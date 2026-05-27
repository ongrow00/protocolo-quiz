export type TreinoLetter = 'A' | 'B' | 'C';
export type TreinoLocal = 'academia' | 'casa';
export type ExerciseSlot = 1 | 2 | 3 | 4 | 5;
export type VariantKind = 'principal' | 'opcao2';
export type FrequencyId = '2x' | '3x' | '4x' | '5x' | '6x' | 'todos';
export type SelectionReason = 'default' | 'equipment' | 'pain' | 'restriction' | 'sedentary';

export type TreinoQuizAnswers = Record<string, string | string[]>;

export type CatalogExerciseVariant = {
	kind: VariantKind;
	name: string;
	requiresEquipment: string[];
	tags: string[];
	blockedByDores?: string[];
	blockedByRestricoes?: string[];
};

export type CatalogExerciseSlot = {
	slot: ExerciseSlot;
	principal: CatalogExerciseVariant;
	opcao2: CatalogExerciseVariant;
};

export type CatalogWorkout = {
	letter: TreinoLetter;
	local: TreinoLocal;
	stationTitle: string;
	whereToStay: string;
	baseMaterials: string[];
	slots: CatalogExerciseSlot[];
};

export type TreinoPhaseConfig = {
	phase: 1 | 2 | 3 | 4;
	phaseName: string;
	exerciseSeconds: number;
	restBetweenExercises: number;
	restBetweenRounds: number;
	rounds: number;
};

export type ExerciseDisplay = {
	id: string;
	name: string;
	imageUrl?: string;
	videoUrl?: string;
	instructions?: string;
};

export type WorkoutExercise = {
	slot: ExerciseSlot;
	activeVariant: VariantKind;
	active: ExerciseDisplay;
	alternative: ExerciseDisplay;
	selectionReason: SelectionReason;
};

export type WorkoutTiming = TreinoPhaseConfig;

export type WorkoutPlanDay = {
	protocolDay: number;
	phase: 1 | 2 | 3 | 4;
	phaseName: string;
	isWorkoutDay: boolean;
	isRestDay: boolean;
	sessionIndex?: number;
	sessionKey?: string;
	workoutLetter?: TreinoLetter;
	stationTitle: string;
	whereToStay: string;
	materials: string[];
	estimatedMinutes: number;
	timing: WorkoutTiming;
	exercises?: WorkoutExercise[];
};

export type WorkoutPlan = {
	version: 1;
	generatedAt: string;
	quizAnswers: TreinoQuizAnswers;
	frequencyId: FrequencyId;
	local: TreinoLocal;
	totalSessions: number;
	workoutDays: number[];
	days: WorkoutPlanDay[];
};

export type WorkoutPlayerPrefs = {
	autoAdvance: boolean;
	soundEnabled: boolean;
};

/** sessionKey → exerciseId → voltas concluídas daquele exercício */
export type SessionExerciseRounds = Record<string, Record<string, number>>;

export type WorkoutProgress = {
	completedSessions: string[];
	/** Progresso por exercício dentro de cada sessão (voltas do circuito). */
	exerciseRoundsBySession: SessionExerciseRounds;
	playerPrefs: WorkoutPlayerPrefs;
};

export const DEFAULT_WORKOUT_PROGRESS: WorkoutProgress = {
	completedSessions: [],
	exerciseRoundsBySession: {},
	playerPrefs: { autoAdvance: true, soundEnabled: true }
};
