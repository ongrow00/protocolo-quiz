import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
import {
	getCatalogWorkout,
	getDores,
	getRestricoes,
	resolveAvailableEquipment
} from '$lib/data/treino-catalog';
import { getTreinoPhaseConfig } from '$lib/data/treino-phases';
import { buildScheduleSlots, buildWorkoutDays, parseFrequencyId } from '$lib/data/treino-schedule';
import { pickVariant } from '$lib/data/treino-substitution-rules';
import type {
	CatalogExerciseSlot,
	CatalogExerciseVariant,
	ExerciseDisplay,
	TreinoLocal,
	TreinoQuizAnswers,
	VariantKind,
	WorkoutExercise,
	WorkoutPlan,
	WorkoutPlanDay
} from '$lib/data/treino-types';
import { getTreinoExerciseImageUrl } from '$lib/data/treino-exercise-images';
import { estimateSessionMinutes } from '$lib/utils/treino-duration';

export type ProfileHints = {
	activityLevel?: string;
};

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
	const schedule = buildScheduleSlots(frequencyId);
	const workoutDays = buildWorkoutDays(frequencyId);

	const days: WorkoutPlanDay[] = [];

	for (let protocolDay = 1; protocolDay <= CHALLENGE_TOTAL_DAYS; protocolDay++) {
		const slot = schedule[protocolDay - 1];
		const phaseConfig = getTreinoPhaseConfig(protocolDay);

		if (!slot.isWorkoutDay || !slot.workoutLetter) {
			days.push({
				protocolDay,
				phase: phaseConfig.phase,
				phaseName: phaseConfig.phaseName,
				isWorkoutDay: false,
				isRestDay: true,
				stationTitle: '',
				whereToStay: '',
				materials: [],
				estimatedMinutes: 0,
				timing: phaseConfig
			});
			continue;
		}

		const catalog = getCatalogWorkout(local, slot.workoutLetter);
		const exercises = buildWorkoutExercises(
			local,
			slot.workoutLetter,
			catalog.slots,
			available,
			dores,
			restricoes,
			preferEasier
		);
		const materials = collectMaterials(catalog.baseMaterials, exercises);
		const estimatedMinutes = estimateSessionMinutes(phaseConfig);

		days.push({
			protocolDay,
			phase: phaseConfig.phase,
			phaseName: phaseConfig.phaseName,
			isWorkoutDay: true,
			isRestDay: false,
			sessionIndex: slot.sessionIndex,
			sessionKey: slot.sessionKey,
			workoutLetter: slot.workoutLetter,
			stationTitle: catalog.stationTitle,
			whereToStay: catalog.whereToStay,
			materials,
			estimatedMinutes,
			timing: phaseConfig,
			exercises
		});
	}

	return {
		version: 1,
		generatedAt: new Date().toISOString(),
		quizAnswers: answers,
		frequencyId,
		local,
		totalSessions: workoutDays.length,
		workoutDays,
		days
	};
}
