import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface PostQuizState {
	name: string;
	whatsapp: string;
	/** Clicou no CTA "COMEÇAR AGORA" no bloco de preço (results). */
	clickedComecarAgora: boolean;
	/**
	 * /results: mesmo gatilho do VTurb que exibe `.results-vturb-delay` (revealHiddenAfterPlayback).
	 * Não vai para sessionStorage — só memória na visita atual.
	 */
	resultsContentRevealed: boolean;
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

const SESSION_KEY = 'lotz-post-quiz-state';

const INITIAL: PostQuizState = {
	name: '',
	whatsapp: '',
	clickedComecarAgora: false,
	resultsContentRevealed: false,
	bonusInteracted: false,
	bonusDiscountAccepted: false
};

function loadFromSession(): PostQuizState {
	if (!browser) return INITIAL;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return INITIAL;
		const parsed = JSON.parse(raw) as Partial<PostQuizState>;
		return {
			name: typeof parsed.name === 'string' ? parsed.name : '',
			whatsapp: typeof parsed.whatsapp === 'string' ? parsed.whatsapp : '',
			clickedComecarAgora: parsed.clickedComecarAgora === true,
			resultsContentRevealed: false,
			bonusInteracted: parsed.bonusInteracted === true,
			bonusDiscountAccepted: parsed.bonusDiscountAccepted === true
		};
	} catch {
		return INITIAL;
	}
}

function saveToSession(state: PostQuizState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(
			SESSION_KEY,
			JSON.stringify({
				name: state.name,
				whatsapp: state.whatsapp,
				clickedComecarAgora: state.clickedComecarAgora,
				bonusInteracted: state.bonusInteracted,
				bonusDiscountAccepted: state.bonusDiscountAccepted
			})
		);
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

function createPostQuizStore() {
	const { subscribe, set, update } = writable<PostQuizState>(loadFromSession());

	function persist(state: PostQuizState): PostQuizState {
		saveToSession(state);
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

		markComecarAgoraClicked() {
			update((s) => (s.clickedComecarAgora ? s : persist({ ...s, clickedComecarAgora: true })));
		},

		markResultsContentRevealed() {
			update((s) => (s.resultsContentRevealed ? s : { ...s, resultsContentRevealed: true }));
		},

		resetResultsContentRevealed() {
			update((s) => (s.resultsContentRevealed ? { ...s, resultsContentRevealed: false } : s));
		},

		acceptBonusDiscount() {
			update((s) => ({
				...persist({
					...s,
					bonusInteracted: true,
					bonusDiscountAccepted: true
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
			if (browser) sessionStorage.removeItem(SESSION_KEY);
		}
	};
}

export const postQuizStore = createPostQuizStore();
