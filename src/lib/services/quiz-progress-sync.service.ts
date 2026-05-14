import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { quizStore } from '$lib/stores/quiz.store';
import { postQuizStore } from '$lib/stores/post-quiz.store';
import { sessionStore } from '$lib/stores/session.store';
import { syncQuizProgress } from '$lib/services/lead.service';

/** Debounce após o primeiro envio (o primeiro sync é imediato para não “sumir” no teste local). */
const DEBOUNCE_MS = 600;

let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let pendingAfterFlight = false;
let stopped = false;
let unsub: (() => void) | null = null;
/** Primeira janela após ligar o sync: envia logo, depois usa debounce. */
let bootstrapped = false;

function clearTimer() {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
}

function buildUtm() {
	const s = get(sessionStore);
	return Object.keys(s.utm).length > 0 ? s.utm : undefined;
}

async function runOneSync(): Promise<void> {
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return;
	const session = get(sessionStore);
	const post = get(postQuizStore);
	const postName = post.name.trim();
	const postWa = post.whatsapp.replace(/\s/g, '').trim();
	await syncQuizProgress({
		funnelSessionId: q.funnelSessionId,
		scores: q.scores,
		answers: q.answers,
		visitedQuestions: q.visitedQuestions,
		startedAt: q.startedAt,
		completedAt: q.completedAt,
		utm: buildUtm(),
		offer: session.offer,
		postQuizName: postName || undefined,
		postQuizWhatsapp: postWa || undefined
	});
}

async function executeFlush(): Promise<void> {
	if (stopped) return;
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return;
	inFlight = true;
	try {
		try {
			await runOneSync();
			while (!stopped && pendingAfterFlight) {
				pendingAfterFlight = false;
				await runOneSync();
			}
		} catch (e) {
			// Melhor esforço na UI; em dev mostra o motivo (env, migração, rede).
			if (import.meta.env.DEV) {
				const msg = e instanceof Error ? e.message : String(e);
				console.warn('[quiz-progress-sync] falhou (ver .env Supabase e migrações):', msg);
			}
		}
	} finally {
		inFlight = false;
	}
}

function schedule(): void {
	if (stopped) return;
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return;

	if (inFlight) {
		pendingAfterFlight = true;
		return;
	}
	clearTimer();
	const delay = bootstrapped ? DEBOUNCE_MS : 0;
	bootstrapped = true;
	timer = setTimeout(() => {
		timer = null;
		void executeFlush();
	}, delay);
}

/** Inicia sync em background nas rotas /plan (debounce + fila após request em voo). */
export function startQuizProgressSync(): void {
	if (!browser) return;
	stopQuizProgressSync();
	stopped = false;
	bootstrapped = false;
	unsub = quizStore.subscribe(() => schedule());
}

/** Para timers e subscription (ex.: ao sair do /plan). */
export function stopQuizProgressSync(): void {
	stopped = true;
	clearTimer();
	unsub?.();
	unsub = null;
	pendingAfterFlight = false;
}

/** Último envio ao sair de /plan (ex.: quiz completo → /carregando) antes do debounce disparar. */
export async function flushQuizProgressNow(): Promise<void> {
	if (!browser) return;
	clearTimer();
	pendingAfterFlight = false;
	await executeFlush();
}

// --- Rotas (post-quiz): mesmo funnel_session_id + nome/WhatsApp do pós-quiz ---

const PQ_DEBOUNCE_MS = 700;
let pqTimer: ReturnType<typeof setTimeout> | null = null;
let pqBootstrapped = false;
let pqUnsubQuiz: (() => void) | null = null;
let pqUnsubPost: (() => void) | null = null;

function clearPqTimer() {
	if (pqTimer) {
		clearTimeout(pqTimer);
		pqTimer = null;
	}
}

function schedulePostQuizFunnel(): void {
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return;
	clearPqTimer();
	const delay = pqBootstrapped ? PQ_DEBOUNCE_MS : 0;
	pqBootstrapped = true;
	pqTimer = setTimeout(() => {
		pqTimer = null;
		void flushPostQuizFunnelOnce();
	}, delay);
}

async function flushPostQuizFunnelOnce(): Promise<void> {
	try {
		await runOneSync();
	} catch (e) {
		if (import.meta.env.DEV) {
			console.warn('[post-quiz-funnel-sync]', e instanceof Error ? e.message : e);
		}
	}
}

/** Em /carregando, /nome, /whatsapp, /metabolismo, /results: mantém respostas + nome + WhatsApp no Supabase. */
export function startPostQuizFunnelSync(): void {
	if (!browser) return;
	stopPostQuizFunnelSync();
	pqBootstrapped = false;
	pqUnsubQuiz = quizStore.subscribe(() => schedulePostQuizFunnel());
	pqUnsubPost = postQuizStore.subscribe(() => schedulePostQuizFunnel());
}

export function stopPostQuizFunnelSync(): void {
	clearPqTimer();
	pqUnsubQuiz?.();
	pqUnsubQuiz = null;
	pqUnsubPost?.();
	pqUnsubPost = null;
	pqBootstrapped = false;
}
