import {
	createsNewAccount,
	isSupportedProduct,
	resolveProductAccess,
	type ProductAccessFlags
} from './product-access.ts';
import { grantAccessToExistingUser, provisionPurchasedUser } from './provision-user.ts';
import { revokeProductAccess } from './revoke-user-access.ts';
import { createSupabaseAdmin } from './supabase-admin.ts';
import type { NormalizedBuyer, TransactionInsertRow, WebhookAdapter } from './types.ts';

/**
 * Eventos canônicos. Cada adapter normaliza o vocabulário do seu gateway para
 * estes nomes, o que mantém payment-history.service.ts funcionando sem alteração.
 */
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

/** Colunas atualizadas a partir do payload (exclui campos de vínculo). */
function toTransactionPayloadUpdate(
	row: TransactionInsertRow
): Omit<TransactionInsertRow, 'user_id' | 'anonymous_id' | 'processed_at'> {
	const {
		user_id: _userId,
		anonymous_id: _anonymousId,
		processed_at: _processedAt,
		...payloadFields
	} = row;
	return payloadFields;
}

export async function handleWebhook<P>(
	request: Request,
	adapter: WebhookAdapter<P>
): Promise<Response> {
	const tag = `[${adapter.gateway}-webhook]`;

	const dbErrorResponse = (
		step: string,
		error: { message: string; code?: string; details?: string }
	): Response => {
		console.error(`${tag} ${step}:`, error.message, error.code ?? '', error.details ?? '');
		return jsonResponse(
			{ error: step, pgCode: error.code ?? null, pgMessage: error.message },
			500
		);
	};

	const loadExistingTransaction = async (
		supabase: SupabaseAdmin,
		webhookEventId: string
	): Promise<ExistingTransaction | null> => {
		const { data, error } = await supabase
			.from('transactions')
			.select('id, processed_at, user_id')
			.eq('webhook_event_id', webhookEventId)
			.maybeSingle();

		if (error) {
			console.error(`${tag} transaction lookup failed:`, error.message);
			throw new Error('Failed to lookup transaction');
		}

		return data;
	};

	const loadProfileAnonymousId = async (
		supabase: SupabaseAdmin,
		userId: string
	): Promise<string | null> => {
		const { data: profile } = await supabase
			.from('profiles')
			.select('anonymous_id')
			.eq('id', userId)
			.maybeSingle();

		return profile?.anonymous_id ?? null;
	};

	const runAccessSideEffects = async (
		supabase: SupabaseAdmin,
		buyer: NormalizedBuyer | null,
		utm: ReturnType<WebhookAdapter<P>['extractUtm']>,
		provision: boolean,
		revoke: boolean,
		productAccess: ProductAccessFlags
	): Promise<AccessSideEffectResult> => {
		const result: AccessSideEffectResult = {
			userId: null,
			anonymousId: null,
			processedAt: null,
			provisionError: null,
			revoked: false
		};

		if (!provision && !revoke) return result;

		if (!buyer?.email) {
			result.provisionError = 'Buyer email missing';
			console.error(tag, result.provisionError);
			return result;
		}

		if (revoke) {
			const revokeResult = await revokeProductAccess(supabase, buyer, productAccess);
			if (revokeResult.ok) {
				result.userId = revokeResult.userId;
				result.revoked = true;
				result.processedAt = new Date().toISOString();
				result.anonymousId = await loadProfileAnonymousId(supabase, revokeResult.userId);
				console.info(`${tag} access revoked:`, revokeResult.userId, productAccess);
			} else {
				result.provisionError = revokeResult.error;
				console.error(`${tag} revoke failed:`, revokeResult.error);
			}
			return result;
		}

		if (createsNewAccount(productAccess)) {
			if (!buyer.phone) {
				result.provisionError = 'Buyer phone missing';
				console.error(tag, result.provisionError);
				return result;
			}

			const provisionResult = await provisionPurchasedUser(
				supabase,
				buyer,
				utm,
				productAccess
			);

			if (provisionResult.ok) {
				result.userId = provisionResult.userId;
				result.processedAt = new Date().toISOString();
				result.anonymousId = await loadProfileAnonymousId(supabase, provisionResult.userId);
				console.info(
					`${tag} account provisioned:`,
					provisionResult.userId,
					provisionResult.created ? 'created' : 'updated',
					productAccess
				);
			} else {
				result.provisionError = provisionResult.error;
				console.error(`${tag} provision failed:`, provisionResult.error);
			}
			return result;
		}

		const grantResult = await grantAccessToExistingUser(supabase, buyer, productAccess);
		if (grantResult.ok) {
			result.userId = grantResult.userId;
			result.processedAt = new Date().toISOString();
			result.anonymousId = await loadProfileAnonymousId(supabase, grantResult.userId);
			console.info(`${tag} access granted to existing user:`, grantResult.userId, productAccess);
		} else {
			result.provisionError = grantResult.error;
			console.error(`${tag} access grant failed:`, grantResult.error);
		}

		return result;
	};

	const persistTransactionRow = async (
		supabase: SupabaseAdmin,
		transactionRow: TransactionInsertRow
	): Promise<ExistingTransaction> => {
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

		if (error) throw error;

		throw new Error('Failed to persist transaction');
	};

	const refreshTransactionPayload = async (
		supabase: SupabaseAdmin,
		transactionId: string,
		transactionRow: TransactionInsertRow
	): Promise<void> => {
		const { error } = await supabase
			.from('transactions')
			.update(toTransactionPayloadUpdate(transactionRow))
			.eq('id', transactionId);

		if (error) throw error;
	};

	const linkTransactionToUser = async (
		supabase: SupabaseAdmin,
		transactionId: string,
		link: Pick<AccessSideEffectResult, 'userId' | 'anonymousId' | 'processedAt'>
	): Promise<void> => {
		const { error } = await supabase
			.from('transactions')
			.update({
				user_id: link.userId,
				anonymous_id: link.anonymousId || null,
				processed_at: link.processedAt
			})
			.eq('id', transactionId);

		if (error) throw error;
	};

	// ── Fluxo ────────────────────────────────────────────────────────────────

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': adapter.allowedHeaders,
				'Access-Control-Allow-Methods': 'POST, OPTIONS'
			}
		});
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405);
	}

	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid JSON' }, 400);
	}

	// Autenticação depois do parse porque o Guru envia o token no corpo.
	const auth = adapter.authenticate(request, raw);
	if (!auth.ok) {
		return jsonResponse({ error: 'Unauthorized' }, 401);
	}

	const payload = adapter.parse(raw);
	if (!payload) {
		return jsonResponse({ error: 'Invalid payload' }, 400);
	}

	const transactionRow = adapter.mapTransaction(payload);
	if (!transactionRow) {
		return jsonResponse({ error: 'Missing required webhook fields' }, 400);
	}

	if (auth.isTest) transactionRow.is_test = true;

	let supabase: SupabaseAdmin;
	try {
		supabase = createSupabaseAdmin();
	} catch (e) {
		const msg = e instanceof Error ? e.message : '';
		console.error(tag, msg);
		return jsonResponse({ error: 'Server configuration error' }, 503);
	}

	const productAccess = resolveProductAccess(adapter.productNames(payload));
	const supportedProduct = isSupportedProduct(productAccess);
	const provision = shouldProvisionUser(
		transactionRow.event,
		transactionRow.is_test,
		supportedProduct
	);
	const revoke = shouldRevokeAccess(transactionRow.event, supportedProduct);
	const needsAccessProcessing = provision || revoke;

	let existing: ExistingTransaction | null;
	try {
		existing = await loadExistingTransaction(supabase, transactionRow.webhook_event_id);
	} catch {
		return jsonResponse({ error: 'Failed to lookup transaction' }, 500);
	}

	if (existing?.processed_at) {
		// Reenvio do gateway: tenta atualizar payload, mas não falha o webhook
		try {
			await refreshTransactionPayload(supabase, existing.id, transactionRow);
		} catch (e) {
			const err = e as { message?: string; code?: string; details?: string };
			console.warn(
				`${tag} duplicate refresh skipped:`,
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
			adapter.extractBuyer(payload),
			adapter.extractUtm(payload),
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
		event: transactionRow.event,
		productAccess,
		transactionId
	});
}
