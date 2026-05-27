/**
 * Dados nutricionais (TACO) e porções exatas da planilha 4_Dietas_1000kcal.xlsx.
 *
 * Fase 1 = Low Carb (dias 1–3)
 * Fase 2 = Jejum (dias 4–6)
 * Fase 3 = Jejum + Low Carb (dias 7–10)
 * Fase 4 = Jejum + Low Carb Extremo (dias 11–14)
 */

export type PhaseId = 1 | 2 | 3 | 4;

export type Macros = {
	kcal: number;
	protein: number;
	carbs: number;
	fat: number;
};

// ---------------------------------------------------------------------------
// Fase a partir do dia
// ---------------------------------------------------------------------------

export function getPhase(day: number): PhaseId {
	if (day <= 3) return 1;
	if (day <= 6) return 2;
	if (day <= 10) return 3;
	return 4;
}

export const PHASE_LABELS: Record<PhaseId, string> = {
	1: 'Desbloqueio',
	2: 'Aceleração',
	3: 'Consolidação',
	4: 'Finalização'
};

export function phaseHasBreakfast(phase: PhaseId): boolean {
	return phase === 1;
}

// ---------------------------------------------------------------------------
// Macros por 100g — base TACO (Tabela Brasileira de Composição de Alimentos)
// ---------------------------------------------------------------------------

const PER_100G: Record<string, Macros> = {
	'arroz': { kcal: 130, protein: 2.5, carbs: 28.2, fat: 0.3 },
	'mandioca': { kcal: 125, protein: 0.6, carbs: 30.1, fat: 0.3 },
	'macarrao': { kcal: 136, protein: 4.0, carbs: 27.0, fat: 1.0 },
	'batata-inglesa': { kcal: 52, protein: 1.2, carbs: 12.0, fat: 0.1 },
	'batata-doce': { kcal: 77, protein: 0.6, carbs: 18.4, fat: 0.1 },
	'abobora': { kcal: 26, protein: 0.7, carbs: 5.6, fat: 0.3 },
	'feijao': { kcal: 77, protein: 4.8, carbs: 14.0, fat: 0.5 },
	'inhame': { kcal: 97, protein: 2.0, carbs: 23.3, fat: 0.1 },
	'patinho': { kcal: 219, protein: 36.0, carbs: 0, fat: 7.3 },
	'frango': { kcal: 159, protein: 32.0, carbs: 0, fat: 2.5 },
	'tilapia': { kcal: 128, protein: 26.0, carbs: 0, fat: 2.5 },
	'suino': { kcal: 164, protein: 31.0, carbs: 0, fat: 3.5 },
	'ovo': { kcal: 143, protein: 13.0, carbs: 0.7, fat: 9.5 },
	'soja': { kcal: 116, protein: 17.0, carbs: 3.5, fat: 3.5 },
	'moela': { kcal: 152, protein: 25.0, carbs: 0, fat: 5.5 },
	'figado': { kcal: 150, protein: 21.0, carbs: 5.0, fat: 5.0 },
	'mussarela': { kcal: 330, protein: 22.0, carbs: 0.5, fat: 26.0 },
	'requeijao-light': { kcal: 167, protein: 11.0, carbs: 3.0, fat: 12.0 },
	'atum': { kcal: 166, protein: 26.0, carbs: 0, fat: 7.0 },
	'queijo-minas': { kcal: 240, protein: 17.0, carbs: 1.0, fat: 19.0 }
};

/** Calcula macros para uma porção em gramas a partir da base per 100g. */
export function macrosForGrams(foodKey: string, grams: number): Macros {
	const base = PER_100G[foodKey];
	if (!base) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
	const ratio = grams / 100;
	return {
		kcal: Math.round(base.kcal * ratio),
		protein: Math.round(base.protein * ratio * 10) / 10,
		carbs: Math.round(base.carbs * ratio * 10) / 10,
		fat: Math.round(base.fat * ratio * 10) / 10
	};
}

export function sumMacros(...items: Macros[]): Macros {
	const result: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
	for (const m of items) {
		result.kcal += m.kcal;
		result.protein += m.protein;
		result.carbs += m.carbs;
		result.fat += m.fat;
	}
	result.protein = Math.round(result.protein * 10) / 10;
	result.carbs = Math.round(result.carbs * 10) / 10;
	result.fat = Math.round(result.fat * 10) / 10;
	return result;
}

// ---------------------------------------------------------------------------
// Porções do almoço — carboidratos (gramas por fase)
// ---------------------------------------------------------------------------

export type PortionByPhase = Record<PhaseId, number>;

