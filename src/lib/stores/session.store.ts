import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { SessionParams, UtmParams } from '$lib/data/types';

const SESSION_KEY = 'pd-session-params';

const EMPTY: SessionParams = {
	utm: {},
	offer: null
};

function hasAnyParams(s: SessionParams): boolean {
	const hasUtm = Object.keys(s.utm).length > 0;
	return hasUtm || s.offer != null;
}

function loadFromSession(): SessionParams {
	if (!browser) return { ...EMPTY };
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return { ...EMPTY };
		const parsed = JSON.parse(raw) as SessionParams;
		return {
			utm: parsed.utm ?? {},
			offer: parsed.offer ?? null
		};
	} catch {
		return { ...EMPTY };
	}
}

function saveToSession(state: SessionParams): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	} catch {
		// ignore
	}
}

function parseUtmFromSearchParams(sp: URLSearchParams): UtmParams {
	const utm: UtmParams = {};
	const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
	for (const key of keys) {
		const v = sp.get(key);
		if (v) utm[key] = v;
	}
	return utm;
}

function createSessionStore() {
	const { subscribe, set, update } = writable<SessionParams>(loadFromSession());

	return {
		subscribe,

		/**
		 * Sincroniza UTMs (first-touch) e `offer` (sempre que vier na URL) a partir dos query params.
		 */
		hydrateFromUrl(searchParams: URLSearchParams) {
			update((state) => {
				const urlUtm = parseUtmFromSearchParams(searchParams);
				const urlOffer = searchParams.get('offer')?.trim() || null;
				const hasUrlUtm = Object.keys(urlUtm).length > 0;
				const firstTouch = !hasAnyParams(state);

				if (!firstTouch && !hasUrlUtm && urlOffer == null) return state;

				const next: SessionParams = { ...state };
				let changed = false;

				if (firstTouch && hasUrlUtm) {
					next.utm = urlUtm;
					changed = true;
				}
				if (urlOffer != null && next.offer !== urlOffer) {
					next.offer = urlOffer;
					changed = true;
				}

				if (!changed) return state;
				saveToSession(next);
				return next;
			});
		}
	};
}

export const sessionStore = createSessionStore();
