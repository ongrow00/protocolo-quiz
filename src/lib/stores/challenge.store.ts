import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	CHALLENGE_SESSION_STORAGE_KEY,
	CHALLENGE_TOTAL_DAYS
} from '$lib/constants/challenge-storage-keys';
import type { MealBlockId } from '$lib/data/challenge-plan';
import { isDayFullyResolved } from '$lib/utils/challenge-progress';

export type DayStatus = 'locked' | 'current' | 'completed';
export type MealCheckStatus = 'pending' | 'completed' | 'skipped';

export type ChallengeState = {
	startedAt: number | null;
	currentDay: number;
	days: Record<number, DayStatus>;
	meals: Record<string, MealCheckStatus>;
	streak: number;
	lastCompletedDayAt: number | null;
};

function buildInitialDays(): Record<number, DayStatus> {
	const days: Record<number, DayStatus> = {};
	for (let d = 1; d <= CHALLENGE_TOTAL_DAYS; d++) {
		days[d] = d === 1 ? 'current' : 'locked';
	}
	return days;
}

const INITIAL_STATE: ChallengeState = {
	startedAt: null,
	currentDay: 1,
	days: buildInitialDays(),
	meals: {},
	streak: 0,
	lastCompletedDayAt: null
};

function loadFromSession(): ChallengeState {
	if (!browser) return INITIAL_STATE;
	try {
		const raw = sessionStorage.getItem(CHALLENGE_SESSION_STORAGE_KEY);
		if (!raw) return INITIAL_STATE;
		const parsed = JSON.parse(raw) as ChallengeState;
		if (!parsed.days || parsed.currentDay == null) return INITIAL_STATE;
		return parsed;
	} catch {
		return INITIAL_STATE;
	}
}

function saveToSession(state: ChallengeState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(CHALLENGE_SESSION_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// quota exceeded
	}
}

function persist(state: ChallengeState): ChallengeState {
	saveToSession(state);
	return state;
}

function mealStorageKey(day: number, block: MealBlockId, optionId: string): string {
	return `${day}-${block}-${optionId}`;
}

function createChallengeStore() {
	const { subscribe, set, update } = writable<ChallengeState>(loadFromSession());

	return {
		subscribe,

		hydrate() {
			set(loadFromSession());
		},

		reset() {
			set(persist({ ...INITIAL_STATE, days: buildInitialDays() }));
		},

		ensureStarted() {
			update((s) => {
				if (s.startedAt != null) return s;
				return persist({ ...s, startedAt: Date.now() });
			});
		},

		markMeal(day: number, block: MealBlockId, optionId: string) {
			update((s) => {
				const key = mealStorageKey(day, block, optionId);
				const meals = { ...s.meals, [key]: 'completed' as MealCheckStatus };
				let next = { ...s, meals };
				next = completeDayIfReady(next, day);
				return persist(next);
			});
		},

		skipMeal(day: number, block: MealBlockId, optionId: string) {
			update((s) => {
				const key = mealStorageKey(day, block, optionId);
				const meals = { ...s.meals, [key]: 'skipped' as MealCheckStatus };
				let next = { ...s, meals };
				next = completeDayIfReady(next, day);
				return persist(next);
			});
		},

		unmarkMeal(day: number, block: MealBlockId, optionId: string) {
			update((s) => {
				const key = mealStorageKey(day, block, optionId);
				if (!(key in s.meals)) return s;
				const meals = { ...s.meals };
				delete meals[key];
				let next = { ...s, meals };
				next = revertDayCompletionIfNeeded(next, day);
				return persist(next);
			});
		}

	};
}

function revertDayCompletionIfNeeded(state: ChallengeState, day: number): ChallengeState {
	if (state.days[day] !== 'completed' || isDayFullyResolved(state, day)) return state;

	const days = { ...state.days, [day]: 'current' as DayStatus };
	let currentDay = state.currentDay;

	if (currentDay === day + 1 && day < CHALLENGE_TOTAL_DAYS) {
		days[day + 1] = 'locked';
		currentDay = day;
	}

	return { ...state, days, currentDay };
}

function completeDayIfReady(state: ChallengeState, day: number): ChallengeState {
	if (!isDayFullyResolved(state, day)) return state;
	if (state.days[day] === 'completed') return state;

	const days = { ...state.days, [day]: 'completed' as DayStatus };
	const now = Date.now();
	const streak =
		state.lastCompletedDayAt && now - state.lastCompletedDayAt < 48 * 60 * 60 * 1000
			? state.streak + 1
			: 1;

	let currentDay = state.currentDay;
	if (day === state.currentDay && day < CHALLENGE_TOTAL_DAYS) {
		const nextDay = day + 1;
		days[nextDay] = 'current';
		currentDay = nextDay;
	}

	return {
		...state,
		days,
		currentDay,
		streak,
		lastCompletedDayAt: now
	};
}

export const challengeStore = createChallengeStore();
