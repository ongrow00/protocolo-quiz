import type { Answers } from '$lib/data/types';

const GOAL_TYPE_LABELS: Record<string, string> = {
	'goal-emagrecer': 'Emagrecer',
	'goal-definir': 'Definir o corpo'
};

/** Rótulo do objetivo principal (pergunta goal_type). */
export function primaryObjectiveLabel(answers: Answers): string | undefined {
	const g = answers['goal_type'];
	const id = typeof g === 'string' ? g : Array.isArray(g) ? g[0] : undefined;
	if (!id || typeof id !== 'string') return undefined;
	return GOAL_TYPE_LABELS[id] ?? id;
}
