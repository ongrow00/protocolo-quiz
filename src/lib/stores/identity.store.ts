import { browser } from '$app/environment';

const ANON_KEY = 'pd-anonymous-id';

let cachedId: string | null = null;

/**
 * Returns a persistent anonymous ID for the current browser.
 * Created once on first visit, stored in localStorage, and used
 * to correlate quiz/meal/progress data before authentication.
 */
export function getAnonymousId(): string {
	if (cachedId) return cachedId;

	if (browser) {
		const existing = localStorage.getItem(ANON_KEY);
		if (existing) {
			cachedId = existing;
			return existing;
		}
		const id = crypto.randomUUID();
		localStorage.setItem(ANON_KEY, id);
		cachedId = id;
		return id;
	}

	return crypto.randomUUID();
}

/**
 * Clears the anonymous ID (e.g. after merge with authenticated user).
 * A new one will be generated on next call to getAnonymousId().
 */
export function clearAnonymousId(): void {
	cachedId = null;
	if (browser) localStorage.removeItem(ANON_KEY);
}
