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

function createAccessStore() {
	const { subscribe, set } = writable<ProductAccess>(INITIAL);

	return {
		subscribe,

		async load() {
			if (!browser) return;

			try {
				const {
					data: { user }
				} = await supabase.auth.getUser();
				if (!user) return;

				const { data, error } = await supabase
					.from('profiles')
					.select('has_protocolo, has_consultoria, has_treino')
					.eq('id', user.id)
					.maybeSingle();

				if (error || !data) {
					set({ ...INITIAL, loaded: true });
					return;
				}

				set({
					has_protocolo: data.has_protocolo ?? false,
					has_consultoria: data.has_consultoria ?? false,
					has_treino: data.has_treino ?? false,
					loaded: true
				});
			} catch {
				set({ ...INITIAL, loaded: true });
			}
		},

		reset() {
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
