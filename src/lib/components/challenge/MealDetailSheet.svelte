<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { mealOptionLabel, type MealOption } from '$lib/data/challenge-plan';
	import type { MealCheckStatus } from '$lib/stores/challenge.store';

	interface Props {
		open: boolean;
		meal: MealOption | null;
		status: MealCheckStatus | 'pending';
		blockResolved?: boolean;
		onClose: () => void;
		onComplete: () => void;
		onUndo: () => void;
	}

	let {
		open,
		meal,
		status,
		blockResolved = false,
		onClose,
		onComplete,
		onUndo
	}: Props = $props();

	const isChosen = $derived(status === 'completed' || status === 'skipped');
	const blockTakenByOther = $derived(blockResolved && !isChosen);
	const statusTagLabel = $derived(
		status === 'skipped' ? 'Refeição ignorada' : status === 'completed' ? 'Refeição concluída' : ''
	);
</script>

{#snippet mealHeaderCheck()}
	{#if meal && !blockTakenByOther}
		<button
			type="button"
			onclick={isChosen ? onUndo : onComplete}
			class="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface {isChosen
				? 'border-2 border-accent bg-accent text-bg'
				: 'border-2 border-line/70 bg-surface-2/80 text-[#c5c5c5]'}"
			aria-label={isChosen ? 'Desfazer conclusão da refeição' : 'Marcar como consumido'}
		>
			<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M3 8.5 L6.5 12 L13 5"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	{/if}
{/snippet}

<BottomSheet
	{open}
	{onClose}
	subtitle={meal ? mealOptionLabel(meal.optionIndex) : undefined}
	title={meal?.name}
	headerTrailing={mealHeaderCheck}
>
	{#if meal}
		<div class="flex flex-col gap-5 pb-2">
			<div class="relative overflow-hidden rounded-challenge bg-accent-soft">
				<img
					src={meal.image}
					alt={meal.name}
					class="h-40 w-full object-cover"
					loading="lazy"
				/>
				{#if isChosen}
					<div class="absolute inset-0 bg-black/45" aria-hidden="true"></div>
					<div class="absolute inset-0 flex items-center justify-center p-4">
						<span
							class="inline-flex items-center gap-1.5 rounded-challenge bg-accent px-3 py-1.5 text-xs font-bold tracking-wide text-bg shadow-md"
						>
							{#if status === 'completed'}
								<svg
									class="h-3.5 w-3.5 shrink-0"
									viewBox="0 0 16 16"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M3 8.5 L6.5 12 L13 5"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							{/if}
							{statusTagLabel}
						</span>
					</div>
				{/if}
			</div>

			<div class="grid grid-cols-4 gap-2 rounded-challenge border border-challenge-border bg-surface-2/50 p-3">
				<div class="text-center">
					<p class="text-lg font-extrabold text-heading">{meal.calories}</p>
					<p class="text-[10px] font-medium text-muted uppercase">kcal</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-extrabold text-heading">{meal.macros.protein}g</p>
					<p class="text-[10px] font-medium text-muted uppercase">Proteína</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-extrabold text-heading">{meal.macros.carbs}g</p>
					<p class="text-[10px] font-medium text-muted uppercase">Carbo</p>
				</div>
				<div class="text-center">
					<p class="text-lg font-extrabold text-heading">{meal.macros.fat}g</p>
					<p class="text-[10px] font-medium text-muted uppercase">Gordura</p>
				</div>
			</div>

			<div>
				<h3 class="text-sm font-bold text-heading">Ingredientes</h3>
				<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-body">
					{#each meal.ingredients as item}
						<li>{item}</li>
					{/each}
				</ul>
			</div>

			{#if meal.notes}
				<div class="rounded-challenge border border-challenge-border bg-accent-soft/50 px-3 py-2">
					<p class="text-xs font-semibold text-accent">Observações</p>
					<p class="mt-1 text-sm text-body">{meal.notes}</p>
				</div>
			{/if}

			{#if blockTakenByOther}
				<p class="text-center text-sm font-medium text-muted">
					Você já registrou outra opção neste período.
				</p>
			{/if}
		</div>
	{/if}
</BottomSheet>
