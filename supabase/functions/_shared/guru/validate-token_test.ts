import { assertEquals } from 'jsr:@std/assert@1';
import { guruApprovedPayload } from './fixtures.ts';
import { authenticateGuruRequest } from './validate-token.ts';

const request = new Request('https://example.com/guru-webhook', { method: 'POST' });

function withEnv(vars: Record<string, string | null>, run: () => void) {
	const previous: Record<string, string | undefined> = {};
	for (const [key, value] of Object.entries(vars)) {
		previous[key] = Deno.env.get(key);
		if (value === null) Deno.env.delete(key);
		else Deno.env.set(key, value);
	}
	try {
		run();
	} finally {
		for (const [key, value] of Object.entries(previous)) {
			if (value === undefined) Deno.env.delete(key);
			else Deno.env.set(key, value);
		}
	}
}

Deno.test('aceita token válido vindo do corpo', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: 'segredo-do-painel', GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		const result = authenticateGuruRequest(request, guruApprovedPayload());
		assertEquals(result, { ok: true, isTest: false });
	});
});

Deno.test('aceita qualquer token da lista', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: 'outro, segredo-do-painel ,mais-um' }, () => {
		const result = authenticateGuruRequest(request, guruApprovedPayload());
		assertEquals(result, { ok: true, isTest: false });
	});
});

Deno.test('token de teste marca a transação como teste', () => {
	withEnv(
		{ GURU_WEBHOOK_TOKENS: 'producao', GURU_WEBHOOK_TEST_TOKENS: 'segredo-do-painel' },
		() => {
			const result = authenticateGuruRequest(request, guruApprovedPayload());
			assertEquals(result, { ok: true, isTest: true });
		}
	);
});

Deno.test('rejeita token desconhecido', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: 'outra-coisa', GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		assertEquals(authenticateGuruRequest(request, guruApprovedPayload()), { ok: false });
	});
});

Deno.test('rejeita payload sem api_token', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: 'segredo-do-painel' }, () => {
		const payload = guruApprovedPayload();
		delete payload.api_token;
		assertEquals(authenticateGuruRequest(request, payload), { ok: false });
	});
});

Deno.test('rejeita quando nenhum token está configurado', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: null, GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		assertEquals(authenticateGuruRequest(request, guruApprovedPayload()), { ok: false });
	});
});

Deno.test('encontra o token dentro de wrappers de proxy', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: 'segredo-do-painel' }, () => {
		const wrapped = { body: guruApprovedPayload() };
		assertEquals(authenticateGuruRequest(request, wrapped), { ok: true, isTest: false });
	});
});
