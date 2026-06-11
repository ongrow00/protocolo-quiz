import type { UtmParams } from '$lib/data/types';
import type { AppCheckoutState, CheckoutBuyerParams } from '$lib/utils/checkout-url';
import { supabase } from '$lib/supabase';

const UTM_COLUMNS = 'utm_source, utm_medium, utm_campaign, utm_term, utm_content';
const CHECKOUT_COLUMNS = `${UTM_COLUMNS}, first_name, last_name, email, phone`;

type ProfileUtmRow = {
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	utm_term: string | null;
	utm_content: string | null;
};

type ProfileCheckoutRow = ProfileUtmRow & {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	phone: string | null;
};

function buyerFromProfileRow(
	row: ProfileCheckoutRow | null | undefined,
	authEmail?: string | null
): CheckoutBuyerParams {
	if (!row) {
		const email = authEmail?.trim().toLowerCase();
		return email ? { email } : {};
	}

	const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || undefined;
	const phone = row.phone?.trim() || undefined;
	const email = (row.email ?? authEmail)?.trim().toLowerCase() || undefined;

	return {
		...(name ? { name } : {}),
		...(phone ? { phone } : {}),
		...(email ? { email } : {})
	};
}

export function utmFromProfileRow(row: ProfileUtmRow | null | undefined): UtmParams {
	if (!row) return {};
	const utm: UtmParams = {};
	if (row.utm_source) utm.utm_source = row.utm_source;
	if (row.utm_medium) utm.utm_medium = row.utm_medium;
	if (row.utm_campaign) utm.utm_campaign = row.utm_campaign;
	if (row.utm_term) utm.utm_term = row.utm_term;
	if (row.utm_content) utm.utm_content = row.utm_content;
	return utm;
}

/** UTMs salvos em `profiles`, vinculados ao usuário autenticado. */
export async function loadProfileUtm(userId: string): Promise<UtmParams> {
	const { data, error } = await supabase
		.from('profiles')
		.select(UTM_COLUMNS)
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		console.warn('loadProfileUtm:', error.message);
		return {};
	}

	return utmFromProfileRow(data as ProfileUtmRow | null);
}

/** UTMs + nome, telefone e e-mail salvos em `profiles` (área logada do app). */
export async function loadAppCheckoutState(
	userId: string,
	authEmail?: string | null
): Promise<AppCheckoutState> {
	const { data, error } = await supabase
		.from('profiles')
		.select(CHECKOUT_COLUMNS)
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		console.warn('loadAppCheckoutState:', error.message);
		return {
			utm: {},
			buyer: buyerFromProfileRow(null, authEmail)
		};
	}

	const row = data as ProfileCheckoutRow | null;
	return {
		utm: utmFromProfileRow(row),
		buyer: buyerFromProfileRow(row, authEmail)
	};
}

