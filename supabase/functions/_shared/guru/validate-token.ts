import type { AuthResult } from '../payments/types.ts';

function timingSafeEqualStr(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}

/**
 * O Token API do painel do Guru vem como `<account-id>|<segredo>`, mas a
 * documentação descreve api_token como Char(40) e o exemplo não tem pipe.
 * Como não dá para saber qual forma o webhook envia — e errar significa 401
 * silencioso em todas as vendas — aceitamos ambas.
 */
function tokenVariants(token: string): string[] {
	const trimmed = token.trim();
	const pipeIndex = trimmed.lastIndexOf('|');
	if (pipeIndex === -1) return [trimmed];

	const suffix = trimmed.slice(pipeIndex + 1);
	return suffix ? [trimmed, suffix] : [trimmed];
}

function tokenMatches(received: string, expected: string): boolean {
	const receivedForms = tokenVariants(received);
	const expectedForms = tokenVariants(expected);
	return receivedForms.some((r) => expectedForms.some((e) => timingSafeEqualStr(r, e)));
}

function loadTokens(envKey: string): string[] {
	const tokens = new Set<string>();
	const list = Deno.env.get(envKey);
	if (list) {
		for (const part of list.split(',')) {
			const token = part.trim();
			if (token) tokens.add(token);
		}
	}
	return [...tokens];
}

export function loadGuruWebhookTokens(): string[] {
	return loadTokens('GURU_WEBHOOK_TOKENS');
}

export function loadGuruWebhookTestTokens(): string[] {
	return loadTokens('GURU_WEBHOOK_TEST_TOKENS');
}

function extractApiToken(raw: unknown): string | null {
	if (!raw || typeof raw !== 'object') return null;

	const obj = raw as Record<string, unknown>;
	if (typeof obj.api_token === 'string' && obj.api_token.trim()) {
		return obj.api_token.trim();
	}

	// Mesmos wrappers que parseGuruPayload desembrulha.
	if (obj.body) return extractApiToken(obj.body);
	if (Array.isArray(raw) && raw.length > 0) return extractApiToken(raw[0]);

	return null;
}

/**
 * O Guru envia api_token no corpo do JSON, não em header.
 * Um token presente em GURU_WEBHOOK_TEST_TOKENS marca a transação como teste.
 */
export function authenticateGuruRequest(_request: Request, raw: unknown): AuthResult {
	const liveTokens = loadGuruWebhookTokens();
	const testTokens = loadGuruWebhookTestTokens();

	if (liveTokens.length === 0 && testTokens.length === 0) {
		console.error('[guru] GURU_WEBHOOK_TOKENS is not configured');
		return { ok: false };
	}

	const received = extractApiToken(raw);
	if (!received) return { ok: false };

	if (testTokens.some((token) => tokenMatches(received, token))) {
		return { ok: true, isTest: true };
	}

	if (liveTokens.some((token) => tokenMatches(received, token))) {
		return { ok: true, isTest: false };
	}

	return { ok: false };
}
