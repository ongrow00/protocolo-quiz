import type { LastlinkWebhookPayload } from './types.ts';

function isWebhookPayload(value: unknown): value is LastlinkWebhookPayload {
	if (!value || typeof value !== 'object') return false;
	const obj = value as Record<string, unknown>;
	return typeof obj.Id === 'string' && typeof obj.Event === 'string';
}

/** Unwraps Lastlink payload from direct JSON or common proxy wrappers (e.g. n8n). */
export function parseLastlinkPayload(raw: unknown): LastlinkWebhookPayload | null {
	if (isWebhookPayload(raw)) return raw;

	if (Array.isArray(raw) && raw.length > 0) {
		const first = raw[0];
		if (first && typeof first === 'object') {
			const wrapped = first as Record<string, unknown>;
			if (wrapped.body) return parseLastlinkPayload(wrapped.body);
		}
	}

	if (raw && typeof raw === 'object') {
		const obj = raw as Record<string, unknown>;
		if (obj.body) return parseLastlinkPayload(obj.body);
	}

	return null;
}
