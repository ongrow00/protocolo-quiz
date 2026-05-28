export type PlayerPhase = 'idle' | 'roundIntro' | 'work' | 'restExercise' | 'restRound' | 'complete' | 'paused';

export type PlayerSnapshot = {
	phase: PlayerPhase;
	round: number;
	exerciseIndex: number;
	secondsLeft: number;
	totalRounds: number;
	totalExercises: number;
	pausedFrom?: PlayerPhase;
};

export function initialSnapshot(totalRounds: number, totalExercises: number): PlayerSnapshot {
	return {
		phase: 'idle',
		round: 1,
		exerciseIndex: 0,
		secondsLeft: 0,
		totalRounds,
		totalExercises
	};
}

export function startSession(totalRounds: number, totalExercises: number): PlayerSnapshot {
	return {
		phase: 'roundIntro',
		round: 1,
		exerciseIndex: 0,
		secondsLeft: 3,
		totalRounds,
		totalExercises
	};
}

export function togglePause(snapshot: PlayerSnapshot): PlayerSnapshot {
	if (snapshot.phase === 'complete' || snapshot.phase === 'idle') return snapshot;
	if (snapshot.phase === 'paused') {
		return {
			...snapshot,
			phase: snapshot.pausedFrom ?? 'work',
			pausedFrom: undefined
		};
	}
	return { ...snapshot, phase: 'paused', pausedFrom: snapshot.phase };
}

export function advanceAfterTimer(
	snapshot: PlayerSnapshot,
	workSeconds: number,
	restExerciseSeconds: number,
	restRoundSeconds: number
): PlayerSnapshot {
	const { phase, round, exerciseIndex, totalRounds, totalExercises } = snapshot;

	if (phase === 'roundIntro') {
		return { ...snapshot, phase: 'work', exerciseIndex: 0, secondsLeft: workSeconds };
	}

	if (phase === 'work') {
		if (exerciseIndex < totalExercises - 1) {
			return { ...snapshot, phase: 'restExercise', secondsLeft: restExerciseSeconds };
		}
		if (round < totalRounds) {
			return { ...snapshot, phase: 'restRound', secondsLeft: restRoundSeconds };
		}
		return { ...snapshot, phase: 'complete', secondsLeft: 0 };
	}

	if (phase === 'restExercise') {
		return {
			...snapshot,
			phase: 'work',
			exerciseIndex: exerciseIndex + 1,
			secondsLeft: workSeconds
		};
	}

	if (phase === 'restRound') {
		return {
			...snapshot,
			phase: 'roundIntro',
			round: round + 1,
			exerciseIndex: 0,
			secondsLeft: 3
		};
	}

	return snapshot;
}

export function skipRest(
	snapshot: PlayerSnapshot,
	workSeconds: number,
	restRoundSeconds: number
): PlayerSnapshot {
	const effective =
		snapshot.phase === 'paused' ? (snapshot.pausedFrom ?? snapshot.phase) : snapshot.phase;
	if (effective === 'restExercise') {
		return {
			...snapshot,
			phase: 'work',
			pausedFrom: undefined,
			exerciseIndex: snapshot.exerciseIndex + 1,
			secondsLeft: workSeconds
		};
	}
	if (effective === 'restRound') {
		return {
			...snapshot,
			phase: 'roundIntro',
			pausedFrom: undefined,
			round: snapshot.round + 1,
			exerciseIndex: 0,
			secondsLeft: 3
		};
	}
	return snapshot;
}

export function resumeAtExercise(
	exerciseIndex: number,
	round: number,
	totalRounds: number,
	totalExercises: number,
	workSeconds: number
): PlayerSnapshot {
	return {
		phase: 'paused',
		round,
		exerciseIndex,
		secondsLeft: workSeconds,
		totalRounds,
		totalExercises,
		pausedFrom: 'work'
	};
}

export function tickSecond(snapshot: PlayerSnapshot): PlayerSnapshot {
	if (snapshot.phase === 'paused' || snapshot.phase === 'idle' || snapshot.phase === 'complete') {
		return snapshot;
	}
	if (snapshot.secondsLeft > 1) {
		return { ...snapshot, secondsLeft: snapshot.secondsLeft - 1 };
	}
	return { ...snapshot, secondsLeft: 0 };
}
