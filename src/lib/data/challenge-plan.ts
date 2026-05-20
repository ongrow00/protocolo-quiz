import type { MealBlockId } from '$lib/data/meal-preferences';
import { MEAL_BLOCKS } from '$lib/data/meal-preferences';

export type { MealBlockId };
import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';

export type MealBadge = 'light' | 'proteico' | 'fitness' | 'equilibrado';

export type MealMacros = {
	protein: number;
	carbs: number;
	fat: number;
};

export type MealOption = {
	id: string;
	/** 1–4, exibido como "Opção N" */
	optionIndex: number;
	name: string;
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
	blocks: Record<MealBlockId, MealOption[]>;
};

export const MEAL_BLOCK_ORDER: MealBlockId[] = ['cafe', 'almoco', 'lanche', 'janta'];

export const MEAL_BLOCK_TITLES: Record<MealBlockId, string> = Object.fromEntries(
	MEAL_BLOCKS.map((b) => [b.id, b.title])
) as Record<MealBlockId, string>;

const BADGE_LABELS: Record<MealBadge, string> = {
	light: 'Light',
	proteico: 'Proteico',
	fitness: 'Fitness',
	equilibrado: 'Equilibrado'
};

export function mealBadgeLabel(badge: MealBadge): string {
	return BADGE_LABELS[badge];
}

/** Foto e nome provisórios até ter conteúdo por receita. */
export const MEAL_PLACEHOLDER_IMAGE = '/images/meals/placeholder.png';
export const MEAL_PLACEHOLDER_NAME = 'Prato do protocolo';
export const OPTIONS_PER_MEAL_BLOCK = 4;

export function mealOptionLabel(optionIndex: number): string {
	return `Opção ${optionIndex}`;
}

/** Dados provisórios idênticos em todas as opções até conteúdo real por receita. */
const SHARED_PLACEHOLDER_RECIPE = {
	calories: 290,
	prepMinutes: 15,
	badge: 'equilibrado' as MealBadge,
	macros: { protein: 22, carbs: 4, fat: 18 },
	ingredients: [
		'4 colheres de arroz branco cozido',
		'3 colheres de feijão cozido',
		'120g peito de frango grelhado',
		'Salada de alface, tomate e cenoura',
		'1 colher de sopa de farofa',
		'1 fio de azeite para temperar'
	],
	steps: [] as string[]
};

function templateToOption(block: MealBlockId, day: number, index: number): MealOption {
	return {
		id: `d${day}-${block}-o${index + 1}`,
		optionIndex: index + 1,
		name: MEAL_PLACEHOLDER_NAME,
		image: MEAL_PLACEHOLDER_IMAGE,
		...SHARED_PLACEHOLDER_RECIPE,
		macros: { ...SHARED_PLACEHOLDER_RECIPE.macros },
		ingredients: [...SHARED_PLACEHOLDER_RECIPE.ingredients],
		steps: [...SHARED_PLACEHOLDER_RECIPE.steps]
	};
}

function buildDayPlan(day: number): DayPlan {
	const blocks = {} as Record<MealBlockId, MealOption[]>;
	for (const blockId of MEAL_BLOCK_ORDER) {
		blocks[blockId] = Array.from({ length: OPTIONS_PER_MEAL_BLOCK }, (_, i) =>
			templateToOption(blockId, day, i)
		);
	}
	return { day, blocks };
}

export const CHALLENGE_PLAN: DayPlan[] = Array.from({ length: CHALLENGE_TOTAL_DAYS }, (_, i) =>
	buildDayPlan(i + 1)
);

export function getDayPlan(day: number): DayPlan | undefined {
	return CHALLENGE_PLAN.find((d) => d.day === day);
}

export function mealKey(day: number, block: MealBlockId, optionId: string): string {
	return `${day}-${block}-${optionId}`;
}
