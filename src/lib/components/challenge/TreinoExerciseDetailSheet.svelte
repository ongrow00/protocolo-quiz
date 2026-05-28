<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import TreinoSubstituteSheet from '$lib/components/challenge/TreinoSubstituteSheet.svelte';
	import TreinoExerciseMedia from '$lib/components/challenge/TreinoExerciseMedia.svelte';
	import type { WorkoutExercise } from '$lib/data/treino-types';

	interface Props {
		open: boolean;
		exercise: WorkoutExercise | null;
		exerciseSeconds: number;
		restBetweenExercises: number;
		canComplete?: boolean;
		onClose: () => void;
		onComplete?: () => void;
		onSubstitute?: () => void;
	}

	let {
		open,
		exercise,
		exerciseSeconds,
		restBetweenExercises,
		canComplete = false,
		onClose,
		onComplete,
		onSubstitute
	}: Props = $props();

	let substituteSheetOpen = $state(false);

	const display = $derived(exercise?.active ?? null);

	function handleClose() {
		substituteSheetOpen = false;
		onClose();
	}

	function openSubstituteSheet() {
		if (!exercise) return;
		substituteSheetOpen = true;
	}

	function closeSubstituteSheet() {
		substituteSheetOpen = false;
	}

	function confirmSubstitute() {
		onSubstitute?.();
		closeSubstituteSheet();
	}

	function handleComplete() {
		onComplete?.();
	}

	$effect(() => {
		if (!open) substituteSheetOpen = false;
	});
</script>

<BottomSheet open={open} onClose={handleClose} heightPercent={90}>
	{#if exercise && display}
		<div class="flex flex-col gap-5 pb-2">
			<div class="relative overflow-hidden rounded-challenge bg-white text-center">
				<TreinoExerciseMedia name={display.name} imageUrl={display.imageUrl} size="lg" />
				<div class="px-4 pb-4">
					<p class="text-[10px] font-bold uppercase tracking-wide text-accent">
						{exercise.activeVariant === 'principal' ? 'Opção principal' : 'Opção adaptada'}
					</p>
					<h2 class="mt-1 text-lg font-extrabold leading-tight text-heading">{display.name}</h2>
					<p class="mt-1 text-xs text-muted">Exercício {exercise.slot} do circuito</p>
				</div>
			</div>

			<div class="grid grid-cols-3 divide-x divide-line/40 rounded-challenge border border-line/30 py-3">
				<div class="text-center px-1">
					<p class="text-base font-extrabold text-heading">{exerciseSeconds}s</p>
					<p class="text-[10px] font-medium text-muted">exercício</p>
				</div>
				<div class="text-center px-1">
					<p class="text-base font-extrabold text-heading">{restBetweenExercises}s</p>
					<p class="text-[10px] font-medium text-muted">descanso depois</p>
				</div>
				<div class="text-center px-1">
					<p class="text-base font-extrabold text-heading">{exercise.slot}/5</p>
					<p class="text-[10px] font-medium text-muted">no circuito</p>
				</div>
			</div>

			{#if display.instructions}
				<p class="text-sm leading-relaxed text-body">{display.instructions}</p>
			{:else}
				<p class="text-sm leading-relaxed text-body">
					Execute o movimento com controle durante <strong class="text-heading">{exerciseSeconds} segundos</strong>.
					Em seguida, descanse <strong class="text-heading">{restBetweenExercises} segundos</strong> antes do
					próximo exercício.
				</p>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		{#if exercise && display}
			<div class="flex flex-col gap-2 border-t border-line/30 pt-3">
				<button
					type="button"
					disabled={!canComplete}
					onclick={handleComplete}
					class="flex h-12 w-full items-center justify-center rounded-challenge text-sm font-bold transition-all active:scale-[0.98]
						{canComplete
						? 'bg-accent text-bg hover:bg-accent-dark'
						: 'cursor-not-allowed bg-line/30 text-muted'}"
				>
					Concluir exercício
				</button>
				<button
					type="button"
					onclick={openSubstituteSheet}
					class="flex h-12 w-full items-center justify-center rounded-challenge border-2 border-line bg-surface text-sm font-bold text-heading transition-all active:scale-[0.98] hover:border-accent/40"
				>
					Substituir exercício
				</button>
			</div>
		{/if}
	{/snippet}
</BottomSheet>

<TreinoSubstituteSheet
	open={substituteSheetOpen}
	{exercise}
	{exerciseSeconds}
	{restBetweenExercises}
	onClose={closeSubstituteSheet}
	onConfirm={confirmSubstitute}
/>
