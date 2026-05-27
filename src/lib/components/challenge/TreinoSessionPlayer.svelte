<script lang="ts">
	import { onDestroy } from 'svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import TreinoExerciseMedia from '$lib/components/challenge/TreinoExerciseMedia.svelte';
	import type { WorkoutPlanDay } from '$lib/data/treino-types';
	import { treinoStore } from '$lib/stores/treino.store';
	import {
		advanceAfterTimer,
		initialSnapshot,
		skipRest,
		startSession,
		tickSecond,
		togglePause,
		type PlayerSnapshot
	} from '$lib/utils/treino-player-state';

	interface Props {
		open: boolean;
		day: WorkoutPlanDay | null;
		onClose: () => void;
		onComplete?: (sessionKey: string) => void;
		onExerciseRoundComplete?: (exerciseId: string) => void;
	}

	let { open, day, onClose, onComplete, onExerciseRoundComplete }: Props = $props();

	type SessionSlide =
		| { kind: 'roundIntro'; round: number }
		| { kind: 'work'; round: number; exerciseIndex: number }
		| { kind: 'restExercise'; round: number; exerciseIndex: number }
		| { kind: 'restRound'; round: number };

	let snapshot = $state<PlayerSnapshot>(initialSnapshot(3, 5));
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let msTickerId: ReturnType<typeof setInterval> | undefined;
	let lastMarkedWorkKey = $state<string | null>(null);
	let phaseEndAtMs = $state<number | null>(null);
	let pausedRemainingMs = $state<number | null>(null);
	let nowMs = $state(Date.now());

	function formatTimerMs(ms: number): string {
		const total = Math.max(0, Math.floor(ms));
		const minutes = Math.floor(total / 60000);
		const seconds = Math.floor((total % 60000) / 1000);
		const millis = total % 1000;
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`;
	}

	function clearMsTicker() {
		if (msTickerId !== undefined) clearInterval(msTickerId);
		msTickerId = undefined;
	}

	function startMsTicker() {
		clearMsTicker();
		msTickerId = setInterval(() => {
			nowMs = Date.now();
		}, 50);
	}

	const timerRemainingMs = $derived.by(() => {
		if (snapshot.phase === 'idle' && timing) return timing.exerciseSeconds * 1000;
		if (snapshot.phase === 'paused' && pausedRemainingMs !== null) return pausedRemainingMs;
		if (phaseEndAtMs !== null) return Math.max(0, phaseEndAtMs - nowMs);
		return snapshot.secondsLeft * 1000;
	});

	const timerDisplay = $derived(formatTimerMs(timerRemainingMs));

	const exercises = $derived(day?.exercises ?? []);
	const timing = $derived(day?.timing);
	const autoAdvance = $derived($treinoStore.progress.playerPrefs.autoAdvance);

	const slides = $derived.by(() => {
		if (!timing) return [] as SessionSlide[];
		return buildSessionSlides(timing.rounds, exercises.length);
	});

	const activeSlideIndex = $derived.by(() => slideIndexFromSnapshot(snapshot, slides));

	const isRestPhase = $derived(
		snapshot.phase === 'restExercise' ||
			snapshot.phase === 'restRound' ||
			(snapshot.phase === 'paused' &&
				(snapshot.pausedFrom === 'restExercise' || snapshot.pausedFrom === 'restRound'))
	);

	const statusLine = $derived.by(() => {
		if (snapshot.phase === 'idle') return 'Pronto para começar';
		if (snapshot.phase === 'complete') return 'Treino concluído';
		const phase = snapshot.phase === 'paused' ? snapshot.pausedFrom : snapshot.phase;
		if (phase === 'roundIntro') return `Volta ${snapshot.round} de ${snapshot.totalRounds}`;
		if (phase === 'restExercise') return 'Descanso entre exercícios';
		if (phase === 'restRound') return 'Descanso entre circuitos';
		return `Exercício ${snapshot.exerciseIndex + 1}/${snapshot.totalExercises} · Volta ${snapshot.round}/${snapshot.totalRounds}`;
	});

	function buildSessionSlides(totalRounds: number, totalExercises: number): SessionSlide[] {
		const list: SessionSlide[] = [];
		for (let round = 1; round <= totalRounds; round++) {
			list.push({ kind: 'roundIntro', round });
			for (let i = 0; i < totalExercises; i++) {
				list.push({ kind: 'work', round, exerciseIndex: i });
				if (i < totalExercises - 1) {
					list.push({ kind: 'restExercise', round, exerciseIndex: i });
				} else if (round < totalRounds) {
					list.push({ kind: 'restRound', round });
				}
			}
		}
		return list;
	}

	function slideIndexFromSnapshot(s: PlayerSnapshot, list: SessionSlide[]): number {
		const phase = s.phase === 'paused' ? (s.pausedFrom ?? s.phase) : s.phase;
		if (phase === 'idle' || s.phase === 'idle') return -1;
		if (phase === 'complete' || s.phase === 'complete') return list.length;

		return list.findIndex((slide) => {
			if (phase === 'roundIntro') return slide.kind === 'roundIntro' && slide.round === s.round;
			if (phase === 'work')
				return slide.kind === 'work' && slide.round === s.round && slide.exerciseIndex === s.exerciseIndex;
			if (phase === 'restExercise')
				return (
					slide.kind === 'restExercise' &&
					slide.round === s.round &&
					slide.exerciseIndex === s.exerciseIndex
				);
			if (phase === 'restRound') return slide.kind === 'restRound' && slide.round === s.round;
			return false;
		});
	}

	function workPhaseKey(round: number, exerciseIndex: number): string {
		return `${round}-${exerciseIndex}`;
	}

	function resetMarkTracking() {
		lastMarkedWorkKey = null;
	}

	const displaySlide = $derived.by((): SessionSlide | null => {
		if (snapshot.phase === 'idle') {
			return slides.find((s) => s.kind === 'work') ?? slides[0] ?? null;
		}
		if (activeSlideIndex >= 0) return slides[activeSlideIndex] ?? null;
		return null;
	});

	function nextStepTitleFromSlide(slide: SessionSlide | undefined): string | null {
		if (!slide) return null;
		switch (slide.kind) {
			case 'roundIntro':
				return `Volta ${slide.round}`;
			case 'work':
				return exercises[slide.exerciseIndex]?.active.name ?? 'Exercício';
			case 'restExercise':
				return 'Descanso';
			case 'restRound':
				return 'Descanso';
		}
	}

	const nextStepLabel = $derived.by((): string | null => {
		if (snapshot.phase === 'complete') return null;

		if (snapshot.phase === 'idle') {
			const firstWorkIdx = slides.findIndex((s) => s.kind === 'work');
			if (firstWorkIdx < 0) return null;
			return nextStepTitleFromSlide(slides[firstWorkIdx + 1]);
		}

		if (activeSlideIndex < 0) return null;
		return nextStepTitleFromSlide(slides[activeSlideIndex + 1]);
	});

	function slideLabel(slide: SessionSlide): string {
		switch (slide.kind) {
			case 'roundIntro':
				return `Volta ${slide.round}`;
			case 'work':
				return 'Exercício';
			case 'restExercise':
				return 'Descanso';
			case 'restRound':
				return 'Pausa do circuito';
		}
	}

	function clearTimer() {
		if (intervalId) clearInterval(intervalId);
		intervalId = undefined;
		clearMsTicker();
	}

	$effect(() => {
		snapshot.phase;
		snapshot.secondsLeft;
		snapshot.round;
		snapshot.exerciseIndex;

		if (snapshot.phase === 'idle' || snapshot.phase === 'complete') {
			phaseEndAtMs = null;
			pausedRemainingMs = null;
			clearMsTicker();
			return;
		}

		if (snapshot.phase === 'paused') {
			if (pausedRemainingMs === null && phaseEndAtMs !== null) {
				pausedRemainingMs = Math.max(0, phaseEndAtMs - Date.now());
			}
			clearMsTicker();
			return;
		}

		phaseEndAtMs = Date.now() + snapshot.secondsLeft * 1000;
		pausedRemainingMs = null;
		startMsTicker();
	});

	$effect(() => {
		if (!open) clearMsTicker();
	});

	function notifyExerciseWorkDone(prev: PlayerSnapshot) {
		if (prev.phase !== 'work' || !exercises.length) return;
		const key = workPhaseKey(prev.round, prev.exerciseIndex);
		if (lastMarkedWorkKey === key) return;
		lastMarkedWorkKey = key;
		const ex = exercises[prev.exerciseIndex];
		if (!ex) return;
		onExerciseRoundComplete?.(ex.active.id);
	}

	function onTimerFire() {
		if (!timing || snapshot.phase === 'paused') return;

		const prev = snapshot;
		let next = tickSecond(snapshot);

		if (next.secondsLeft === 0 && next.phase !== 'complete') {
			notifyExerciseWorkDone(prev);
			if (autoAdvance) {
				next = advanceAfterTimer(
					next,
					timing.exerciseSeconds,
					timing.restBetweenExercises,
					timing.restBetweenRounds
				);
			}
		}

		snapshot = next;

		if (snapshot.phase === 'complete' && day?.sessionKey) {
			clearTimer();
			onComplete?.(day.sessionKey);
		}
	}

	function handleStart() {
		if (!day || !timing) return;
		resetMarkTracking();
		snapshot = startSession(timing.rounds, exercises.length);
		clearTimer();
		intervalId = setInterval(onTimerFire, 1000);
	}

	function handlePause() {
		snapshot = togglePause(snapshot);
	}

	function handleSkip() {
		if (!timing) return;
		snapshot = skipRest(snapshot, timing.exerciseSeconds, timing.restBetweenRounds);
	}

	function handleNext() {
		if (!timing) return;
		const prev = snapshot;
		if (prev.phase === 'work') notifyExerciseWorkDone(prev);
		snapshot = advanceAfterTimer(
			snapshot,
			timing.exerciseSeconds,
			timing.restBetweenExercises,
			timing.restBetweenRounds
		);
		if (snapshot.phase === 'complete' && day?.sessionKey) {
			clearTimer();
			onComplete?.(day.sessionKey);
		}
	}

	function handleClose() {
		clearTimer();
		resetMarkTracking();
		if (day && timing) {
			snapshot = initialSnapshot(timing.rounds, exercises.length);
		}
		onClose();
	}

	$effect(() => {
		if (!open) {
			clearTimer();
			resetMarkTracking();
			if (day && timing) snapshot = initialSnapshot(timing.rounds, exercises.length);
		}
	});

	onDestroy(clearTimer);
</script>

<BottomSheet open={open} onClose={handleClose} heightPercent={90}>
	{#if day?.isWorkoutDay && timing}
		<div
			class="flex min-h-0 flex-col {snapshot.phase === 'idle'
				? 'h-[calc(90dvh-12rem)]'
				: snapshot.phase === 'complete'
					? 'min-h-[50vh]'
					: 'h-[calc(90dvh-8rem)]'}"
		>
			{#if snapshot.phase === 'idle'}
				<div class="shrink-0 border-b border-line/15 pb-4">
					<p class="text-center text-[11px] font-medium uppercase tracking-wide text-muted">
						Treino {day.workoutLetter} · Fase {day.phase}
					</p>
					<p class="mt-3 text-center font-mono text-4xl font-extrabold tabular-nums tracking-tight text-heading">
						{formatTimerMs(timing.exerciseSeconds * 1000)}
					</p>
					<div class="mt-4 flex justify-center gap-6 text-center text-[11px] text-muted">
						<span>{timing.restBetweenExercises}s descanso</span>
						<span>{timing.rounds} circuitos</span>
					</div>
				</div>

				<div class="flex flex-1 flex-col justify-center py-4">
					{#if displaySlide}
						{@render stepCard(displaySlide, false)}
						{#if nextStepLabel}
							{@render nextStepPreview(nextStepLabel)}
						{/if}
					{/if}
				</div>
			{:else if snapshot.phase === 'complete'}
				<div class="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
					<div class="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-bg">
						<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M5 12l5 5L20 7" />
						</svg>
					</div>
					<h3 class="text-lg font-bold text-heading">Parabéns!</h3>
					<p class="text-sm text-body">Você concluiu o treino do dia.</p>
					<button
						type="button"
						onclick={handleClose}
						class="mt-4 h-11 w-full max-w-xs rounded-full bg-accent text-sm font-bold text-bg"
					>
						Fechar
					</button>
				</div>
			{:else}
				<div class="shrink-0 border-b border-line/15 pb-3" aria-live="polite">
					<p class="text-center text-[11px] font-medium text-muted">{statusLine}</p>

					<p class="mt-1 text-center font-mono text-4xl font-extrabold tabular-nums tracking-tight text-heading">
						{timerDisplay}
					</p>
					<p class="text-center text-[11px] text-muted">min : seg : ms</p>

					<div class="mt-3 flex items-center justify-center gap-2">
						<button
							type="button"
							onclick={handlePause}
							class="h-9 rounded-full border border-line/60 px-4 text-xs font-semibold text-heading transition-colors active:bg-surface-2"
						>
							{snapshot.phase === 'paused' ? 'Continuar' : 'Pausar'}
						</button>
						{#if isRestPhase}
							<button
								type="button"
								onclick={handleSkip}
								class="h-9 rounded-full border border-line/60 px-4 text-xs font-semibold text-heading transition-colors active:bg-surface-2"
							>
								Pular
							</button>
						{/if}
						{#if !autoAdvance}
							<button
								type="button"
								onclick={handleNext}
								class="h-9 rounded-full bg-accent px-4 text-xs font-bold text-bg transition-colors active:opacity-90"
							>
								Próximo
							</button>
						{/if}
					</div>

					<label class="mt-2 flex items-center justify-center gap-2 text-[11px] text-muted">
						<input
							type="checkbox"
							class="accent-accent"
							checked={autoAdvance}
							onchange={(e) => treinoStore.setPlayerPrefs({ autoAdvance: e.currentTarget.checked })}
						/>
						Avanço automático
					</label>
				</div>

				<div class="flex min-h-0 flex-1 flex-col justify-center py-2">
					{#if displaySlide}
						{@render stepCard(displaySlide, true)}
					{/if}
					{#if nextStepLabel}
						{@render nextStepPreview(nextStepLabel)}
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		{#if day?.isWorkoutDay && timing && snapshot.phase === 'idle'}
			<button
				type="button"
				onclick={handleStart}
				class="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold text-bg transition-all active:scale-[0.98]"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M8 5v14l11-7z" />
				</svg>
				Começar agora
			</button>
		{/if}
	{/snippet}
</BottomSheet>

{#snippet nextStepPreview(label: string)}
	<div class="mt-4 text-center">
		<div class="flex items-center gap-3">
			<span class="h-px flex-1 bg-line/50" aria-hidden="true"></span>
			<p class="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">Próximo passo</p>
			<span class="h-px flex-1 bg-line/50" aria-hidden="true"></span>
		</div>
		<p class="mt-2 text-sm font-semibold text-heading">{label}</p>
	</div>
{/snippet}

{#snippet stepCard(slide: SessionSlide, showRound: boolean)}
	{@const ex = slide.kind === 'work' ? exercises[slide.exerciseIndex] : null}
	<article
		class="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-surface p-4 shadow-sm transition-all duration-300"
	>
		<p class="text-[10px] font-semibold uppercase tracking-wide text-accent">
			{slideLabel(slide)}
			{#if showRound && (slide.kind === 'work' || slide.kind === 'roundIntro')}
				· Volta {slide.round}/{snapshot.totalRounds}
			{/if}
		</p>

		{#if ex}
			<TreinoExerciseMedia name={ex.active.name} imageUrl={ex.active.imageUrl} size="lg" />
			<h3 class="text-lg font-bold text-heading">{ex.active.name}</h3>
		{:else if slide.kind === 'roundIntro'}
			<div class="flex aspect-video w-full items-center justify-center rounded-xl bg-accent-soft/60">
				<p class="text-sm font-semibold text-accent">Prepare a volta {slide.round}</p>
			</div>
		{:else}
			<div
				class="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl bg-line/15"
			>
				<svg
					class="h-8 w-8 text-muted"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					aria-hidden="true"
				>
					<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
					<path d="M12 6v6l4 2" />
				</svg>
				<p class="text-sm font-medium text-body">
					{slide.kind === 'restRound' ? 'Descanso entre circuitos' : 'Descanso entre exercícios'}
				</p>
				<p class="text-xs text-muted">
					{slide.kind === 'restRound'
						? `${Math.floor(timing!.restBetweenRounds / 60)} min`
						: `${timing!.restBetweenExercises}s`}
				</p>
			</div>
		{/if}
	</article>
{/snippet}
