import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { quizStore } from '$lib/stores/quiz.store';
import { postQuizStore } from '$lib/stores/post-quiz.store';
import {
	buildQuizProgressPayload,
	syncQuizProgress,
	syncQuizProgressBeacon,
	type QuizProgressPayload
} from '$lib/services/lead.service';

/** Sync a cada N perguntas visitadas (perfil balanceado). */
const SYNC_EVERY_N_QUESTIONS = 5;
/** Timer de sync se houver mudanças pendentes. */
const SYNC_INTERVAL_MS = 90_000;
/** Debounce para nome/WhatsApp no pós-quiz. */
const POST_QUIZ_TEXT_DEBOUNCE_MS = 1_500;

let inFlight = false;
let pendingAfterFlight = false;
let stopped = true;
let dirty = false;
let lastSyncedHash = '';
let lastMilestoneSynced = 0;

let intervalId: ReturnType<typeof setInterval> | null = null;
let unsubQuiz: (() => void) | null = null;
let unsubPost: (() => void) | null = null;
let postQuizTextTimer: ReturnType<typeof setTimeout> | null = null;
let pagehideRegistered = false;

function clearIntervalTimer() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
}

function clearPostQuizTextTimer() {
	if (postQuizTextTimer) {
		clearTimeout(postQuizTextTimer);
		postQuizTextTimer = null;
	}
}

function payloadHash(payload: QuizProgressPayload): string {
	return JSON.stringify({
		answers: payload.answers,
		scores: payload.scores,
		visited: payload.visitedQuestions,
		completedAt: payload.completedAt,
		currentQuestionId: payload.currentQuestionId,
		postQuizName: payload.postQuizName ?? '',
		postQuizWhatsapp: payload.postQuizWhatsapp ?? '',
		offerRevealed: payload.offerRevealed === true
	});
}

function markDirty() {
	dirty = true;
}

function shouldSkipSync(payload: QuizProgressPayload, force: boolean): boolean {
	if (force) return false;
	return payloadHash(payload) === lastSyncedHash;
}

function isQuestionMilestone(visitedCount: number): boolean {
	return visitedCount === 1 || (visitedCount > 0 && visitedCount % SYNC_EVERY_N_QUESTIONS === 0);
}

function onQuizStoreChange() {
	if (stopped) return;
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return;

	markDirty();
	const count = q.visitedQuestions.length;
	if (count > lastMilestoneSynced && isQuestionMilestone(count)) {
		void requestSync(false);
	}
}

function onPostQuizStoreChange() {
	if (stopped) return;
	const q = get(quizStore);
	if (!q.startedAt || !q.funnelSessionId) return;

	markDirty();
	clearPostQuizTextTimer();
	postQuizTextTimer = setTimeout(() => {
		postQuizTextTimer = null;
		void requestSync(false);
	}, POST_QUIZ_TEXT_DEBOUNCE_MS);
}

function onIntervalTick() {
	if (stopped || !dirty) return;
	void requestSync(false);
}

async function runOneSync(force: boolean): Promise<boolean> {
	const payload = buildQuizProgressPayload();
	if (!payload) return false;
	if (shouldSkipSync(payload, force)) {
		dirty = false;
		return true;
	}

	await syncQuizProgress(payload);
	lastSyncedHash = payloadHash(payload);
	lastMilestoneSynced = payload.visitedQuestions?.length ?? 0;
	dirty = false;
	return true;
}

async function executeFlush(force: boolean): Promise<void> {
	if (stopped) return;
	if (!buildQuizProgressPayload()) return;

	inFlight = true;
	try {
		try {
			await runOneSync(force);
			while (!stopped && pendingAfterFlight) {
				pendingAfterFlight = false;
				await runOneSync(true);
			}
		} catch (e) {
			if (import.meta.env.DEV) {
				const msg = e instanceof Error ? e.message : String(e);
				console.warn('[quiz-progress-sync] falhou (ver .env Supabase e migrações):', msg);
			}
		}
	} finally {
		inFlight = false;
	}
}

function requestSync(force: boolean): void {
	if (stopped) return;
	if (!buildQuizProgressPayload()) return;

	if (inFlight) {
		pendingAfterFlight = true;
		return;
	}
	void executeFlush(force);
}

function beaconSync(): void {
	if (stopped) return;
	const payload = buildQuizProgressPayload();
	if (!payload) return;
	if (shouldSkipSync(payload, false)) return;
	syncQuizProgressBeacon(payload);
}

function ensurePagehideListeners() {
	if (!browser || pagehideRegistered) return;
	pagehideRegistered = true;
	window.addEventListener('pagehide', beaconSync);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') beaconSync();
	});
}

function startCoreSync(includePostQuiz: boolean) {
	if (!browser) return;

	clearIntervalTimer();
	clearPostQuizTextTimer();
	unsubQuiz?.();
	unsubPost?.();
	unsubQuiz = null;
	unsubPost = null;

	stopped = false;
	dirty = false;
	lastSyncedHash = '';
	lastMilestoneSynced = 0;
	pendingAfterFlight = false;

	ensurePagehideListeners();
	unsubQuiz = quizStore.subscribe(onQuizStoreChange);
	if (includePostQuiz) {
		unsubPost = postQuizStore.subscribe(onPostQuizStoreChange);
	}

	intervalId = setInterval(onIntervalTick, SYNC_INTERVAL_MS);
}

function stopCoreSync() {
	stopped = true;
	clearIntervalTimer();
	clearPostQuizTextTimer();
	unsubQuiz?.();
	unsubPost?.();
	unsubQuiz = null;
	unsubPost = null;
	pendingAfterFlight = false;
}

/** Inicia sync nas rotas /plan (marcos + timer 90s + beacon). */
export function startQuizProgressSync(): void {
	stopQuizProgressSync();
	startCoreSync(false);
}

/** Para timers e subscription (ex.: ao sair do /plan). */
export function stopQuizProgressSync(): void {
	stopCoreSync();
}

/** Último envio ao sair de /plan antes do timer disparar. */
export async function flushQuizProgressNow(): Promise<void> {
	if (!browser) return;
	clearPostQuizTextTimer();
	pendingAfterFlight = false;
	await executeFlush(true);
}

/** Pós-quiz: respostas + nome + WhatsApp no Supabase. */
export function startPostQuizFunnelSync(): void {
	if (!browser) return;
	stopPostQuizFunnelSync();
	startCoreSync(true);
}

export function stopPostQuizFunnelSync(): void {
	stopCoreSync();
}

/** Força sync imediato (ex.: quiz complete). */
export function flushQuizProgressImmediate(): void {
	requestSync(true);
}
