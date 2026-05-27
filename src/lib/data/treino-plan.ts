import { writable, get } from 'svelte/store';
import { generateWorkoutPlan } from '$lib/data/treino-plan-generator';
import type {
	ExerciseSlot,
	TreinoLetter,
	TreinoQuizAnswers,
	WorkoutExercise,
	WorkoutPlan,
	WorkoutPlanDay
} from '$lib/data/treino-types';

/** Store reativo — `$derived` não rastreia `export let` de módulo no Svelte 5. */
export const workoutPlanStore = writable<WorkoutPlan | null>(null);

/** @deprecated Use workoutPlanStore; mantido para compatibilidade pontual. */
export let WORKOUT_PLAN: WorkoutPlan | null = null;

function syncLegacy(plan: WorkoutPlan | null) {
	WORKOUT_PLAN = plan;
}

export function hasWorkoutPlan(): boolean {
	const plan = get(workoutPlanStore);
	return plan !== null && plan.days.length > 0;
}

/** Reconstrói exercícios se o JSON do banco veio incompleto. */
export function normalizeWorkoutPlan(
	plan: WorkoutPlan,
	answers?: TreinoQuizAnswers | null
): WorkoutPlan {
	const broken = plan.days.some(
		(d) => d.isWorkoutDay && (!d.exercises || d.exercises.length === 0)
	);
	if (!broken) return plan;
	if (!answers || Object.keys(answers).length === 0) return plan;
	return generateWorkoutPlan(answers);
}

export function setWorkoutPlanDirect(plan: WorkoutPlan, answers?: TreinoQuizAnswers | null): void {
	const normalized = normalizeWorkoutPlan(plan, answers ?? plan.quizAnswers);
	workoutPlanStore.set(normalized);
	syncLegacy(normalized);
}

export function clearWorkoutPlan(): void {
	workoutPlanStore.set(null);
	syncLegacy(null);
}

export function getWorkoutDay(protocolDay: number): WorkoutPlanDay | undefined {
	const plan = get(workoutPlanStore);
	return plan?.days.find((d) => d.protocolDay === protocolDay);
}

/** Troca ativo/alternativo em todos os dias do mesmo treino (A/B/C). */
export function swapWorkoutExerciseVariant(
	workoutLetter: TreinoLetter,
	slot: ExerciseSlot
): { exercise: WorkoutExercise; previousActiveId: string } | null {
	const plan = get(workoutPlanStore);
	if (!plan) return null;

	const updated: WorkoutPlan = structuredClone(plan);
	let sample: WorkoutExercise | null = null;
	let previousActiveId = '';

	for (const day of updated.days) {
		if (!day.isWorkoutDay || day.workoutLetter !== workoutLetter || !day.exercises) continue;
		const ex = day.exercises.find((e) => e.slot === slot);
		if (!ex) continue;

		if (!sample) previousActiveId = ex.active.id;

		const prevActive = ex.active;
		ex.active = ex.alternative;
		ex.alternative = prevActive;
		ex.activeVariant = ex.activeVariant === 'principal' ? 'opcao2' : 'principal';
		if (!sample) sample = ex;
	}

	if (!sample) return null;

	workoutPlanStore.set(updated);
	syncLegacy(updated);
	return { exercise: sample, previousActiveId };
}

export function setWorkoutPlanFromQuiz(
	answers: TreinoQuizAnswers,
	hints?: { activityLevel?: string }
): WorkoutPlan {
	const plan = generateWorkoutPlan(answers, hints);
	workoutPlanStore.set(plan);
	syncLegacy(plan);
	return plan;
}

export type { WorkoutPlan, WorkoutPlanDay, WorkoutExercise } from '$lib/data/treino-types';
