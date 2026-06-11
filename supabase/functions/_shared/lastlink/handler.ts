import { mapTransactionRow } from './map-transaction-row.ts';
import { parseLastlinkPayload } from './parse-payload.ts';
import {
	createsNewAccount,
	isSupportedProduct,
	resolveProductAccess
} from './product-access.ts';
import { grantAccessToExistingUser, provisionPurchasedUser } from './provision-user.ts';
import { revokeProductAccess } from './revoke-user-access.ts';
import { createSupabaseAdmin } from './supabase-admin.ts';
import { validateLastlinkToken } from './validate-token.ts';

const CREATE_USER_EVENT = 'Purchase_Order_Confirmed';
const REVOKE_EVENTS = new Set(['Payment_Refund', 'Payment_Chargeback']);

function isLocalDev(): boolean {
	const url = Deno.env.get('SUPABASE_URL') ?? '';
	return url.includes('127.0.0.1') || url.includes('localhost');
}

function shouldProvisionUser(
	event: string,
	isTest: boolean,
	supportedProduct: boolean
): boolean {
	if (event !== CREATE_USER_EVENT) return false;
	if (isTest && !isLocalDev()) return false;
	if (!supportedProduct) return false;
	return true;
}

function shouldRevokeAccess(event: string, supportedProduct: boolean): boolean {
	return REVOKE_EVENTS.has(event) && supportedProduct;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export async function handleLastlinkWebhook(request: Request): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'content-type, x-lastlink-token',
				'Access-Control-Allow-Methods': 'POST, OPTIONS'
			}
		});
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405);
	}

	if (!validateLastlinkToken(request)) {
		return jsonResponse({ error: 'Unauthorized' }, 401);
	}

	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid JSON' }, 400);
	}

	const payload = parseLastlinkPayload(raw);
	if (!payload) {
		return jsonResponse({ error: 'Invalid Lastlink payload' }, 400);
	}

	const transactionRow = mapTransactionRow(payload);
	if (!transactionRow) {
		return jsonResponse({ error: 'Missing required webhook fields' }, 400);
	}

	let supabase: ReturnType<typeof createSupabaseAdmin>;
	try {
		supabase = createSupabaseAdmin();
	} catch (e) {
		const msg = e instanceof Error ? e.message : '';
		console.error('[lastlink-webhook]', msg);
		return jsonResponse({ error: 'Server configuration error' }, 503);
	}

	const { data: existing } = await supabase
		.from('transactions')
		.select('id')
		.eq('webhook_event_id', transactionRow.webhook_event_id)
		.maybeSingle();

	if (existing) {
		return jsonResponse({ ok: true, duplicate: true });
	}

	const productAccess = resolveProductAccess(payload.Data);
	const supportedProduct = isSupportedProduct(productAccess);
	const provision = shouldProvisionUser(
		payload.Event,
		transactionRow.is_test,
		supportedProduct
	);
	const revoke = shouldRevokeAccess(payload.Event, supportedProduct);

	let userId: string | null = null;
	let provisionError: string | null = null;
	let revoked = false;

	if (provision || revoke) {
		const buyer = payload.Data?.Buyer;
		if (!buyer?.Email) {
			provisionError = 'Buyer email missing';
			console.error('[lastlink-webhook]', provisionError);
		} else if (revoke) {
			const result = await revokeProductAccess(supabase, buyer, productAccess);
			if (result.ok) {
				userId = result.userId;
				revoked = true;
				transactionRow.processed_at = new Date().toISOString();
				console.info('[lastlink-webhook] access revoked:', result.userId, productAccess);
			} else {
				provisionError = result.error;
				console.error('[lastlink-webhook] revoke failed:', result.error);
			}
		} else if (createsNewAccount(productAccess)) {
			if (!buyer.PhoneNumber) {
				provisionError = 'Buyer phone missing';
				console.error('[lastlink-webhook]', provisionError);
			} else {
				const result = await provisionPurchasedUser(
					supabase,
					buyer,
					payload.Data?.Utm,
					productAccess
				);
				if (result.ok) {
					userId = result.userId;
					transactionRow.processed_at = new Date().toISOString();

					const { data: profile } = await supabase
						.from('profiles')
						.select('anonymous_id')
						.eq('id', result.userId)
						.maybeSingle();

					if (profile?.anonymous_id) {
						transactionRow.anonymous_id = profile.anonymous_id;
					}

					console.info(
						'[lastlink-webhook] account provisioned:',
						result.userId,
						result.created ? 'created' : 'updated',
						productAccess
					);
				} else {
					provisionError = result.error;
					console.error('[lastlink-webhook] provision failed:', result.error);
				}
			}
		} else {
			const result = await grantAccessToExistingUser(supabase, buyer, productAccess);
			if (result.ok) {
				userId = result.userId;
				transactionRow.processed_at = new Date().toISOString();

				const { data: profile } = await supabase
					.from('profiles')
					.select('anonymous_id')
					.eq('id', result.userId)
					.maybeSingle();

				if (profile?.anonymous_id) {
					transactionRow.anonymous_id = profile.anonymous_id;
				}

				console.info(
					'[lastlink-webhook] access granted to existing user:',
					result.userId,
					productAccess
				);
			} else {
				provisionError = result.error;
				console.error('[lastlink-webhook] access grant failed:', result.error);
			}
		}
	}

	transactionRow.user_id = userId;

	const { error: insertError } = await supabase.from('transactions').insert(transactionRow);

	if (insertError) {
		if (insertError.code === '23505') {
			return jsonResponse({ ok: true, duplicate: true });
		}
		console.error('[lastlink-webhook] transaction insert failed:', insertError.message);
		return jsonResponse({ error: 'Failed to persist transaction' }, 500);
	}

	return jsonResponse({
		ok: true,
		provisioned: !!userId && !revoked,
		revoked,
		provisionError: provisionError ?? undefined,
		event: payload.Event,
		productAccess
	});
}
