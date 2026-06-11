import type { UtmParams } from '$lib/data/types';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/** Mescla UTMs; fontes anteriores têm prioridade (ex.: sessão do funil antes do perfil). */
export function mergeUtmParams(...sources: (UtmParams | undefined)[]): UtmParams {
	const merged: UtmParams = {};
	for (const src of sources) {
		if (!src) continue;
		for (const key of UTM_KEYS) {
			const value = src[key];
			if (value && !merged[key]) merged[key] = value;
		}
	}
	return merged;
}

/** Dados do lead para checkout pré-populado (Lastlink: name, phone, email, sck). */
export type CheckoutBuyerParams = {
	name?: string;
	phone?: string;
	email?: string;
	/** Rastreamento — ex.: funnel_session_id do funil. */
	sck?: string;
};

/** Telefone no formato Lastlink (+55…), a partir do valor salvo no funil. */
export function formatCheckoutPhone(raw: string): string | undefined {
	const digits = raw.replace(/\D/g, '');
	if (!digits) return undefined;
	if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
	if (digits.length >= 10) return `+55${digits}`;
	return undefined;
}

function applyQueryParams(url: URL, params: Record<string, string | undefined>) {
	for (const [key, value] of Object.entries(params)) {
		if (value) url.searchParams.set(key, value);
	}
}

/** Anexa UTMs, dados do comprador e parâmetros extras à URL de checkout (Lastlink). */
export function appendCheckoutParams(
	baseUrl: string,
	options: {
		utm?: UtmParams;
		buyer?: CheckoutBuyerParams;
		extra?: Record<string, string | undefined>;
	}
): string {
	const url = new URL(baseUrl);

	if (options.utm) {
		for (const key of UTM_KEYS) {
			const value = options.utm[key];
			if (value) url.searchParams.set(key, value);
		}
	}

	const buyer = options.buyer;
	if (buyer) {
		const name = buyer.name?.trim();
		const phone = buyer.phone ? formatCheckoutPhone(buyer.phone) : undefined;
		const email = buyer.email?.trim().toLowerCase();
		const sck = buyer.sck?.trim();
		applyQueryParams(url, {
			...(name ? { name } : {}),
			...(phone ? { phone } : {}),
			...(email ? { email } : {}),
			...(sck ? { sck } : {})
		});
	}

	if (options.extra) {
		applyQueryParams(url, options.extra);
	}

	return url.toString();
}

export type AppCheckoutState = {
	utm: UtmParams;
	buyer: CheckoutBuyerParams;
};

export const EMPTY_APP_CHECKOUT_STATE: AppCheckoutState = { utm: {}, buyer: {} };

/** Checkout interno (área logada): UTMs da sessão + perfil e dados do comprador no banco. */
export function buildAppCheckoutUrl(
	baseUrl: string,
	options: {
		sessionUtm?: UtmParams;
		checkout: AppCheckoutState;
		extra?: Record<string, string | undefined>;
	}
): string {
	return appendCheckoutParams(baseUrl, {
		utm: mergeUtmParams(options.sessionUtm, options.checkout.utm),
		buyer: options.checkout.buyer,
		extra: options.extra
	});
}
