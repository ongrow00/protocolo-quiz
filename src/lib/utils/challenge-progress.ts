import {
	CHALLENGE_PLAN,
	MEAL_BLOCK_ORDER,
	type MealBlockId
} from '$lib/data/challenge-plan';
import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import type { ChallengeState, DayStatus, MealCheckStatus } from '$lib/stores/challenge.store';

export type DaySummary = {
	day: number;
	status: DayStatus;
	navigable: boolean;
	mealsDone: number;
	mealsTotal: number;
	percent: number;
};

/** Dia visitável: desbloqueado no protocolo ou com pelo menos uma refeição registrada. */
export function isDayNavigable(state: ChallengeState, day: number): boolean {
	const status = state.days[day] ?? 'locked';
	if (status !== 'locked') return true;
	return countMealsResolvedForDay(state, day) > 0;
}

export function getMealStatusesForDay(
	state: ChallengeState,
	day: number
): Record<MealBlockId, MealCheckStatus | 'pending'> {
	const plan = CHALLENGE_PLAN.find((d) => d.day === day);
	if (!plan) {
		return { cafe: 'pending', almoco: 'pending', lanche: 'pending', janta: 'pending' };
	}
	const result = {} as Record<MealBlockId, MealCheckStatus | 'pending'>;
	for (const block of MEAL_BLOCK_ORDER) {
		const options = plan.blocks[block];
		let status: MealCheckStatus | 'pending' = 'pending';
		for (const opt of options) {
			const key = `${day}-${block}-${opt.id}`;
			const s = state.meals[key];
			if (s === 'completed' || s === 'skipped') {
				status = s;
				break;
			}
		}
		result[block] = status;
	}
	return result;
}

export function countMealsResolvedForDay(state: ChallengeState, day: number): number {
	const statuses = getMealStatusesForDay(state, day);
	return MEAL_BLOCK_ORDER.filter((b) => statuses[b] !== 'pending').length;
}

export function dayPercentComplete(state: ChallengeState, day: number): number {
	const done = countMealsResolvedForDay(state, day);
	return Math.round((done / MEAL_BLOCK_ORDER.length) * 100);
}

export function isDayFullyResolved(state: ChallengeState, day: number): boolean {
	return countMealsResolvedForDay(state, day) === MEAL_BLOCK_ORDER.length;
}

export function globalPercentComplete(state: ChallengeState): number {
	const completedDays = Object.values(state.days).filter((d) => d === 'completed').length;
	const currentPartial =
		state.days[state.currentDay] === 'current'
			? dayPercentComplete(state, state.currentDay) / 100
			: 0;
	return Math.round(((completedDays + currentPartial) / CHALLENGE_TOTAL_DAYS) * 100);
}

export function countCompletedDays(state: ChallengeState): number {
	return Object.values(state.days).filter((d) => d === 'completed').length;
}

export function getTodayMealsSummary(state: ChallengeState): {
	done: number;
	total: number;
	percent: number;
} {
	const day = state.currentDay;
	const done = countMealsResolvedForDay(state, day);
	return {
		done,
		total: MEAL_BLOCK_ORDER.length,
		percent: dayPercentComplete(state, day)
	};
}

export function getAllDaySummaries(state: ChallengeState): DaySummary[] {
	return Array.from({ length: CHALLENGE_TOTAL_DAYS }, (_, i) => {
		const day = i + 1;
		const status = state.days[day] ?? 'locked';
		const mealsDone = countMealsResolvedForDay(state, day);
		return {
			day,
			status,
			navigable: isDayNavigable(state, day),
			mealsDone,
			mealsTotal: MEAL_BLOCK_ORDER.length,
			percent: dayPercentComplete(state, day)
		};
	});
}

export const MOTIVATIONAL_MESSAGES = [
	'Você está indo muito bem!',
	'Mais um passo concluído!',
	'Consistência é o segredo.',
	'Seu corpo agradece cada escolha.',
	'Continue assim — você consegue!'
] as const;

export function dayUnlockMessage(day: number): string {
	return `Dia ${day} desbloqueado!`;
}
