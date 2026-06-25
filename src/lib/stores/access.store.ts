import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabase';

export type ProductAccess = {
	has_protocolo: boolean;
	has_consultoria: boolean;
	has_treino: boolean;
	loaded: boolean;
};

const INITIAL: ProductAccess = {
	has_protocolo: false,
	has_consultoria: false,
	has_treino: false,
	loaded: false
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function createAccessStore() {
	const { subscribe, set } = writable<ProductAccess>(INITIAL);

	let loadGeneration = 0;
	let inflightUserId: string | null = null;
	let inflight: Promise<void> | null = null;

	async function fetchProfile(userId: string) {
		return supabase
			.from('profiles')
			.select('has_protocolo, has_consultoria, has_treino')
			.eq('id', userId)
			.maybeSingle();
	}

	async function loadForUser(userId: string) {
		const generation = ++loadGeneration;
		set({ ...INITIAL, loaded: false });

		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			if (generation !== loadGeneration) return;

			try {
				const { data, error } = await fetchProfile(userId);

				if (generation !== loadGeneration) return;

				if (error) {
					console.error('accessStore.load:', error.message, error.code);
					if (attempt < MAX_RETRIES) {
						await delay(RETRY_DELAY_MS);
						continue;
					}
					set({ ...INITIAL, loaded: false });
					return;
				}

				if (!data) {
					set({ ...INITIAL, loaded: true });
					return;
				}

				set({
					has_protocolo: data.has_protocolo ?? false,
					has_consultoria: data.has_consultoria ?? false,
					has_treino: data.has_treino ?? false,
					loaded: true
				});
				return;
			} catch (e) {
				console.error('accessStore.load unexpected:', e);
				if (attempt < MAX_RETRIES) {
					await delay(RETRY_DELAY_MS);
					continue;
				}
				if (generation !== loadGeneration) return;
				set({ ...INITIAL, loaded: false });
				return;
			}
		}
	}

	return {
		subscribe,

		async load(userId?: string) {
			if (!browser) return;

			let id = userId;
			if (!id) {
				const {
					data: { user }
				} = await supabase.auth.getUser();
				id = user?.id;
			}

			if (!id) {
				loadGeneration++;
				inflight = null;
				inflightUserId = null;
				set({ ...INITIAL, loaded: true });
				return;
			}

			if (inflight && inflightUserId === id) {
				return inflight;
			}

			inflightUserId = id;
			inflight = loadForUser(id).finally(() => {
				inflight = null;
				inflightUserId = null;
			});
			return inflight;
		},

		reset() {
			loadGeneration++;
			inflight = null;
			inflightUserId = null;
			set(INITIAL);
		}
	};
}

export const accessStore = createAccessStore();

export const canAccessProtocolo = derived(accessStore, ($a) => $a.has_protocolo);
export const canAccessLista = derived(accessStore, ($a) => $a.has_protocolo);

export const canAccessConsultoria = derived(accessStore, ($a) => $a.has_consultoria);

export const canAccessTreino = derived(accessStore, ($a) => $a.has_treino);
export const accessLoaded = derived(accessStore, ($a) => $a.loaded);
