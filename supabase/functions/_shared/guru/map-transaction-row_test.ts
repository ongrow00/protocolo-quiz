import { assertEquals, assertNotEquals } from 'jsr:@std/assert@1';
import { guruApprovedPayload } from './fixtures.ts';
import {
	buildGuruEventKey,
	collectGuruProductNames,
	composeGuruPhone,
	extractGuruBuyer,
	extractGuruUtm,
	mapGuruTransactionRow,
	normalizeGuruEvent
} from './map-transaction-row.ts';
import { parseGuruPayload } from './parse-payload.ts';

Deno.test('mapeia o payload aprovado para a linha de transactions', () => {
	const row = mapGuruTransactionRow(guruApprovedPayload())!;

	assertEquals(row.gateway, 'guru');
	assertEquals(row.event, 'Purchase_Order_Confirmed');
	assertEquals(row.is_test, false);
	assertEquals(row.buyer_email, 'maria.silva@email.com');
	assertEquals(row.buyer_name, 'Maria Silva');
	assertEquals(row.buyer_phone, '+5541999998888');
	assertEquals(row.product_name, 'Protocolo Desbloqueio');
	assertEquals(row.product_price, 47);
	assertEquals(row.total_price, 47);
	assertEquals(row.original_price, 47);
	assertEquals(row.installments, 1);
	assertEquals(row.payment_method, 'credit_card');
	assertEquals(row.payment_date, '2026-07-30T11:35:57.000Z');
	assertEquals(row.device_ip, '187.55.10.2');
});

Deno.test('persiste identificadores do Guru que não são UUID', () => {
	const row = mapGuruTransactionRow(guruApprovedPayload())!;

	// Estes quebrariam as colunas uuid do schema anterior.
	assertEquals(row.payment_id, 'ch_1ke4QoCQOs7VE6VY');
	assertEquals(row.offer_lastlink_id, 'of_9Kd82');
	assertEquals(row.seller_lastlink_id, '01234567890');
});

Deno.test('monta o endereço no shape que a coluna buyer_address já usa', () => {
	const row = mapGuruTransactionRow(guruApprovedPayload())!;

	assertEquals(row.buyer_address, {
		ZipCode: '83324090',
		Street: 'Rua Terra Rica',
		StreetNumber: '123',
		District: 'Centro',
		City: 'Pinhais',
		State: 'PR'
	});
});

Deno.test('normaliza status para os eventos canônicos', () => {
	assertEquals(normalizeGuruEvent('approved'), 'Purchase_Order_Confirmed');
	assertEquals(normalizeGuruEvent('refunded'), 'Payment_Refund');
	assertEquals(normalizeGuruEvent('chargeback'), 'Payment_Chargeback');
	assertEquals(normalizeGuruEvent('APPROVED'), 'Purchase_Order_Confirmed');
});

Deno.test('mantém status não mapeado e desconhecido como estão', () => {
	assertEquals(normalizeGuruEvent('waiting_payment'), 'waiting_payment');
	assertEquals(normalizeGuruEvent('abandoned'), 'abandoned');
	assertEquals(normalizeGuruEvent('status_que_nao_existe'), 'status_que_nao_existe');
});

Deno.test('gera chave de idempotência distinta por status da mesma transação', () => {
	const id = '9081534a-7512-4dab-9172-218c1dc1f263';
	const approved = buildGuruEventKey(id, 'approved');
	const refunded = buildGuruEventKey(id, 'refunded');

	assertEquals(approved, `guru:${id}:approved`);
	assertNotEquals(approved, refunded);
});

Deno.test('reembolso da mesma transação não colide com a aprovação', () => {
	const approved = mapGuruTransactionRow(guruApprovedPayload())!;
	const refunded = mapGuruTransactionRow(guruApprovedPayload({ status: 'refunded' }))!;

	assertNotEquals(approved.webhook_event_id, refunded.webhook_event_id);
	assertEquals(refunded.event, 'Payment_Refund');
});

Deno.test('preserva as UTMs intactas, incluindo o pipe do Meta Ads', () => {
	const utm = extractGuruUtm(guruApprovedPayload())!;

	assertEquals(utm.source, 'Meta|216102221917389');
	assertEquals(utm.campaign, '[PROTOCOLO-D]-[VENDA]-[QUIZ]-[COSTCAP]-2307|52568213630963');
	assertEquals(utm.content, 'H3_B1_C1-V1-[ORGANICO 19].mp4|52568213633363');
});

Deno.test('utm_id fica nulo, como sempre foi na Lastlink', () => {
	const row = mapGuruTransactionRow(guruApprovedPayload())!;
	assertEquals(row.utm_id, null);
});

Deno.test('remove o api_token do raw_payload', () => {
	const row = mapGuruTransactionRow(guruApprovedPayload())!;
	const raw = row.raw_payload as Record<string, unknown>;

	assertEquals('api_token' in raw, false);
	assertEquals(raw.id, '9081534a-7512-4dab-9172-218c1dc1f263');
});

Deno.test('compõe o telefone sem duplicar o código do país', () => {
	assertEquals(composeGuruPhone({ phone_number: '41999998888', phone_local_code: '55' }), '+5541999998888');
	assertEquals(composeGuruPhone({ phone_number: '5541999998888', phone_local_code: '55' }), '+5541999998888');
	assertEquals(composeGuruPhone({ phone_number: '+5541999998888' }), '+5541999998888');
	assertEquals(composeGuruPhone({ phone_number: '41999998888' }), '41999998888');
	assertEquals(composeGuruPhone(undefined), null);
});

Deno.test('extrai o comprador normalizado', () => {
	const buyer = extractGuruBuyer(guruApprovedPayload())!;

	assertEquals(buyer.email, 'maria.silva@email.com');
	assertEquals(buyer.name, 'Maria Silva');
	assertEquals(buyer.phone, '+5541999998888');
	assertEquals(buyer.document, '01234567890');
});

Deno.test('coleta nomes de produto sem duplicar item e produto principal', () => {
	assertEquals(collectGuruProductNames(guruApprovedPayload()), ['Protocolo Desbloqueio']);
});

Deno.test('coleta múltiplos produtos da mesma transação', () => {
	const payload = guruApprovedPayload({
		items: [
			{ name: 'Protocolo Desbloqueio' },
			{ name: 'Protocolo Treino' }
		]
	});

	assertEquals(collectGuruProductNames(payload), [
		'Protocolo Desbloqueio',
		'Protocolo Treino'
	]);
});

Deno.test('rejeita payload sem id ou status', () => {
	assertEquals(mapGuruTransactionRow({ id: '', status: 'approved' }), null);
	assertEquals(mapGuruTransactionRow({ id: 'abc', status: '' }), null);
});

Deno.test('parse aceita payload direto e wrappers de proxy', () => {
	const payload = guruApprovedPayload();

	assertEquals(parseGuruPayload(payload)?.id, payload.id);
	assertEquals(parseGuruPayload({ body: payload })?.id, payload.id);
	assertEquals(parseGuruPayload([{ body: payload }])?.id, payload.id);
});

Deno.test('parse rejeita webhook que não seja de transação', () => {
	assertEquals(parseGuruPayload(guruApprovedPayload({ webhook_type: 'subscription' })), null);
	assertEquals(parseGuruPayload({ foo: 'bar' }), null);
});
