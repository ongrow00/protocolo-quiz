import type { GuruWebhookPayload } from './types.ts';

/** Só o webhook de transações é tratado aqui. */
const SUPPORTED_WEBHOOK_TYPE = 'transaction';

function isWebhookPayload(value: unknown): value is GuruWebhookPayload {
	if (!value || typeof value !== 'object') return false;
	const obj = value as Record<string, unknown>;
	if (typeof obj.id !== 'string' || typeof obj.status !== 'string') return false;
	// webhook_type ausente é aceito: nem toda configuração do painel o envia.
	if (obj.webhook_type !== undefined && obj.webhook_type !== SUPPORTED_WEBHOOK_TYPE) {
		return false;
	}
	return true;
}

/** Desembrulha o payload do Guru de JSON direto ou de wrappers de proxy (ex.: n8n). */
export function parseGuruPayload(raw: unknown): GuruWebhookPayload | null {
	if (isWebhookPayload(raw)) return raw;

	if (Array.isArray(raw) && raw.length > 0) {
		const first = raw[0];
		if (first && typeof first === 'object') {
			const wrapped = first as Record<string, unknown>;
			if (wrapped.body) return parseGuruPayload(wrapped.body);
		}
	}

	if (raw && typeof raw === 'object') {
		const obj = raw as Record<string, unknown>;
		if (obj.body) return parseGuruPayload(obj.body);
	}

	return null;
}

/** Remove o api_token antes de persistir em raw_payload — é um segredo. */
export function stripApiToken(payload: GuruWebhookPayload): Omit<GuruWebhookPayload, 'api_token'> {
	const { api_token: _apiToken, ...rest } = payload;
	return rest;
}
