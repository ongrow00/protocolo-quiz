import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { postQuizStore } from '$lib/stores/post-quiz.store';
import { trackAddToCart } from '$lib/services/analytics.service';
import { flushQuizProgressImmediate } from '$lib/services/quiz-progress-sync.service';

/** Evita sync duplicado na mesma visita (restore + gate). */
let offerSyncedThisVisit = false;

/** Persiste `offer_revealed` no Supabase quando o pitch de /results já foi liberado. */
export function syncResultsOfferRevealedToDb(): void {
	if (!browser || offerSyncedThisVisit) return;
	if (!get(postQuizStore).resultsOfferRevealed) return;

	offerSyncedThisVisit = true;
	flushQuizProgressImmediate();
}

/** VTurb liberou a oferta em /results: analytics + banco. */
export function onResultsOfferRevealedByVturb(): void {
	if (!browser) return;

	trackAddToCart();
	syncResultsOfferRevealedToDb();
}
