<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import MealMarkConfirmSheet from '$lib/components/challenge/MealMarkConfirmSheet.svelte';
	import {
		mealOptionLabel,
		getMealOptionKind,
		getPhase,
		type MealOption
	} from '$lib/data/challenge-plan';
	import { MEAL_BLOCKS, type ChallengeMealBlockId, type MealBlockId, type MealFoodItem } from '$lib/data/meal-preferences';
	import { PHASE4_LANCHE_FORMATO_OPTIONS } from '$lib/data/meal-nutrition';
	import type { MealCheckStatus } from '$lib/stores/challenge.store';
	import { formatKcalNumber, formatGrams } from '$lib/utils/macros';

	interface Props {
		open: boolean;
		meal: MealOption | null;
		status: MealCheckStatus | 'pending';
		blockResolved?: boolean;
		onClose: () => void;
		onComplete: () => void;
		onUndo: () => void;
		onSubstitute: (carbId: string, proteinId: string) => void;
	}

	let {
		open,
		meal,
		status,
		blockResolved = false,
		onClose,
		onComplete,
		onUndo,
		onSubstitute
	}: Props = $props();

	const isChosen = $derived(status === 'completed' || status === 'skipped');
	const blockTakenByOther = $derived(blockResolved && !isChosen);

	let substituteOpen = $state(false);
	let selectedCarb = $state<string | null>(null);
	let selectedProtein = $state<string | null>(null);
	let confirmOpen = $state(false);

	function extractBlockId(mealId: string): ChallengeMealBlockId {
		const parts = mealId.split('-');
		return parts[1] as ChallengeMealBlockId;
	}

	const blockId = $derived(meal ? extractBlockId(meal.id) : 'almoco');
	const mealKind = $derived(meal ? getMealOptionKind(meal) : 'main');
	const mealDay = $derived(meal ? Number.parseInt(meal.id.split('-')[0].slice(1), 10) : 1);
	const mealPhase = $derived(getPhase(mealDay));
	const isAfternoonSnack = $derived(mealKind === 'snack');
	const isLancheFormato = $derived(mealKind === 'lanche');
	const isPhase4LancheFormato = $derived(isLancheFormato && mealPhase === 4);
	const substituteBlockId = $derived<MealBlockId>(
		isAfternoonSnack ? 'lanche' : isLancheFormato ? 'lancheNoite' : blockId
	);
	const block = $derived(MEAL_BLOCKS.find((b) => b.id === substituteBlockId));
	const showVegetais = $derived(
		blockId === 'almoco' || (blockId === 'janta' && mealKind === 'main')
	);
	const canSubstitute = $derived(!(isAfternoonSnack && mealPhase === 4));
	const carbOptions = $derived<MealFoodItem[]>(block?.carbs ?? []);
	const proteinOptions = $derived<MealFoodItem[]>(block?.proteins ?? []);
	const substituteReady = $derived(
		isAfternoonSnack || isPhase4LancheFormato
			? !!selectedCarb
			: !!selectedCarb && !!selectedProtein
	);

	function openSubstitute() {
		selectedCarb = null;
		selectedProtein = null;
		substituteOpen = true;
	}

	function closeSubstitute() {
		substituteOpen = false;
	}

	function handleClose() {
		substituteOpen = false;
		onClose();
	}

	function handleSubstitute() {
		if (!selectedCarb) return;
		if (!isAfternoonSnack && !isPhase4LancheFormato && !selectedProtein) return;
		onSubstitute(selectedCarb, selectedProtein ?? '');
		closeSubstitute();
	}

	function handleFinalize() {
		confirmOpen = true;
	}

	function confirmFinalize() {
		confirmOpen = false;
		onComplete();
	}

	$effect(() => {
		if (!open) substituteOpen = false;
	});
</script>

