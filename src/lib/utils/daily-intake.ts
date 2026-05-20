import { CHALLENGE_PLAN, MEAL_BLOCK_ORDER } from '$lib/data/challenge-plan';
import type { ChallengeState } from '$lib/stores/challenge.store';

export type DailyIntakeConsumed = {
	kcal: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
};

export function getDayIntakeConsumed(state: ChallengeState, day: number): DailyIntakeConsumed {
	const plan = CHALLENGE_PLAN.find((d) => d.day === day);
	if (!plan) {
		return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
	}

	let kcal = 0;
	let proteinG = 0;
	let carbsG = 0;
	let fatG = 0;

	for (const block of MEAL_BLOCK_ORDER) {
		for (const opt of plan.blocks[block]) {
			const key = `${day}-${block}-${opt.id}`;
			if (state.meals[key] === 'completed') {
				kcal += opt.calories;
				proteinG += opt.macros.protein;
				carbsG += opt.macros.carbs;
				fatG += opt.macros.fat;
				break;
			}
		}
	}

	return { kcal, proteinG, carbsG, fatG };
}

export function intakeProgress(consumed: number, goal: number): number {
	if (goal <= 0) return 0;
	return Math.min(100, Math.round((consumed / goal) * 100));
}
