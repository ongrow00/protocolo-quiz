import type { MealBlockId } from '$lib/data/meal-preferences';
import { MEAL_BLOCKS } from '$lib/data/meal-preferences';
import type { MealSelections } from '$lib/data/meal-preferences';
import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import {
	generateChallengePlan,
	buildSubstituteMealOption,
	DEFAULT_SELECTIONS,
	type MealOption,
	type MealBadge,
	type MealMacros,
	type DayPlan,
	getPhase,
	phaseHasBreakfast
} from '$lib/data/meal-plan-generator';

export type { MealBlockId, MealOption, MealBadge, MealMacros, DayPlan, MealSelections };
export { getPhase, phaseHasBreakfast, buildSubstituteMealOption };

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

export const MEAL_PLACEHOLDER_IMAGE = '/images/meals/placeholder.png';
export const OPTIONS_PER_MEAL_BLOCK = 4;

export function mealOptionLabel(optionIndex: number): string {
	return `Opção ${optionIndex}`;
}

// ---------------------------------------------------------------------------
// Plano reativo — atualizado via setChallengeSelections()
// ---------------------------------------------------------------------------

/**
 * Plano de 14 dias gerado a partir das preferências do usuário.
 * Inicializado com seleções padrão; atualizar via setChallengeSelections().
 * ES module live bindings garantem que importadores veem a referência atualizada.
 */
export let CHALLENGE_PLAN: DayPlan[] = generateChallengePlan(DEFAULT_SELECTIONS);

export function setChallengeSelections(selections: MealSelections): void {
	CHALLENGE_PLAN = generateChallengePlan(selections);
}

export function setChallengePlanDirect(plan: DayPlan[]): void {
	CHALLENGE_PLAN = plan;
}

export function getDayPlan(day: number): DayPlan | undefined {
	return CHALLENGE_PLAN.find((d) => d.day === day);
}

export function mealKey(day: number, block: MealBlockId, optionId: string): string {
	return `${day}-${block}-${optionId}`;
}

/**
 * Retorna os blocos ativos para um dia (ex: fases 2–4 não têm café).
 */
export function activeBlocksForDay(day: number): MealBlockId[] {
	const phase = getPhase(day);
	if (phaseHasBreakfast(phase)) return MEAL_BLOCK_ORDER;
	return MEAL_BLOCK_ORDER.filter((b) => b !== 'cafe');
}

/**
 * Substitui uma opção de refeição no plano em memória.
 * Retorna a nova MealOption, ou null se a substituição falhar.
 */
export function replaceMealOption(
	day: number,
	blockId: MealBlockId,
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
	const newMeal = buildSubstituteMealOption(blockId, carbItemId, proteinItemId, day, optionIndex);
	newMeal.id = oldOptionId;
	options[idx] = newMeal;

	return newMeal;
}
