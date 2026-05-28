import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { TREINO_STORAGE_KEY } from '$lib/constants/treino-storage-keys';
import {
	DEFAULT_WORKOUT_PROGRESS,
	type DayTreinoDecision,
	type WorkoutPlayerPrefs,
	type WorkoutProgress
} from '$lib/data/treino-types';
import { getNextSessionIndex, getNextWorkoutLetter, dayDecisionKey } from '$lib/utils/treino-day-resolve';
import { supabase } from '$lib/supabase';

function normalizeProgress(raw: Partial<WorkoutProgress> | undefined): WorkoutProgress {
	return {
		...DEFAULT_WORKOUT_PROGRESS,
		...raw,
		exerciseRoundsBySession: raw?.exerciseRoundsBySession ?? {},
		dayDecisions: raw?.dayDecisions ?? {}
	};
}

export type TreinoState = {
	quizCompleted: boolean;
	progress: WorkoutProgress;
};

function loadState(): TreinoState {
	if (!browser) {
		return { quizCompleted: false, progress: { ...DEFAULT_WORKOUT_PROGRESS } };
	}
	try {
		const raw = localStorage.getItem(TREINO_STORAGE_KEY);
		if (!raw) return { quizCompleted: false, progress: { ...DEFAULT_WORKOUT_PROGRESS } };
		const parsed = JSON.parse(raw) as TreinoState;
		return {
			quizCompleted: parsed.quizCompleted ?? false,
			progress: normalizeProgress(parsed.progress)
		};
	} catch {
		return { quizCompleted: false, progress: { ...DEFAULT_WORKOUT_PROGRESS } };
	}
}