export const ALMOCO_CARB_GRAMS: Record<string, PortionByPhase> = {
	'arroz': { 1: 100, 2: 150, 3: 80, 4: 40 },
	'mandioca': { 1: 100, 2: 150, 3: 80, 4: 40 },
	'macarrao': { 1: 90, 2: 135, 3: 70, 4: 35 },
	'batata-inglesa': { 1: 250, 2: 365, 3: 200, 4: 100 },
	'batata-doce': { 1: 160, 2: 240, 3: 130, 4: 65 },
	'abobora': { 1: 350, 2: 525, 3: 280, 4: 140 },
	'inhame': { 1: 110, 2: 165, 3: 90, 4: 45 }
};

/** Arroz + Feijão é composto: [gramas arroz, gramas feijão] por fase. */
export const ARROZ_FEIJAO_GRAMS: Record<PhaseId, [number, number]> = {
	1: [50, 80],
	2: [75, 120],
	3: [40, 65],
	4: [30, 30]
};

export const ALMOCO_PROTEIN_GRAMS: Record<string, PortionByPhase> = {
	'patinho': { 1: 100, 2: 150, 3: 180, 4: 200 },
	'frango': { 1: 100, 2: 150, 3: 180, 4: 200 },
	'tilapia': { 1: 100, 2: 150, 3: 180, 4: 200 },
	'suino': { 1: 100, 2: 150, 3: 180, 4: 200 },
	'ovos': { 1: 100, 2: 150, 3: 150, 4: 150 },
	'soja': { 1: 100, 2: 150, 3: 180, 4: 200 },
	'moela': { 1: 100, 2: 150, 3: 180, 4: 200 },
	'figado': { 1: 100, 2: 150, 3: 180, 4: 200 }
};

// ---------------------------------------------------------------------------
// Porções do jantar (formato comida) — diferem do almoço na Fase 3
// ---------------------------------------------------------------------------

export const JANTA_CARB_GRAMS: Record<string, PortionByPhase> = {
	'arroz': { 1: 100, 2: 150, 3: 100, 4: 40 },
	'mandioca': { 1: 100, 2: 150, 3: 100, 4: 40 },
	'macarrao': { 1: 90, 2: 135, 3: 90, 4: 35 },
	'batata-inglesa': { 1: 250, 2: 365, 3: 250, 4: 100 },
	'batata-doce': { 1: 160, 2: 240, 3: 160, 4: 65 },
	'abobora': { 1: 350, 2: 525, 3: 350, 4: 140 },
	'inhame': { 1: 110, 2: 165, 3: 110, 4: 45 }
};

export const JANTA_ARROZ_FEIJAO_GRAMS: Record<PhaseId, [number, number]> = {
	1: [50, 80],
	2: [75, 120],
	3: [50, 80],
	4: [30, 30]
};

export const JANTA_PROTEIN_GRAMS: Record<string, PortionByPhase> = {
	'patinho': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'frango': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'tilapia': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'suino': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'ovos': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'soja': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'moela': { 1: 100, 2: 150, 3: 150, 4: 200 },
	'figado': { 1: 100, 2: 150, 3: 150, 4: 200 }
};

// ---------------------------------------------------------------------------
// Café da manhã — porções fixas (só Fase 1)
// ---------------------------------------------------------------------------

export type FixedPortionEntry = {
	label: string;
	shortLabel: string;
	macros: Macros;
};

export const BREAKFAST_CARB_PORTIONS: Record<string, FixedPortionEntry> = {
	'pao-frances': {
		label: 'Pão francês 1 unid',
		shortLabel: 'Pão francês',
		macros: { kcal: 150, protein: 4.7, carbs: 28.5, fat: 1.7 }
	},
	'tapioca': {
		label: 'Tapioca 50g',
		shortLabel: 'Tapioca',
		macros: { kcal: 68, protein: 0, carbs: 17.1, fat: 0 }
	},
	'cuscuz': {
		label: 'Cuscuz 90g',
		shortLabel: 'Cuscuz',
		macros: { kcal: 101, protein: 2.3, carbs: 21.1, fat: 0.5 }
	},
	'pao-forma': {
		label: 'Pão de forma 2 fatias',
		shortLabel: 'Pão de forma',
		macros: { kcal: 131, protein: 4.2, carbs: 24.5, fat: 1.7 }
	},
	'rap10': {
		label: 'Rap 10 1 unid',
		shortLabel: 'Rap 10',
		macros: { kcal: 126, protein: 3.6, carbs: 20.3, fat: 3.6 }
	},
	'torrada': {
		label: 'Torrada Bauducco 4 unid',
		shortLabel: 'Torrada Bauducco',
		macros: { kcal: 123, protein: 3.0, carbs: 20.4, fat: 3.3 }
	},
	'biscoito-arroz': {
		label: 'Biscoito de arroz 30g',
		shortLabel: 'Biscoito de arroz',
		macros: { kcal: 116, protein: 2.1, carbs: 25.2, fat: 0.3 }
	},
	'banana': {
		label: 'Banana 1 unid',
		shortLabel: 'Banana',
		macros: { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }
	}
};

