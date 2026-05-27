/**
 * Gera o plano de 14 dias a partir das preferências do usuário.
 *
 * Cada dia pertence a uma fase:
 *   Fase 1 (dias 1–3)  → Low Carb          — 4 refeições (com café)
 *   Fase 2 (dias 4–6)  → Jejum             — 3 refeições (sem café)
 *   Fase 3 (dias 7–10) → Jejum + Low Carb  — 3 refeições (sem café)
 *   Fase 4 (dias 11–14)→ Jejum + LC Extremo— 3 refeições (sem café)
 *
 * Para cada refeição gera 4 opções baseadas nas preferências do usuário.
 */

import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import type { MealBlockId, MealSelections } from '$lib/data/meal-preferences';
import {
	type Macros,
	type PhaseId,
	getPhase,
	phaseHasBreakfast,
	extractFoodKey,
	sumMacros,
	BREAKFAST_CARB_PORTIONS,
	BREAKFAST_PROTEIN_PORTIONS,
	FRUIT_PORTIONS,
	PHASE4_LANCHE_OPTIONS,
	mainCarbMacros,
	mainProteinMacros,
	foodKeyToName
} from '$lib/data/meal-nutrition';

// Re-export types needed by challenge-plan
export type { PhaseId };
export { getPhase, phaseHasBreakfast };

export type MealBadge = 'light' | 'proteico' | 'fitness' | 'equilibrado';

export type MealMacros = {
	protein: number;
	carbs: number;
	fat: number;
};

export type MealOption = {
	id: string;
	optionIndex: number;
	name: string;
	shortName: string;
	image: string;
	calories: number;
	prepMinutes: number;
	badge: MealBadge;
	macros: MealMacros;
	ingredients: string[];
	steps: string[];
	notes?: string;
};

export type DayPlan = {
	day: number;
	phase: PhaseId;
	blocks: Record<MealBlockId, MealOption[]>;
};

const MEAL_PLACEHOLDER_IMAGE = '/images/meals/placeholder.png';
const OPTIONS_PER_BLOCK = 4;

/**
 * Offset de rotação dentro da fase para variar combos entre dias.
 * Ex: Fase 1 (dias 1–3) → offsets 0, 1, 2
 */
function dayRotationOffset(day: number): number {
	const phase = getPhase(day);
	const phaseStart = phase === 1 ? 1 : phase === 2 ? 4 : phase === 3 ? 7 : 11;
	return day - phaseStart;
}

// ---------------------------------------------------------------------------
// Badge heuristic based on macro ratios
// ---------------------------------------------------------------------------

function assignBadge(m: Macros): MealBadge {
	if (m.kcal === 0) return 'equilibrado';
	const protRatio = (m.protein * 4) / m.kcal;
	const fatRatio = (m.fat * 9) / m.kcal;
	if (protRatio >= 0.45) return 'proteico';
	if (fatRatio <= 0.15) return 'light';
	if (protRatio >= 0.3 && fatRatio <= 0.3) return 'fitness';
	return 'equilibrado';
}

function toMealMacros(m: Macros): MealMacros {
	return { protein: m.protein, carbs: m.carbs, fat: m.fat };
}

// ---------------------------------------------------------------------------
// Opções do café da manhã (só Fase 1)
// ---------------------------------------------------------------------------

function buildBreakfastOptions(
	carbIds: string[],
	proteinIds: string[],
	day: number
): MealOption[] {
	const offset = dayRotationOffset(day);
	return Array.from({ length: OPTIONS_PER_BLOCK }, (_, i) => {
		const carbKey = extractFoodKey(carbIds[(i + offset) % carbIds.length]);
		const protKey = extractFoodKey(proteinIds[(i + offset + 1) % proteinIds.length]);

		const carb = BREAKFAST_CARB_PORTIONS[carbKey];
		const prot = BREAKFAST_PROTEIN_PORTIONS[protKey];

		if (!carb || !prot) {
			return emptyOption('cafe', day, i);
		}

		const total = sumMacros(carb.macros, prot.macros);
		return {
			id: `d${day}-cafe-o${i + 1}`,
			optionIndex: i + 1,
			name: `${carb.label} + ${prot.label}`,
			shortName: `${carb.shortLabel} + ${prot.shortLabel}`,
			image: MEAL_PLACEHOLDER_IMAGE,
			calories: total.kcal,
			prepMinutes: 10,
			badge: assignBadge(total),
			macros: toMealMacros(total),
			ingredients: [carb.label, prot.label],
			steps: []
		};
	});
}

// ---------------------------------------------------------------------------
// Opções do almoço / jantar (formato comida)
// ---------------------------------------------------------------------------

