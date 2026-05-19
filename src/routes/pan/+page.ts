import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/** Atalho para o questionário (typo comum de /plan). */
export const load: PageLoad = () => {
	redirect(302, '/plan');
};
