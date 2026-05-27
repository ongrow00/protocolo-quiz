import {
	CHALLENGE_PLAN,
	MEAL_BLOCK_ORDER,
	activeBlocksForDay,
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

/** Todos os dias são navegáveis — o usuário pode explorar qualquer dia do protocolo. */
export function isDayNavigable(_state: ChallengeState, _day: number): boolean {
	return true;
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
		if (!options || options.length === 0) {
			result[block] = 'skipped';
			continue;
		}
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
	const active = activeBlocksForDay(day);
	return active.filter((b) => statuses[b] !== 'pending').length;
}

export function dayMealsTotal(day: number): number {
	return activeBlocksForDay(day).length;
}

export function dayPercentComplete(state: ChallengeState, day: number): number {
	const total = dayMealsTotal(day);
	if (total === 0) return 100;
	const done = countMealsResolvedForDay(state, day);
	return Math.round((done / total) * 100);
}

export function isDayFullyResolved(state: ChallengeState, day: number): boolean {
	return countMealsResolvedForDay(state, day) === dayMealsTotal(day);
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
	const total = dayMealsTotal(day);
	return {
		done,
		total,
		percent: dayPercentComplete(state, day)
	};
}

export function getAllDaySummaries(state: ChallengeState): DaySummary[] {
	return Array.from({ length: CHALLENGE_TOTAL_DAYS }, (_, i) => {
		const day = i + 1;
		const status = state.days[day] ?? 'locked';
		const mealsDone = countMealsResolvedForDay(state, day);
		const mealsTotal = dayMealsTotal(day);
		return {
			day,
			status,
			navigable: isDayNavigable(state, day),
			mealsDone,
			mealsTotal,
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
