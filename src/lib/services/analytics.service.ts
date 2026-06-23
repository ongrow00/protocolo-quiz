import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { PUBLIC_GA4_ID } from '$env/static/public';
import { getAnonymousId } from '$lib/stores/identity.store';
import { get } from 'svelte/store';
import { quizStore } from '$lib/stores/quiz.store';

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
		fbq?: (...args: unknown[]) => void;
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
	generate_lead_prefix: 'ga4:generate_lead:',
	meta_lead_prefix: 'meta:lead:',
	meta_view_content_plan_v2: 'meta:view_content:plan-v2',
	meta_view_content_plan: 'meta:view_content:plan',
	meta_add_to_wishlist_plan_v2: 'meta:add_to_wishlist:plan-v2',
	meta_add_to_wishlist_plan: 'meta:add_to_wishlist:plan',
	meta_add_to_cart_prefix: 'meta:add_to_cart:',
	ga4_add_to_cart_prefix: 'ga4:add_to_cart:'
} as const;

function canSend(): boolean {
	return browser && !!PUBLIC_GA4_ID && typeof window.gtag === 'function';
}

function canSendMeta(): boolean {
	return browser && !!env.PUBLIC_META_PIXEL_ID && typeof window.fbq === 'function';
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

function sendMetaEvent(eventName: string, params?: Record<string, unknown>): void {
	if (!canSendMeta()) return;
	if (params && Object.keys(params).length > 0) {
		window.fbq!('track', eventName, params);
	} else {
		window.fbq!('track', eventName);
	}
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

/** Meta: início do quiz (legado — preferir trackMetaViewContentPlan). */
export function trackMetaViewContent(): void {
	sendMetaEvent('ViewContent', {
		content_name: 'Protocolo Desbloqueio',
		content_type: 'quiz'
	});
}

/** Meta: entrada em `/plan` (dispara no carregamento da página). */
export function trackMetaViewContentPlan(): void {
	if (dedupeOnce(DEDUPE_KEYS.meta_view_content_plan)) return;
	sendMetaEvent('ViewContent', {
		content_name: 'Protocolo Desbloqueio',
		content_type: 'quiz',
		page_path: '/plan'
	});
}

/** Meta: clique em objetivo (Emagrecer / Definir) em `/plan`. */
export function trackMetaAddToWishlistPlan(): void {
	if (dedupeOnce(DEDUPE_KEYS.meta_add_to_wishlist_plan)) return;
	sendMetaEvent('AddToWishlist', {
		content_name: 'Protocolo Desbloqueio',
		content_type: 'quiz',
		page_path: '/plan'
	});
}

/** Meta: entrada A/B em `/plan-v2` (dispara no carregamento da página). */
export function trackMetaViewContentPlanV2(): void {
	if (dedupeOnce(DEDUPE_KEYS.meta_view_content_plan_v2)) return;
	sendMetaEvent('ViewContent', {
		content_name: 'Protocolo Desbloqueio',
		content_type: 'quiz',
		page_path: '/plan-v2'
	});
}

/** Meta: clique em «Começar teste gratuito» em `/plan-v2`. */
export function trackMetaAddToWishlistPlanV2(): void {
	if (dedupeOnce(DEDUPE_KEYS.meta_add_to_wishlist_plan_v2)) return;
	sendMetaEvent('AddToWishlist', {
		content_name: 'Teste do Metabolismo',
		content_type: 'quiz',
		page_path: '/plan-v2'
	});
}

/** Meta: WhatsApp capturado/confirmado (sem PII). */
export function trackMetaLead(): void {
	const { funnel_session_id, anonymous_id } = baseParams();
	const dedupeKey = `${DEDUPE_KEYS.meta_lead_prefix}${funnel_session_id ?? anonymous_id}`;
	if (dedupeOnce(dedupeKey)) return;
	sendMetaEvent('Lead', { lead_type: 'whatsapp' });
}

/** Meta + GA4: oferta em /results revelada pelo VTurb. */
export function trackAddToCart(params?: {
	content_name?: string;
	value?: number;
	currency?: string;
}): void {
	const { funnel_session_id, anonymous_id } = baseParams();
	const dedupeId = funnel_session_id ?? anonymous_id;
	const metaDedupeKey = `${DEDUPE_KEYS.meta_add_to_cart_prefix}${dedupeId}`;
	const ga4DedupeKey = `${DEDUPE_KEYS.ga4_add_to_cart_prefix}${dedupeId}`;

	if (!dedupeOnce(metaDedupeKey)) {
		sendMetaEvent('AddToCart', {
			content_name: params?.content_name ?? 'Protocolo Desbloqueio',
			content_type: 'product',
			currency: params?.currency ?? 'BRL',
			...(params?.value != null ? { value: params.value } : {})
		});
	}

	if (!dedupeOnce(ga4DedupeKey)) {
		sendEvent('add_to_cart', {
			...baseParams(),
			page_path: '/results',
			content_name: params?.content_name ?? 'Protocolo Desbloqueio',
			currency: params?.currency ?? 'BRL',
			...(params?.value != null ? { value: params.value } : {})
		});
	}
}

/** Back-compat (se existir algum uso legado). */
export function trackLeadSubmit(_profileId: string): void {
	trackGenerateLead('whatsapp');
}
