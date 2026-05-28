import { browser } from '$app/environment';
import { PUBLIC_GA4_ID } from '$env/static/public';
import { getAnonymousId } from '$lib/stores/identity.store';
import { get } from 'svelte/store';
import { quizStore } from '$lib/stores/quiz.store';

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

type CommonParams = {
	anonymous_id: string;
	funnel_session_id?: string;
};

type QuizStepCompleteParams = CommonParams & {
	step_id: string;
	step_index?: number;
	steps_total?: number;
	next_step_id?: string | null;
	is_last_step?: boolean;
};

const DEDUPE_KEYS = {
	quiz_view: 'ga4:quiz_view',
	quiz_complete_prefix: 'ga4:quiz_complete:',
	generate_lead_prefix: 'ga4:generate_lead:'
} as const;

function canSend(): boolean {
	return browser && !!PUBLIC_GA4_ID && typeof window.gtag === 'function';
}

function baseParams(): CommonParams {
	const anon = getAnonymousId();
	const funnelSessionId = get(quizStore).funnelSessionId ?? undefined;
	return { anonymous_id: anon, funnel_session_id: funnelSessionId };
}

function dedupeOnce(key: string): boolean {
	if (!browser) return false;
	try {
		if (sessionStorage.getItem(key) === '1') return true;
		sessionStorage.setItem(key, '1');
		return false;
	} catch {
		return false;
	}
}

function sendEvent(name: string, params: Record<string, unknown> = {}): void {
	if (!canSend()) return;
	window.gtag!('event', name, params);
}

export function trackQuizView(): void {
	if (dedupeOnce(DEDUPE_KEYS.quiz_view)) return;
	sendEvent('quiz_view', {
		...baseParams(),
		page_path: '/plan'
	});
}

export function trackQuizStart(): void {
	sendEvent('quiz_start', {
		...baseParams(),
		first_question_id: 'goal_type'
	});
}

/**
 * 1 evento por pergunta respondida (avanço do step).
 * Não envia o valor digitado (PII / sensível).
 */
export function trackQuizStepComplete(params: Omit<QuizStepCompleteParams, keyof CommonParams> & Partial<CommonParams>): void {
	const common = baseParams();
	sendEvent('quiz_step_complete', {
		...common,
		...params
	});
}

/**
 * Back-compat: chamadas existentes enviam quiz_step_complete com step_id.
 * Mantemos a assinatura para não quebrar imports atuais.
 */
export function trackQuestionAnswer(questionId: string, _value: string | string[]): void {
	trackQuizStepComplete({ step_id: questionId });
}

export function trackQuizComplete(): void {
	const { funnel_session_id, anonymous_id } = baseParams();
	const dedupeKey = `${DEDUPE_KEYS.quiz_complete_prefix}${funnel_session_id ?? anonymous_id}`;
	if (dedupeOnce(dedupeKey)) return;
	sendEvent('quiz_complete', { ...baseParams(), page_path: '/results' });
}

/** Última pergunta respondida; ainda não garante que chegou na oferta (/results). */
export function trackQuizFinishQuestions(): void {
	sendEvent('quiz_finish_questions', { ...baseParams() });
}

export function trackGenerateLead(method: 'whatsapp' = 'whatsapp'): void {
	const { funnel_session_id, anonymous_id } = baseParams();
	const dedupeKey = `${DEDUPE_KEYS.generate_lead_prefix}${funnel_session_id ?? anonymous_id}`;
	if (dedupeOnce(dedupeKey)) return;
	sendEvent('generate_lead', {
		...baseParams(),
		method,
		lead_type: 'quiz'
	});
}

/** Back-compat (se existir algum uso legado). */
export function trackLeadSubmit(_profileId: string): void {
	trackGenerateLead('whatsapp');
}
