import { isExerciseFullyDone } from '$lib/utils/treino-exercise-progress';

/** Pode marcar +1 volta neste exercício (ordem do circuito: 1→2→…→5→volta). */
export function canMarkExerciseAtIndex(
	index: number,
	rounds: number[],
	totalRounds: number
): boolean {
	if (totalRounds <= 0 || index < 0 || index >= rounds.length) return false;
	const done = rounds[index] ?? 0;
	if (done >= totalRounds) return false;

	if (index === 0) {
		const last = rounds[rounds.length - 1] ?? 0;
		if (done === 0 && rounds.every((r, i) => i === 0 || r === 0)) return true;
		if (last > done) return true;
		return rounds.every((r) => r === done);
	}

	return (rounds[index - 1] ?? 0) > done;
}

export function getNextExerciseIndex(
	exerciseCount: number,
	rounds: number[],
	totalRounds: number
): number | null {
	for (let i = 0; i < exerciseCount; i++) {
		if (canMarkExerciseAtIndex(i, rounds, totalRounds)) return i;
	}
	return null;
}

/** Volta deste exercício já feita na sequência atual — aguarda avançar no circuito. */
export function isExerciseWaitingInCircuit(
	index: number,
	rounds: number[],
	totalRounds: number
): boolean {
	const done = rounds[index] ?? 0;
	if (done === 0) return false;
	if (isExerciseFullyDone(done, totalRounds)) return true;
	return !canMarkExerciseAtIndex(index, rounds, totalRounds);
}

export function isSessionCircuitComplete(
	rounds: number[],
	totalRounds: number
): boolean {
	if (totalRounds <= 0 || rounds.length === 0) return false;
	return rounds.every((done) => isExerciseFullyDone(done, totalRounds));
}