{#snippet footerButtons()}
	{#if meal}
		{#if blockTakenByOther}
			<!-- noop -->
		{:else if !isChosen}
			<div class="flex flex-col gap-2">
				<button
					type="button"
					onclick={handleFinalize}
					class="w-full rounded-challenge bg-accent py-3.5 text-sm font-bold text-bg shadow-sm transition-all active:scale-[0.98]"
				>
					Refeição Finalizada
				</button>
				{#if canSubstitute}
					<button
						type="button"
						onclick={openSubstitute}
						class="w-full rounded-challenge border border-line/40 bg-surface py-3.5 text-sm font-bold text-heading transition-all active:scale-[0.98]"
					>
						Substituir Refeição
					</button>
				{/if}
			</div>
		{:else}
			<button
				type="button"
				onclick={onUndo}
				class="w-full rounded-challenge border border-line/40 bg-surface py-3.5 text-sm font-bold text-heading transition-all active:scale-[0.98]"
			>
				Desfazer
			</button>
		{/if}
	{/if}
{/snippet}

{#snippet substituteFooter()}
	<button
		type="button"
		disabled={!substituteReady}
		onclick={handleSubstitute}
		class="w-full rounded-challenge py-3.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] {substituteReady
			? 'bg-accent text-bg'
			: 'bg-line/30 text-muted cursor-not-allowed'}"
	>
		Confirmar Substituição
	</button>
{/snippet}

<BottomSheet {open} onClose={handleClose} heightPercent={90} footer={footerButtons}>
	{#if meal}
		{#key meal.name + meal.calories}
			<div class="flex flex-col gap-5 pb-2">
				<div class="relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-challenge bg-accent-soft px-5 py-6 text-center">
					<p class="text-xs font-medium uppercase tracking-wide text-accent/70">
						{mealOptionLabel(meal.optionIndex)}
					</p>
					<h2 class="text-lg font-extrabold leading-tight text-heading">{meal.shortName || meal.name}</h2>
				</div>

				<div class="grid grid-cols-4 divide-x divide-line/40 rounded-challenge border border-line/30 py-3">
					<div class="text-center">
						<p class="text-base font-extrabold text-heading">{formatKcalNumber(meal.calories)}</p>
						<p class="text-[10px] font-medium text-muted">kcal</p>
					</div>
					<div class="text-center">
						<p class="text-base font-extrabold text-heading">{formatGrams(meal.macros.protein)}</p>
						<p class="text-[10px] font-medium text-muted">proteína</p>
					</div>
					<div class="text-center">
						<p class="text-base font-extrabold text-heading">{formatGrams(meal.macros.carbs)}</p>
						<p class="text-[10px] font-medium text-muted">carbo</p>
					</div>
					<div class="text-center">
						<p class="text-base font-extrabold text-heading">{formatGrams(meal.macros.fat)}</p>
						<p class="text-[10px] font-medium text-muted">gordura</p>
					</div>
				</div>

				<details class="collapse-section border-t border-line/20 pt-5" open>
					<summary class="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
						<div>
							<h3 class="text-sm font-bold text-heading">Ingredientes</h3>
							<p class="text-[10px] text-muted">O que você vai precisar para preparar</p>
						</div>
						<svg class="collapse-chevron h-4 w-4 shrink-0 text-muted transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
						</svg>
					</summary>
					<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-body">
						{#each meal.ingredients as item}
							<li>{item}</li>
						{/each}
					</ul>
				</details>

				{#if showVegetais}
					<details class="collapse-section border-t border-line/20 pt-5">
						<summary class="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
							<div>
								<h3 class="text-sm font-bold text-heading">Vegetais livres</h3>
								<p class="text-[10px] text-muted">Consuma à vontade</p>
							</div>
							<svg class="collapse-chevron h-4 w-4 shrink-0 text-muted transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
							</svg>
						</summary>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each ['Alface', 'Rúcula', 'Agrião', 'Espinafre', 'Acelga', 'Couve', 'Pepino', 'Tomate', 'Aipo', 'Rabanete', 'Pimentão', 'Brócolis', 'Couve-flor', 'Abobrinha', 'Berinjela', 'Aspargo', 'Repolho', 'Cogumelo', 'Vagem', 'Chuchu'] as vegetal}
								<span class="rounded-full bg-accent-soft/30 px-2.5 py-1 text-xs text-muted">{vegetal}</span>
							{/each}
						</div>
					</details>

					<details class="collapse-section border-t border-line/20 pt-5">
						<summary class="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
							<div>
								<h3 class="text-sm font-bold text-heading">Vegetais controlados</h3>
								<p class="text-[10px] text-muted">Coma até 150g por refeição</p>
							</div>
							<svg class="collapse-chevron h-4 w-4 shrink-0 text-muted transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
							</svg>
						</summary>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each ['Cenoura', 'Beterraba', 'Abóbora cabotiá', 'Quiabo', 'Couve (porção maior)'] as vegetal}
								<span class="rounded-full bg-accent-soft/30 px-2.5 py-1 text-xs text-muted">{vegetal}</span>
							{/each}
						</div>
					</details>
				{/if}

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
		{/key}
	{/if}
</BottomSheet>

<BottomSheet
	open={substituteOpen && !!meal}
	onClose={closeSubstitute}
	title="Substituir Refeição"
	heightPercent={90}
	stacked
	footer={substituteFooter}
>
	{#if meal}
		<div class="flex flex-col gap-5 pb-2">
			{#if isPhase4LancheFormato}
				<div class="flex flex-col gap-2">
					<h3 class="text-sm font-bold text-heading">Opção</h3>
					<div class="flex flex-col gap-2">
						{#each PHASE4_LANCHE_FORMATO_OPTIONS as combo, i (combo.name)}
							<button
								type="button"
								onclick={() =>
									(selectedCarb =
										selectedCarb === `lancheNoite-combo-${i}`
											? null
											: `lancheNoite-combo-${i}`)}
								class="rounded-challenge border px-3 py-2.5 text-left text-sm transition-all active:scale-[0.98] {selectedCarb ===
								`lancheNoite-combo-${i}`
									? 'border-accent bg-accent-soft font-bold text-heading'
									: 'border-line/40 bg-surface text-body'}"
							>
								{combo.name}
							</button>
						{/each}
					</div>
				</div>
			{:else}
			<div class="flex flex-col gap-2">
				<h3 class="text-sm font-bold text-heading">
					{block?.carbLabel ?? 'Carboidrato'}
				</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each carbOptions as item (item.id)}
						<button
							type="button"
							onclick={() => (selectedCarb = selectedCarb === item.id ? null : item.id)}
							class="flex items-center gap-2 rounded-challenge border px-3 py-2.5 text-left text-sm transition-all active:scale-[0.98] {selectedCarb === item.id
								? 'border-accent bg-accent-soft font-bold text-heading'
								: 'border-line/40 bg-surface text-body'}"
						>
							<span class="text-base">{item.emoji}</span>
							<span class="truncate">{item.label}</span>
						</button>
					{/each}
				</div>
			</div>

			{#if !isAfternoonSnack}
				<div class="flex flex-col gap-2">
					<h3 class="text-sm font-bold text-heading">
						{block?.proteinLabel ?? 'Proteína'}
					</h3>
					<div class="grid grid-cols-2 gap-2">
						{#each proteinOptions as item (item.id)}
							<button
								type="button"
								onclick={() => (selectedProtein = selectedProtein === item.id ? null : item.id)}
								class="flex items-center gap-2 rounded-challenge border px-3 py-2.5 text-left text-sm transition-all active:scale-[0.98] {selectedProtein === item.id
									? 'border-accent bg-accent-soft font-bold text-heading'
									: 'border-line/40 bg-surface text-body'}"
							>
								<span class="text-base">{item.emoji}</span>
								<span class="truncate">{item.label}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
			{/if}
		</div>
	{/if}
</BottomSheet>

<MealMarkConfirmSheet
	open={confirmOpen}
	message="Deseja marcar como refeição feita?"
	onClose={() => (confirmOpen = false)}
	onConfirm={confirmFinalize}
/>

<style>
	.collapse-section[open] > summary .collapse-chevron {
		transform: rotate(180deg);
	}
</style>
