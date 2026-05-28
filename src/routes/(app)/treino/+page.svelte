<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { page } from '$app/stores';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import TreinoQuizSheet from '$lib/components/challenge/TreinoQuizSheet.svelte';
	import TreinoPaywallSheet from '$lib/components/challenge/TreinoPaywallSheet.svelte';
	import TreinoInfoSheet from '$lib/components/challenge/TreinoInfoSheet.svelte';
	import TreinoRestDayCard from '$lib/components/challenge/TreinoRestDayCard.svelte';
	import TreinoDayChoiceCard from '$lib/components/challenge/TreinoDayChoiceCard.svelte';
	import TreinoDayHeaderCard from '$lib/components/challenge/TreinoDayHeaderCard.svelte';
	import TreinoPreparationSheet from '$lib/components/challenge/TreinoPreparationSheet.svelte';
	import TreinoExerciseList from '$lib/components/challenge/TreinoExerciseList.svelte';
	import TreinoExerciseDetailSheet from '$lib/components/challenge/TreinoExerciseDetailSheet.svelte';
	import TreinoSessionPlayer from '$lib/components/challenge/TreinoSessionPlayer.svelte';
	import MealMarkConfirmSheet from '$lib/components/challenge/MealMarkConfirmSheet.svelte';
	import { canAccessTreino, canAccessConsultoria } from '$lib/stores/access.store';
	import { authStore, authLoading } from '$lib/stores/auth.store';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { treinoStore } from '$lib/stores/treino.store';
	import { generatingTreino } from '$lib/stores/generating-treino.store';
	import {
		workoutPlanStore,
		clearWorkoutPlan,
		setWorkoutPlanDirect,
		setWorkoutPlanFromQuiz,
		swapWorkoutExerciseVariant
	} from '$lib/data/treino-plan';
	import type { TreinoQuizAnswers, WorkoutExercise } from '$lib/data/treino-types';
	import {
		saveWorkoutPlan,
		loadActiveWorkoutPlan,
		updateActiveWorkoutPlan
	} from '$lib/services/treino-plan-sync.service';
	import { supabase } from '$lib/supabase';
	import { fireCelebrationConfetti } from '$lib/utils/celebration-confetti';
	import {
		canMarkExerciseAtIndex,
		getNextExerciseIndex,
		isSessionCircuitComplete
	} from '$lib/utils/treino-circuit-progress';
	import {
		isProtocolDayCompleted,
		resolveDayView
	} from '$lib/utils/treino-day-resolve';

	let quizOpen = $state(false);
	let paywallOpen = $state(false);
	let infoSheetOpen = $state(false);
	let prepOpen = $state(false);
	let playerOpen = $state(false);
	let exerciseSheetOpen = $state(false);
	let selectedExercise = $state<WorkoutExercise | null>(null);
	let confirmExercise = $state<WorkoutExercise | null>(null);
	let markConfirmOpen = $state(false);
	let resetConfirmOpen = $state(false);
	let highlightExerciseId = $state<string | null>(null);
	let selectedDay = $state(1);
	let generating = $state(false);
	let planHydrated = $state(false);

	const phases = [
		{ num: 1, name: 'Desbloqueio', from: 1, to: 3 },
		{ num: 2, name: 'Aceleração', from: 4, to: 6 },
		{ num: 3, name: 'Consolidação', from: 7, to: 10 },
		{ num: 4, name: 'Finalização', from: 11, to: 14 }
	] as const;

	const workoutPlan = $derived($workoutPlanStore);
	const protocolCreated = $derived(!!workoutPlan);
	const baseDay = $derived(workoutPlan?.days.find((d) => d.protocolDay === selectedDay));
	const dayView = $derived(
		workoutPlan && baseDay
			? resolveDayView(workoutPlan, $treinoStore.progress, selectedDay)
			: null
	);
	const dayPlan = $derived(dayView?.kind === 'workout' ? dayView.day : null);
	const canPlay = $derived($canAccessTreino);

	onMount(async () => {
		treinoStore.hydrate();
		await treinoStore.hydrateProgressFromSupabase();
		const dayParam = Number($page.url.searchParams.get('day'));
		if (!(dayParam >= 1 && dayParam <= 14)) {
			selectedDay = $challengeStore.currentDay;
		}
		scrollDayIntoView(selectedDay);
	});

	$effect(() => {
		const dayParam = Number($page.url.searchParams.get('day'));
		if (dayParam >= 1 && dayParam <= 14) {
			selectedDay = dayParam;
			scrollDayIntoView(dayParam);
		}
	});

	$effect(() => {
		if ($authLoading || planHydrated) return;
		if ($workoutPlanStore) {
			planHydrated = true;
			return;
		}
		const userId = $authStore.user?.id;
		if (!userId) {
			planHydrated = true;
			return;
		}
		void loadPlanFromDb();
	});

	async function loadPlanFromDb() {
		const userId = $authStore.user?.id;
		if (!userId) return;

		if ($workoutPlanStore) {
			planHydrated = true;
			return;
		}

		const { plan, answers, error } = await loadActiveWorkoutPlan(userId);
		if (error) console.warn('loadWorkoutPlan:', error);
		if (plan) {
			setWorkoutPlanDirect(plan, answers);
			treinoStore.markQuizComplete();
		} else {
			clearWorkoutPlan();
			treinoStore.resetQuiz();
		}
		planHydrated = true;
	}

	async function fetchActivityLevel(userId: string): Promise<string | undefined> {
		const { data } = await supabase
			.from('quiz_responses')
			.select('answers')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		const answers = data?.answers as Record<string, unknown> | undefined;
		return answers?.activity_level as string | undefined;
	}

	async function handleQuizFinish(answers: Record<string, string | string[]>) {
		const userId = $authStore.user?.id;
		generating = true;
		generatingTreino.set(true);

		try {
			const activityLevel = userId ? await fetchActivityLevel(userId) : undefined;
			const plan = setWorkoutPlanFromQuiz(answers as TreinoQuizAnswers, { activityLevel });

			if (userId) {
				const { error } = await saveWorkoutPlan(userId, answers as TreinoQuizAnswers, plan);
				if (error) console.warn('saveWorkoutPlan:', error);
			}

			treinoStore.markQuizComplete();
		} finally {
			setTimeout(() => {
				generating = false;
				generatingTreino.set(false);
			}, 1500);
		}
	}

	function handleStartPlayer() {
		if (!canPlay) {
			paywallOpen = true;
			return;
		}
		playerOpen = true;
	}

	function handleSessionComplete(sessionKey: string) {
		const ids = dayPlan?.exercises?.map((e) => e.active.id) ?? [];
		const rounds = dayPlan?.timing.rounds ?? 0;
		treinoStore.completeSession(sessionKey, ids, rounds);
		fireCelebrationConfetti();
	}

	function getExerciseRounds(): number[] {
		if (!dayPlan?.exercises) return [];
		const sessionKey = sessionKeyForDay();
		if (!sessionKey) return [];
		const progress = get(treinoStore).progress;
		return dayPlan.exercises.map((ex) =>
			treinoStore.getExerciseRoundsDone(progress, sessionKey, ex.active.id)
		);
	}

	function maybeCompleteSession() {
		if (!dayPlan?.exercises || !dayPlan.timing) return;
		const sessionKey = sessionKeyForDay();
		if (!sessionKey) return;
		const rounds = getExerciseRounds();
		if (!isSessionCircuitComplete(rounds, dayPlan.timing.rounds)) return;
		if (treinoStore.isSessionCompleted(sessionKey, get(treinoStore).progress)) return;
		const ids = dayPlan.exercises.map((e) => e.active.id);
		treinoStore.completeSession(sessionKey, ids, dayPlan.timing.rounds);
		fireCelebrationConfetti();
	}

	function scrollToExerciseById(exerciseId: string) {
		highlightExerciseId = exerciseId;
		requestAnimationFrame(() => {
			document
				.querySelector(`[data-exercise-id="${exerciseId}"]`)
				?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		});
	}

	function goToNextExercise(_from: WorkoutExercise) {
		if (!dayPlan?.exercises || !dayPlan.timing) return;
		const nextIdx = getNextExerciseIndex(
			dayPlan.exercises.length,
			getExerciseRounds(),
			dayPlan.timing.rounds
		);
		if (nextIdx === null) return;
		scrollToExerciseById(dayPlan.exercises[nextIdx].active.id);
	}

	const CONFIRM_SHEET_CLOSE_MS = 320;

	function markExerciseRoundComplete(
		ex: WorkoutExercise,
		confettiDelayMs = 0,
		options?: { scrollToNext?: boolean }
	): boolean {
		if (!dayPlan?.exercises || !dayPlan.timing) return false;
		const sessionKey = sessionKeyForDay();
		if (!sessionKey) return false;
		const idx = dayPlan.exercises.findIndex((e) => e.active.id === ex.active.id);
		if (idx < 0) return false;
		const rounds = getExerciseRounds();
		if (!canMarkExerciseAtIndex(idx, rounds, dayPlan.timing.rounds)) return false;

		const before = rounds[idx] ?? 0;
		treinoStore.completeExerciseRound(sessionKey, ex.active.id, dayPlan.timing.rounds);
		const after = getExerciseRounds()[idx] ?? 0;
		if (after <= before) return false;

		fireCelebrationConfetti({ delayMs: confettiDelayMs });
		maybeCompleteSession();
		if (options?.scrollToNext !== false) goToNextExercise(ex);
		return true;
	}

	function handleExerciseRoundComplete(exerciseId: string) {
		if (!dayPlan?.exercises || !dayPlan.timing) return;
		const sk = sessionKeyForDay();
		if (!sk) return;
		const ex = dayPlan.exercises.find((e) => e.active.id === exerciseId);
		if (!ex) return;
		treinoStore.completeExerciseRound(sk, ex.active.id, dayPlan.timing.rounds);
		fireCelebrationConfetti();
		maybeCompleteSession();
	}

	function openExerciseDetail(ex: WorkoutExercise) {
		selectedExercise = ex;
		exerciseSheetOpen = true;
	}

	function canMarkExercise(ex: WorkoutExercise): boolean {
		if (!dayPlan?.exercises || !dayPlan.timing) return false;
		const idx = dayPlan.exercises.findIndex((e) => e.active.id === ex.active.id);
		if (idx < 0) return false;
		return canMarkExerciseAtIndex(idx, getExerciseRounds(), dayPlan.timing.rounds);
	}

	function handleCompleteFromDetail() {
		if (!selectedExercise || !canMarkExercise(selectedExercise)) return;
		exerciseSheetOpen = false;
		openMarkConfirm(selectedExercise);
	}

	async function handleSubstituteExercise() {
		if (!selectedExercise || !dayPlan?.workoutLetter) return;

		const result = swapWorkoutExerciseVariant(dayPlan.workoutLetter, selectedExercise.slot);
		if (!result) return;

		treinoStore.migrateExerciseProgress(result.previousActiveId, result.exercise.active.id);

		const refreshed = dayPlan.exercises?.find((e) => e.slot === selectedExercise!.slot);
		if (refreshed) selectedExercise = refreshed;

		const userId = $authStore.user?.id;
		const plan = get(workoutPlanStore);
		if (userId && plan) {
			const { error } = await updateActiveWorkoutPlan(userId, plan);
			if (error) console.warn('updateWorkoutPlan:', error);
		}
	}

	const canCompleteSelectedExercise = $derived.by(() => {
		$treinoStore.progress;
		return selectedExercise ? canMarkExercise(selectedExercise) : false;
	});

	function sessionKeyForDay(): string {
		if (!dayPlan) return '';
		return dayPlan.sessionKey ?? `day-${dayPlan.protocolDay}`;
	}

	function openMarkConfirm(ex: WorkoutExercise) {
		if (!dayPlan?.exercises || !dayPlan.timing) return;
		const idx = dayPlan.exercises.findIndex((e) => e.active.id === ex.active.id);
		if (idx < 0 || !canMarkExerciseAtIndex(idx, getExerciseRounds(), dayPlan.timing.rounds)) return;
		confirmExercise = ex;
		markConfirmOpen = true;
	}

	function closeMarkConfirm() {
		markConfirmOpen = false;
		confirmExercise = null;
	}

	function confirmMarkRound() {
		if (!confirmExercise) return;
		const marked = confirmExercise;
		closeMarkConfirm();
		markExerciseRoundComplete(marked, CONFIRM_SHEET_CLOSE_MS);
	}

	function phaseDays(from: number, to: number): number[] {
		const days: number[] = [];
		for (let d = from; d <= to; d++) days.push(d);
		return days;
	}

	function isActivePhase(from: number, to: number): boolean {
		return selectedDay >= from && selectedDay <= to;
	}

	function isDaySessionCompleted(day: number): boolean {
		if (!workoutPlan) return false;
		return isProtocolDayCompleted(workoutPlan, $treinoStore.progress, day);
	}

	function handleChooseWorkout() {
		if (selectedDay <= 1) return;
		treinoStore.chooseWorkoutDay(selectedDay);
	}

	function handleChooseRest() {
		if (selectedDay <= 1) return;
		treinoStore.chooseRestDay(selectedDay);
	}

	function handleUndoDayDecision() {
		if (selectedDay <= 1) return;
		treinoStore.undoDayDecision(selectedDay);
	}

	function hasSessionProgress(sessionKey: string): boolean {
		const progress = get(treinoStore).progress;
		if (progress.completedSessions.includes(sessionKey)) return true;
		const rounds = progress.exerciseRoundsBySession[sessionKey];
		if (!rounds) return false;
		return Object.values(rounds).some((n) => n > 0);
	}

	const currentSessionHasProgress = $derived.by(() => {
		$treinoStore.progress;
		const sessionKey = sessionKeyForDay();
		return sessionKey ? hasSessionProgress(sessionKey) : false;
	});

	function openResetConfirm() {
		resetConfirmOpen = true;
	}

	function closeResetConfirm() {
		resetConfirmOpen = false;
	}

	function confirmResetDaySession() {
		closeResetConfirm();
		resetCurrentDaySession();
	}

	function resetCurrentDaySession() {
		const sessionKey = sessionKeyForDay();
		if (!sessionKey) return;
		treinoStore.resetSession(sessionKey);
		highlightExerciseId = null;
		markConfirmOpen = false;
		confirmExercise = null;
	}

	let timelineEl = $state<HTMLDivElement | null>(null);
	let isDragging = $state(false);
	let dragStartX = 0;
	let scrollStart = 0;
	let didDrag = false;
	let activePointerId: number | null = null;

	function selectDay(day: number) {
		if (didDrag) return;
		selectedDay = day;
		scrollDayIntoView(day);
	}

	function scrollDayIntoView(day: number) {
		requestAnimationFrame(() => {
			if (!timelineEl) return;
			const btn = timelineEl.querySelector<HTMLElement>(`[data-day="${day}"]`);
			if (!btn) return;
			const target = btn.offsetLeft - timelineEl.clientWidth / 2 + btn.offsetWidth / 2;
			timelineEl.scrollTo({ left: target, behavior: 'smooth' });
		});
	}

	function onPointerDown(e: PointerEvent) {
		if (!timelineEl || e.button !== 0) return;
		isDragging = true;
		didDrag = false;
		dragStartX = e.clientX;
		scrollStart = timelineEl.scrollLeft;
		activePointerId = e.pointerId;
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging || !timelineEl) return;
		const dx = e.clientX - dragStartX;
		if (Math.abs(dx) > 5) {
			didDrag = true;
			if (activePointerId !== null && !timelineEl.hasPointerCapture(activePointerId)) {
				try { timelineEl.setPointerCapture(activePointerId); } catch { /* */ }
			}
		}
		if (didDrag) timelineEl.scrollLeft = scrollStart - dx;
	}

	function endDrag(e: PointerEvent) {
		if (!timelineEl) return;
		isDragging = false;
		activePointerId = null;
		if (timelineEl.hasPointerCapture(e.pointerId)) {
			timelineEl.releasePointerCapture(e.pointerId);
		}
		if (didDrag) setTimeout(() => { didDrag = false; }, 0);
	}
