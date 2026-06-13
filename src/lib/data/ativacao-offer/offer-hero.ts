import type { HeroHeadlineSegment, HeroProgress } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_HERO_PROGRESS: HeroProgress = {
	currentStep: 3,
	steps: [
		{ label: 'Anamnese' },
		{ label: 'Acesso' },
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

export const ATIVACAO_HERO_SUBHEADLINE: readonly HeroHeadlineSegment[] = [
	{ text: 'Assista a este ' },
	{ bold: true, text: 'breve vídeo' },
	{ text: ' antes de ' },
	{ bold: true, text: 'acessar o aplicativo' },
	{ text: '. Assim que ele terminar, seu acesso ' },
	{ bold: true, text: 'será liberado automaticamente' },
	{ text: '.' }
];