export const BREAKFAST_PROTEIN_PORTIONS: Record<string, FixedPortionEntry> = {
	'ovo-mussarela': {
		label: '1 ovo + 1 fatia de mussarela',
		shortLabel: 'Ovo + Mussarela',
		macros: { kcal: 138, protein: 10.9, carbs: 0.5, fat: 10.0 }
	},
	'frango-mussarela': {
		label: '30g de frango + 1 fatia de mussarela',
		shortLabel: 'Frango + Mussarela',
		macros: { kcal: 114, protein: 14.0, carbs: 0.1, fat: 6.0 }
	},
	'patinho-mussarela': {
		label: '30g de patinho + 1 fatia de mussarela',
		shortLabel: 'Patinho + Mussarela',
		macros: { kcal: 132, protein: 15.2, carbs: 0.1, fat: 7.4 }
	},
	'atum-requeijao': {
		label: '75g de atum + 30g de requeijão light',
		shortLabel: 'Atum + Requeijão',
		macros: { kcal: 175, protein: 22.8, carbs: 0.9, fat: 8.9 }
	},
	'queijo': {
		label: '2 fatias de queijo',
		shortLabel: 'Queijo',
		macros: { kcal: 132, protein: 8.8, carbs: 0.2, fat: 10.4 }
	},
	'frango-requeijao': {
		label: '45g de frango + 25g de requeijão light',
		shortLabel: 'Frango + Requeijão',
		macros: { kcal: 114, protein: 17.2, carbs: 0.8, fat: 4.1 }
	},
	'2ovos': {
		label: '2 ovos',
		shortLabel: 'Ovos',
		macros: { kcal: 143, protein: 13.0, carbs: 0.7, fat: 9.5 }
	},
	'queijo-whey': {
		label: '1 fatia de queijo + meia dose de whey',
		shortLabel: 'Queijo + Whey',
		macros: { kcal: 126, protein: 16.4, carbs: 1.6, fat: 5.7 }
	}
};

// ---------------------------------------------------------------------------
// Frutas — porções fixas da planilha (Fases 1–3)
// ---------------------------------------------------------------------------

export const FRUIT_PORTIONS: Record<string, FixedPortionEntry> = {
	'banana': {
		label: 'Banana prata — 1 unidade (100g)',
		shortLabel: 'Banana prata',
		macros: { kcal: 89, protein: 1.1, carbs: 22.8, fat: 0.3 }
	},
	'maca': {
		label: 'Maçã — 1 unidade (150g)',
		shortLabel: 'Maçã',
		macros: { kcal: 84, protein: 0.5, carbs: 22.2, fat: 0.2 }
	},
	'mamao': {
		label: 'Mamão formosa — 1 fatia grande (190g)',
		shortLabel: 'Mamão formosa',
		macros: { kcal: 86, protein: 1.0, carbs: 19.8, fat: 0.2 }
	},
	'manga': {
		label: 'Manga — 1/2 unidade (130g)',
		shortLabel: 'Manga',
		macros: { kcal: 83, protein: 0.5, carbs: 20.4, fat: 0.2 }
	},
	'laranja': {
		label: 'Laranja — 1 unidade (190g)',
		shortLabel: 'Laranja',
		macros: { kcal: 86, protein: 1.9, carbs: 20.0, fat: 0.2 }
	},
	'uva': {
		label: 'Uva — 1 cacho pequeno (120g)',
		shortLabel: 'Uva',
		macros: { kcal: 83, protein: 0.8, carbs: 20.0, fat: 0.2 }
	},
	'melancia': {
		label: 'Melancia — 1 fatia (260g)',
		shortLabel: 'Melancia',
		macros: { kcal: 86, protein: 1.6, carbs: 19.8, fat: 0.5 }
	},
	'abacaxi': {
		label: 'Abacaxi — 1 fatia grossa (180g)',
		shortLabel: 'Abacaxi',
		macros: { kcal: 86, protein: 0.7, carbs: 20.7, fat: 0.2 }
	},
	'morango': {
		label: 'Morango — 1 xícara cheia (280g)',
		shortLabel: 'Morango',
		macros: { kcal: 84, protein: 1.7, carbs: 19.0, fat: 0.3 }
	},
	'pera': {
		label: 'Pera — 1 unidade (160g)',
		shortLabel: 'Pera',
		macros: { kcal: 85, protein: 0.6, carbs: 21.8, fat: 0.2 }
	}
};

