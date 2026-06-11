import type { LastlinkWebhookPayload, TransactionInsertRow } from './types.ts';

function parseUuid(v: unknown): string | null {
	if (typeof v !== 'string') return null;
	const s = v.trim().toLowerCase();
	if (
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)
	)
		return null;
	return s;
}

function pickStr(v: unknown, max = 500): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	return v.trim().slice(0, max);
}

function pickEmail(v: unknown): string | null {
	const s = pickStr(v, 320);
	return s ? s.toLowerCase() : null;
}

function pickNum(v: unknown): number | null {
	if (typeof v !== 'number' || !Number.isFinite(v)) return null;
	return v;
}

function toIso(v: unknown): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	const d = new Date(v);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function mapTransactionRow(payload: LastlinkWebhookPayload): TransactionInsertRow | null {
	const eventId = parseUuid(payload.Id);
	const data = payload.Data;
	const buyer = data?.Buyer;
	const email = pickEmail(buyer?.Email);

	if (!eventId || !email) return null;

	const product = data?.Products?.[0];
	const purchase = data?.Purchase;
	const payment = purchase?.Payment;
	const offer = data?.Offer;
	const subscription = data?.Subscriptions?.[0];
	const utm = data?.Utm;
	const seller = data?.Seller;
	const device = data?.DeviceInfo;

	return {
		webhook_event_id: eventId,
		event: payload.Event,
		is_test: payload.IsTest === true,
		buyer_lastlink_id: parseUuid(buyer?.Id),
		buyer_email: email,
		buyer_name: pickStr(buyer?.Name, 200),
		buyer_phone: pickStr(buyer?.PhoneNumber, 32),
		buyer_document: pickStr(buyer?.Document, 32),
		buyer_address: buyer?.Address ?? null,
		product_lastlink_id: parseUuid(product?.Id),
		product_name: pickStr(product?.Name, 200),
		product_price: pickNum(product?.Price),
		offer_lastlink_id: parseUuid(offer?.Id),
		offer_name: pickStr(offer?.Name, 200),
		payment_id: parseUuid(purchase?.PaymentId),
		payment_method: pickStr(payment?.PaymentMethod, 64),
		payment_date: toIso(purchase?.PaymentDate),
		original_price: pickNum(purchase?.OriginalPrice?.Value),
		total_price: pickNum(purchase?.Price?.Value),
		installments: pickNum(payment?.NumberOfInstallments),
		interest_amount: pickNum(payment?.InterestRateAmount),
		recurrency: pickNum(purchase?.Recurrency),
		next_billing_at: toIso(purchase?.NextBilling),
		subscription_lastlink_id: parseUuid(subscription?.Id),
		commissions: data?.Commissions ?? null,
		seller_lastlink_id: parseUuid(seller?.Id),
		seller_email: pickEmail(seller?.Email),
		utm_id: pickStr(utm?.UtmId, 200),
		utm_source: pickStr(utm?.UtmSource, 500),
		utm_medium: pickStr(utm?.UtmMedium, 500),
		utm_campaign: pickStr(utm?.UtmCampaign, 500),
		utm_term: pickStr(utm?.UtmTerm, 500),
		utm_content: pickStr(utm?.UtmContent, 2000),
		device_user_agent: pickStr(device?.UserAgent, 1000),
		device_ip: pickStr(device?.ip, 64),
		raw_payload: payload,
		lastlink_created_at: toIso(payload.CreatedAt)
	};
}
