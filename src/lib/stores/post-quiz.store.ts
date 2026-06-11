import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { MealSelections } from '$lib/data/meal-preferences';
import { normalizeMealSelections } from '$lib/data/meal-preferences';
import { DEFAULT_SELECTIONS } from '$lib/data/meal-plan-generator';
import type { MealFollowUpAnswer } from '$lib/data/meal-follow-up-questions';
import { setChallengeSelections } from '$lib/data/challenge-plan';

export interface PostQuizState {
	name: string;
	whatsapp: string;
	mealSelections: MealSelections | null;
	/** Respostas das perguntas de follow-up (sim/não). Persistido para retomar o fluxo. */
	followUpAnswers: Record<string, MealFollowUpAnswer> | null;
	/**
	 * true quando o onboarding in-app está completo (usuário passou pela oferta e salvou no Supabase).
	 * Enquanto false, o layout redireciona para /ativacao.
	 */
	onboardingComplete: boolean;
	/** Clicou no CTA "COMEÇAR AGORA" no bloco de preço (results). */
	clickedComecarAgora: boolean;
	/**
	 * /results: oferta revelada pelo gate de reprodução (video.currentTime >= delay).
	 * Em memória na visita; `resultsOfferRevealed` persiste o pitch no localStorage.
	 */
	resultsContentRevealed: boolean;
	/**
	 * /results: pitch do vídeo já atingido — persiste em localStorage para liberar
	 * conteúdo e sticky footer ao recarregar ou voltar à página.
	 */
	resultsOfferRevealed: boolean;
	/**
	 * /ativacao: oferta revelada pelo gate do vídeo. Persiste em localStorage para
	 * não exigir rever o vídeo ao recarregar ou voltar à tela.
	 */
	ativacaoOfferRevealed: boolean;
	/**
	 * /plan/bonus: utilizador já respondeu (aceitar ou recusar). Persiste em sessionStorage.
	 * Usado para: após interação, Voltar em /results vai a /metabolismo (não repete o bónus).
	 */
	bonusInteracted: boolean;
	/**
	 * /plan/bonus: utilizador aceitou o desconto extra (+20%). Persiste em sessionStorage.
	 * Quando true, a página de resultados mostra R$37 e parcela 6x R$9,00.
	 */
	bonusDiscountAccepted: boolean;
}

const STORAGE_KEY = 'pd-post-quiz-state-v1';

const INITIAL: PostQuizState = {
	name: '',
	whatsapp: '',
	mealSelections: null,
	followUpAnswers: null,
	onboardingComplete: false,
	clickedComecarAgora: false,
	resultsContentRevealed: false,
	resultsOfferRevealed: false,
	ativacaoOfferRevealed: false,
	bonusInteracted: false,
	bonusDiscountAccepted: false
};

function loadState(): PostQuizState {
	if (!browser) return INITIAL;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return INITIAL;
		const parsed = JSON.parse(raw) as Partial<PostQuizState>;
		const rawSelections =
			parsed.mealSelections && typeof parsed.mealSelections === 'object'
				? (parsed.mealSelections as Partial<MealSelections>)
				: null;
		const selections = rawSelections
			? normalizeMealSelections(rawSelections, DEFAULT_SELECTIONS)
			: null;
		if (selections) setChallengeSelections(selections);
		const followUp =
			parsed.followUpAnswers && typeof parsed.followUpAnswers === 'object'
				? (parsed.followUpAnswers as Record<string, MealFollowUpAnswer>)
				: null;
		const ativacaoOfferRevealed = parsed.ativacaoOfferRevealed === true;
		const resultsOfferRevealed = parsed.resultsOfferRevealed === true;
		return {
			name: typeof parsed.name === 'string' ? parsed.name : '',
			whatsapp: typeof parsed.whatsapp === 'string' ? parsed.whatsapp : '',
			mealSelections: selections,
			followUpAnswers: followUp,
			onboardingComplete: parsed.onboardingComplete === true,
			clickedComecarAgora: parsed.clickedComecarAgora === true,
			resultsContentRevealed: resultsOfferRevealed || ativacaoOfferRevealed,
			resultsOfferRevealed,
			ativacaoOfferRevealed,
			bonusInteracted: parsed.bonusInteracted === true,
			bonusDiscountAccepted: parsed.bonusDiscountAccepted === true
		};
	} catch {
		return INITIAL;
	}
}

function saveState(state: PostQuizState): void {
	if (!browser) return;
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				name: state.name,
				whatsapp: state.whatsapp,
				mealSelections: state.mealSelections,
				followUpAnswers: state.followUpAnswers,
				onboardingComplete: state.onboardingComplete,
				clickedComecarAgora: state.clickedComecarAgora,
				resultsOfferRevealed: state.resultsOfferRevealed,
				ativacaoOfferRevealed: state.ativacaoOfferRevealed,
				bonusInteracted: state.bonusInteracted,
				bonusDiscountAccepted: state.bonusDiscountAccepted
			})
		);
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

function createPostQuizStore() {
	const { subscribe, set, update } = writable<PostQuizState>(loadState());

	function persist(state: PostQuizState): PostQuizState {
		saveState(state);
		return state;
	}

	return {
		subscribe,

		setName(value: string) {
			update((s) => persist({ ...s, name: value }));
		},

		setWhatsapp(value: string) {
			update((s) => persist({ ...s, whatsapp: value }));
		},

		setMealSelections(selections: MealSelections) {
			setChallengeSelections(selections);
			update((s) => persist({ ...s, mealSelections: selections }));
		},

		setFollowUpAnswers(answers: Record<string, MealFollowUpAnswer>) {
			update((s) => persist({ ...s, followUpAnswers: answers }));
		},

		markOnboardingComplete() {
			update((s) => (s.onboardingComplete ? s : persist({ ...s, onboardingComplete: true })));
		},

		syncOnboardingComplete(complete: boolean) {
			update((s) => (s.onboardingComplete === complete ? s : persist({ ...s, onboardingComplete: complete })));
		},

		markComecarAgoraClicked() {
			update((s) => (s.clickedComecarAgora ? s : persist({ ...s, clickedComecarAgora: true })));
		},

		markResultsContentRevealed() {
			update((s) =>
				s.resultsContentRevealed
					? s
					: persist({ ...s, resultsContentRevealed: true, resultsOfferRevealed: true })
			);
		},

		/** Restaura conteúdo revelado na sessão quando o pitch já foi salvo localmente. */
		restoreResultsContentIfOfferRevealed() {
			update((s) =>
				s.resultsOfferRevealed && !s.resultsContentRevealed
					? { ...s, resultsContentRevealed: true }
					: s
			);
		},

		markAtivacaoOfferRevealed() {
			update((s) =>
				s.ativacaoOfferRevealed
					? s
					: persist({ ...s, ativacaoOfferRevealed: true, resultsContentRevealed: true })
			);
		},

		resetResultsContentRevealed() {
			update((s) => (s.resultsContentRevealed ? { ...s, resultsContentRevealed: false } : s));
		},

		acceptBonusDiscount() {
			update((s) => ({
				...persist({
					...s,
					bonusInteracted: true,
					bonusDiscountAccepted: true,
					resultsOfferRevealed: true
				}),
				resultsContentRevealed: true
			}));
		},

		declineBonusDiscount() {
			update((s) =>
				persist({
					...s,
					bonusInteracted: true,
					bonusDiscountAccepted: false
				})
			);
		},

		reset() {
			set(INITIAL);
			if (browser) localStorage.removeItem(STORAGE_KEY);
		}
	};
}

export const postQuizStore = createPostQuizStore();
