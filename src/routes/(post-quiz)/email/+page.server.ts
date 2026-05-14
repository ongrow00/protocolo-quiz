import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** Coleta de contato voltou a ser em `/whatsapp`. */
export const load: PageServerLoad = () => {
	redirect(308, '/whatsapp');
};
