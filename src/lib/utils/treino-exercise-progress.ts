export function exerciseProgressLabel(roundsDone: number, totalRounds: number): string {
	if (totalRounds <= 0) return '';
	return `${Math.min(roundsDone, totalRounds)}/${totalRounds}`;
}

export function isExerciseFullyDone(roundsDone: number, totalRounds: number): boolean {
	return totalRounds > 0 && roundsDone >= totalRounds;
}
