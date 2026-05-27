import { CHALLENGE_PLAN } from '$lib/data/challenge-plan';
import { activeBlocksForDay } from '$lib/data/challenge-plan';
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

	for (const block of activeBlocksForDay(day)) {
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

export type DailyIntakeGoals = {
	kcal: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
};

export function getDayIntakeGoals(day: number): DailyIntakeGoals {
	const plan = CHALLENGE_PLAN.find((d) => d.day === day);
	if (!plan) {
		return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
	}

	let kcal = 0;
	let proteinG = 0;
	let carbsG = 0;
	let fatG = 0;

	for (const block of activeBlocksForDay(day)) {
		const options = plan.blocks[block];
		if (!options || options.length === 0) continue;

		let blockKcal = 0;
		let blockProtein = 0;
		let blockCarbs = 0;
		let blockFat = 0;

		for (const opt of options) {
			blockKcal += opt.calories;
			blockProtein += opt.macros.protein;
			blockCarbs += opt.macros.carbs;
			blockFat += opt.macros.fat;
		}

		kcal += Math.round(blockKcal / options.length);
		proteinG += Math.round(blockProtein / options.length);
		carbsG += Math.round(blockCarbs / options.length);
		fatG += Math.round(blockFat / options.length);
	}

	return { kcal, proteinG, carbsG, fatG };
}

export function intakeProgress(consumed: number, goal: number): number {
	if (goal <= 0) return 0;
	return Math.min(100, Math.round((consumed / goal) * 100));
}
