const HEADER = 'x-lastlink-token';

function timingSafeEqualStr(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}

/** Tokens aceitos: LASTLINK_WEBHOOK_TOKENS (vírgula) e/ou LASTLINK_WEBHOOK_TOKEN (legado). */
export function loadLastlinkWebhookTokens(): string[] {
	const tokens = new Set<string>();

	const list = Deno.env.get('LASTLINK_WEBHOOK_TOKENS');
	if (list) {
		for (const part of list.split(',')) {
			const token = part.trim();
			if (token) tokens.add(token);
		}
	}

	const single = Deno.env.get('LASTLINK_WEBHOOK_TOKEN')?.trim();
	if (single) tokens.add(single);

	return [...tokens];
}

/** Validates the Lastlink webhook token from request headers. */
export function validateLastlinkToken(request: Request): boolean {
	const expectedTokens = loadLastlinkWebhookTokens();
	if (expectedTokens.length === 0) {
		console.error(
			'[lastlink] LASTLINK_WEBHOOK_TOKENS or LASTLINK_WEBHOOK_TOKEN is not configured'
		);
		return false;
	}

	const received = request.headers.get(HEADER)?.trim();
	if (!received) return false;

	return expectedTokens.some((token) => timingSafeEqualStr(received, token));
}
