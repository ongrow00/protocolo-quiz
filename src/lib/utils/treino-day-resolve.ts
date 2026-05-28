import type {
	DayTreinoDecision,
	TreinoLetter,
	WorkoutPlan,
	WorkoutPlanDay,
	WorkoutProgress,
	WorkoutTemplate
} from '$lib/data/treino-types';
import { estimateSessionMinutes } from '$lib/utils/treino-duration';

const WORKOUT_LETTERS: TreinoLetter[] = ['A', 'B', 'C'];

export type ResolvedDayView =
	| { kind: 'choice' }
	| { kind: 'rest'; day: WorkoutPlanDay }
	| { kind: 'workout'; day: WorkoutPlanDay };

export function dayDecisionKey(protocolDay: number): string {
	return String(protocolDay);
}

export function getDayDecision(
	progress: WorkoutProgress,
	protocolDay: number
): DayTreinoDecision | null {
	if (protocolDay === 1) return null;
	return progress.dayDecisions?.[dayDecisionKey(protocolDay)] ?? null;
}

export function getNextSessionIndex(progress: WorkoutProgress): number {
	const indices = [1];
	const decisions = progress.dayDecisions ?? {};
	for (const decision of Object.values(decisions)) {
		if (decision.status === 'workout') indices.push(decision.sessionIndex);
	}
	return Math.max(...indices) + 1;
}

export function getNextWorkoutLetter(progress: WorkoutProgress): TreinoLetter {
	const nextIndex = getNextSessionIndex(progress);
	return WORKOUT_LETTERS[(nextIndex - 1) % 3];
}

function getTemplate(plan: WorkoutPlan, letter: TreinoLetter): WorkoutTemplate {
	const fromTemplates = plan.workoutTemplates?.[letter];
	if (fromTemplates) return fromTemplates;

	const legacy = plan.days.find((d) => d.workoutLetter === letter && d.exercises?.length);
	if (legacy?.exercises) {
		return {
			letter,
			stationTitle: legacy.stationTitle,
			whereToStay: legacy.whereToStay,
			materials: legacy.materials,
			exercises: legacy.exercises
		};
	}

	throw new Error(`Template de treino ${letter} não encontrado`);
}

function buildWorkoutDayFromTemplate(
	plan: WorkoutPlan,
	baseDay: WorkoutPlanDay,
	letter: TreinoLetter,
	sessionIndex: number,
	sessionKey: string
): WorkoutPlanDay {
	const template = getTemplate(plan, letter);
	return {
		...baseDay,
		isWorkoutDay: true,
		isRestDay: false,
		isPending: false,
		sessionIndex,
		sessionKey,
		workoutLetter: letter,
		stationTitle: template.stationTitle,
		whereToStay: template.whereToStay,
		materials: template.materials,
		estimatedMinutes: estimateSessionMinutes(baseDay.timing),
		exercises: template.exercises
	};
}

export function resolveDayView(
	plan: WorkoutPlan,
	progress: WorkoutProgress,
	protocolDay: number
): ResolvedDayView {
	const baseDay = plan.days.find((d) => d.protocolDay === protocolDay);
	if (!baseDay) return { kind: 'choice' };

	if (protocolDay === 1) {
		return {
			kind: 'workout',
			day: buildWorkoutDayFromTemplate(plan, baseDay, 'A', 1, 'session-1')
		};
	}

	const decision = getDayDecision(progress, protocolDay);
	if (!decision) return { kind: 'choice' };
	if (decision.status === 'rest') {
		return {
			kind: 'rest',
			day: { ...baseDay, isRestDay: true, isWorkoutDay: false, isPending: false }
		};
	}

	return {
		kind: 'workout',
		day: buildWorkoutDayFromTemplate(
			plan,
			baseDay,
			decision.workoutLetter,
			decision.sessionIndex,
			decision.sessionKey
		)
	};
}

export function isProtocolDayCompleted(
	plan: WorkoutPlan,
	progress: WorkoutProgress,
	protocolDay: number
): boolean {
	const view = resolveDayView(plan, progress, protocolDay);
	if (view.kind === 'rest') return true;
	if (view.kind === 'choice') return false;
	const sessionKey = view.day.sessionKey;
	if (!sessionKey) return false;
	return progress.completedSessions.includes(sessionKey);
}

export function hasWorkoutAssigned(
	plan: WorkoutPlan,
	progress: WorkoutProgress,
	protocolDay: number
): boolean {
	const view = resolveDayView(plan, progress, protocolDay);
	return view.kind === 'workout';
}
