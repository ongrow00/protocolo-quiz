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
		 * Call from layout on client: fills store from URL only if nothing was in sessionStorage (first entry).
		 */
		hydrateFromUrl(searchParams: URLSearchParams) {
			update((state) => {
				if (hasAnyParams(state)) return state;
				const utm = parseUtmFromSearchParams(searchParams);
				const offer = searchParams.get('offer')?.trim() ?? null;
				if (Object.keys(utm).length === 0 && offer == null) return state;
				const next: SessionParams = { utm, offer };
				saveToSession(next);
				return next;
			});
		}
	};
}

export const sessionStore = createSessionStore();
