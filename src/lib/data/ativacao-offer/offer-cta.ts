import type { OfferCta } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_OFFER_CTA: OfferCta = {
	primaryLabel: 'Aceitar Oferta',
	checkoutUrl: 'https://lastlink.com/p/CF5DBA234/checkout-payment/',
	checkoutSrc: 'onboarding-upsell',
	declineLabel: 'Recusar Oferta',
	declineModal: {
		message: 'Essa condição não está disponível em outro lugar. Deseja mesmo recusar?',
		confirmLabel: 'Sim',
		cancelLabel: 'Não'
	}
};
