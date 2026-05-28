<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { get } from 'svelte/store';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import TreinoExerciseMedia from '$lib/components/challenge/TreinoExerciseMedia.svelte';
	import type { WorkoutPlanDay } from '$lib/data/treino-types';
	import { treinoStore } from '$lib/stores/treino.store';
	import {
		ORGANIZE_SECONDS,
		advanceAfterTimer,
		initialSnapshot,
		resumeAtExercise,
		skipRest,
		startSession,
		tickSecond,
		togglePause,
		type PlayerSnapshot
	} from '$lib/utils/treino-player-state';
	import { getNextExerciseIndex } from '$lib/utils/treino-circuit-progress';

	interface Props {
		open: boolean;
		day: WorkoutPlanDay | null;
		sessionKey: string;
		onClose: () => void;
		onComplete?: (sessionKey: string) => void;
		onExerciseRoundComplete?: (exerciseId: string) => void;
	}

	type NextStepInfo = {
		title: string;
		durationLabel: string;
		imageUrl?: string;
		name?: string;
	};

	let { open, day, sessionKey, onClose, onComplete, onExerciseRoundComplete }: Props = $props();

	type SessionSlide =
		| { kind: 'roundIntro'; round: number }
		| { kind: 'exerciseIntro'; round: number; exerciseIndex: number }
		| { kind: 'work'; round: number; exerciseIndex: number }
		| { kind: 'restExercise'; round: number; exerciseIndex: number }
		| { kind: 'restRound'; round: number };

	let snapshot = $state<PlayerSnapshot>(initialSnapshot(3, 5));
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let msTickerId: ReturnType<typeof setInterval> | undefined;
	let processingTick = false;
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
		}, 100);
	}

	const exercises = $derived(day?.exercises ?? []);
	const timing = $derived(day?.timing);
	const autoAdvance = $derived($treinoStore.progress.playerPrefs.autoAdvance);

	const effectivePhase = $derived(
		snapshot.phase === 'paused' ? (snapshot.pausedFrom ?? snapshot.phase) : snapshot.phase
	);

	const isOrganizePhase = $derived(effectivePhase === 'exerciseIntro');

	const timerRemainingMs = $derived.by(() => {
		if (snapshot.phase === 'idle' && timing) return timing.exerciseSeconds * 1000;
		if (snapshot.phase === 'paused' && pausedRemainingMs !== null) return pausedRemainingMs;
		if (phaseEndAtMs !== null) return Math.max(0, phaseEndAtMs - nowMs);
		return snapshot.secondsLeft * 1000;
	});

	const timerDisplay = $derived(formatTimerMs(timerRemainingMs));

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

	function buildSessionSlides(totalRounds: number, totalExercises: number): SessionSlide[] {
		const list: SessionSlide[] = [];
		for (let round = 1; round <= totalRounds; round++) {
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
			if (phase === 'exerciseIntro')
				return (
					slide.kind === 'work' && slide.round === s.round && slide.exerciseIndex === s.exerciseIndex
				);
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

	function hasSessionProgress(): boolean {
		if (!day?.exercises || !sessionKey) return false;
		const progress = get(treinoStore).progress;
		if (progress.completedSessions.includes(sessionKey)) return true;
		const sessionRounds = progress.exerciseRoundsBySession[sessionKey];
		if (!sessionRounds) return false;
		return Object.values(sessionRounds).some((n) => n > 0);
	}

	function computeResumeSnapshot(): PlayerSnapshot | null {
		if (!day?.exercises || !timing || !sessionKey) return null;
		if (!hasSessionProgress()) return null;

		const progress = get(treinoStore).progress;
		const rounds = day.exercises.map((ex) =>
			treinoStore.getExerciseRoundsDone(progress, sessionKey, ex.active.id)
		);
		const nextIdx = getNextExerciseIndex(day.exercises.length, rounds, timing.rounds);
		if (nextIdx === null) return null;
		const round = (rounds[nextIdx] ?? 0) + 1;
		return resumeAtExercise(nextIdx, round, timing.rounds, day.exercises.length, timing.exerciseSeconds);
	}

	function startSessionTimer() {
		clearTimer();
		intervalId = setInterval(onTimerFire, 1000);
	}

	function beginFreshSession() {
		if (!timing) return;
		snapshot = startSession(timing.rounds, exercises.length);
		startSessionTimer();
	}

	const displaySlide = $derived.by((): SessionSlide | null => {
		if (snapshot.phase === 'idle') {
			return slides.find((s) => s.kind === 'work') ?? slides[0] ?? null;
		}
		if (isOrganizePhase) {
			return (
				slides.find(
					(s) =>
						s.kind === 'work' &&
						s.round === snapshot.round &&
						s.exerciseIndex === snapshot.exerciseIndex
				) ?? null
			);
		}
		if (activeSlideIndex >= 0) return slides[activeSlideIndex] ?? null;
		return null;
	});

	function nextStepFromSlide(slide: SessionSlide | undefined): NextStepInfo | null {
		if (!slide || !timing) return null;
		switch (slide.kind) {
			case 'roundIntro':
				return {
					title: `Volta ${slide.round}`,
					durationLabel: `${ORGANIZE_SECONDS}s`
				};
			case 'exerciseIntro':
				return null;
			case 'work': {
				const ex = exercises[slide.exerciseIndex];
				return {
					title: ex?.active.name ?? 'Exercício',
					durationLabel: `${timing.exerciseSeconds}s`,
					imageUrl: ex?.active.imageUrl,
					name: ex?.active.name
				};
			}
			case 'restExercise':
				return {
					title: 'Descanso',
					durationLabel: `${timing.restBetweenExercises}s`
				};
			case 'restRound':
				return {
					title: 'Descanso',
					durationLabel:
						timing.restBetweenRounds >= 60
							? `${Math.floor(timing.restBetweenRounds / 60)} min`
							: `${timing.restBetweenRounds}s`
				};
		}
	}

	const upcomingSteps = $derived.by((): NextStepInfo[] => {
		if (snapshot.phase === 'complete') return [];

		let startIndex = -1;
		if (snapshot.phase === 'idle' || isOrganizePhase) {
			const firstWorkIdx = slides.findIndex((s) => s.kind === 'work');
			startIndex = firstWorkIdx < 0 ? -1 : firstWorkIdx + 1;
		} else if (activeSlideIndex >= 0) {
			startIndex = activeSlideIndex + 1;
		}

		if (startIndex < 0) return [];

		const list: NextStepInfo[] = [];
		for (let i = startIndex; i < slides.length; i++) {
			const step = nextStepFromSlide(slides[i]);
			if (step) list.push(step);
		}
		return list;
	});

	const sequenceLine = $derived.by(() => {
		const totalEx = snapshot.totalExercises;
		const totalRounds = snapshot.totalRounds;

		if (snapshot.phase === 'idle') {
			return `Sequência 1/${totalEx} · Circuito 1/${totalRounds}`;
		}
		if (snapshot.phase === 'complete') {
			return `Sequência ${totalEx}/${totalEx} · Circuito ${totalRounds}/${totalRounds}`;
		}

		const slide = displaySlide;
		if (!slide) {
			return `Sequência ${snapshot.exerciseIndex + 1}/${totalEx} · Circuito ${snapshot.round}/${totalRounds}`;
		}

		switch (slide.kind) {
			case 'roundIntro':
				return `Sequência 1/${totalEx} · Circuito ${slide.round}/${totalRounds}`;
			case 'exerciseIntro':
				return `Sequência ${slide.exerciseIndex + 1}/${totalEx} · Circuito ${slide.round}/${totalRounds}`;
			case 'work':
				return `Sequência ${slide.exerciseIndex + 1}/${totalEx} · Circuito ${slide.round}/${totalRounds}`;
			case 'restExercise':
				return `Sequência ${Math.min(slide.exerciseIndex + 2, totalEx)}/${totalEx} · Circuito ${slide.round}/${totalRounds}`;
			case 'restRound':
				return `Sequência 1/${totalEx} · Circuito ${Math.min(slide.round + 1, totalRounds)}/${totalRounds}`;
		}
	});

	const currentTitle = $derived.by(() => {
		if (isRestPhase) return 'Descanso';
		if (displaySlide?.kind === 'roundIntro') return `Volta ${displaySlide.round}`;
		if (isOrganizePhase || displaySlide?.kind === 'work') {
			const idx = isOrganizePhase ? snapshot.exerciseIndex : displaySlide!.exerciseIndex;
			return exercises[idx]?.active.name ?? 'Exercício';
		}
		const first = exercises[0];
		return first?.active.name ?? 'Exercício';
	});

	const currentExerciseMedia = $derived.by(() => {
		if (isOrganizePhase || displaySlide?.kind === 'work') {
			const idx = isOrganizePhase ? snapshot.exerciseIndex : displaySlide!.exerciseIndex;
			const ex = exercises[idx];
			return ex ? { name: ex.active.name, imageUrl: ex.active.imageUrl } : null;
		}
		if (snapshot.phase === 'idle') {
			const ex = exercises[0];
			return ex ? { name: ex.active.name, imageUrl: ex.active.imageUrl } : null;
		}
		return null;
	});

	function snapshotFromSlide(slide: SessionSlide): PlayerSnapshot {
		const base = {
			totalRounds: snapshot.totalRounds,
			totalExercises: snapshot.totalExercises
		};
		if (!timing) return { ...snapshot, ...base };

		switch (slide.kind) {
			case 'roundIntro':
				return {
					...base,
					phase: 'roundIntro',
					round: slide.round,
					exerciseIndex: 0,
					secondsLeft: ORGANIZE_SECONDS
				};
			case 'exerciseIntro':
				return {
					...base,
					phase: 'work',
					round: slide.round,
					exerciseIndex: slide.exerciseIndex,
					secondsLeft: timing.exerciseSeconds
				};
			case 'work':
				return {
					...base,
					phase: 'work',
					round: slide.round,
					exerciseIndex: slide.exerciseIndex,
					secondsLeft: timing.exerciseSeconds
				};
			case 'restExercise':
				return {
					...base,
					phase: 'restExercise',
					round: slide.round,
					exerciseIndex: slide.exerciseIndex,
					secondsLeft: timing.restBetweenExercises
				};
			case 'restRound':
				return {
					...base,
					phase: 'restRound',
					round: slide.round,
					exerciseIndex: 0,
					secondsLeft: timing.restBetweenRounds
				};
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
		const ex = exercises[prev.exerciseIndex];
		if (!ex) return;
		onExerciseRoundComplete?.(ex.active.id);
	}

	function onTimerFire() {
		if (!timing || snapshot.phase === 'paused') return;
		if (processingTick) return;
		processingTick = true;

		const prev = snapshot;
		let next = tickSecond(snapshot);

		if (prev.secondsLeft > 0 && next.secondsLeft === 0 && next.phase !== 'complete') {
			if (prev.phase === 'work') notifyExerciseWorkDone(prev);
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
		processingTick = false;

		if (snapshot.phase === 'complete') {
			clearTimer();
			onComplete?.(sessionKey);
		}
	}

	function handleStart() {
		if (!day || !timing) return;
		beginFreshSession();
	}

	function handlePause() {
		snapshot = togglePause(snapshot);
	}

	function handleBack() {
		if (snapshot.phase === 'idle') return;
		if (activeSlideIndex <= 0) {
			handleClose();
			return;
		}
		const prevSlide = slides[activeSlideIndex - 1];
		if (!prevSlide) return;
		snapshot = snapshotFromSlide(prevSlide);
	}

	function handleNext() {
		if (snapshot.phase === 'idle') {
			beginFreshSession();
			return;
		}
		if (!timing) return;
		const prev = snapshot;
		// Only notify if the timer hasn't already fired for this phase (secondsLeft > 0 means timer hasn't expired yet)
		if (prev.phase === 'work' && prev.secondsLeft > 0) notifyExerciseWorkDone(prev);
		if (isRestPhase) {
			snapshot = skipRest(snapshot, timing.exerciseSeconds, timing.restBetweenRounds);
		} else {
			snapshot = advanceAfterTimer(
				snapshot,
				timing.exerciseSeconds,
				timing.restBetweenExercises,
				timing.restBetweenRounds
			);
		}
		if (snapshot.phase === 'complete') {
			clearTimer();
			onComplete?.(sessionKey);
		}
	}

	function handleClose() {
		clearTimer();
		if (day && timing) {
			snapshot = initialSnapshot(timing.rounds, exercises.length);
		}
		onClose();
	}

	function toggleAutoAdvance() {
		treinoStore.setPlayerPrefs({ autoAdvance: !autoAdvance });
	}

	$effect(() => {
		// Track only `open` — use untrack for everything else to avoid mid-session resets
		if (!open) {
			untrack(() => {
				clearTimer();
				if (day && timing) snapshot = initialSnapshot(timing.rounds, exercises.length);
			});
			return;
		}
		untrack(() => {
			if (!day || !timing) return;
			const resume = computeResumeSnapshot();
			snapshot = resume ?? initialSnapshot(timing.rounds, exercises.length);
		});
	});

	onDestroy(clearTimer);
</script>

<BottomSheet open={open} onClose={handleClose} heightPercent={90} scrollable={false} contentFlush noShadow>
	{#if day && timing && exercises.length > 0}
		<div class="-mb-[calc(1.5rem+env(safe-area-inset-bottom))] flex h-full min-h-0 flex-col overflow-hidden">
			{#if snapshot.phase === 'complete'}
				<div class="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
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
				<div class="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-challenge-progress-track">
					<div
						class="relative z-[1] flex shrink-0 flex-col rounded-b-[28px] bg-white px-6 pb-3 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
					>
						<p class="shrink-0 text-center text-xs font-medium text-muted">
							Treino {day.workoutLetter} · Fase {day.phase}
						</p>

						<div class="flex shrink-0 justify-center">
							{#if currentExerciseMedia && !isRestPhase}
								<TreinoExerciseMedia
									name={currentExerciseMedia.name}
									imageUrl={currentExerciseMedia.imageUrl}
									size="player"
								/>
							{:else}
								<div
									class="mx-auto flex aspect-square w-[min(11.75rem,22dvh,78vw)] flex-col items-center justify-center rounded-challenge bg-white"
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
								</div>
							{/if}
						</div>

						<div class="shrink-0 text-center">
							<h3 class="truncate px-1 text-base font-bold text-heading">{currentTitle}</h3>
							{#if isOrganizePhase}
								<p class="mt-0.5 text-xs font-medium text-accent">Organize-se ({ORGANIZE_SECONDS}s)</p>
							{/if}

							<p
								class="mt-1 text-center font-mono text-[clamp(1.5rem,8vw,2.25rem)] font-extrabold tabular-nums leading-none tracking-tight text-heading"
								aria-live="polite"
							>
								{timerDisplay}
							</p>

							<p class="mt-1 text-xs text-muted">{sequenceLine}</p>
						</div>
					</div>

					<div class="relative flex min-h-0 flex-1 flex-col">
						{#if upcomingSteps.length}
							<div
								class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-3 pb-[calc(11rem+env(safe-area-inset-bottom))]"
							>
								<p class="text-center text-xs text-muted">Seu próximo passo</p>
								<div class="mt-2 flex flex-col gap-2">
									{#each upcomingSteps as step, index (index)}
										<div class="flex min-w-0 items-center gap-2.5 rounded-xl bg-white px-2.5 py-2">
											{#if step.name}
												<TreinoExerciseMedia
													name={step.name}
													imageUrl={step.imageUrl}
													size="sm"
												/>
											{:else}
												<div
													class="flex h-12 w-12 shrink-0 items-center justify-center rounded-challenge bg-line/20"
												>
													<svg
														class="h-5 w-5 text-muted"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="1.5"
														aria-hidden="true"
													>
														<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
														<path d="M12 6v6l4 2" />
													</svg>
												</div>
											{/if}
											<div class="min-w-0 flex-1">
												<p class="truncate text-xs font-bold text-heading">{step.title}</p>
												<p class="text-[11px] text-muted">{step.durationLabel}</p>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<div class="pointer-events-none absolute inset-x-0 bottom-0 z-20 w-full shrink-0">
							<div
								class="pointer-events-auto mb-3 flex items-center justify-center gap-3"
								aria-label="Controles do treino"
							>
								<button
									type="button"
									onclick={handleBack}
									disabled={snapshot.phase === 'idle'}
									class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[5px] border-white bg-accent text-bg shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
									aria-label="Voltar"
								>
									<svg
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M15 18l-6-6 6-6" />
									</svg>
								</button>
								<button
									type="button"
									onclick={snapshot.phase === 'idle' ? handleStart : handlePause}
									class="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-accent text-bg shadow-[0_4px_20px_rgba(0,0,0,0.14)] transition-transform active:scale-95 {snapshot.phase ===
										'idle'
											? 'treino-play-idle'
											: ''}"
									aria-label={snapshot.phase === 'idle'
										? 'Começar'
										: snapshot.phase === 'paused'
											? 'Continuar'
											: 'Pausar'}
								>
									{#if snapshot.phase === 'idle' || snapshot.phase === 'paused'}
										<svg
											class="relative z-[1] ml-1 h-9 w-9"
											viewBox="0 0 24 24"
											fill="currentColor"
											aria-hidden="true"
										>
											<path d="M8 5v14l11-7z" />
										</svg>
									{:else}
										<svg
											class="relative z-[1] h-8 w-8"
											viewBox="0 0 24 24"
											fill="currentColor"
											aria-hidden="true"
										>
											<rect x="6" y="5" width="4" height="14" rx="1" />
											<rect x="14" y="5" width="4" height="14" rx="1" />
										</svg>
									{/if}
								</button>
								<button
									type="button"
									onclick={handleNext}
									class="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[5px] border-white bg-accent text-bg shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-transform active:scale-95"
									aria-label="Avançar"
								>
									<svg
										class="h-5 w-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2.5"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M9 18l6-6-6-6" />
									</svg>
								</button>
							</div>

							<div
								class="bg-white px-6 py-3 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
							>
								<div class="flex items-center justify-center gap-2.5">
									<button
										type="button"
										role="switch"
										aria-checked={autoAdvance}
										aria-label="Avanço automático"
										onclick={toggleAutoAdvance}
										class="relative shrink-0 h-6 w-10 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 {autoAdvance
											? 'bg-accent'
											: 'bg-line/60'}"
									>
										<span
											class="pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out {autoAdvance
												? 'translate-x-4'
												: 'translate-x-0'}"
											aria-hidden="true"
										></span>
									</button>
									<span
										class="text-[11px] {autoAdvance ? 'font-medium text-accent' : 'text-muted'}"
									>
										Avanço automático
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</BottomSheet>

<style>
	.treino-play-idle {
		animation: treino-play-pulse 2s ease-in-out infinite;
	}

	.treino-play-idle::after {
		content: '';
		position: absolute;
		inset: -20%;
		border-radius: inherit;
		background: linear-gradient(
			115deg,
			transparent 38%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 62%
		);
		animation: treino-play-shimmer 2.2s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes treino-play-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.08);
		}
	}

	@keyframes treino-play-shimmer {
		0% {
			transform: translateX(-120%) rotate(12deg);
		}
		100% {
			transform: translateX(120%) rotate(12deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.treino-play-idle,
		.treino-play-idle::after {
			animation: none;
		}
	}
</style>
