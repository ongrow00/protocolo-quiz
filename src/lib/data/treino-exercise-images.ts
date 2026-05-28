const EXERCISES_BASE = '/images/treino/exercises';

/** Slug do arquivo em static/images/treino/exercises/{slug}.png */
const SLUG_BY_NAME: Record<string, string> = {
	'Abdominal com pernas elevadas': 'abdominal-com-pernas-elevadas',
	'Abdominal curto': 'abdominal-curto',
	'Agachamento apoiando as costas na parede': 'agachamento-apoiando-as-costas-na-parede',
	'Agachamento com peso do corpo': 'agachamento-com-peso-do-corpo',
	'Agachamento com peso do corpo no banco': 'agachamento-com-peso-do-corpo-no-banco',
	'Agachamento com peso do corpo no sofá': 'agachamento-com-peso-do-corpo-no-sofa',
	'Agachamento livre': 'agachamento-com-peso-do-corpo',
	'Agachamento no banco segurando halter': 'agachamento-no-banco-segurando-halter',
	'Agachamento no Smith': 'agachamento-no-smith',
	'Agachamento no sofá': 'agachamento-no-sofa',
	'Agachamento no sofá segurando carga': 'agachamento-no-sofa-segurando-carga',
	'Agachamento segurando carga': 'agachamento-segurando-carga',
	'Agachamento segurando halter': 'agachamento-segurando-carga',
	'Agachamento sumô no banco (peso do corpo)': 'agachamento-com-peso-do-corpo-no-banco',
	'Agachamento sumô no sofá': 'agachamento-sumo-no-sofa',
	'Agachamento sumô segurando carga': 'agachamento-sumo-segurando-carga',
	'Agachamento sumô segurando halter': 'agachamento-sumo-segurando-halter',
	'Cadeira extensora': 'cadeira-extensora',
	'Desenvolvimento de ombros em pé': 'desenvolvimento-de-ombros-em-pe',
	'Elevação de quadril apoiada no sofá com carga': 'elevacao-de-quadril-apoiada-no-sofa-com-carga',
	'Elevação de quadril no chão': 'elevacao-de-quadril-no-chao',
	'Elevação de quadril no step com halter': 'elevacao-de-quadril-no-step-com-halter',
	'Elevação frontal com halteres': 'elevacao-frontal-com-halteres',
	'Elevação frontal com pesos': 'elevacao-frontal-com-pesos',
	'Elevação lateral com halteres': 'elevacao-lateral-com-pesos',
	'Elevação lateral com pesos': 'elevacao-lateral-com-pesos',
	'Flexão com joelhos apoiados': 'flexao-com-joelhos-apoiados',
	'Flexão de braço': 'flexao-de-braco',
	'Leg Press': 'leg-press',
	'Passada alternada para frente': 'passada-alternada-para-frente',
	'Passada para trás alternada': 'passada-para-tras-alternada',
	'Prancha': 'prancha',
	'Prancha com joelhos apoiados': 'prancha-com-joelhos-apoiados',
	'Puxada aberta': 'puxada-aberta',
	'Puxada fechada': 'puxada-fechada',
	'Remada baixa com barra': 'remada-baixa-com-barra',
	'Remada baixa improvisada com mochila': 'remada-baixa-improvisada-com-mochila',
	'Remada com halter': 'remada-com-halter',
	'Remada com pesos': 'remada-com-pesos',
	'Remada curvada com pesos': 'remada-curvada-com-pesos',
	'Remada unilateral com peso': 'remada-unilateral-com-peso'
};

export function getTreinoExerciseImageUrl(name: string): string | undefined {
	const slug = SLUG_BY_NAME[name];
	if (!slug) return undefined;
	return `${EXERCISES_BASE}/${slug}.png`;
}

export function getTreinoExerciseSlug(name: string): string | undefined {
	return SLUG_BY_NAME[name];
}

/** Todos os slugs únicos (para validar assets em static/). */
export function getTreinoExerciseImageSlugs(): string[] {
	return [...new Set(Object.values(SLUG_BY_NAME))].sort();
}