function saveState(state: TreinoState): void {
	if (!browser) return;
	try {
		localStorage.setItem(TREINO_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// quota
	}
}

let syncTimer: ReturnType<typeof setTimeout> | undefined;

function syncProgressToSupabase(progress: WorkoutProgress): void {
	if (!browser) return;
	if (syncTimer) clearTimeout(syncTimer);
	syncTimer = setTimeout(async () => {
		try {
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase
				.from('challenge_progress')
				.update({
					workout_status: progress,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id);

			if (error) console.warn('workout_status sync failed:', error.message);
		} catch (e) {
			console.warn('workout_status sync error:', e);
		}
	}, 500);
}

function createTreinoStore() {
	const { subscribe, set, update } = writable<TreinoState>(loadState());

	return {
		subscribe,

		hydrate() {
			set(loadState());
		},

		markQuizComplete() {
			update((s) => {
				const next = { ...s, quizCompleted: true };
				saveState(next);
				return next;
			});
		},

		resetQuiz() {
			update((s) => {
				const next = { ...s, quizCompleted: false };
				saveState(next);
				return next;
			});
		},

		async hydrateProgressFromSupabase() {
			try {
				const {
					data: { user }
				} = await supabase.auth.getUser();
				if (!user) return;

				const { data, error } = await supabase
					.from('challenge_progress')
					.select('workout_status')
					.eq('user_id', user.id)
					.order('created_at', { ascending: false })
					.limit(1)
					.maybeSingle();

				if (error || !data?.workout_status) return;

				const progress = normalizeProgress(data.workout_status as WorkoutProgress);
				update((s) => {
					const next = { ...s, progress };
					saveState(next);
					return next;
				});
			} catch (e) {
				console.warn('treino hydrateProgressFromSupabase error:', e);
			}
		},

		isSessionCompleted(sessionKey: string, progress: WorkoutProgress): boolean {
			return progress.completedSessions.includes(sessionKey);
		},

		getExerciseRoundsDone(
			progress: WorkoutProgress,
			sessionKey: string,
			exerciseId: string
		): number {
			return progress.exerciseRoundsBySession[sessionKey]?.[exerciseId] ?? 0;
		},

		completeExerciseRound(sessionKey: string, exerciseId: string, maxRounds: number) {
			update((s) => {
				const session = { ...(s.progress.exerciseRoundsBySession[sessionKey] ?? {}) };
				const current = session[exerciseId] ?? 0;
				if (current >= maxRounds) return s;
				session[exerciseId] = Math.min(maxRounds, current + 1);
				const progress: WorkoutProgress = {
					...s.progress,
					exerciseRoundsBySession: {
						...s.progress.exerciseRoundsBySession,
						[sessionKey]: session
					}
				};
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		setExerciseRoundsDone(
			sessionKey: string,
			exerciseId: string,
			roundsDone: number,
			maxRounds: number
		) {
			update((s) => {
				const session = { ...(s.progress.exerciseRoundsBySession[sessionKey] ?? {}) };
				session[exerciseId] = Math.max(0, Math.min(maxRounds, roundsDone));
				const progress: WorkoutProgress = {
					...s.progress,
					exerciseRoundsBySession: {
						...s.progress.exerciseRoundsBySession,
						[sessionKey]: session
					}
				};
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		completeAllExercisesInSession(
			sessionKey: string,
			exerciseIds: string[],
			maxRounds: number
		) {
			update((s) => {
				const session: Record<string, number> = {};
				for (const id of exerciseIds) {
					session[id] = maxRounds;
				}
				const progress: WorkoutProgress = {
					...s.progress,
					exerciseRoundsBySession: {
						...s.progress.exerciseRoundsBySession,
						[sessionKey]: session
					}
				};
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		completeSession(sessionKey: string, exerciseIds: string[] = [], maxRounds = 0) {
			update((s) => {
				let progress = { ...s.progress };
				if (exerciseIds.length > 0 && maxRounds > 0) {
					const existing = progress.exerciseRoundsBySession[sessionKey] ?? {};
					const session: Record<string, number> = { ...existing };
					for (const id of exerciseIds) {
						session[id] = Math.max(session[id] ?? 0, maxRounds);
					}
					progress = {
						...progress,
						exerciseRoundsBySession: {
							...progress.exerciseRoundsBySession,
							[sessionKey]: session
						}
					};
				}
				if (progress.completedSessions.includes(sessionKey)) {
					const next = { ...s, progress };
					saveState(next);
					return next;
				}
				progress = {
					...progress,
					completedSessions: [...progress.completedSessions, sessionKey]
				};
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		setPlayerPrefs(prefs: Partial<WorkoutPlayerPrefs>) {
			update((s) => {
				const progress: WorkoutProgress = {
					...s.progress,
					playerPrefs: { ...s.progress.playerPrefs, ...prefs }
				};
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		migrateExerciseProgress(oldExerciseId: string, newExerciseId: string) {
			if (oldExerciseId === newExerciseId) return;
			update((s) => {
				const exerciseRoundsBySession = { ...s.progress.exerciseRoundsBySession };
				let changed = false;

				for (const sessionKey of Object.keys(exerciseRoundsBySession)) {
					const session = { ...exerciseRoundsBySession[sessionKey] };
					if (session[oldExerciseId] === undefined) continue;
					const rounds = session[oldExerciseId] ?? 0;
					session[newExerciseId] = Math.max(session[newExerciseId] ?? 0, rounds);
					delete session[oldExerciseId];
					exerciseRoundsBySession[sessionKey] = session;
					changed = true;
				}

				if (!changed) return s;

				const progress: WorkoutProgress = { ...s.progress, exerciseRoundsBySession };
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		resetSession(sessionKey: string) {
			update((s) => {
				const exerciseRoundsBySession = { ...s.progress.exerciseRoundsBySession };
				delete exerciseRoundsBySession[sessionKey];
				const progress: WorkoutProgress = {
					...s.progress,
					exerciseRoundsBySession,
					completedSessions: s.progress.completedSessions.filter((k) => k !== sessionKey)
				};
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		resetProgress() {
			update((s) => {
				const next = { ...s, progress: { ...DEFAULT_WORKOUT_PROGRESS } };
				saveState(next);
				syncProgressToSupabase(next.progress);
				return next;
			});
		},

		chooseRestDay(protocolDay: number) {
			if (protocolDay <= 1) return;
			update((s) => {
				const key = dayDecisionKey(protocolDay);
				const dayDecisions = { ...(s.progress.dayDecisions ?? {}) };
				const existing = dayDecisions[key];
				if (existing?.status === 'workout') {
					const sessionKey = existing.sessionKey;
					const exerciseRoundsBySession = { ...s.progress.exerciseRoundsBySession };
					delete exerciseRoundsBySession[sessionKey];
					const progress: WorkoutProgress = {
						...s.progress,
						exerciseRoundsBySession,
						completedSessions: s.progress.completedSessions.filter((k) => k !== sessionKey),
						dayDecisions: { ...dayDecisions, [key]: { status: 'rest' } }
					};
					const next = { ...s, progress };
					saveState(next);
					syncProgressToSupabase(progress);
					return next;
				}
				dayDecisions[key] = { status: 'rest' };
				const progress: WorkoutProgress = { ...s.progress, dayDecisions };
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		chooseWorkoutDay(protocolDay: number) {
			if (protocolDay <= 1) return;
			update((s) => {
				const key = dayDecisionKey(protocolDay);
				const dayDecisions = { ...(s.progress.dayDecisions ?? {}) };
				if (dayDecisions[key]?.status === 'workout') return s;

				const sessionIndex = getNextSessionIndex(s.progress);
				const workoutLetter = getNextWorkoutLetter(s.progress);
				const sessionKey = `session-${sessionIndex}`;
				const decision: DayTreinoDecision = {
					status: 'workout',
					workoutLetter,
					sessionIndex,
					sessionKey
				};
				dayDecisions[key] = decision;
				const progress: WorkoutProgress = { ...s.progress, dayDecisions };
				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		},

		undoDayDecision(protocolDay: number) {
			if (protocolDay <= 1) return;
			update((s) => {
				const key = dayDecisionKey(protocolDay);
				const decision = s.progress.dayDecisions?.[key];
				if (!decision) return s;

				const dayDecisions = { ...(s.progress.dayDecisions ?? {}) };
				delete dayDecisions[key];

				let progress: WorkoutProgress = { ...s.progress, dayDecisions };
				if (decision.status === 'workout') {
					const exerciseRoundsBySession = { ...progress.exerciseRoundsBySession };
					delete exerciseRoundsBySession[decision.sessionKey];
					progress = {
						...progress,
						exerciseRoundsBySession,
						completedSessions: progress.completedSessions.filter(
							(k) => k !== decision.sessionKey
						)
					};
				}

				const next = { ...s, progress };
				saveState(next);
				syncProgressToSupabase(progress);
				return next;
			});
		}
	};
}

export const treinoStore = createTreinoStore();
