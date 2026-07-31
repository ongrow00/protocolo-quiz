import {
	pickEmail,
	pickInt,
	pickIp,
	pickNum,
	pickStr,
	toIso
} from '../payments/field-pickers.ts';
import type {
	NormalizedBuyer,
	NormalizedUtm,
	TransactionAddress,
	TransactionInsertRow
} from '../payments/types.ts';
import { stripApiToken } from './parse-payload.ts';
import type { GuruContact, GuruProduct, GuruWebhookPayload } from './types.ts';

/**
 * Status do Guru → eventos canônicos.
 * Preserva os nomes que payment-history.service.ts filtra, para que o histórico
 * de pagamentos funcione sem alteração no app.
 */
const EVENT_BY_STATUS: Record<string, string> = {
	approved: 'Purchase_Order_Confirmed',
	refunded: 'Payment_Refund',
	chargeback: 'Payment_Chargeback'
};

export function normalizeGuruEvent(status: string): string {
	const normalized = status.trim().toLowerCase();
	return EVENT_BY_STATUS[normalized] ?? (pickStr(status, 128) ?? 'Unknown');
}

/**
 * Chave de idempotência. O Guru reutiliza o mesmo `id` a cada mudança de status,
 * então sem o sufixo um reembolso de compra já aprovada seria lido como duplicata
 * e o acesso nunca seria revogado.
 */
export function buildGuruEventKey(id: string, status: string): string {
	return `guru:${id.trim()}:${status.trim().toLowerCase()}`;
}

/** Telefone no formato +DDI…, equivalente ao que a Lastlink entrega. */
export function composeGuruPhone(contact: GuruContact | undefined): string | null {
	const number = pickStr(contact?.phone_number, 32);
	if (!number) return null;
	if (number.startsWith('+')) return number;

	const code = pickStr(contact?.phone_local_code, 8)?.replace(/\D/g, '');
	if (!code) return number;
	if (number.startsWith(code)) return `+${number}`;
	return `+${code}${number}`;
}

function mapAddress(contact: GuruContact | undefined): TransactionAddress | null {
	if (!contact) return null;

	const address: TransactionAddress = {};
	const zip = pickStr(contact.address_zip_code, 32);
	const street = pickStr(contact.address, 200);
	const number = pickStr(contact.address_number, 32);
	const district = pickStr(contact.address_district, 120);
	const city = pickStr(contact.address_city, 120);
	const state = pickStr(contact.address_state, 64);

	if (zip) address.ZipCode = zip;
	if (street) address.Street = street;
	if (number) address.StreetNumber = number;
	if (district) address.District = district;
	if (city) address.City = city;
	if (state) address.State = state;

	return Object.keys(address).length > 0 ? address : null;
}

/** Produtos da compra: itens da transação mais o produto principal, sem duplicatas. */
export function collectGuruProductNames(payload: GuruWebhookPayload): string[] {
	const candidates: (GuruProduct | undefined)[] = [...(payload.items ?? []), payload.product];
	const names = new Set<string>();

	for (const candidate of candidates) {
		const name = pickStr(candidate?.name, 200);
		if (name) names.add(name);
	}

	return [...names];
}

export function extractGuruBuyer(payload: GuruWebhookPayload): NormalizedBuyer | null {
	const email = pickEmail(payload.contact?.email);
	if (!email) return null;

	const buyer: NormalizedBuyer = { email };

	const name = pickStr(payload.contact?.name, 200);
	const phone = composeGuruPhone(payload.contact);
	const document = pickStr(payload.contact?.doc, 32);
	const address = mapAddress(payload.contact);

	if (name) buyer.name = name;
	if (phone) buyer.phone = phone;
	if (document) buyer.document = document;
	if (address) buyer.address = address;

	return buyer;
}

