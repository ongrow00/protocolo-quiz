import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';
import { quizConfig } from '$lib/data/quiz.config';
import type { Answers, CategoryKey, Question, QuizState, Scores } from '$lib/data/types';
import { computeVisibleQuestions } from '$lib/utils/branching';
import { calculateScores } from '$lib/utils/scoring';
import { QUIZ_SESSION_STORAGE_KEY } from '$lib/constants/storage-keys';
import { easeOutProgress01 } from '$lib/utils/progress-easing';

const SESSION_KEY = QUIZ_SESSION_STORAGE_KEY;

const INITIAL_SCORES: Scores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

const INITIAL_STATE: QuizState = {
	currentQuestionId: null,
	answers: {},
	scores: { ...INITIAL_SCORES },
	visitedQuestions: [],
	startedAt: null,
	completedAt: null,
	funnelSessionId: null
};

function newFunnelSessionId(): string {
	return crypto.randomUUID();
}

function loadFromSession(): QuizState {
	if (!browser) return INITIAL_STATE;
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return INITIAL_STATE;
		let state = JSON.parse(raw) as QuizState;
		if (state.startedAt != null && !state.funnelSessionId) {
			state = { ...state, funnelSessionId: newFunnelSessionId() };
			sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
		}
		return state;
	} catch {
		return INITIAL_STATE;
	}
}

function saveToSession(state: QuizState): void {
	if (!browser) return;
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

function createQuizStore() {
	const { subscribe, set, update } = writable<QuizState>(loadFromSession());

	function persist(state: QuizState): QuizState {
		saveToSession(state);
		return state;
	}

	return {
		subscribe,

		start() {
			const visible = computeVisibleQuestions(quizConfig.questions, {});
			const firstQuestion = visible[0] ?? null;
			update(() =>
				persist({
					...INITIAL_STATE,
					funnelSessionId: newFunnelSessionId(),
					currentQuestionId: firstQuestion?.id ?? null,
					startedAt: Date.now()
				})
			);
		},

		answer(questionId: string, value: string | string[]) {
			update((s) => {
				const def = quizConfig.questions.find((q) => q.id === questionId);
				let stored: string | string[] = value;
				if (def?.type === 'single' && Array.isArray(value)) {
					const last = value.filter((v) => v != null && String(v).trim() !== '').at(-1);
					stored = last != null ? String(last) : '';
				}
				const newAnswers = { ...s.answers, [questionId]: stored };
				const newScores = calculateScores(newAnswers, quizConfig.questions);

				// Mark as visited if not already
				const visited = s.visitedQuestions.includes(questionId)
					? s.visitedQuestions
					: [...s.visitedQuestions, questionId];

				return persist({ ...s, answers: newAnswers, scores: newScores, visitedQuestions: visited });
			});
		},

		goTo(questionId: string) {
			update((s) => persist({ ...s, currentQuestionId: questionId }));
		},

		complete() {
			update((s) => persist({ ...s, completedAt: Date.now() }));
		},

		reset() {
			const fresh = { ...INITIAL_STATE };
			saveToSession(fresh);
			set(fresh);
		}
	};
}

export const quizStore = createQuizStore();

/** Bumped when navigation has ended (afterNavigate). QuizShell uses this to clear advancing lock. */
export const quizNavigationEnded = writable(0);

// --- Derived stores ---

export const visibleQuestions = derived(quizStore, ($quiz) =>
	computeVisibleQuestions(quizConfig.questions, $quiz.answers)
);

export const currentQuestion = derived(
	[quizStore, visibleQuestions],
	([$quiz, $visible]): Question | null =>
		$visible.find((q) => q.id === $quiz.currentQuestionId) ?? null
);

export const currentIndex = derived(
	[quizStore, visibleQuestions],
	([$quiz, $visible]): number => $visible.findIndex((q) => q.id === $quiz.currentQuestionId)
);

/**
 * Marcos fixos de checkpoint na barra (mr-3 sem círculo).
 * O 4.º marco é o fim do quiz (última pergunta visível), sem tela mr-5.
 */
const MR_PROGRESS_MILESTONE_IDS = ['mr-1', 'mr-2', 'mr-4'] as const;

/** Só a última pergunta visível pode estar em 100%; abaixo disso evita barra/check cheios e arredondamento para 100. */
const PROGRESS_MAX_BEFORE_LAST_QUESTION = 99.49;

function capProgressUntilLastQuestion(percent: number, index: number, lastIx: number): number {
	const p = Math.min(100, percent);
	if (index < lastIx) return Math.min(p, PROGRESS_MAX_BEFORE_LAST_QUESTION);
	return p;
}

export const progressPercent = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): number => {
		if ($visible.length === 0 || $index < 0) return 0;
		const lastIx = $visible.length - 1;
		const mrIndices = MR_PROGRESS_MILESTONE_IDS.map((id) => $visible.findIndex((q) => q.id === id)).filter(
			(i) => i >= 0
		);
		if (mrIndices.length === 0) {
			const pct = Math.round((($index + 1) / $visible.length) * 100);
			return capProgressUntilLastQuestion(pct, $index, lastIx);
		}
		/** Índices dos 3 MR + última pergunta (4.º marco visual), únicos e ordenados. */
		const milestoneIndices = [...new Set([...mrIndices, lastIx])].sort((a, b) => a - b);
		const totalSegments = milestoneIndices.length;
		const currentId = $visible[$index]?.id;
		const mrSegment = MR_PROGRESS_MILESTONE_IDS.findIndex((id) => id === currentId);
		if (mrSegment >= 0) {
			const slot = milestoneIndices.findIndex((visIdx) => $visible[visIdx]?.id === currentId);
			const checkpoint = slot >= 0 ? slot + 1 : mrSegment + 1;
			const pct = Math.min(100, (checkpoint / totalSegments) * 100);
			return capProgressUntilLastQuestion(pct, $index, lastIx);
		}
		let segment = 0;
		for (let s = 0; s < milestoneIndices.length; s++) {
			if ($index <= milestoneIndices[s]) {
				segment = s;
				break;
			}
			segment = s + 1;
		}
		const segmentStart = segment === 0 ? 0 : milestoneIndices[segment - 1] + 1;
		const segmentEnd = segment < milestoneIndices.length ? milestoneIndices[segment] : lastIx;
		const segmentSize = Math.max(1, segmentEnd - segmentStart);
		const tLinear = ($index - segmentStart) / segmentSize;
		const progressWithin = easeOutProgress01(tLinear);
		const pct = ((segment + progressWithin) / totalSegments) * 100;
		return capProgressUntilLastQuestion(pct, $index, lastIx);
	}
);

export const isFirstQuestion = derived(currentIndex, ($index) => $index === 0);

export const isLastQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]) => $index === $visible.length - 1
);

export const nextQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): Question | null => $visible[$index + 1] ?? null
);

export const prevQuestion = derived(
	[currentIndex, visibleQuestions],
	([$index, $visible]): Question | null => ($index > 0 ? $visible[$index - 1] : null)
);
