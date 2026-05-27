import type { UtmParams } from '$lib/data/types';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/** Anexa UTMs e parâmetros extras à URL de checkout (Lastlink). */
export function appendCheckoutParams(
	baseUrl: string,
	options: { utm?: UtmParams; extra?: Record<string, string | undefined> }
): string {
	const url = new URL(baseUrl);

	if (options.utm) {
		for (const key of UTM_KEYS) {
			const value = options.utm[key];
			if (value) url.searchParams.set(key, value);
		}
	}

	if (options.extra) {
		for (const [key, value] of Object.entries(options.extra)) {
			if (value) url.searchParams.set(key, value);
		}
	}

	return url.toString();
}
