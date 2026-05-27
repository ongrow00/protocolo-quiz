import type { UtmParams } from '$lib/data/types';
import { supabase } from '$lib/supabase';

const UTM_COLUMNS = 'utm_source, utm_medium, utm_campaign, utm_term, utm_content';

type ProfileUtmRow = {
	utm_source: string | null;
	utm_medium: string | null;
	utm_campaign: string | null;
	utm_term: string | null;
	utm_content: string | null;
};

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
