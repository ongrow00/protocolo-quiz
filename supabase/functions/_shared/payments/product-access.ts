export type ProductAccessFlags = {
	has_protocolo: boolean;
	has_consultoria: boolean;
	has_treino: boolean;
};

const PROTOCOL_DESBLOQUEIO = 'protocolo desbloqueio';
const PROTOCOL_TREINO = 'protocolo treino';
const CONSULTORIA_LIBERDADE = 'consultoria liberdade';

function normalizeProductName(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Mapeia nomes de produto para flags de acesso do perfil. */
export function resolveProductAccess(productNames: string[]): ProductAccessFlags {
	const names = productNames.map((name) => normalizeProductName(name ?? ''));
	return {
		has_protocolo: names.some((name) => name === PROTOCOL_DESBLOQUEIO),
		has_consultoria: names.some((name) => name === CONSULTORIA_LIBERDADE),
		has_treino: names.some((name) => name === PROTOCOL_TREINO)
	};
}

export function isSupportedProduct(access: ProductAccessFlags): boolean {
	return access.has_protocolo || access.has_consultoria || access.has_treino;
}

/** Protocolo Desbloqueio cria conta; treino e consultoria só atualizam conta existente. */
export function createsNewAccount(access: ProductAccessFlags): boolean {
	return access.has_protocolo;
}

export function isUpsellOnly(access: ProductAccessFlags): boolean {
	return (access.has_treino || access.has_consultoria) && !access.has_protocolo;
}
