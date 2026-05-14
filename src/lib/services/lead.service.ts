import type { Answers, LeadData, Scores, UtmParams } from '$lib/data/types';

/** Persists lead + full quiz payload via server (Supabase service role). */
export async function submitLead(data: LeadData): Promise<void> {
	const res = await fetch('/api/leads', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ intent: 'submit', ...data })
	});

	if (!res.ok) {
		let message = 'Falha ao enviar';
		try {
			const err = (await res.json()) as { message?: string };
			if (typeof err.message === 'string') message = err.message;
		} catch {
			// ignore
		}
		throw new Error(message);
	}
}

export type QuizProgressPayload = {
	funnelSessionId: string;
	scores: Scores;
	answers: Answers;
	visitedQuestions?: string[];
	startedAt?: number | null;
	completedAt?: number | null;
	utm?: UtmParams;
	offer?: string | null;
	/** Pós-quiz (/nome, /whatsapp): persiste no mesmo registro do funil */
	postQuizName?: string;
	postQuizWhatsapp?: string;
};

/** Upsert só do progresso do quiz (sem nome/e-mail). Melhor esforço — erros são ignorados pelo caller. */
export async function syncQuizProgress(data: QuizProgressPayload): Promise<void> {
	const res = await fetch('/api/leads', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			intent: 'progress',
			funnelSessionId: data.funnelSessionId,
			scores: data.scores,
			answers: data.answers,
			visitedQuestions: data.visitedQuestions,
			startedAt: data.startedAt ?? undefined,
			completedAt: data.completedAt ?? undefined,
			utm: data.utm,
			offer: data.offer ?? undefined,
			...(data.postQuizName?.trim() ? { postQuizName: data.postQuizName.trim().slice(0, 200) } : {}),
			...(data.postQuizWhatsapp?.replace(/\s/g, '').trim()
				? { postQuizWhatsapp: data.postQuizWhatsapp.replace(/\s/g, '').trim().slice(0, 32) }
				: {})
		})
	});

	if (!res.ok) {
		let message = 'Falha ao sincronizar';
		try {
			const err = (await res.json()) as { message?: string };
			if (typeof err.message === 'string') message = err.message;
		} catch {
			// ignore
		}
		throw new Error(message);
	}
}
