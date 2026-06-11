import { browser } from '$app/environment';
import { writable, derived } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase';

export type AuthState = {
	user: User | null;
	session: Session | null;
	loading: boolean;
};

const INITIAL: AuthState = {
	user: null,
	session: null,
	loading: true
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(INITIAL);

	let initialized = false;

	async function init() {
		if (!browser || initialized) return;
		initialized = true;

		const {
			data: { user }
		} = await supabase.auth.getUser();

		let session: Session | null = null;
		if (user) {
			const {
				data: { session: activeSession }
			} = await supabase.auth.getSession();
			session = activeSession;
		} else {
			// Sessão local obsoleta (ex.: usuário removido no Auth)
			await supabase.auth.signOut();
		}

		set({
			user: user ?? null,
			session,
			loading: false
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			set({
				user: session?.user ?? null,
				session: session ?? null,
				loading: false
			});
		});
	}

	return {
		subscribe,
		init,

		async signIn(email: string, password: string) {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) throw error;
			return data;
		},

		async signOut() {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		},

		async resetPassword(email: string) {
			const { error } = await supabase.auth.resetPasswordForEmail(email);
			if (error) throw error;
		}
	};
}

export const authStore = createAuthStore();

export const isAuthenticated = derived(authStore, ($auth) => $auth.user !== null);
export const authLoading = derived(authStore, ($auth) => $auth.loading);
export const currentUser = derived(authStore, ($auth) => $auth.user);
