<script lang="ts">
	import { mealOptionLabel, type MealOption } from '$lib/data/challenge-plan';
	import type { MealCheckStatus } from '$lib/stores/challenge.store';

	interface Props {
		meal: MealOption;
		status: MealCheckStatus | 'pending';
		selected?: boolean;
		blockResolved?: boolean;
		onCardClick?: () => void;
		onMarkClick?: () => void;
		onUndoClick?: () => void;
	}

	let {
		meal,
		status,
		selected = false,
		blockResolved = false,
		onCardClick,
		onMarkClick,
		onUndoClick
	}: Props = $props();

	const isChosen = $derived(status === 'completed' || status === 'skipped');
	const isDimmed = $derived(blockResolved && !isChosen);
	const canMarkFromCircle = $derived(!isChosen && !isDimmed);

	const displayName = $derived(meal.shortName || meal.name);
	const initials = $derived(
		displayName
			.split(/\s+/)
			.filter((w) => /[a-zA-ZÀ-ÿ]/.test(w[0]))
			.slice(0, 2)
			.map((w) => w[0].toUpperCase())
			.join('')
	);
</script>

<div
	class="flex w-full items-center gap-2 rounded-challenge border border-challenge-border bg-surface p-3 transition-all duration-200
		{isDimmed ? 'opacity-50' : selected ? 'ring-2 ring-accent' : ''}"
>
	{#if canMarkFromCircle}
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				onMarkClick?.();
			}}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-2/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			aria-label="Marcar como refeição feita"
		>
			<span
				class="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-line bg-transparent"
				aria-hidden="true"
			></span>
		</button>
	{:else if isChosen}
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				onUndoClick?.();
			}}
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-2/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
			aria-label="Desfazer conclusão da refeição"
		>
			<span
				class="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-accent bg-transparent text-accent"
				aria-hidden="true"
			>
				<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none">
					<path
						d="M3 8.5 L6.5 12 L13 5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
		</button>
	{:else}
		<span class="flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden="true">
			<span
				class="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-line bg-transparent"
			></span>
		</span>
	{/if}

	<button
		type="button"
		onclick={onCardClick}
		class="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-challenge"
		aria-label="{mealOptionLabel(meal.optionIndex)}, {displayName}, {meal.calories} calorias{isChosen ? ', consumida' : isDimmed ? ', outra opção escolhida' : ''}"
	>
		<div
			class="flex h-14 w-14 shrink-0 items-center justify-center rounded-challenge bg-accent-soft {isDimmed
				? 'grayscale'
				: ''}"
		>
			<span class="text-base font-extrabold text-accent">{initials}</span>
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-[10px] font-medium uppercase tracking-wide text-muted">
				{mealOptionLabel(meal.optionIndex)}
			</p>
			<p class="truncate text-sm font-bold text-heading">{displayName}</p>
		</div>
		<div class="flex shrink-0 items-center gap-0.5 text-xs font-medium text-muted tabular-nums">
			<span>{meal.calories} kcal</span>
			<svg
				class="h-3.5 w-3.5 shrink-0 text-muted/70"
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
		</div>
	</button>
</div>
