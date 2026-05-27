import type { HeroHeadlineSegment, HeroProgress } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_HERO_PROGRESS: HeroProgress = {
	currentStep: 3,
	steps: [
		{ label: 'Anamnese' },
		{ label: 'Pagamento' },
		{ label: 'Protocolo' },
		{ label: 'Liberação' }
	]
};

export const ATIVACAO_HERO_HEADLINE: readonly HeroHeadlineSegment[] = [
	{ bold: true, text: 'Seu acesso' },
	{ text: ' está ' },
	{ bold: true, text: 'quase completo' },
	{ text: ', veja esse video para ' },
	{ bold: true, text: 'continuar' },
	{ text: '.' }
];