function buildMainMealOptions(
	block: 'almoco' | 'janta',
	carbIds: string[],
	proteinIds: string[],
	phase: PhaseId,
	day: number
): MealOption[] {
	const offset = dayRotationOffset(day);
	return Array.from({ length: OPTIONS_PER_BLOCK }, (_, i) => {
		const carbKey = extractFoodKey(carbIds[(i + offset) % carbIds.length]);
		const protKey = extractFoodKey(proteinIds[(i + offset + 1) % proteinIds.length]);

		const carb = mainCarbMacros(carbKey, phase, block);
		const prot = mainProteinMacros(protKey, phase, block);

		const total = sumMacros(carb.macros, prot.macros);
		const saladaMacros: Macros = { kcal: 15, protein: 0.5, carbs: 2.5, fat: 0.3 };
		const withSalad = sumMacros(total, saladaMacros);

		const carbShort = carbKey === 'arroz-feijao'
			? 'Arroz + Feijão'
			: capitalizeFirst(foodKeyToName(carbKey));
		const protShort = protKey === 'ovos'
			? 'Ovos'
			: capitalizeFirst(foodKeyToName(protKey));

		return {
			id: `d${day}-${block}-o${i + 1}`,
			optionIndex: i + 1,
			name: `${capitalizeFirst(carb.label)} + ${capitalizeFirst(prot.label)}`,
			shortName: `${carbShort} + ${protShort}`,
			image: MEAL_PLACEHOLDER_IMAGE,
			calories: withSalad.kcal,
			prepMinutes: 20,
			badge: assignBadge(withSalad),
			macros: toMealMacros(withSalad),
			ingredients: [
				capitalizeFirst(carb.label),
				capitalizeFirst(prot.label),
				'Salada de vegetais livres'
			],
			steps: []
		};
	});
}

// ---------------------------------------------------------------------------
// Opções do lanche (Fases 1–3: frutas / Fase 4: combos Extremo)
// ---------------------------------------------------------------------------

function buildSnackOptions(
	fruitIds: string[],
	phase: PhaseId,
	day: number
): MealOption[] {
	if (phase === 4) {
		const p4offset = dayRotationOffset(day);
		const p4items = PHASE4_LANCHE_OPTIONS;
		return Array.from({ length: OPTIONS_PER_BLOCK }, (_, i) => {
			const combo = p4items[(i + p4offset) % p4items.length];
			return {
				id: `d${day}-lanche-o${i + 1}`,
				optionIndex: i + 1,
				name: combo.name,
				shortName: combo.name,
				image: MEAL_PLACEHOLDER_IMAGE,
				calories: combo.macros.kcal,
				prepMinutes: 5,
				badge: assignBadge(combo.macros),
				macros: toMealMacros(combo.macros),
				ingredients: [...combo.ingredients],
				steps: []
			};
		});
	}

	const snackOffset = dayRotationOffset(day);
	return Array.from({ length: OPTIONS_PER_BLOCK }, (_, i) => {
		const fruitKey = extractFoodKey(fruitIds[(i + snackOffset) % fruitIds.length]);
		const fruit = FRUIT_PORTIONS[fruitKey];

		if (!fruit) return emptyOption('lanche', day, i);

		return {
			id: `d${day}-lanche-o${i + 1}`,
			optionIndex: i + 1,
			name: fruit.label,
			shortName: fruit.shortLabel,
			image: MEAL_PLACEHOLDER_IMAGE,
			calories: fruit.macros.kcal,
			prepMinutes: 2,
			badge: 'light' as MealBadge,
			macros: toMealMacros(fruit.macros),
			ingredients: [fruit.label],
			steps: []
		};
	});
}

// ---------------------------------------------------------------------------
// Empty option fallback
// ---------------------------------------------------------------------------

function emptyOption(block: MealBlockId, day: number, i: number): MealOption {
	return {
		id: `d${day}-${block}-o${i + 1}`,
		optionIndex: i + 1,
		name: 'Opção não disponível',
		shortName: 'Opção não disponível',
		image: MEAL_PLACEHOLDER_IMAGE,
		calories: 0,
		prepMinutes: 0,
		badge: 'equilibrado',
		macros: { protein: 0, carbs: 0, fat: 0 },
		ingredients: [],
		steps: []
	};
}

// ---------------------------------------------------------------------------
// Gerador principal
// ---------------------------------------------------------------------------

function buildDayPlan(day: number, selections: MealSelections): DayPlan {
	const phase = getPhase(day);
	const hasCafe = phaseHasBreakfast(phase);

	const cafe = hasCafe
		? buildBreakfastOptions(selections.cafe.carbs, selections.cafe.proteins, day)
		: [];

	const almoco = buildMainMealOptions(
		'almoco',
		selections.almoco.carbs,
		selections.almoco.proteins,
		phase,
		day
	);

	const lanche = buildSnackOptions(selections.lanche.carbs, phase, day);

	const janta = buildMainMealOptions(
		'janta',
		selections.janta.carbs,
		selections.janta.proteins,
		phase,
		day
	);

	return {
		day,
		phase,
		blocks: { cafe, almoco, lanche, janta }
	};
}

export function generateChallengePlan(selections: MealSelections): DayPlan[] {
	return Array.from({ length: CHALLENGE_TOTAL_DAYS }, (_, i) =>
		buildDayPlan(i + 1, selections)
	);
}

