import { mapTransactionRow, toTransactionPayloadUpdate } from './map-transaction-row.ts';
import { parseLastlinkPayload } from './parse-payload.ts';
import {
	createsNewAccount,
	isSupportedProduct,
	resolveProductAccess
} from './product-access.ts';
import { grantAccessToExistingUser, provisionPurchasedUser } from './provision-user.ts';
import { revokeProductAccess } from './revoke-user-access.ts';
import { createSupabaseAdmin } from './supabase-admin.ts';
import type { LastlinkWebhookPayload, TransactionInsertRow } from './types.ts';
import { validateLastlinkToken } from './validate-token.ts';

const CREATE_USER_EVENT = 'Purchase_Order_Confirmed';
const REVOKE_EVENTS = new Set(['Payment_Refund', 'Payment_Chargeback']);

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

type ExistingTransaction = {
	id: string;
	processed_at: string | null;
	user_id: string | null;
};

type AccessSideEffectResult = {
	userId: string | null;
	anonymousId: string | null;
	processedAt: string | null;
	provisionError: string | null;
	revoked: boolean;
};

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

function dbErrorResponse(step: string, error: { message: string; code?: string; details?: string }): Response {
	console.error(`[lastlink-webhook] ${step}:`, error.message, error.code ?? '', error.details ?? '');
	return jsonResponse(
		{
			error: step,
			pgCode: error.code ?? null,
			pgMessage: error.message
		},
		500
	);
}

async function loadExistingTransaction(
	supabase: SupabaseAdmin,
	webhookEventId: string
): Promise<ExistingTransaction | null> {
	const { data, error } = await supabase
		.from('transactions')
		.select('id, processed_at, user_id')
		.eq('webhook_event_id', webhookEventId)
		.maybeSingle();

	if (error) {
		console.error('[lastlink-webhook] transaction lookup failed:', error.message);
		throw new Error('Failed to lookup transaction');
	}

	return data;
}

async function loadProfileAnonymousId(
	supabase: SupabaseAdmin,
	userId: string
): Promise<string | null> {
	const { data: profile } = await supabase
		.from('profiles')
		.select('anonymous_id')
		.eq('id', userId)
		.maybeSingle();

	return profile?.anonymous_id ?? null;
}

async function runAccessSideEffects(
	supabase: SupabaseAdmin,
	payload: LastlinkWebhookPayload,
	transactionRow: TransactionInsertRow,
	provision: boolean,
	revoke: boolean,
	productAccess: ReturnType<typeof resolveProductAccess>
): Promise<AccessSideEffectResult> {
	const result: AccessSideEffectResult = {
		userId: null,
		anonymousId: null,
		processedAt: null,
		provisionError: null,
		revoked: false
	};

	if (!provision && !revoke) return result;

	const buyer = payload.Data?.Buyer;
	if (!buyer?.Email) {
		result.provisionError = 'Buyer email missing';
		console.error('[lastlink-webhook]', result.provisionError);
		return result;
	}

	if (revoke) {
		const revokeResult = await revokeProductAccess(supabase, buyer, productAccess);
		if (revokeResult.ok) {
			result.userId = revokeResult.userId;
			result.revoked = true;
			result.processedAt = new Date().toISOString();
			result.anonymousId = await loadProfileAnonymousId(supabase, revokeResult.userId);
			console.info('[lastlink-webhook] access revoked:', revokeResult.userId, productAccess);
		} else {
			result.provisionError = revokeResult.error;
			console.error('[lastlink-webhook] revoke failed:', revokeResult.error);
		}
		return result;
	}

	if (createsNewAccount(productAccess)) {
		if (!buyer.PhoneNumber) {
			result.provisionError = 'Buyer phone missing';
			console.error('[lastlink-webhook]', result.provisionError);
			return result;
		}

		const provisionResult = await provisionPurchasedUser(
			supabase,
			buyer,
			payload.Data?.Utm,
			productAccess
		);

		if (provisionResult.ok) {
			result.userId = provisionResult.userId;
			result.processedAt = new Date().toISOString();
			result.anonymousId = await loadProfileAnonymousId(supabase, provisionResult.userId);
			console.info(
				'[lastlink-webhook] account provisioned:',
				provisionResult.userId,
				provisionResult.created ? 'created' : 'updated',
				productAccess
			);
		} else {
			result.provisionError = provisionResult.error;
			console.error('[lastlink-webhook] provision failed:', provisionResult.error);
		}
		return result;
	}

	const grantResult = await grantAccessToExistingUser(supabase, buyer, productAccess);
	if (grantResult.ok) {
		result.userId = grantResult.userId;
		result.processedAt = new Date().toISOString();
		result.anonymousId = await loadProfileAnonymousId(supabase, grantResult.userId);
		console.info(
			'[lastlink-webhook] access granted to existing user:',
			grantResult.userId,
			productAccess
		);
	} else {
		result.provisionError = grantResult.error;
		console.error('[lastlink-webhook] access grant failed:', grantResult.error);
	}

	return result;
}