</script>

<ChallengePageShell>
	<div class="mx-auto flex w-full max-w-sm flex-col gap-5 pt-4">
		<div class="w-full overflow-hidden rounded-challenge border border-challenge-border bg-surface">
			<div class="p-4 pb-3">
				<div class="mb-3 flex items-center justify-between">
					<p class="text-sm font-bold text-heading">Seu Treino</p>
					<button
						type="button"
						onclick={() => (infoSheetOpen = true)}
						class="flex h-6 w-6 items-center justify-center rounded-full transition-colors active:bg-line/30"
						aria-label="Como funciona o treino"
					>
						<svg class="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<circle cx="12" cy="12" r="10" />
							<path d="M12 16v-4" />
							<path d="M12 8h.01" />
						</svg>
					</button>
				</div>
				<div
					bind:this={timelineEl}
					class="treino-days-scroll flex gap-3 overflow-x-auto pb-1 scrollbar-hidden select-none
						{isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
					role="group"
					aria-label="Timeline de treino — 14 dias"
					onpointerdown={onPointerDown}
					onpointermove={onPointerMove}
					onpointerup={endDrag}
					onpointercancel={endDrag}
					onpointerleave={endDrag}
				>
					{#each phases as phase}
						{@const active = isActivePhase(phase.from, phase.to)}
						<div class="flex shrink-0 flex-col items-center">
							<div class="flex gap-1.5">
								{#each phaseDays(phase.from, phase.to) as day (day)}
									{@const isSelected = day === selectedDay}
									{@const isCompleted = isDaySessionCompleted(day)}
									<button
										type="button"
										data-day={day}
										onclick={() => selectDay(day)}
										aria-label="Selecionar dia {day}"
										aria-pressed={isSelected}
										class="flex w-10 shrink-0 snap-center flex-col items-center gap-1 rounded-challenge border-2 px-1 py-2 transition-all duration-200 active:scale-95
											{isSelected
											? 'border-accent bg-surface text-heading'
											: isCompleted
												? 'border-accent/40 bg-accent-soft text-accent'
												: 'border-challenge-border bg-surface text-muted'}"
									>
										<span class="text-[10px] font-bold">D{day}</span>
										{#if isCompleted}
											<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
												<path
													d="M3 8.5 L6.5 12 L13 5"
													stroke="currentColor"
													stroke-width="1.8"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										{:else}
											<span
												class="h-4 w-4 rounded-full bg-line/80"
												aria-hidden="true"
											></span>
										{/if}
									</button>
								{/each}
							</div>
							<div class="mt-3 flex w-full flex-col items-center gap-0.5">
								<div class="h-px w-full transition-colors duration-200 {active ? 'bg-accent' : 'bg-line'}"></div>
								<span class="whitespace-nowrap text-[9px] font-semibold leading-tight transition-colors duration-200 {active ? 'text-accent' : 'text-muted/70'}">
									Fase {phase.num} · {phase.name}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>

			{#if !$canAccessConsultoria}
				<a
					href="/consultoria"
					class="consultoria-cta block w-full shrink-0 bg-accent text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98]"
				>
					<span class="flex min-h-11 items-center justify-between gap-3 px-4 py-3.5">
						<span class="text-xs font-medium leading-snug">Tenha <strong>1 ano</strong> de acompanhamento <strong>individual</strong></span>
						<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M5 12h14M13 6l6 6-6 6" />
						</svg>
					</span>
				</a>
			{/if}
		</div>

		{#if generating}
			<div class="flex flex-col items-center gap-3 py-12">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
				<p class="text-sm font-medium text-body">Montando seu protocolo de treino…</p>
			</div>
		{:else if !planHydrated && $authStore.user?.id}
			<div class="flex flex-col items-center gap-4 py-8 text-center">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
				<p class="text-sm text-body">Carregando seu protocolo de treino…</p>
			</div>
		{:else if protocolCreated && baseDay && dayView}
			{#if dayView.kind === 'choice'}
				<div class="flex min-h-[min(45dvh,20rem)] flex-col items-center justify-center">
					<TreinoDayChoiceCard onTrain={handleChooseWorkout} onRest={handleChooseRest} />
				</div>
			{:else if dayView.kind === 'rest'}
				<div class="flex min-h-[min(45dvh,20rem)] flex-col items-center justify-center">
					<TreinoRestDayCard day={dayView.day} onUndo={handleUndoDayDecision} />
				</div>
			{:else if dayPlan}
				<TreinoDayHeaderCard
					day={dayPlan}
					canPlay={canPlay}
					onPreparation={() => (prepOpen = true)}
					onStart={handleStartPlayer}
					onPaywall={() => (paywallOpen = true)}
				/>

				{#if dayPlan.exercises && dayPlan.exercises.length > 0}
					<TreinoExerciseList
						exercises={dayPlan.exercises}
						sessionKey={dayPlan.sessionKey ?? `day-${dayPlan.protocolDay}`}
						totalRounds={dayPlan.timing.rounds}
						restBetweenExercises={dayPlan.timing.restBetweenExercises}
						blurred={!canPlay}
						highlightExerciseId={highlightExerciseId}
						onSelect={openExerciseDetail}
						onMarkClick={openMarkConfirm}
						onGoToNext={goToNextExercise}
						onUnlock={() => (paywallOpen = true)}
					/>
					{#if currentSessionHasProgress}
						<button
							type="button"
							onclick={openResetConfirm}
							class="flex h-11 w-full items-center justify-center rounded-challenge border-2 border-line bg-transparent px-4 text-sm font-semibold text-muted transition-all active:scale-[0.98] hover:border-line hover:bg-surface-2/50 hover:text-heading"
						>
							Reiniciar sequência deste dia
						</button>
					{/if}
				{:else}
					<div class="rounded-challenge border border-line/40 bg-surface-2/50 p-4 text-center text-sm text-body">
						Não foi possível carregar os exercícios deste dia.
						<button type="button" class="mt-2 block w-full font-semibold text-accent" onclick={() => (quizOpen = true)}>
							Refazer quiz de treino
						</button>
					</div>
				{/if}
			{/if}
		{:else}
			<div class="flex flex-col items-center gap-6 pb-8 pt-4">
				<div class="empty-cards-row relative flex w-full items-center justify-center overflow-hidden" style="height: 140px;">
					<div class="relative z-10 w-[58%] rounded-2xl border border-line/40 bg-surface p-5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
						<div class="mb-3.5 flex gap-2">
							<div class="h-2.5 w-[35%] rounded-full bg-line/50"></div>
							<div class="h-2.5 w-[25%] rounded-full bg-line/35"></div>
						</div>
						<div class="mb-2.5 h-2 w-full rounded-full bg-line/25"></div>
						<div class="h-2 w-[85%] rounded-full bg-line/25"></div>
					</div>
				</div>

				<div class="flex flex-col items-center gap-2 px-4 text-center">
					<h1 class="text-lg font-bold leading-[18px] text-heading">Você ainda não criou seu protocolo de treino</h1>
					<p class="text-sm leading-relaxed text-body text-balance">
						Circuito personalizado por tempo, na sua estação, com opções mais fáceis quando precisar.
					</p>
				</div>

				<button
					type="button"
					class="flex h-11 items-center justify-center gap-1.5 rounded-full bg-accent px-6 text-sm font-semibold text-bg transition-all duration-200 active:scale-[0.97] hover:bg-accent-dark"
					onclick={() => (quizOpen = true)}
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M12 5v14M5 12h14" />
					</svg>
					Criar treino agora
				</button>
			</div>
		{/if}
	</div>
</ChallengePageShell>

<TreinoQuizSheet open={quizOpen} onClose={() => (quizOpen = false)} onFinish={handleQuizFinish} />
<TreinoPreparationSheet
	open={prepOpen}
	day={dayPlan ?? null}
	onClose={() => (prepOpen = false)}
/>
<TreinoExerciseDetailSheet
	open={exerciseSheetOpen}
	exercise={selectedExercise}
	exerciseSeconds={dayPlan?.timing.exerciseSeconds ?? 30}
	restBetweenExercises={dayPlan?.timing.restBetweenExercises ?? 20}
	canComplete={canCompleteSelectedExercise}
	onClose={() => (exerciseSheetOpen = false)}
	onComplete={handleCompleteFromDetail}
	onSubstitute={handleSubstituteExercise}
/>
<TreinoSessionPlayer
	open={playerOpen}
	day={dayPlan}
	sessionKey={sessionKeyForDay()}
	onClose={() => (playerOpen = false)}
	onComplete={handleSessionComplete}
	onExerciseRoundComplete={handleExerciseRoundComplete}
/>
<TreinoPaywallSheet open={paywallOpen} onClose={() => (paywallOpen = false)} />
<TreinoInfoSheet open={infoSheetOpen} onClose={() => (infoSheetOpen = false)} />

<MealMarkConfirmSheet
	open={markConfirmOpen}
	message="Deseja marcar esta volta como concluída?"
	onClose={closeMarkConfirm}
	onConfirm={confirmMarkRound}
/>

<MealMarkConfirmSheet
	open={resetConfirmOpen}
	message="Deseja reiniciar a sequência deste dia? O progresso das voltas será apagado."
	onClose={closeResetConfirm}
	onConfirm={confirmResetDaySession}
/>

<style>
	.treino-days-scroll {
		touch-action: pan-x;
		-webkit-overflow-scrolling: touch;
		scroll-snap-type: x proximity;
		overscroll-behavior-x: contain;
	}

	.consultoria-cta {
		position: relative;
		overflow: hidden;
		border-radius: 0 0 var(--radius-challenge) var(--radius-challenge);
	}

	.consultoria-cta::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 38%,
			rgba(255, 255, 255, 0.22) 50%,
			transparent 62%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: cta-shine 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	.consultoria-cta > span {
		position: relative;
		z-index: 1;
	}

	@keyframes cta-shine {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	@media (prefers-reduced-motion: reduce) {
		.consultoria-cta::after {
			animation: none;
		}
	}
</style>
