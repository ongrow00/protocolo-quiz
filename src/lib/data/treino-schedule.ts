import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import type { FrequencyId, TreinoLetter } from '$lib/data/treino-types';

export const SESSIONS_IN_14: Record<FrequencyId, number> = {
	'2x': 4,
	'3x': 6,
	'4x': 8,
	'5x': 10,
	'6x': 12,
	todos: 14
};

/** Mon=0 … Sun=6 — T = treino */
const WEEK_PATTERNS: Record<FrequencyId, boolean[]> = {
	'2x': [true, false, false, true, false, false, false],
	'3x': [true, false, true, false, true, false, false],
	'4x': [true, true, false, true, false, true, false],
	'5x': [true, true, true, false, true, true, false],
	'6x': [true, true, true, true, true, true, false],
	todos: [true, true, true, true, true, true, true]
};

const WORKOUT_LETTERS: TreinoLetter[] = ['A', 'B', 'C'];

export type ScheduleSlot = {
	protocolDay: number;
	isWorkoutDay: boolean;
	sessionIndex?: number;
	sessionKey?: string;
	workoutLetter?: TreinoLetter;
};

export function parseFrequencyId(raw: string | string[] | undefined): FrequencyId {
	const id = Array.isArray(raw) ? raw[0] : raw;
	if (id && id in SESSIONS_IN_14) return id as FrequencyId;
	return '3x';
}

export function buildWorkoutDays(frequencyId: FrequencyId, weekStartOffset = 0): number[] {
	const target = SESSIONS_IN_14[frequencyId];
	if (target >= CHALLENGE_TOTAL_DAYS) {
		return Array.from({ length: CHALLENGE_TOTAL_DAYS }, (_, i) => i + 1);
	}

	const pattern = WEEK_PATTERNS[frequencyId];
	const days: number[] = [];

	for (let d = 1; d <= CHALLENGE_TOTAL_DAYS; d++) {
		const weekDay = (d - 1 + weekStartOffset) % 7;
		if (pattern[weekDay]) days.push(d);
	}

	if (days.length > target) return days.slice(0, target);
	if (days.length < target) {
		return distributeEvenly(target);
	}
	return days;
}

/** Fallback: evenly space sessions across 14 days */
function distributeEvenly(count: number): number[] {
	if (count <= 1) return [1];
	const result: number[] = [];
	for (let i = 0; i < count; i++) {
		const day = Math.round(1 + (i * (CHALLENGE_TOTAL_DAYS - 1)) / (count - 1));
		if (!result.includes(day)) result.push(day);
	}
	let d = 1;
	while (result.length < count && d <= CHALLENGE_TOTAL_DAYS) {
		if (!result.includes(d)) result.push(d);
		d++;
	}
	return result.sort((a, b) => a - b);
}

export function buildScheduleSlots(frequencyId: FrequencyId): ScheduleSlot[] {
	const workoutDays = buildWorkoutDays(frequencyId);
	let sessionIndex = 0;

	return Array.from({ length: CHALLENGE_TOTAL_DAYS }, (_, i) => {
		const protocolDay = i + 1;
		const isWorkoutDay = workoutDays.includes(protocolDay);

		if (!isWorkoutDay) {
			return { protocolDay, isWorkoutDay: false };
		}

		sessionIndex += 1;
		const workoutLetter = WORKOUT_LETTERS[(sessionIndex - 1) % 3];
		return {
			protocolDay,
			isWorkoutDay: true,
			sessionIndex,
			sessionKey: `session-${sessionIndex}`,
			workoutLetter
		};
	});
}
