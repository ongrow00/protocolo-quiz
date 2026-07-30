import type { OfferCta } from '$lib/components/post-quiz/ResultsOfferPage.svelte';

export const ATIVACAO_OFFER_CTA: OfferCta = {
	primaryLabel: 'Aceitar Oferta',
	checkoutUrl: 'https://lastlink.com/p/CAEB73A76/checkout-payment/',
	/** Quem comprou pelo Guru continua no Guru (ver resolveGatewayCheckoutUrl). */
	checkoutUrlGuru: 'https://pay.protocolodesbloqueio.com.br/pay/consultoria-liberdade',
	checkoutSrc: 'onboarding-upsell',
	declineLabel: 'Recusar e entrar no App',
	declineModal: {
		message: 'Essa condição não está disponível em outro lugar. Deseja mesmo recusar?',
		confirmLabel: 'Sim',
		cancelLabel: 'Não'
	}
};
