import type { WorkoutTiming } from '$lib/data/treino-types';

const TRANSITION_BUFFER_SECONDS = 75;

export function estimateSessionSeconds(timing: WorkoutTiming, exerciseCount = 5): number {
	const { exerciseSeconds, restBetweenExercises, restBetweenRounds, rounds } = timing;
	const perRound =
		exerciseCount * exerciseSeconds + (exerciseCount - 1) * restBetweenExercises;
	const total =
		rounds * perRound + (rounds - 1) * restBetweenRounds + TRANSITION_BUFFER_SECONDS;
	return total;
}

export function estimateSessionMinutes(timing: WorkoutTiming, exerciseCount = 5): number {
	return Math.ceil(estimateSessionSeconds(timing, exerciseCount) / 60);
}

export function formatDurationMinutes(minutes: number): string {
	return `~${minutes} min`;
}
