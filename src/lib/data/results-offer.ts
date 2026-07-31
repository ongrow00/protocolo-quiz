const VTURB_ACCOUNT = 'cb674c2a-44f8-4af3-949d-f12749d714fb';

/** Player VTurb a partir do hash (o `id` do elemento leva o prefixo `vid-`). */
function vturbPlayer(hash: string, revealAtSec?: number): ResultsOfferVideo {
	return {
		smartplayerId: `vid-${hash}`,
		scriptSrc: `https://scripts.converteai.net/${VTURB_ACCOUNT}/players/${hash}/v4/player.js`,
		...(revealAtSec != null ? { revealAtSec } : {})
	};
}

/** Oferta principal (`/results`, bloco `#bloco-preco`). */
export const RESULTS_OFFER = {
	/** R$47,00 — oferta padrão */
	checkoutUrl: 'https://lastlink.com/p/C1C84B971/checkout-payment/',
	/** R$37,00 — `?offer=OF002` */
	checkoutUrlOf002: 'https://lastlink.com/p/CC4FA15CD/checkout-payment/',
	installmentLabel: '9x de R$6,32',
	installmentLabelOf002: '7x de R$6,16'
} as const;

export type ResultsOfferVideo = {
	smartplayerId: string;
	scriptSrc: string;
	/** Segundos de vídeo até revelar a oferta. Omitido ⇒ `RESULTS_VTURB_DELAY_SEC`. */
	revealAtSec?: number;
};

/** Oferta de campanha, resolvida por `?offer=` em `/results`. */
export type ResultsOfferConfig = {
	/** Valor principal do bloco de preço (ex.: 'R$67,00'). */
	mainPrice: string;
	/** Renderizado como "ou {label}" (ex.: '12x de R$7,14'). */
	installmentLabel: string;
	checkoutUrl: string;
	/** Omitido ⇒ vídeo padrão de `/results`. */
	video?: ResultsOfferVideo;
	/** Preço riscado. Omitido ⇒ 'R$197'. */
	compareAtPrice?: string;
	/**
	 * Esconde o Voltar/bónus em `/results`.
	 * Só faz sentido quando a oferta já vale o preço do bónus (OF37): lá o bónus
	 * prometeria "+20%" e entregaria o mesmo valor.
	 */
	disablesBonus?: boolean;
};

/**
 * Campanhas por `?offer=` (`/results`). O código vem da URL ou da sessão do funil.
 * Sem match, a página mantém a oferta padrão (R$47) e o fluxo do bónus (OF002).
 */
export const RESULTS_OFFERS: Record<string, ResultsOfferConfig> = {
	OF37: {
		mainPrice: 'R$37,00',
		installmentLabel: '7x de R$6,16',
		checkoutUrl: 'https://lastlink.com/p/CC4FA15CD/checkout-payment/',
		video: vturbPlayer('6a5a0bf15bd6ca54b0033c33'),
		disablesBonus: true
	},
	OF67: {
		mainPrice: 'R$67,00',
		installmentLabel: '12x de R$7,14',
		checkoutUrl: 'https://lastlink.com/p/C13E08ABB/checkout-payment/',
		video: vturbPlayer('6a5a11082a8666c4f6765151')
	},
	OF87: {
		mainPrice: 'R$87,00',
		installmentLabel: '12x de R$9,26',
		checkoutUrl: 'https://lastlink.com/p/CEB4B9B8D/checkout-payment/',
		video: vturbPlayer('6a5a0bca6ed0caeb794c28b4')
	},

	// Digital Manager Guru — mesmas ofertas de R$47 e R$37, com checkout no Guru.
	// Servem para migrar tráfego aos poucos: a coluna `gateway` em transactions
	// separa o que veio de cada lado. Os parâmetros (name, phone, sck, src e utm_*)
	// são anexados por appendCheckoutParams, igual à Lastlink.
	GROF47: {
		mainPrice: 'R$47,00',
		installmentLabel: RESULTS_OFFER.installmentLabel,
		checkoutUrl: 'https://pay.protocolodesbloqueio.com.br/pay/protocolo-desbloqueio-47'
	},
	GROF37: {
		mainPrice: 'R$37,00',
		installmentLabel: RESULTS_OFFER.installmentLabelOf002,
		checkoutUrl: 'https://pay.protocolodesbloqueio.com.br/pay/protocolo-desbloqueio-37',
		video: vturbPlayer('6a5a0bf15bd6ca54b0033c33'),
		disablesBonus: true
	}
};

/** Código canónico (trim + maiúsculas) quando existe campanha; senão `undefined`. */
export function resolveResultsOfferCode(code?: string | null): string | undefined {
	const normalized = code?.trim().toUpperCase();
	if (!normalized || !Object.hasOwn(RESULTS_OFFERS, normalized)) return undefined;
	return normalized;
}

export function resolveResultsOffer(code?: string | null): ResultsOfferConfig | undefined {
	const normalized = resolveResultsOfferCode(code);
	return normalized ? RESULTS_OFFERS[normalized] : undefined;
}
