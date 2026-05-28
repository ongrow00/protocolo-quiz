import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import {
	getCatalogWorkout,
	getDores,
	getRestricoes,
	resolveAvailableEquipment
} from '$lib/data/treino-catalog';
import { getTreinoPhaseConfig } from '$lib/data/treino-phases';
import { SESSIONS_IN_14, parseFrequencyId } from '$lib/data/treino-schedule';
import { pickVariant } from '$lib/data/treino-substitution-rules';
import type {
	CatalogExerciseSlot,
	CatalogExerciseVariant,
	ExerciseDisplay,
	TreinoLetter,
	TreinoLocal,
	TreinoQuizAnswers,
	VariantKind,
	WorkoutExercise,
	WorkoutPlan,
	WorkoutPlanDay,
	WorkoutTemplate
} from '$lib/data/treino-types';
import { getTreinoExerciseImageUrl } from '$lib/data/treino-exercise-images';
import { estimateSessionMinutes } from '$lib/utils/treino-duration';

export type ProfileHints = {
	activityLevel?: string;
};

const WORKOUT_LETTERS: TreinoLetter[] = ['A', 'B', 'C'];

function exerciseId(local: TreinoLocal, letter: string, slot: number, kind: VariantKind): string {
	return `${local}-${letter}-s${slot}-${kind}`;
}

function toDisplay(
	local: TreinoLocal,
	letter: string,
	slot: CatalogExerciseSlot,
	variant: CatalogExerciseVariant
): ExerciseDisplay {
	return {
		id: exerciseId(local, letter, slot.slot, variant.kind),
		name: variant.name,
		imageUrl: getTreinoExerciseImageUrl(variant.name)
	};
}

function collectMaterials(baseMaterials: string[], _exercises: WorkoutExercise[]): string[] {
	return [...baseMaterials];
}

function buildWorkoutExercises(
	local: TreinoLocal,
	letter: string,
	slots: CatalogExerciseSlot[],
	available: Set<string>,
	dores: string[],
	restricoes: string[],
	preferEasier: boolean
): WorkoutExercise[] {
	return slots.map((slot) => {
		const { kind, reason } = pickVariant(slot, available, dores, restricoes, preferEasier);
		const activeVariant = kind === 'principal' ? slot.principal : slot.opcao2;
		const altVariant = kind === 'principal' ? slot.opcao2 : slot.principal;
		return {
			slot: slot.slot,
			activeVariant: kind,
			active: toDisplay(local, letter, slot, activeVariant),
			alternative: toDisplay(local, letter, slot, altVariant),
			selectionReason: reason
		};
	});
}

function buildWorkoutTemplate(
	local: TreinoLocal,
	letter: TreinoLetter,
	available: Set<string>,
	dores: string[],
	restricoes: string[],
	preferEasier: boolean
): WorkoutTemplate {
	const catalog = getCatalogWorkout(local, letter);
	const exercises = buildWorkoutExercises(
		local,
		letter,
		catalog.slots,
		available,
		dores,
		restricoes,
		preferEasier
	);
	return {
		letter,
		stationTitle: catalog.stationTitle,
		whereToStay: catalog.whereToStay,
		materials: collectMaterials(catalog.baseMaterials, exercises),
		exercises
	};
}

export function generateWorkoutPlan(
	answers: TreinoQuizAnswers,
	hints?: ProfileHints
): WorkoutPlan {
	const local = (answers.treino_local as TreinoLocal) ?? 'academia';
	const frequencyId = parseFrequencyId(answers.treino_frequencia);
	const available = resolveAvailableEquipment(answers);
	const dores = getDores(answers);
	const restricoes = getRestricoes(answers);
	const preferEasier = hints?.activityLevel === 'al-sedentaria' || hints?.activityLevel === 'al-leve';

	const workoutTemplates = Object.fromEntries(
		WORKOUT_LETTERS.map((letter) => [
			letter,
			buildWorkoutTemplate(local, letter, available, dores, restricoes, preferEasier)
		])
	) as Record<TreinoLetter, WorkoutTemplate>;

	const templateA = workoutTemplates.A;
	const days: WorkoutPlanDay[] = [];

	for (let protocolDay = 1; protocolDay <= CHALLENGE_TOTAL_DAYS; protocolDay++) {
		const phaseConfig = getTreinoPhaseConfig(protocolDay);

		if (protocolDay === 1) {
			days.push({
				protocolDay,
				phase: phaseConfig.phase,
				phaseName: phaseConfig.phaseName,
				isWorkoutDay: true,
				isRestDay: false,
				isPending: false,
				sessionIndex: 1,
				sessionKey: 'session-1',
				workoutLetter: 'A',
				stationTitle: templateA.stationTitle,
				whereToStay: templateA.whereToStay,
				materials: templateA.materials,
				estimatedMinutes: estimateSessionMinutes(phaseConfig),
				timing: phaseConfig,
				exercises: templateA.exercises
			});
			continue;
		}

		days.push({
			protocolDay,
			phase: phaseConfig.phase,
			phaseName: phaseConfig.phaseName,
			isWorkoutDay: false,
			isRestDay: false,
			isPending: true,
			stationTitle: '',
			whereToStay: '',
			materials: [],
			estimatedMinutes: 0,
			timing: phaseConfig
		});
	}

	return {
		version: 2,
		generatedAt: new Date().toISOString(),
		quizAnswers: answers,
		frequencyId,
		local,
		totalSessions: SESSIONS_IN_14[frequencyId],
		workoutDays: [1],
		workoutTemplates,
		days
	};
}
