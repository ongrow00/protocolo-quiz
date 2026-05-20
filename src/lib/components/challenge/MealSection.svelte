<script lang="ts">
	import { slide } from 'svelte/transition';
	import MealOptionCard from '$lib/components/challenge/MealOptionCard.svelte';
	import type { MealBlockId } from '$lib/data/meal-preferences';
	import { MEAL_BLOCK_TITLES, type MealOption } from '$lib/data/challenge-plan';
	import type { MealCheckStatus } from '$lib/stores/challenge.store';

	interface Props {
		blockId: MealBlockId;
		meals: MealOption[];
		getStatus: (optionId: string) => MealCheckStatus | 'pending';
		isBlockResolved: boolean;
		selectedOptionId?: string | null;
		onSelect: (meal: MealOption) => void;
		onMarkClick: (meal: MealOption) => void;
		onUndoClick: (meal: MealOption) => void;
		expanded: boolean;
		onToggle: () => void;
	}

	let {
		blockId,
		meals,
		getStatus,
		isBlockResolved,
		selectedOptionId = null,
		onSelect,
		onMarkClick,
		onUndoClick,
		expanded,
		onToggle
	}: Props = $props();

	const sectionTitle = $derived(MEAL_BLOCK_TITLES[blockId]);
	const contentId = $derived(`section-${blockId}-content`);
</script>

<section class="flex flex-col gap-3" aria-labelledby="section-{blockId}">
	<h2 id="section-{blockId}" class="m-0">
		<button
			type="button"
			class="flex w-full items-center justify-between gap-2 rounded-challenge py-0.5 text-left transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			aria-expanded={expanded}
			aria-controls={contentId}
			onclick={onToggle}
		>
			<span class="text-base font-extrabold text-heading">{sectionTitle}</span>
			<svg
				class="h-5 w-5 shrink-0 text-muted transition-transform duration-200 {expanded
					? 'rotate-180'
					: ''}"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
			</svg>
		</button>
	</h2>
	{#if expanded}
		<div
			id={contentId}
			class="flex flex-col gap-2"
			transition:slide={{ duration: 200 }}
		>
			{#each meals as meal (meal.id)}
				<MealOptionCard
					{meal}
					status={getStatus(meal.id)}
					blockResolved={isBlockResolved}
					selected={selectedOptionId === meal.id}
					onCardClick={() => onSelect(meal)}
					onMarkClick={() => onMarkClick(meal)}
					onUndoClick={() => onUndoClick(meal)}
				/>
			{/each}
		</div>
	{/if}
</section>
