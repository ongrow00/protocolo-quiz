import type { OfferAccessSection, HeroHeadlineSegment } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_OFFER_ACCESS_SECTION: OfferAccessSection = {
	title: [
		{ bold: true, text: '12 meses' },
		{ text: ' de ' },
		{ bold: true, text: 'acompanhamento individual' },
		{ text: '.' }
	] as readonly HeroHeadlineSegment[],
	subtitle: [
		{ text: 'Somente ' },
		{ bold: true, text: 'nessa página' },
		{ text: ', você acessa ' },
		{ bold: true, text: '12 meses de acompanhamento individual' },
		{ text: ' pelo preço de um.' }
	] as readonly HeroHeadlineSegment[]
};
