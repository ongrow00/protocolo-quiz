/** Hero acima do vídeo — exclusivo de `/atiavacao-de-conta`. */
export const ATIVACAO_HERO_PROGRESS = {
	currentStep: 3,
	steps: [
		{ label: 'Anamnese' },
		{ label: 'Pagamento' },
		{ label: 'Acesso' },
		{ label: 'Liberação' }
	]
} as const;

export const ATIVACAO_HERO_HEADLINE = [
	{ bold: true, text: 'Seu acesso' },
	{ text: ' está ' },
	{ bold: true, text: 'quase completo' },
	{ text: ', veja esse video para ' },
	{ bold: true, text: 'continuar' },
	{ text: '.' }
] as const;