async function persistTransactionRow(
	supabase: SupabaseAdmin,
	transactionRow: TransactionInsertRow
): Promise<ExistingTransaction> {
	const insertRow = {
		...transactionRow,
		user_id: null,
		anonymous_id: null,
		processed_at: null
	};

	const { data, error } = await supabase
		.from('transactions')
		.insert(insertRow)
		.select('id, processed_at, user_id')
		.single();

	if (!error && data) return data;

	if (error?.code === '23505') {
		const existing = await loadExistingTransaction(supabase, transactionRow.webhook_event_id);
		if (existing) return existing;
	}

	if (error) {
		throw error;
	}

	throw new Error('Failed to persist transaction');
}

async function refreshTransactionPayload(
	supabase: SupabaseAdmin,
	transactionId: string,
	transactionRow: TransactionInsertRow
): Promise<void> {
	const { error } = await supabase
		.from('transactions')
		.update(toTransactionPayloadUpdate(transactionRow))
		.eq('id', transactionId);

	if (error) {
		throw error;
	}
}

async function linkTransactionToUser(
	supabase: SupabaseAdmin,
	transactionId: string,
	link: Pick<AccessSideEffectResult, 'userId' | 'anonymousId' | 'processedAt'>
): Promise<void> {
	const { error } = await supabase
		.from('transactions')
		.update({
			user_id: link.userId,
			anonymous_id: link.anonymousId || null,
			processed_at: link.processedAt
		})
		.eq('id', transactionId);

	if (error) {
		throw error;
	}
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

	let supabase: SupabaseAdmin;
	try {
		supabase = createSupabaseAdmin();
	} catch (e) {
		const msg = e instanceof Error ? e.message : '';
		console.error('[lastlink-webhook]', msg);
		return jsonResponse({ error: 'Server configuration error' }, 503);
	}

	const productAccess = resolveProductAccess(payload.Data);
	const supportedProduct = isSupportedProduct(productAccess);
	const provision = shouldProvisionUser(
		payload.Event,
		transactionRow.is_test,
		supportedProduct
	);
	const revoke = shouldRevokeAccess(payload.Event, supportedProduct);
	const needsAccessProcessing = provision || revoke;

	let existing: ExistingTransaction | null;
	try {
		existing = await loadExistingTransaction(supabase, transactionRow.webhook_event_id);
	} catch {
		return jsonResponse({ error: 'Failed to lookup transaction' }, 500);
	}

	if (existing?.processed_at) {
		// Reenvio da Lastlink: tenta atualizar payload, mas não falha o webhook
		try {
			await refreshTransactionPayload(supabase, existing.id, transactionRow);
		} catch (e) {
			const err = e as { message?: string; code?: string; details?: string };
			console.warn(
				'[lastlink-webhook] duplicate refresh skipped:',
				err.message ?? e,
				err.code ?? '',
				err.details ?? ''
			);
		}
		return jsonResponse({ ok: true, duplicate: true, transactionId: existing.id });
	}

	let transactionId: string;
	let isDuplicateRetry = false;

	try {
		if (existing) {
			transactionId = existing.id;
			isDuplicateRetry = true;
			await refreshTransactionPayload(supabase, transactionId, transactionRow);
		} else {
			const persisted = await persistTransactionRow(supabase, transactionRow);
			transactionId = persisted.id;
			if (persisted.processed_at) {
				return jsonResponse({ ok: true, duplicate: true });
			}
		}
	} catch (e) {
		const err = e as { message?: string; code?: string; details?: string };
		if (err.code) {
			return dbErrorResponse('Failed to persist transaction', {
				message: err.message ?? 'insert/update failed',
				code: err.code,
				details: err.details
			});
		}
		return jsonResponse({ error: err.message ?? 'Failed to persist transaction' }, 500);
	}

	let accessResult: AccessSideEffectResult = {
		userId: existing?.user_id ?? null,
		anonymousId: null,
		processedAt: null,
		provisionError: null,
		revoked: false
	};

	if (needsAccessProcessing) {
		accessResult = await runAccessSideEffects(
			supabase,
			payload,
			transactionRow,
			provision,
			revoke,
			productAccess
		);

		if (accessResult.processedAt) {
			try {
				await linkTransactionToUser(supabase, transactionId, accessResult);
			} catch (e) {
				const err = e as { message?: string; code?: string; details?: string };
				if (err.code) {
					return dbErrorResponse('Failed to link transaction', {
						message: err.message ?? 'link failed',
						code: err.code,
						details: err.details
					});
				}
				return jsonResponse({ error: err.message ?? 'Failed to link transaction' }, 500);
			}
		}
	}

	return jsonResponse({
		ok: true,
		duplicate: isDuplicateRetry,
		provisioned: !!accessResult.userId && !accessResult.revoked,
		revoked: accessResult.revoked,
		provisionError: accessResult.provisionError ?? undefined,
		event: payload.Event,
		productAccess,
		transactionId
	});
}
