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

// O Token API do painel tem o formato `<account-id>|<segredo>`, mas a doc
// descreve api_token como Char(40) sem pipe. Estes testes garantem que o
// webhook autentica independente de qual forma o Guru enviar.
const ACCOUNT_ID = '11111111-2222-3333-4444-555555555555';
const SECRET = 'SegredoFalsoApenasParaTeste0123456789';
const FULL = `${ACCOUNT_ID}|${SECRET}`;

Deno.test('token completo configurado aceita webhook que envia o completo', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: FULL, GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		const payload = guruApprovedPayload({ api_token: FULL });
		assertEquals(authenticateGuruRequest(request, payload), { ok: true, isTest: false });
	});
});

Deno.test('token completo configurado aceita webhook que envia só o sufixo', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: FULL, GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		const payload = guruApprovedPayload({ api_token: SECRET });
		assertEquals(authenticateGuruRequest(request, payload), { ok: true, isTest: false });
	});
});

Deno.test('só o sufixo configurado aceita webhook que envia o completo', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: SECRET, GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		const payload = guruApprovedPayload({ api_token: FULL });
		assertEquals(authenticateGuruRequest(request, payload), { ok: true, isTest: false });
	});
});

Deno.test('tolerância ao pipe não aceita account id nem segredo errado', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: FULL, GURU_WEBHOOK_TEST_TOKENS: null }, () => {
		// O account id sozinho não autentica — o segredo é a parte após o pipe.
		assertEquals(
			authenticateGuruRequest(request, guruApprovedPayload({ api_token: ACCOUNT_ID })),
			{ ok: false }
		);
		assertEquals(
			authenticateGuruRequest(request, guruApprovedPayload({ api_token: `${ACCOUNT_ID}|outro` })),
			{ ok: false }
		);
	});
});

Deno.test('encontra o token dentro de wrappers de proxy', () => {
	withEnv({ GURU_WEBHOOK_TOKENS: 'segredo-do-painel' }, () => {
		const wrapped = { body: guruApprovedPayload() };
		assertEquals(authenticateGuruRequest(request, wrapped), { ok: true, isTest: false });
	});
});
