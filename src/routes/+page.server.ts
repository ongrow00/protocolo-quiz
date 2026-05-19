import type { PageServerLoad } from './$types';

/** Landing em / — sem redirect. (Cache do browser: limpar dados do site se /plan abrir sozinho.) */
export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'no-store, no-cache, must-revalidate'
	});
	return {};
};
