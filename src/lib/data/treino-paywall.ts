/** Conteúdo do paywall de treino (bottom sheet em `/treino`). */
export const TREINO_PAYWALL = {
	checkoutUrl: 'https://lastlink.com/p/CE7F06EBF/checkout-payment/',
	/** Quem comprou pelo Guru continua no Guru (ver resolveGatewayCheckoutUrl). */
	checkoutUrlGuru: 'https://pay.protocolodesbloqueio.com.br/pay/protocolo-de-treino-17',
	checkoutSrc: 'upgrade-treino-interno',
	headline: 'Libere seu treino agora!',
	priceLabel: 'R$17,00',
	ctaLabel: 'Começar Agora',
	features: [
		{
			title: 'Um treino feito para o seu corpo',
			subtitle:
				'Nada genérico: cada treino é ajustado para seu objetivo, condicionamento e rotina.'
		},
		{
			title: 'Máxima queima de gordura',
			subtitle:
				'Combinações estratégicas de exercícios para acelerar seu emagrecimento durante o protocolo.'
		},
		{
			title: 'Sem desculpas para começar',
			subtitle: 'Treine em casa, na academia, com pouco tempo ou poucos equipamentos.'
		},
		{
			title: 'Resultados consistentes e seguros',
			subtitle:
				'Você evolui semana após semana com um plano progressivo e fácil de seguir.'
		}
	]
} as const;
