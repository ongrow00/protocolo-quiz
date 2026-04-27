import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface PostQuizState {
	name: string;
	whatsapp: string;
	/** Clicou no CTA "COMEÇAR AGORA" no bloco de preço (results). */
	clickedComecarAgora: boolean;
}

const SESSION_KEY = 'lotz-post-quiz-state';

const INITIAL: PostQuizState = {
	name: '',
	whatsapp: '',
	clickedComecarAgora: false
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
			clickedComecarAgora: parsed.clickedComecarAgora === true
		};
	} catch {
		return INITIAL;
	}
}

function saveToSession(state: PostQuizState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
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

		reset() {
			set(INITIAL);
			if (browser) sessionStorage.removeItem(SESSION_KEY);
		}
	};
}

export const postQuizStore = createPostQuizStore();
