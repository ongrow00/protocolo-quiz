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
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim()) {
		const n = Number(v.replace(',', '.'));
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function pickInt(v: unknown): number | null {
	const n = pickNum(v);
	if (n === null) return null;
	return Math.trunc(n);
}

function toIso(v: unknown): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	const d = new Date(v);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isValidIpv4(value: string): boolean {
	const parts = value.split('.');
	if (parts.length !== 4) return false;
	return parts.every((part) => {
		if (!/^\d{1,3}$/.test(part)) return false;
		const n = Number(part);
		return n >= 0 && n <= 255;
	});
}

/** Postgres `inet` rejects arbitrary strings — only persist valid IPv4/IPv6. */
function pickIp(v: unknown): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	const s = v.trim();
	if (isValidIpv4(s)) return s;
	// IPv6 only (must contain ":" and hex/colon chars — not URLs like "https://...")
	if (/^[0-9a-fA-F:]+$/.test(s) && s.includes(':')) return s;
	return null;
}

function pickDeviceIp(device: Record<string, unknown> | undefined): string | null {
	if (!device) return null;
	return pickIp(device.ip) ?? pickIp(device.Ip) ?? pickIp(device.IP);
}

function resolveBuyerEmail(
	buyerEmail: string | null | undefined,
	eventId: string
): string {
	return (
		pickEmail(buyerEmail) ??
		`unknown+${eventId.replace(/-/g, '').slice(0, 12)}@lastlink.local`
	);
}

function joinProductNames(payload: LastlinkWebhookPayload): string | null {
	const names = (payload.Data?.Products ?? [])
		.map((product) => pickStr(product?.Name, 200))
		.filter((name): name is string => !!name);
	if (names.length === 0) return null;
	return names.join(', ');
}

export function mapTransactionRow(payload: LastlinkWebhookPayload): TransactionInsertRow | null {
	const eventId = parseUuid(payload.Id);
	if (!eventId) return null;

	const data = payload.Data;
	const buyer = data?.Buyer;
	const buyerEmail = pickEmail(buyer?.Email);
	const email = resolveBuyerEmail(buyer?.Email, eventId);
	if (!buyerEmail) {
		console.warn('[lastlink-webhook] buyer email missing; using placeholder for transaction:', eventId);
	}

	const products = data?.Products ?? [];
	const product = products[0];
	const productId = parseUuid(product?.Id);
	const subscription =
		(productId
			? data?.Subscriptions?.find((item) => parseUuid(item?.ProductId) === productId)
			: undefined) ?? data?.Subscriptions?.[0];

	const purchase = data?.Purchase;
	const payment = purchase?.Payment;
	const offer = data?.Offer;
	const utm = data?.Utm;
	const seller = data?.Seller;
	const device = data?.DeviceInfo as Record<string, unknown> | undefined;

	return {
		webhook_event_id: eventId,
		event: pickStr(payload.Event, 128) ?? 'Unknown',
		is_test: payload.IsTest === true,
		buyer_lastlink_id: parseUuid(buyer?.Id),
		buyer_email: email,
		buyer_name: pickStr(buyer?.Name, 200),
		buyer_phone: pickStr(buyer?.PhoneNumber, 32),
		buyer_document: pickStr(buyer?.Document, 32),
		buyer_address: buyer?.Address ?? null,
		product_lastlink_id: productId,
		product_name: joinProductNames(payload),
		product_price: pickNum(product?.Price),
		offer_lastlink_id: parseUuid(offer?.Id),
		offer_name: pickStr(offer?.Name, 200),
		payment_id: parseUuid(purchase?.PaymentId),
		payment_method: pickStr(payment?.PaymentMethod, 64),
		payment_date: toIso(purchase?.PaymentDate),
		original_price: pickNum(purchase?.OriginalPrice?.Value),
		total_price: pickNum(purchase?.Price?.Value),
		installments: pickInt(payment?.NumberOfInstallments),
		interest_amount: pickNum(payment?.InterestRateAmount),
		recurrency: pickInt(purchase?.Recurrency),
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
		device_ip: pickDeviceIp(device),
		raw_payload: payload,
		lastlink_created_at: toIso(payload.CreatedAt)
	};
}

/** Columns refreshed from the webhook payload (excludes linkage fields). */
export function toTransactionPayloadUpdate(
	row: TransactionInsertRow
): Omit<TransactionInsertRow, 'user_id' | 'anonymous_id' | 'processed_at'> {
	const {
		user_id: _userId,
		anonymous_id: _anonymousId,
		processed_at: _processedAt,
		...payloadFields
	} = row;
	return payloadFields;
}