// ---------------------------------------------------------------------------
// Lanche Fase 4 — opções combo da aba Jejum + Low Carb Extremo
// ---------------------------------------------------------------------------

export type LancheComboOption = {
	name: string;
	macros: Macros;
	ingredients: string[];
};

export const PHASE4_LANCHE_OPTIONS: LancheComboOption[] = [
	{
		name: 'Mix de Castanhas',
		ingredients: ['Mix de castanhas 35g'],
		macros: { kcal: 210, protein: 5.3, carbs: 7.0, fat: 18.2 }
	},
	{
		name: 'Queijo Minas + Café',
		ingredients: ['Queijo minas 75g', 'Café sem açúcar'],
		macros: { kcal: 180, protein: 12.8, carbs: 0.8, fat: 14.3 }
	},
	{
		name: 'Omelete Simples',
		ingredients: ['2 ovos', '6g azeite'],
		macros: { kcal: 196, protein: 13.0, carbs: 0.7, fat: 15.5 }
	},
	{
		name: 'Queijo Minas + Abacate',
		ingredients: ['Queijo minas 45g', 'Abacate 75g'],
		macros: { kcal: 180, protein: 8.6, carbs: 5.0, fat: 14.9 }
	},
	{
		name: 'Ovos + Coco',
		ingredients: ['2 ovos', 'Coco fresco 20g'],
		macros: { kcal: 214, protein: 13.7, carbs: 3.7, fat: 16.2 }
	}
];

// ---------------------------------------------------------------------------
// Helpers para extrair food key de um item ID do picker
// ---------------------------------------------------------------------------

/**
 * Extrai a chave nutricional de um item ID do picker.
 * Ex.: 'almoco-carb-arroz' → 'arroz', 'cafe-prot-2ovos' → '2ovos'
 */
export function extractFoodKey(itemId: string): string {
	const parts = itemId.split('-');
	return parts.slice(2).join('-');
}

/**
 * Calcula macros de um carboidrato do almoço/jantar (incluindo arroz-feijão).
 */
export function mainCarbMacros(
	foodKey: string,
	phase: PhaseId,
	block: 'almoco' | 'janta'
): { label: string; macros: Macros } {
	if (foodKey === 'arroz-feijao') {
		const [arrozG, feijaoG] =
			block === 'janta' ? JANTA_ARROZ_FEIJAO_GRAMS[phase] : ARROZ_FEIJAO_GRAMS[phase];
		const arrozM = macrosForGrams('arroz', arrozG);
		const feijaoM = macrosForGrams('feijao', feijaoG);
		return {
			label: `${arrozG}g arroz + ${feijaoG}g feijão`,
			macros: sumMacros(arrozM, feijaoM)
		};
	}

	const table = block === 'janta' ? JANTA_CARB_GRAMS : ALMOCO_CARB_GRAMS;
	const grams = table[foodKey]?.[phase] ?? 100;
	return {
		label: `${grams}g ${foodKeyToName(foodKey)}`,
		macros: macrosForGrams(foodKey, grams)
	};
}

/**
 * Calcula macros de uma proteína do almoço/jantar.
 */
export function mainProteinMacros(
	foodKey: string,
	phase: PhaseId,
	block: 'almoco' | 'janta'
): { label: string; macros: Macros } {
	const table = block === 'janta' ? JANTA_PROTEIN_GRAMS : ALMOCO_PROTEIN_GRAMS;
	const grams = table[foodKey]?.[phase] ?? 100;

	const nutritionKey = foodKey === 'ovos' ? 'ovo' : foodKey;
	const eggCount = Math.round(grams / 50);
	const label =
		foodKey === 'ovos' ? `${eggCount} ovos` : `${grams}g ${foodKeyToName(foodKey)}`;

	return {
		label,
		macros: macrosForGrams(nutritionKey, grams)
	};
}

// ---------------------------------------------------------------------------
// Display names
// ---------------------------------------------------------------------------

const FOOD_NAMES: Record<string, string> = {
	'arroz': 'arroz branco',
	'mandioca': 'mandioca',
	'macarrao': 'macarrão',
	'batata-inglesa': 'batata inglesa',
	'batata-doce': 'batata doce',
	'abobora': 'abóbora cabotiá',
	'inhame': 'inhame',
	'patinho': 'patinho',
	'frango': 'peito de frango',
	'tilapia': 'tilápia',
	'suino': 'filé suíno',
	'soja': 'proteína de soja',
	'moela': 'moela',
	'figado': 'fígado'
};

export function foodKeyToName(key: string): string {
	return FOOD_NAMES[key] ?? key;
}
