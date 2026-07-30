<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import Logo from '$lib/components/ui/Logo.svelte';
	import {
		MEAL_BLOCKS,
		MEAL_SELECTION_LIMIT,
		type MealBlockId,
		type MealBlock,
		type MealSelections
	} from '$lib/data/meal-preferences';

	interface Props {
		hideLogo?: boolean;
		onComplete?: (selections: MealSelections) => void;
	}

	let { hideLogo = false, onComplete }: Props = $props();

	type Category = 'carbs' | 'proteins';

	const selections = $state<MealSelections>({
		cafe: { carbs: [], proteins: [] },
		almoco: { carbs: [], proteins: [] },
		lanche: { carbs: [], proteins: [] },
		janta: { carbs: [], proteins: [] },
		lancheNoite: { carbs: [], proteins: [] }
	});

	let stepIndex = $state(0);
	let completionNotified = $state(false);

	const currentBlock = $derived(MEAL_BLOCKS[stepIndex]);
	const isLastStep = $derived(stepIndex === MEAL_BLOCKS.length - 1);

	function isCategoryComplete(blockId: MealBlockId, cat: Category): boolean {
		return selections[blockId][cat].length >= MEAL_SELECTION_LIMIT;
	}

	function isBlockComplete(blockId: MealBlockId): boolean {
		return isCategoryComplete(blockId, 'carbs') && isCategoryComplete(blockId, 'proteins');
	}

	const canAdvance = $derived(isBlockComplete(currentBlock.id));

	function toggleItem(blockId: MealBlockId, cat: Category, itemId: string) {
		const current = selections[blockId][cat];
		if (current.includes(itemId)) {
			selections[blockId][cat] = current.filter((id) => id !== itemId);
			return;
		}
		if (current.length >= MEAL_SELECTION_LIMIT) return;
		selections[blockId][cat] = [...current, itemId];
	}

	function goNext() {
		if (!canAdvance) return;

		if (!isLastStep) {
			stepIndex += 1;
			void resetScroll();
			return;
		}

		if (completionNotified) return;
		completionNotified = true;
		onComplete?.({
			cafe: { ...selections.cafe },
			almoco: { ...selections.almoco },
			lanche: { ...selections.lanche },
			janta: { ...selections.janta },
			lancheNoite: { ...selections.lancheNoite }
		});
	}

	function goBack() {
		if (stepIndex === 0) return;
		stepIndex -= 1;
		void resetScroll();
	}

	function categoryLabel(block: MealBlock, cat: Category): string {
		if (cat === 'carbs') return block.carbLabel ?? 'Carboidrato';
		return block.proteinLabel ?? 'Proteína';
	}

	function totalSelected(blockId: MealBlockId): number {
		return selections[blockId].carbs.length + selections[blockId].proteins.length;
	}

	const totalLimit = MEAL_SELECTION_LIMIT * 2;

	const stepFlyIn = { x: 30, duration: 260, delay: 40 };
	const stepFlyOut = { x: -30, duration: 180 };

	let stepRoot = $state<HTMLElement | null>(null);

	async function resetScroll() {
		await tick();
		stepRoot?.closest('main')?.scrollTo({ top: 0, behavior: 'auto' });
	}
</script>

<div class="meal-picker w-full max-w-md mx-auto min-w-0 text-left">
	{#if !hideLogo}
		<div class="flex justify-center mb-6">
			<Logo class="block h-7 w-auto" />
		</div>
	{/if}

	<div class="mb-4 flex items-center gap-3 px-1">
		<button
			type="button"
			class="shrink-0 -ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-heading transition-colors hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none {stepIndex ===
			0
				? 'invisible'
				: ''}"
			aria-label="Voltar"
			disabled={stepIndex === 0}
			onclick={goBack}
		>
			<svg
				class="h-5 w-5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>
		<div
			class="flex flex-1 items-center gap-1.5"
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={MEAL_BLOCKS.length}
			aria-valuenow={stepIndex + 1}
			aria-valuetext={`Etapa ${stepIndex + 1} de ${MEAL_BLOCKS.length}`}
			aria-label="Progresso das preferências"
		>
			{#each MEAL_BLOCKS as block, i (block.id)}
				<span
					class="h-1 flex-1 rounded-full transition-colors duration-200 {i <= stepIndex
						? 'bg-accent'
						: 'bg-line'}"
				></span>
			{/each}
		</div>
	</div>

	<p class="sr-only" aria-live="polite">
		Etapa {stepIndex + 1} de {MEAL_BLOCKS.length}: {currentBlock.title}
	</p>

	<div class="content-transition-root" bind:this={stepRoot}>
		{#key stepIndex}
			<div in:fly={stepFlyIn} out:fly={stepFlyOut}>
				<div class="mb-4 flex items-start justify-between gap-3 px-1">
					<div class="min-w-0">
						<h2 class="text-xl font-extrabold text-heading leading-snug">
							{currentBlock.title}
						</h2>
						<p class="text-sm text-muted mt-1 leading-relaxed">
							Selecione {MEAL_SELECTION_LIMIT} opções de cada categoria
						</p>
						{#if currentBlock.hint}
							<p class="text-[11px] text-muted/80 mt-1 leading-relaxed">{currentBlock.hint}</p>
						{/if}
					</div>
					<span
						class="shrink-0 text-sm tabular-nums {canAdvance
							? 'font-semibold text-accent'
							: 'text-muted'}"
					>
						{totalSelected(currentBlock.id)}/{totalLimit}
					</span>
				</div>

				<div class="flex flex-col gap-5 pb-fixed-cta-reserve">
					{#each ['carbs', 'proteins'] as cat (cat)}
						{@const category = cat as Category}
						{@const items = category === 'carbs' ? currentBlock.carbs : currentBlock.proteins}
						{@const selected = selections[currentBlock.id][category]}
						{@const catComplete = selected.length >= MEAL_SELECTION_LIMIT}
						<div>
							<div class="flex items-center justify-between mb-2 px-1">
								<span
									class="text-xs font-bold uppercase tracking-wide {catComplete
										? 'text-accent'
										: 'text-muted'}"
								>
									{categoryLabel(currentBlock, category)}
								</span>
								<span
									class="text-xs tabular-nums {catComplete
										? 'font-semibold text-accent'
										: 'text-muted'}"
								>
									{selected.length}/{MEAL_SELECTION_LIMIT}
								</span>
							</div>
							<div class="grid grid-cols-3 gap-2">
								{#each items as item (item.id)}
									{@const isSelected = selected.includes(item.id)}
									{@const isDisabled = !isSelected && selected.length >= MEAL_SELECTION_LIMIT}
									<button
										type="button"
										role="checkbox"
										aria-checked={isSelected}
										aria-disabled={isDisabled}
										disabled={isDisabled}
										onclick={() => toggleItem(currentBlock.id, category, item.id)}
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
					{/each}
				</div>
			</div>
		{/key}
	</div>
</div>

<div
	class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none"
>
	<div
		class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto"
	>
		<button
			type="button"
			onclick={goNext}
			disabled={!canAdvance}
			class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
		>
			<span>{isLastStep ? 'Finalizar' : 'Continuar'}</span>
			<svg
				class="w-4 h-4 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
			</svg>
		</button>
	</div>
</div>

<style>
	.content-transition-root {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		width: 100%;
	}

	.content-transition-root > * {
		grid-row: 1;
		grid-column: 1;
		min-width: 0;
	}

	.content-transition-root > *:not(:last-child) {
		pointer-events: none;
	}

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
