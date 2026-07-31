import { assertEquals } from 'jsr:@std/assert@1';
import {
	createsNewAccount,
	isSupportedProduct,
	isUpsellOnly,
	resolveProductAccess
} from './product-access.ts';

Deno.test('reconhece os três produtos', () => {
	assertEquals(resolveProductAccess(['Protocolo Desbloqueio']), {
		has_protocolo: true,
		has_consultoria: false,
		has_treino: false
	});
	assertEquals(resolveProductAccess(['Consultoria Liberdade']), {
		has_protocolo: false,
		has_consultoria: true,
		has_treino: false
	});
	assertEquals(resolveProductAccess(['Protocolo Treino']), {
		has_protocolo: false,
		has_consultoria: false,
		has_treino: true
	});
});

Deno.test('normaliza caixa e espaços, como fazia com os nomes da Lastlink', () => {
	assertEquals(resolveProductAccess(['  PROTOCOLO   DESBLOQUEIO  ']).has_protocolo, true);
	assertEquals(resolveProductAccess(['protocolo treino']).has_treino, true);
});

Deno.test('libera múltiplos produtos na mesma compra', () => {
	const access = resolveProductAccess(['Protocolo Desbloqueio', 'Protocolo Treino']);
	assertEquals(access.has_protocolo, true);
	assertEquals(access.has_treino, true);
	assertEquals(access.has_consultoria, false);
});

Deno.test('ignora produto desconhecido', () => {
	const access = resolveProductAccess(['Ebook Qualquer']);
	assertEquals(isSupportedProduct(access), false);
});

Deno.test('lista vazia não libera nada', () => {
	assertEquals(isSupportedProduct(resolveProductAccess([])), false);
});

Deno.test('só o Protocolo Desbloqueio cria conta', () => {
	assertEquals(createsNewAccount(resolveProductAccess(['Protocolo Desbloqueio'])), true);
	assertEquals(createsNewAccount(resolveProductAccess(['Protocolo Treino'])), false);
	assertEquals(createsNewAccount(resolveProductAccess(['Consultoria Liberdade'])), false);
});

Deno.test('treino e consultoria sozinhos são upsell', () => {
	assertEquals(isUpsellOnly(resolveProductAccess(['Protocolo Treino'])), true);
	assertEquals(
		isUpsellOnly(resolveProductAccess(['Protocolo Desbloqueio', 'Protocolo Treino'])),
		false
	);
});
