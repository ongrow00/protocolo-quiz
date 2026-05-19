import { writable } from 'svelte/store';

export type QuizTransitionDirection = 'forward' | 'back';

/** Direção da última navegação entre perguntas (animação in/out). */
export const quizTransitionDirection = writable<QuizTransitionDirection>('forward');