// ---------------------------------------------------------------------------
// Seleções padrão (fallback quando o usuário não escolheu)
// ---------------------------------------------------------------------------

export const DEFAULT_SELECTIONS: MealSelections = {
	cafe: {
		carbs: [
			'cafe-carb-pao-frances',
			'cafe-carb-tapioca',
			'cafe-carb-cuscuz',
			'cafe-carb-pao-forma'
		],
		proteins: [
			'cafe-prot-ovo-mussarela',
			'cafe-prot-frango-mussarela',
			'cafe-prot-2ovos',
			'cafe-prot-queijo-whey'
		]
	},
	almoco: {
		carbs: [
			'almoco-carb-arroz',
			'almoco-carb-batata-doce',
			'almoco-carb-macarrao',
			'almoco-carb-arroz-feijao'
		],
		proteins: [
			'almoco-prot-frango',
			'almoco-prot-patinho',
			'almoco-prot-tilapia',
			'almoco-prot-ovos'
		]
	},
	lanche: {
		carbs: [
			'lanche-carb-banana',
			'lanche-carb-maca',
			'lanche-carb-morango',
			'lanche-carb-laranja'
		],
		proteins: [
			'lanche-prot-iogurte',
			'lanche-prot-whey',
			'lanche-prot-queijo-minas',
			'lanche-prot-castanhas'
		]
	},
	janta: {
		carbs: [
			'janta-carb-arroz',
			'janta-carb-mandioca',
			'janta-carb-batata-inglesa',
			'janta-carb-inhame'
		],
		proteins: [
			'janta-prot-frango',
			'janta-prot-patinho',
			'janta-prot-suino',
			'janta-prot-figado'
		]
	}
};

// ---------------------------------------------------------------------------
// Substituição de refeição
// ---------------------------------------------------------------------------

export function buildSubstituteMealOption(
	blockId: MealBlockId,
	carbItemId: string,
	proteinItemId: string,
	day: number,
	optionIndex: number
): MealOption {
	const phase = getPhase(day);
	const carbKey = extractFoodKey(carbItemId);
	const protKey = extractFoodKey(proteinItemId);

	if (blockId === 'cafe') {
		const carb = BREAKFAST_CARB_PORTIONS[carbKey];
		const prot = BREAKFAST_PROTEIN_PORTIONS[protKey];
		if (!carb || !prot) return emptyOption(blockId, day, optionIndex - 1);

		const total = sumMacros(carb.macros, prot.macros);
		return {
			id: `d${day}-cafe-o${optionIndex}`,
			optionIndex,
			name: `${carb.label} + ${prot.label}`,
			shortName: `${carb.shortLabel} + ${prot.shortLabel}`,
			image: MEAL_PLACEHOLDER_IMAGE,
			calories: total.kcal,
			prepMinutes: 10,
			badge: assignBadge(total),
			macros: toMealMacros(total),
			ingredients: [carb.label, prot.label],
			steps: []
		};
	}

	if (blockId === 'almoco' || blockId === 'janta') {
		const carb = mainCarbMacros(carbKey, phase, blockId);
		const prot = mainProteinMacros(protKey, phase, blockId);
		const total = sumMacros(carb.macros, prot.macros);
		const saladaMacros: Macros = { kcal: 15, protein: 0.5, carbs: 2.5, fat: 0.3 };
		const withSalad = sumMacros(total, saladaMacros);

		const carbShort =
			carbKey === 'arroz-feijao'
				? 'Arroz + Feijão'
				: capitalizeFirst(foodKeyToName(carbKey));
		const protShort = protKey === 'ovos' ? 'Ovos' : capitalizeFirst(foodKeyToName(protKey));

		return {
			id: `d${day}-${blockId}-o${optionIndex}`,
			optionIndex,
			name: `${capitalizeFirst(carb.label)} + ${capitalizeFirst(prot.label)}`,
			shortName: `${carbShort} + ${protShort}`,
			image: MEAL_PLACEHOLDER_IMAGE,
			calories: withSalad.kcal,
			prepMinutes: 20,
			badge: assignBadge(withSalad),
			macros: toMealMacros(withSalad),
			ingredients: [
				capitalizeFirst(carb.label),
				capitalizeFirst(prot.label),
				'Salada de vegetais livres'
			],
			steps: []
		};
	}

	// Lanche: fruit + protein companion
	const fruit = FRUIT_PORTIONS[carbKey];
	if (!fruit) return emptyOption(blockId, day, optionIndex - 1);

	return {
		id: `d${day}-lanche-o${optionIndex}`,
		optionIndex,
		name: fruit.label,
		shortName: fruit.shortLabel,
		image: MEAL_PLACEHOLDER_IMAGE,
		calories: fruit.macros.kcal,
		prepMinutes: 2,
		badge: 'light' as MealBadge,
		macros: toMealMacros(fruit.macros),
		ingredients: [fruit.label],
		steps: []
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalizeFirst(s: string): string {
	if (!s) return s;
	return s.charAt(0).toUpperCase() + s.slice(1);
}
