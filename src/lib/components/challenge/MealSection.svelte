<script lang="ts">
	import { slide, fade } from 'svelte/transition';
	import MealOptionCard from '$lib/components/challenge/MealOptionCard.svelte';
	import type { MealBlockId } from '$lib/data/meal-preferences';
	import { MEAL_BLOCK_TITLES, type MealOption } from '$lib/data/challenge-plan';
	import type { MealCheckStatus } from '$lib/stores/challenge.store';
	import { canAccessTreino } from '$lib/stores/access.store';

	interface Props {
		blockId: MealBlockId;
		dayNum: number;
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
		dayNum,
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
			<span class="text-sm font-extrabold text-heading">{sectionTitle} - Dia {dayNum}</span>
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
			{#if isBlockResolved}
				{#each meals.filter((m) => {
					const s = getStatus(m.id);
					return s === 'completed' || s === 'skipped';
				}) as meal (meal.id)}
					<div transition:slide={{ duration: 250 }}>
						<div in:fade={{ duration: 200, delay: 100 }}>
							<MealOptionCard
								{meal}
								status={getStatus(meal.id)}
								blockResolved={isBlockResolved}
								selected={selectedOptionId === meal.id}
								onCardClick={() => onSelect(meal)}
								onMarkClick={() => onMarkClick(meal)}
								onUndoClick={() => onUndoClick(meal)}
							/>
						</div>
					</div>
				{/each}
			{:else}
				{#each meals as meal (meal.id)}
					<div transition:slide={{ duration: 250 }}>
						<div in:fade={{ duration: 200, delay: 50 }}>
							<MealOptionCard
								{meal}
								status={getStatus(meal.id)}
								blockResolved={isBlockResolved}
								selected={selectedOptionId === meal.id}
								onCardClick={() => onSelect(meal)}
								onMarkClick={() => onMarkClick(meal)}
								onUndoClick={() => onUndoClick(meal)}
							/>
						</div>
					</div>
				{/each}
			{/if}

			{#if !$canAccessTreino}
				<a
					href="/treino"
					class="treino-shimmer relative flex w-full items-center justify-between gap-3 rounded-[50px] px-4 py-3 transition-all duration-200 active:scale-[0.98]"
				>
					<span class="text-xs font-medium text-body">💪 Tenha um treino personalizado para você</span>
					<svg
						class="treino-arrow h-4 w-4 shrink-0 text-muted"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M5 12h14M13 6l6 6-6 6" />
					</svg>
				</a>
			{/if}
		</div>
	{/if}
</section>

<style>
	.treino-shimmer {
		background: transparent;
		border: none;
		overflow: hidden;
		z-index: 0;
	}

	.treino-shimmer::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 200%;
		height: 200%;
		transform-origin: center;
		background: conic-gradient(
			from 0deg,
			transparent 0%,
			transparent 75%,
			rgba(22, 46, 33, 0.6) 83%,
			rgba(22, 46, 33, 0.3) 89%,
			transparent 95%
		);
		animation: laser-spin 7s linear infinite;
		z-index: -1;
		translate: -50% -50%;
	}

	.treino-shimmer::after {
		content: '';
		position: absolute;
		inset: 2px;
		border-radius: inherit;
		background: #ececec;
		border: 1px solid #e0e0e0;
		z-index: -1;
	}

	@keyframes laser-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.treino-arrow {
		animation: arrow-nudge 2s ease-in-out infinite;
	}

	@keyframes arrow-nudge {
		0%, 100% {
			transform: translateX(0);
			opacity: 0.5;
		}
		50% {
			transform: translateX(3px);
			opacity: 1;
		}
	}
</style>
