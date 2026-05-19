import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import { quizConfig } from '$lib/data/quiz.config';
import { QUIZ_SESSION_STORAGE_KEY } from '$lib/constants/storage-keys';

export const load: PageLoad = ({ params }) => {
	const { questionId } = params;

	/** Passo mr-5 removido: URLs antigas seguem para o loading pós-quiz. */
	if (questionId === 'mr-5') {
		redirect(302, '/carregando');
	}

	// Validate questionId exists in config
	const question = quizConfig.questions.find((q) => q.id === questionId);
	if (!question) {
		redirect(302, '/plan');
	}

	if (questionId === 'goal_type') {
		redirect(302, '/plan');
	}

	// Guard: quiz não iniciado → entrada em /plan (only client-side)
	if (browser) {
		try {
			const raw = sessionStorage.getItem(QUIZ_SESSION_STORAGE_KEY);
			if (!raw) redirect(302, '/plan');
			const state = JSON.parse(raw);
			if (!state.startedAt) redirect(302, '/plan');
		} catch {
			redirect(302, '/plan');
		}
	}

	return { questionId };
};
