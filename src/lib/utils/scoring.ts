import type { Answers, CategoryKey, Question, ResultProfile, Scores } from '$lib/data/types';

const ZERO_SCORES: Scores = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

export function calculateScores(answers: Answers, questions: Question[]): Scores {
	const scores: Scores = { ...ZERO_SCORES };

	for (const question of questions) {
		if (!question.options) continue;
		const answer = answers[question.id];
		if (answer === undefined || answer === null) continue;

		let selectedIds: string[];
		if (question.type === 'single') {
			const one = Array.isArray(answer)
				? answer.filter((id) => id != null && String(id).trim() !== '').at(-1)
				: answer;
			if (one == null || String(one).trim() === '') continue;
			selectedIds = [String(one)];
		} else {
			selectedIds = Array.isArray(answer) ? answer : [answer];
		}

		for (const optionId of selectedIds) {
			const option = question.options.find((o) => o.id === optionId);
			if (!option) continue;

			for (const [cat, pts] of Object.entries(option.scores) as [CategoryKey, number][]) {
				scores[cat] = (scores[cat] ?? 0) + pts;
			}
		}
	}

	return scores;
}

export function matchProfile(scores: Scores, profiles: ResultProfile[]): ResultProfile {
	// Find the category with the highest score
	const topCategory = (Object.keys(scores) as CategoryKey[]).reduce((best, cat) =>
		scores[cat] > scores[best] ? cat : best
	);

	// Find the profile whose primaryCategory matches
	const matched = profiles.find((p) => p.threshold.primaryCategory === topCategory);

	if (matched) {
		const min = matched.threshold.minimumScore ?? 0;
		if (scores[topCategory] >= min) {
			return matched;
		}
	}

	// Fallback: find any profile that meets its minimum threshold
	const fallback = profiles.find((p) => {
		const cat = p.threshold.primaryCategory;
		const min = p.threshold.minimumScore ?? 0;
		return scores[cat] >= min;
	});

	// Last resort: first profile
	return fallback ?? profiles[0];
}