export function extractGuruUtm(payload: GuruWebhookPayload): NormalizedUtm | undefined {
	const src = payload.source;
	if (!src) return undefined;

	// Deliberadamente ignora source.pptc.*: misturar o rastreamento interno do
	// Guru com as UTMs do checkout divergiria do modelo da Lastlink.
	const utm: NormalizedUtm = {};
	const source = pickStr(src.utm_source, 500);
	const medium = pickStr(src.utm_medium, 500);
	const campaign = pickStr(src.utm_campaign, 500);
	const term = pickStr(src.utm_term, 500);
	const content = pickStr(src.utm_content, 2000);

	if (source) utm.source = source;
	if (medium) utm.medium = medium;
	if (campaign) utm.campaign = campaign;
	if (term) utm.term = term;
	if (content) utm.content = content;

	return Object.keys(utm).length > 0 ? utm : undefined;
}

function joinProductNames(payload: GuruWebhookPayload): string | null {
	const names = collectGuruProductNames(payload);
	return names.length > 0 ? names.join(', ') : null;
}

export function mapGuruTransactionRow(
	payload: GuruWebhookPayload
): TransactionInsertRow | null {
	const id = pickStr(payload.id, 191);
	const status = pickStr(payload.status, 64);
	if (!id || !status) return null;

	const contact = payload.contact;
	const email = pickEmail(contact?.email);
	if (!email) {
		console.warn('[guru-webhook] contact email missing; using placeholder for transaction:', id);
	}

	const product = payload.product;
	const payment = payload.payment;
	const dates = payload.dates;
	const utm = extractGuruUtm(payload);

	return {
		gateway: 'guru',
		webhook_event_id: buildGuruEventKey(id, status),
		event: normalizeGuruEvent(status),
		// O payload do Guru não tem flag de teste; a distinção vem do token usado.
		is_test: false,
		buyer_lastlink_id: pickStr(contact?.id, 191),
		buyer_email: email ?? `unknown+${id.replace(/-/g, '').slice(0, 12)}@guru.local`,
		buyer_name: pickStr(contact?.name, 200),
		buyer_phone: composeGuruPhone(contact),
		buyer_document: pickStr(contact?.doc, 32),
		buyer_address: mapAddress(contact),
		product_lastlink_id: pickStr(product?.internal_id, 191),
		product_name: joinProductNames(payload),
		product_price: pickNum(product?.unit_value),
		offer_lastlink_id: pickStr(product?.offer?.id, 191),
		offer_name: pickStr(product?.offer?.name, 200),
		payment_id: pickStr(payment?.marketplace_id, 191),
		payment_method: pickStr(payment?.method, 64),
		payment_date: toIso(dates?.confirmed_at) ?? toIso(dates?.ordered_at),
		original_price: pickNum(payment?.gross),
		total_price: pickNum(payment?.total),
		installments: pickInt(payment?.installments?.qty),
		interest_amount: pickNum(payment?.installments?.interest),
		recurrency: pickInt(payload.invoice?.cycle),
		next_billing_at: toIso(payload.invoice?.period_end),
		subscription_lastlink_id: pickStr(payload.subscription?.internal_id, 191),
		commissions: payload.affiliations ?? null,
		seller_lastlink_id: pickStr(product?.producer?.marketplace_id, 191),
		seller_email: pickEmail(product?.producer?.contact_email),
		// utm_id fica nulo: na Lastlink sempre foi nulo, e preenchê-lo só no Guru
		// faria a coluna mudar de significado conforme o gateway.
		utm_id: null,
		utm_source: utm?.source ?? null,
		utm_medium: utm?.medium ?? null,
		utm_campaign: utm?.campaign ?? null,
		utm_term: utm?.term ?? null,
		utm_content: utm?.content ?? null,
		device_user_agent: pickStr(payload.infrastructure?.user_agent, 1000),
		device_ip: pickIp(payload.infrastructure?.ip),
		raw_payload: stripApiToken(payload),
		lastlink_created_at: toIso(dates?.created_at)
	};
}
