import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type ProfileData = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	documentType: string;
	document: string;
	street: string;
	number: string;
	neighborhood: string;
	city: string;
	state: string;
	zip: string;
	country: string;
	photoDataUrl: string | null;
};

const STORAGE_KEY = 'pd-profile-v1';

function empty(): ProfileData {
	return {
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		documentType: 'CPF',
		document: '',
		street: '',
		number: '',
		neighborhood: '',
		city: '',
		state: '',
		zip: '',
		country: 'Brasil',
		photoDataUrl: null
	};
}

function load(): ProfileData {
	if (!browser) return empty();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return empty();
		const parsed = JSON.parse(raw) as Partial<ProfileData> & { address?: string };
		const base = { ...empty(), ...parsed };
		// migração: endereço antigo em string única
		if (parsed.address && !parsed.street) {
			base.street = parsed.address;
		}
		delete (base as { address?: string }).address;
		return base;
	} catch {
		return empty();
	}
}

function save(data: ProfileData) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {}
}

function createProfileStore() {
	const { subscribe, update, set } = writable<ProfileData>(load());

	return {
		subscribe,
		setField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
			update((s) => {
				const next = { ...s, [key]: value };
				save(next);
				return next;
			});
		},
		setAll(data: ProfileData) {
			save(data);
			set(data);
		},
		reset() {
			const d = empty();
			save(d);
			set(d);
		}
	};
}

export const profileStore = createProfileStore();
