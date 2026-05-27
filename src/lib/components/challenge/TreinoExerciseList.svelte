<script lang="ts">
	import type { WorkoutExercise } from '$lib/data/treino-types';
	import TreinoExerciseMedia from '$lib/components/challenge/TreinoExerciseMedia.svelte';
	import { treinoStore } from '$lib/stores/treino.store';
	import {
		canMarkExerciseAtIndex,
		getNextExerciseIndex,
		isExerciseWaitingInCircuit
	} from '$lib/utils/treino-circuit-progress';
	import { exerciseProgressLabel, isExerciseFullyDone } from '$lib/utils/treino-exercise-progress';

	interface Props {
		exercises: WorkoutExercise[];
		sessionKey: string;
		totalRounds: number;
		restBetweenExercises: number;
		blurred?: boolean;
		highlightExerciseId?: string | null;
		onSelect?: (exercise: WorkoutExercise) => void;
		onMarkClick?: (exercise: WorkoutExercise) => void;
		onGoToNext?: (exercise: WorkoutExercise) => void;
		onUnlock?: () => void;
	}

	let {
		exercises,
		sessionKey,
		totalRounds,
		restBetweenExercises,
		blurred = false,
		highlightExerciseId = null,
		onSelect,
		onMarkClick,
		onGoToNext,
		onUnlock
	}: Props = $props();

	const progress = $derived($treinoStore.progress);

	const rounds = $derived(
		exercises.map((ex) => treinoStore.getExerciseRoundsDone(progress, sessionKey, ex.active.id))
	);

	const nextIndex = $derived(getNextExerciseIndex(exercises.length, rounds, totalRounds));

	function handleCheckbox(ex: WorkoutExercise, index: number, e: MouseEvent) {
		e.stopPropagation();
		if (blurred) {
			onUnlock?.();
			return;
		}

		if (canMarkExerciseAtIndex(index, rounds, totalRounds)) {
			onMarkClick?.(ex);
			return;
		}

		if (isExerciseWaitingInCircuit(index, rounds, totalRounds)) {
			onGoToNext?.(ex);
		}
	}

	function handleRowClick(ex: WorkoutExercise, index: number) {
		if (blurred) {
			onUnlock?.();
			return;
		}

		if (isExerciseWaitingInCircuit(index, rounds, totalRounds) && !canMarkExerciseAtIndex(index, rounds, totalRounds)) {
			onGoToNext?.(ex);
			return;
		}

		onSelect?.(ex);
	}
</script>

<div class="flex flex-col gap-0 {blurred ? 'select-none' : ''}">
	{#each exercises as ex, i (ex.active.id)}
		{@const done = rounds[i] ?? 0}
		{@const isLast = i === exercises.length - 1}
		{@const fullyDone = isExerciseFullyDone(done, totalRounds)}
		{@const canMark = canMarkExerciseAtIndex(i, rounds, totalRounds)}
		{@const waiting = isExerciseWaitingInCircuit(i, rounds, totalRounds)}
		{@const isCurrent = nextIndex === i}
		{@const isHighlighted = highlightExerciseId === ex.active.id}
		<div
			data-exercise-id={ex.active.id}
			class="relative flex w-full items-center gap-2 overflow-hidden rounded-challenge border p-3 transition-all
				{(isHighlighted || isCurrent) && !blurred ? 'border-accent/50 ring-1 ring-accent/30' : 'border-challenge-border'}
				{waiting && !blurred ? 'bg-surface-2/70 opacity-60' : 'bg-surface'}"
		>
			{#if blurred}
				<div
					class="flex min-w-0 flex-1 items-center gap-3 blur-[5px] select-none"
					aria-hidden="true"
				>
					<div class="h-10 w-10 shrink-0"></div>
					<TreinoExerciseMedia name={ex.active.name} imageUrl={ex.active.imageUrl} size="sm" />
					<div class="min-w-0 flex-1">
						<p class="text-[10px] font-bold uppercase text-muted">Exercício {ex.slot}</p>
						<p class="truncate text-sm font-bold text-heading">{ex.active.name}</p>
						<p class="mt-0.5 text-xs font-medium tabular-nums text-body">
							{exerciseProgressLabel(done, totalRounds)}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => onUnlock?.()}
					class="absolute inset-0 flex items-center justify-center rounded-challenge focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
					aria-label="Desbloquear exercício"
				>
					<span class="flex items-center gap-2.5">
						<span
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-challenge bg-accent"
							aria-hidden="true"
						>
							<svg
								class="h-4 w-4 text-bg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<rect x="5" y="11" width="14" height="10" rx="2" />
								<path d="M8 11V7a4 4 0 0 1 8 0v4" />
							</svg>
						</span>
						<span class="text-sm font-normal text-heading">Desbloquear exercício</span>
					</span>
				</button>
			{:else}
				<button
					type="button"
					onclick={(e) => handleCheckbox(ex, i, e)}
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-2/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
					aria-label={canMark
						? `Marcar volta de ${ex.active.name}`
						: waiting
							? `Ir para o próximo exercício após ${ex.active.name}`
							: ex.active.name}
				>
					<span
						class="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-colors duration-200
							{fullyDone
							? 'border-accent bg-accent text-bg'
							: waiting
								? 'border-muted/50 bg-muted/20 text-muted'
								: canMark
									? 'border-accent bg-transparent'
									: 'border-line bg-transparent'}"
					>
						{#if fullyDone || (waiting && done > 0)}
							<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path
									d="M3 8.5 L6.5 12 L13 5"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</span>
				</button>

				<button
					type="button"
					onclick={() => handleRowClick(ex, i)}
					class="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-challenge"
				>
					<TreinoExerciseMedia name={ex.active.name} imageUrl={ex.active.imageUrl} size="sm" />
					<div class="min-w-0 flex-1">
						<p class="text-[10px] font-bold uppercase text-muted">Exercício {ex.slot}</p>
						<p class="truncate text-sm font-bold {waiting ? 'text-muted' : 'text-heading'}">
							{ex.active.name}
						</p>
						<p class="mt-0.5 text-xs font-medium tabular-nums text-body">
							{exerciseProgressLabel(done, totalRounds)}
						</p>
					</div>
					<svg
						class="h-5 w-5 shrink-0 text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				</button>
			{/if}
		</div>
		{#if !isLast}
			<div class="flex items-center justify-center gap-2 py-2.5" aria-hidden="true">
				<span class="h-px flex-1 bg-line/50"></span>
				<p class="shrink-0 text-center text-[11px] font-medium text-muted">
					{restBetweenExercises} segundos de descanso
				</p>
				<span class="h-px flex-1 bg-line/50"></span>
			</div>
		{/if}
	{/each}
</div>
