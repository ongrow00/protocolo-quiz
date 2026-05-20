<script lang="ts">
	import { slide } from 'svelte/transition';
	import Logo from '$lib/components/ui/Logo.svelte';
	import {
		MEAL_BLOCKS,
		MEAL_SELECTION_LIMIT,
		type MealBlockId
	} from '$lib/data/meal-preferences';

	interface Props {
		onComplete?: (selections: Record<MealBlockId, string[]>) => void;
	}

	let { onComplete }: Props = $props();

	const selections = $state<Record<MealBlockId, string[]>>({
		cafe: [],
		almoco: [],
		lanche: [],
		janta: []
	});

	const expanded = $state<Record<MealBlockId, boolean>>({
		cafe: true,
		almoco: false,
		lanche: false,
		janta: false
	});

	function isBlockAccessible(blockId: MealBlockId): boolean {
		const idx = MEAL_BLOCKS.findIndex((b) => b.id === blockId);
		if (idx <= 0) return true;
		return MEAL_BLOCKS.slice(0, idx).every(
			(b) => selections[b.id].length >= MEAL_SELECTION_LIMIT
		);
	}

	function openBlock(blockId: MealBlockId) {
		for (const block of MEAL_BLOCKS) {
			expanded[block.id] = block.id === blockId;
		}
	}

	function openNextBlockAfter(currentId: MealBlockId) {
		const idx = MEAL_BLOCKS.findIndex((b) => b.id === currentId);
		const next = idx >= 0 ? MEAL_BLOCKS[idx + 1] : undefined;
		if (next) openBlock(next.id);
	}

	const allComplete = $derived(
		MEAL_BLOCKS.every((block) => selections[block.id].length >= MEAL_SELECTION_LIMIT)
	);

	let completionNotified = $state(false);

	$effect(() => {
		if (!allComplete || completionNotified) return;
		completionNotified = true;
		onComplete?.({ ...selections });
	});

	function toggleItem(blockId: MealBlockId, itemId: string) {
		if (!expanded[blockId]) return;

		const current = selections[blockId];
		if (current.includes(itemId)) {
			selections[blockId] = current.filter((id) => id !== itemId);
			return;
		}
		if (current.length >= MEAL_SELECTION_LIMIT) return;

		const next = [...current, itemId];
		selections[blockId] = next;

		if (next.length >= MEAL_SELECTION_LIMIT) {
			expanded[blockId] = false;
			openNextBlockAfter(blockId);
		}
	}

	function toggleExpanded(blockId: MealBlockId) {
		if (expanded[blockId]) {
			expanded[blockId] = false;
			return;
		}
		if (!isBlockAccessible(blockId)) return;
		openBlock(blockId);
	}

	function selectedLabels(blockId: MealBlockId): string[] {
		const block = MEAL_BLOCKS.find((b) => b.id === blockId);
		if (!block) return [];
		return selections[blockId]
			.map((id) => block.items.find((item) => item.id === id))
			.filter((item): item is NonNullable<typeof item> => item != null)
			.map((item) => `${item.emoji} ${item.label}`);
	}
</script>

<div class="meal-picker w-full max-w-md mx-auto min-w-0 text-left">
	<div class="flex justify-center mb-6">
		<Logo class="block h-7 w-auto" />
	</div>
	<div class="mb-4 px-1">
		<h2 class="text-xl font-extrabold text-heading leading-snug">
			Selecione suas preferências
		</h2>
		<p class="text-sm text-muted mt-1 leading-relaxed">
			Selecione {MEAL_SELECTION_LIMIT} alimentos em cada refeição. O bloco fecha ao completar.
		</p>
	</div>

	<div class="flex flex-col gap-4">
		{#each MEAL_BLOCKS as block (block.id)}
			{@const selected = selections[block.id]}
			{@const isComplete = selected.length >= MEAL_SELECTION_LIMIT}
			{@const isOpen = expanded[block.id]}
			{@const isPending = !isBlockAccessible(block.id)}
			<section
				class="rounded-2xl border overflow-hidden transition-opacity duration-200 {isPending
					? 'opacity-50 border-line/40 bg-surface-2 pointer-events-none'
					: 'border-line/60 bg-surface'}"
				aria-labelledby="meal-block-{block.id}"
				aria-disabled={isPending}
			>
				<button
					type="button"
					id="meal-block-{block.id}"
					class="w-full px-4 pt-4 pb-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset {isPending
						? 'text-muted'
						: 'hover:bg-surface-2/40'}"
					onclick={() => toggleExpanded(block.id)}
					aria-expanded={isOpen}
					disabled={isPending}
				>
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<h3 class="text-base font-extrabold text-heading">
								{block.title}
							</h3>
							<p class="text-xs text-muted mt-0.5">
								{#if isComplete}
									{selected.length} alimentos selecionados
								{:else}
									Selecione os alimentos.
								{/if}
							</p>
						</div>
						<span
							class="shrink-0 text-sm tabular-nums {isComplete
								? 'font-semibold text-accent'
								: 'text-muted'}"
						>
							{selected.length}/{MEAL_SELECTION_LIMIT}
						</span>
					</div>

					{#if isComplete && !isOpen}
						<p class="mt-2 text-xs text-body leading-relaxed line-clamp-2">
							{selectedLabels(block.id).join(' · ')}
						</p>
					{/if}
				</button>

				{#if isOpen}
					<div class="h-px bg-line/60 mx-4" aria-hidden="true"></div>
					<div
						class="px-3 pb-4 pt-3"
						transition:slide={{ duration: 220 }}
					>
						<div class="grid grid-cols-3 gap-2">
							{#each block.items as item (item.id)}
								{@const isSelected = selected.includes(item.id)}
								{@const isDisabled =
									!isSelected && selected.length >= MEAL_SELECTION_LIMIT}
								<button
									type="button"
									role="checkbox"
									aria-checked={isSelected}
									aria-disabled={isDisabled}
									disabled={isDisabled}
									onclick={() => toggleItem(block.id, item.id)}
									class="meal-food-btn @container flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
										{isSelected
										? 'border-accent bg-accent text-bg font-medium'
										: isDisabled
											? 'border-line/40 bg-surface text-muted/50 cursor-not-allowed'
											: 'border-line bg-surface text-body hover:border-accent/40 hover:bg-surface-2'}"
								>
									<span class="meal-food-emoji shrink-0" aria-hidden="true">{item.emoji}</span>
									<span class="meal-food-label min-w-0 w-full text-balance">{item.label}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		{/each}
	</div>
</div>

<style>
	.meal-picker {
		container-type: inline-size;
		container-name: meal-picker;
	}

	.meal-food-btn {
		container-type: inline-size;
	}

	.meal-food-emoji {
		font-size: clamp(0.875rem, 12cqi, 1rem);
		line-height: 1;
	}

	.meal-food-label {
		font-size: clamp(0.5625rem, 10cqi, 0.75rem);
		line-height: 1.15;
	}

	@container meal-picker (min-width: 24rem) {
		.meal-food-label {
			font-size: clamp(0.6875rem, 8cqi, 0.8125rem);
		}

		.meal-food-emoji {
			font-size: clamp(1rem, 10cqi, 1.125rem);
		}
	}
</style>
