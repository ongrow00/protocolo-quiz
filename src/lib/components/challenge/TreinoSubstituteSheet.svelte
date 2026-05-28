<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import TreinoExerciseMedia from '$lib/components/challenge/TreinoExerciseMedia.svelte';
	import type { WorkoutExercise } from '$lib/data/treino-types';

	interface Props {
		open: boolean;
		exercise: WorkoutExercise | null;
		exerciseSeconds: number;
		restBetweenExercises: number;
		onClose: () => void;
		onConfirm: () => void;
	}

	let { open, exercise, exerciseSeconds, restBetweenExercises, onClose, onConfirm }: Props = $props();

	const alternative = $derived(exercise?.alternative ?? null);

	const variantLabel = $derived(
		exercise?.activeVariant === 'principal' ? 'Opção adaptada' : 'Opção principal'
	);
</script>

<BottomSheet
	open={open}
	onClose={onClose}
	stacked
	heightPercent={90}
	title="Substituir exercício"
	titleDetail={exercise && alternative ? `${exercise.active.name} → ${alternative.name}` : undefined}
>
	{#if exercise && alternative}
		<div class="flex flex-col gap-5 pb-2">
			<div class="relative overflow-hidden rounded-challenge bg-white text-center">
				<TreinoExerciseMedia name={alternative.name} imageUrl={alternative.imageUrl} size="lg" />
				<div class="px-4 pb-4">
					<p class="text-[10px] font-bold uppercase tracking-wide text-accent">{variantLabel}</p>
					<h2 class="mt-1 text-lg font-extrabold leading-tight text-heading">{alternative.name}</h2>
					<p class="mt-1 text-xs text-muted">Exercício {exercise.slot} do circuito</p>
				</div>
			</div>

			<div class="grid grid-cols-3 divide-x divide-line/40 rounded-challenge border border-line/30 py-3">
				<div class="px-1 text-center">
					<p class="text-base font-extrabold text-heading">{exerciseSeconds}s</p>
					<p class="text-[10px] font-medium text-muted">exercício</p>
				</div>
				<div class="px-1 text-center">
					<p class="text-base font-extrabold text-heading">{restBetweenExercises}s</p>
					<p class="text-[10px] font-medium text-muted">descanso depois</p>
				</div>
				<div class="px-1 text-center">
					<p class="text-base font-extrabold text-heading">{exercise.slot}/5</p>
					<p class="text-[10px] font-medium text-muted">no circuito</p>
				</div>
			</div>

			<p class="rounded-challenge border border-line/30 bg-surface-2/40 px-3 py-2 text-center text-xs text-muted">
				Opção atual: <strong class="text-heading">{exercise.active.name}</strong>
			</p>

			{#if alternative.instructions}
				<p class="text-sm leading-relaxed text-body">{alternative.instructions}</p>
			{:else}
				<p class="text-sm leading-relaxed text-body">
					Ao confirmar, <strong class="text-heading">{alternative.name}</strong> passa a ser o exercício
					deste slot em todos os dias do treino. Você pode trocar de novo quando quiser.
				</p>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		{#if exercise && alternative}
			<div class="flex flex-col gap-2 border-t border-line/30 pt-3">
				<button
					type="button"
					onclick={onConfirm}
					class="flex h-12 w-full items-center justify-center rounded-challenge bg-accent text-sm font-bold text-bg transition-all active:scale-[0.98] hover:bg-accent-dark"
				>
					Confirmar troca
				</button>
				<button
					type="button"
					onclick={onClose}
					class="flex h-12 w-full items-center justify-center rounded-challenge border-2 border-line bg-surface text-sm font-bold text-heading transition-all active:scale-[0.98] hover:border-accent/40"
				>
					Cancelar
				</button>
			</div>
		{/if}
	{/snippet}
</BottomSheet>
