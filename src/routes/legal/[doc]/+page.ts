import { error } from '@sveltejs/kit';

const ALLOWED = new Set([
	'termos-de-uso',
	'politica-de-privacidade',
	'politica-de-assinatura',
	'garantia-de-reembolso'
]);

export function load({ params }) {
	if (!ALLOWED.has(params.doc)) error(404, 'Página não encontrada');
	return { doc: params.doc };
}
