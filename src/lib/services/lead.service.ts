import { browser } from '$app/environment';
import { get } from 'svelte/store';
import type { Answers, LeadData, Scores, UtmParams } from '$lib/data/types';
import { getAnonymousId } from '$lib/stores/identity.store';
import { postQuizStore } from '$lib/stores/post-quiz.store';
import { quizStore } from '$lib/stores/quiz.store';
import { sessionStore } from '$lib/stores/session.store';

/** Persists lead + full quiz payload via server (Supabase service role). */
export async function submitLead(data: LeadData): Promise<void> {
	const res = await fetch('/api/leads', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			intent: 'submit',
			anonymousId: getAnonymousId(),
			...data
		})
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
	anonymousId: string;
	scores: Scores;
	answers: Answers;
	visitedQuestions?: string[];
	currentQuestionId?: string | null;
	startedAt?: number | null;
	completedAt?: number | null;
	lastActivityAt?: number;
	utm?: UtmParams;
	offer?: string | null;
	/** Pós-quiz (/nome, /whatsapp): persiste no mesmo registro do funil */
	postQuizName?: string;
	postQuizWhatsapp?: string;
	/** /results: oferta revelada (VTurb, restore ou bónus). */
	offerRevealed?: boolean;
};

/** Monta payload completo a partir dos stores (fetch e sendBeacon). */
export function buildQuizProgressPayload(): QuizProgressPayload | null {
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return null;

	const session = get(sessionStore);
	const post = get(postQuizStore);
	const postName = post.name.trim();
	const postWa = post.whatsapp.replace(/\s/g, '').trim();
	const utm = session.utm;
	const hasUtm = Object.keys(utm).length > 0;

	return {
		funnelSessionId: q.funnelSessionId,
		anonymousId: getAnonymousId(),
		scores: q.scores,
		answers: q.answers,
		visitedQuestions: q.visitedQuestions,
		currentQuestionId: q.currentQuestionId,
		startedAt: q.startedAt,
		completedAt: q.completedAt,
		lastActivityAt: Date.now(),
		...(hasUtm ? { utm } : {}),
		offer: session.offer,
		...(postName ? { postQuizName: postName.slice(0, 200) } : {}),
		...(postWa ? { postQuizWhatsapp: postWa.slice(0, 32) } : {}),
		...(post.resultsOfferRevealed ? { offerRevealed: true } : {})
	};
}

function progressBody(data: QuizProgressPayload): Record<string, unknown> {
	return {
		intent: 'progress',
		funnelSessionId: data.funnelSessionId,
		anonymousId: data.anonymousId,
		scores: data.scores,
		answers: data.answers,
		visitedQuestions: data.visitedQuestions,
		currentQuestionId: data.currentQuestionId ?? undefined,
		startedAt: data.startedAt ?? undefined,
		completedAt: data.completedAt ?? undefined,
		lastActivityAt: data.lastActivityAt ?? Date.now(),
		utm: data.utm,
		offer: data.offer ?? undefined,
		...(data.postQuizName?.trim() ? { postQuizName: data.postQuizName.trim().slice(0, 200) } : {}),
		...(data.postQuizWhatsapp?.replace(/\s/g, '').trim()
			? { postQuizWhatsapp: data.postQuizWhatsapp.replace(/\s/g, '').trim().slice(0, 32) }
			: {}),
		...(data.offerRevealed ? { offerRevealed: true } : {})
	};
}

/** Upsert do progresso do quiz. Melhor esforço — erros são ignorados pelo caller. */
export async function syncQuizProgress(data: QuizProgressPayload): Promise<void> {
	const res = await fetch('/api/leads', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(progressBody(data))
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

/** Último envio ao fechar aba (sendBeacon). */
export function syncQuizProgressBeacon(data: QuizProgressPayload): boolean {
	if (!browser || typeof navigator.sendBeacon !== 'function') return false;
	const body = JSON.stringify(progressBody(data));
	return navigator.sendBeacon('/api/leads', new Blob([body], { type: 'application/json' }));
}
