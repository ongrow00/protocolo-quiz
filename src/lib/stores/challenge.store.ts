import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import {
	CHALLENGE_STORAGE_KEY,
	CHALLENGE_TOTAL_DAYS
} from '$lib/constants/challenge-storage-keys';
import type { MealBlockId } from '$lib/data/challenge-plan';
import { isDayFullyResolved } from '$lib/utils/challenge-progress';
import { supabase } from '$lib/supabase';

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

function loadState(): ChallengeState {
	if (!browser) return INITIAL_STATE;
	try {
		const raw = localStorage.getItem(CHALLENGE_STORAGE_KEY);
		if (!raw) return INITIAL_STATE;
		const parsed = JSON.parse(raw) as ChallengeState;
		if (!parsed.days || parsed.currentDay == null) return INITIAL_STATE;
		return parsed;
	} catch {
		return INITIAL_STATE;
	}
}

function saveState(state: ChallengeState): void {
	if (!browser) return;
	try {
		localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// quota exceeded
	}
}

function persist(state: ChallengeState): ChallengeState {
	saveState(state);
	syncToSupabase(state);
	return state;
}

let syncTimer: ReturnType<typeof setTimeout> | undefined;

function syncToSupabase(state: ChallengeState): void {
	if (!browser) return;
	if (syncTimer) clearTimeout(syncTimer);

	syncTimer = setTimeout(async () => {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase
				.from('challenge_progress')
				.update({
					current_day: state.currentDay,
					started_at: state.startedAt ? new Date(state.startedAt).toISOString() : null,
					streak: state.streak,
					last_completed_day_at: state.lastCompletedDayAt
						? new Date(state.lastCompletedDayAt).toISOString()
						: null,
					days_status: state.days,
					meals_status: state.meals,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) {
				console.warn('challenge_progress sync failed:', error.message);
			}
		} catch (e) {
			console.warn('challenge_progress sync error:', e);
		}
	}, 500);
}

function mealStorageKey(day: number, block: MealBlockId, optionId: string): string {
	return `${day}-${block}-${optionId}`;
}

function createChallengeStore() {
	const { subscribe, set, update } = writable<ChallengeState>(loadState());

	return {
		subscribe,

		hydrate() {
			set(loadState());
		},

		async hydrateFromSupabase() {
			try {
				const { data: { user } } = await supabase.auth.getUser();
				if (!user) return;

				const { data, error } = await supabase
					.from('challenge_progress')
					.select('current_day, started_at, streak, last_completed_day_at, days_status, meals_status')
					.eq('user_id', user.id)
					.order('created_at', { ascending: false })
					.limit(1)
					.maybeSingle();

				if (error || !data) return;

				if (data.meals_status && Object.keys(data.meals_status as object).length > 0) {
					const dbState: ChallengeState = {
						startedAt: data.started_at ? new Date(data.started_at).getTime() : null,
						currentDay: data.current_day ?? 1,
						days: (data.days_status as Record<number, DayStatus>) ?? buildInitialDays(),
						meals: (data.meals_status as Record<string, MealCheckStatus>) ?? {},
						streak: data.streak ?? 0,
						lastCompletedDayAt: data.last_completed_day_at
							? new Date(data.last_completed_day_at).getTime()
							: null
					};
					saveState(dbState);
					set(dbState);
				}
			} catch (e) {
				console.warn('challenge hydrateFromSupabase error:', e);
			}
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
