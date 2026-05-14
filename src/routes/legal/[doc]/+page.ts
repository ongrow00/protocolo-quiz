import { error } from '@sveltejs/kit';
import { LEGAL_DOCS } from '$lib/data/legal-docs';

export function load({ params }: { params: { doc: string } }) {
	const doc = LEGAL_DOCS[params.doc];
	if (!doc) error(404, 'Página não encontrada');
	return { doc: params.doc, ...doc };
}
