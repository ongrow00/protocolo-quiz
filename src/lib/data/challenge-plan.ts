import type { ChallengeMealBlockId, MealBlockId } from '$lib/data/meal-preferences';
import { MEAL_BLOCKS, normalizeMealSelections } from '$lib/data/meal-preferences';
import type { MealSelections } from '$lib/data/meal-preferences';
import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import {
	generateChallengePlan,
	buildSubstituteMealOption,
	DEFAULT_SELECTIONS,
	type MealOption,
	type MealOptionKind,
	type MealBadge,
	type MealMacros,
	type DayPlan,
	getPhase,
	phaseHasBreakfast,
	getMealOptionKind,
	JANTA_MAIN_OPTIONS
} from '$lib/data/meal-plan-generator';

export type {
	MealBlockId,
	ChallengeMealBlockId,
	MealSelections,
	MealOption,
	MealBadge,
	MealMacros,
	DayPlan,
	MealOptionKind
};
export {
	getPhase,
	phaseHasBreakfast,
	buildSubstituteMealOption,
	getMealOptionKind,
	JANTA_MAIN_OPTIONS,
	normalizeMealSelections
};

export const MEAL_BLOCK_ORDER: ChallengeMealBlockId[] = ['cafe', 'almoco', 'lanche', 'janta'];

const CHALLENGE_BLOCK_TITLES = Object.fromEntries(
	MEAL_BLOCKS.filter((b) => MEAL_BLOCK_ORDER.includes(b.id as ChallengeMealBlockId)).map((b) => [
		b.id,
		b.title
	])
) as Record<ChallengeMealBlockId, string>;

export const MEAL_BLOCK_TITLES: Record<ChallengeMealBlockId, string> = CHALLENGE_BLOCK_TITLES;

const BADGE_LABELS: Record<MealBadge, string> = {
	light: 'Light',
	proteico: 'Proteico',
	fitness: 'Fitness',
	equilibrado: 'Equilibrado'
};

export function mealBadgeLabel(badge: MealBadge): string {
	return BADGE_LABELS[badge];
}

export const MEAL_PLACEHOLDER_IMAGE = '/images/meals/placeholder.png';
export const OPTIONS_PER_MEAL_BLOCK = 4;

export function mealOptionLabel(optionIndex: number): string {
	return `Opção ${optionIndex}`;
}

export let CHALLENGE_PLAN: DayPlan[] = generateChallengePlan(DEFAULT_SELECTIONS);

export function setChallengeSelections(selections: MealSelections): void {
	const normalized = normalizeMealSelections(selections, DEFAULT_SELECTIONS);
	CHALLENGE_PLAN = generateChallengePlan(normalized);
}

export function setChallengePlanDirect(plan: DayPlan[]): void {
	CHALLENGE_PLAN = plan;
}

export function getDayPlan(day: number): DayPlan | undefined {
	return CHALLENGE_PLAN.find((d) => d.day === day);
}

export function mealKey(day: number, block: ChallengeMealBlockId, optionId: string): string {
	return `${day}-${block}-${optionId}`;
}

export function activeBlocksForDay(day: number): ChallengeMealBlockId[] {
	const phase = getPhase(day);
	if (phaseHasBreakfast(phase)) return MEAL_BLOCK_ORDER;
	return MEAL_BLOCK_ORDER.filter((b) => b !== 'cafe');
}

export function replaceMealOption(
	day: number,
	blockId: ChallengeMealBlockId,
	oldOptionId: string,
	carbItemId: string,
	proteinItemId: string
): MealOption | null {
	const dayPlan = CHALLENGE_PLAN.find((d) => d.day === day);
	if (!dayPlan) return null;

	const options = dayPlan.blocks[blockId];
	const idx = options.findIndex((m) => m.id === oldOptionId);
	if (idx === -1) return null;

	const optionIndex = options[idx].optionIndex;
	const kind = getMealOptionKind(options[idx]);
	const newMeal = buildSubstituteMealOption(
		blockId,
		carbItemId,
		proteinItemId,
		day,
		optionIndex,
		kind
	);
	newMeal.id = oldOptionId;
	options[idx] = newMeal;

	return newMeal;
}
