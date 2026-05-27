<script lang="ts">
	import type { WorkoutPlanDay } from '$lib/data/treino-types';
	import { formatDurationMinutes } from '$lib/utils/treino-duration';
	import { treinoStore } from '$lib/stores/treino.store';
	interface Props {
		day: WorkoutPlanDay;
		onPreparation: () => void;
		onStart: () => void;
		canPlay: boolean;
		onPaywall?: () => void;
	}

	let { day, onPreparation, onStart, canPlay, onPaywall }: Props = $props();

	function handlePreparation() {
		if (!canPlay) {
			onPaywall?.();
			return;
		}
		onPreparation();
	}

	function handleStart() {
		if (sessionDone) return;
		if (!canPlay) {
			onPaywall?.();
			return;
		}
		onStart();
	}

	const sessionKey = $derived(day.sessionKey ?? `day-${day.protocolDay}`);
	const sessionDone = $derived($treinoStore.progress.completedSessions.includes(sessionKey));
</script>

<div class="overflow-hidden rounded-challenge border border-challenge-border bg-surface">
	<div class="p-4">
		<div class="mb-1 flex items-start justify-between gap-2">
			<div>
				<p class="text-[10px] font-semibold uppercase tracking-wide text-accent">
					Treino {day.workoutLetter} · Fase {day.phase}
				</p>
				<h2 class="text-base font-bold text-heading">{day.stationTitle}</h2>
			</div>
			{#if sessionDone}
				<span class="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">Concluído</span>
			{/if}
		</div>

		<div class="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-medium text-muted">
			<span>
				<span class={!canPlay ? 'blur-[5px]' : ''}>{formatDurationMinutes(day.estimatedMinutes)}</span>
			</span>
			<span aria-hidden="true">·</span>
			<span>
				<span class={!canPlay ? 'blur-[5px]' : ''}>{day.timing.rounds}</span> circuitos
			</span>
			<span aria-hidden="true">·</span>
			<span>
				<span class={!canPlay ? 'blur-[5px]' : ''}>{day.timing.exerciseSeconds}s</span> por exercício
			</span>
			<span aria-hidden="true">·</span>
			<span><span class={!canPlay ? 'blur-[5px]' : ''}>5</span> exercícios</span>
		</div>

		<div class="mt-4 grid grid-cols-2 gap-2">
			<button
				type="button"
				onclick={handlePreparation}
				class="flex h-11 min-w-0 items-center justify-center rounded-challenge border-2 border-line bg-surface px-2 text-center text-xs font-semibold leading-tight text-heading transition-all active:scale-[0.98] hover:border-accent/40 sm:text-sm"
			>
				Ver preparação
			</button>
			<button
				type="button"
				disabled={sessionDone}
				onclick={handleStart}
				aria-disabled={sessionDone}
				class="flex h-11 min-w-0 items-center justify-center gap-1 rounded-challenge px-2 text-center text-xs font-bold leading-tight transition-all sm:text-sm {sessionDone
					? 'cursor-not-allowed bg-line/40 text-muted'
					: 'bg-accent text-bg active:scale-[0.98] hover:bg-accent-dark'}"
			>
				<svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M8 5v14l11-7z" />
				</svg>
				<span class="min-w-0">Treino Guiado</span>
			</button>
		</div>
	</div>
</div>
