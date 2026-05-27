import { PHASE_LABELS, getPhase, type PhaseId } from '$lib/data/meal-nutrition';
import type { TreinoPhaseConfig } from '$lib/data/treino-types';

const PHASE_TIMING: Record<
	PhaseId,
	Pick<TreinoPhaseConfig, 'exerciseSeconds' | 'restBetweenExercises' | 'restBetweenRounds' | 'rounds'>
> = {
	1: { exerciseSeconds: 30, restBetweenExercises: 20, restBetweenRounds: 120, rounds: 3 },
	2: { exerciseSeconds: 35, restBetweenExercises: 20, restBetweenRounds: 120, rounds: 4 },
	3: { exerciseSeconds: 40, restBetweenExercises: 20, restBetweenRounds: 120, rounds: 5 },
	4: { exerciseSeconds: 45, restBetweenExercises: 20, restBetweenRounds: 120, rounds: 6 }
};

export function getTreinoPhaseConfig(protocolDay: number): TreinoPhaseConfig {
	const phase = getPhase(protocolDay);
	return {
		phase,
		phaseName: PHASE_LABELS[phase],
		...PHASE_TIMING[phase]
	};
}

export { getPhase };
