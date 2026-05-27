import type { OfferFeatureItem } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_OFFER_FEATURES: OfferFeatureItem[] = [
	{
		icon: 'calendar',
		title: '12 Meses de Acompanhamento Completo',
		description:
			'Acompanhamento contínuo para garantir evolução e estabilidade dos resultados.'
	},
	{
		icon: 'clipboard',
		title: 'Plano Alimentar 100% Personalizado',
		description: 'Atualizado todos os meses conforme sua evolução e objetivo.'
	},
	{
		icon: 'mobile',
		title: 'Acesso ao Aplicativo WebDiet',
		description: 'Seu plano, evolução e suporte sempre na palma da sua mão.'
	},
	{
		icon: 'chat',
		title: 'Suporte Diário pelo WhatsApp',
		description: 'Acompanhamento da equipe de segunda a sábado.'
	},
	{
		icon: 'lessons',
		title: 'Aulas Comportamentais e Psicológicas',
		description: 'Conteúdos sobre ansiedade, compulsão e comportamento alimentar.',
		bonus: true
	},
	{
		icon: 'chart',
		title: 'Análise de Evolução',
		description: 'Avaliações recorrentes para ajustar seu acompanhamento.'
	},
	{
		icon: 'video',
		title: 'Lives Mensais com Lucas',
		description: 'Encontros ao vivo para acompanhar sua evolução.',
		bonus: true
	},
	{
		icon: 'food',
		title: 'Lista da Liberdade',
		description: 'Mais de 200 refeições para adaptar sua dieta à vida real.',
		bonus: true
	},
	{
		icon: 'fire',
		title: 'Protocolo de Desbloqueio de 14 Dias Incluso',
		description: 'As 4 etapas iniciais para acelerar seus resultados.'
	},
	{
		icon: 'shield',
		title: 'Garantia Incondicional de 21 Dias',
		description: 'Se não fizer sentido para você, devolvemos 100% do valor.'
	}
];
