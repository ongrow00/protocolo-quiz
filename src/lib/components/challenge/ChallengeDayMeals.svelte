<script lang="ts">
	import DayCompleteToast from '$lib/components/challenge/DayCompleteToast.svelte';
	import MealDetailSheet from '$lib/components/challenge/MealDetailSheet.svelte';
	import MealMarkConfirmSheet from '$lib/components/challenge/MealMarkConfirmSheet.svelte';
	import MealSection from '$lib/components/challenge/MealSection.svelte';
	import {
		getDayPlan,
		MEAL_BLOCK_ORDER,
		type MealBlockId,
		type MealOption
	} from '$lib/data/challenge-plan';
	import { challengeStore } from '$lib/stores/challenge.store';
	import {
		dayUnlockMessage,
		isDayFullyResolved,
		MOTIVATIONAL_MESSAGES
	} from '$lib/utils/challenge-progress';

	interface Props {
		dayNum: number;
	}

	let { dayNum }: Props = $props();

	const plan = $derived(getDayPlan(dayNum));

	let selectedMeal = $state<MealOption | null>(null);
	let sheetOpen = $state(false);
	let markConfirmMeal = $state<MealOption | null>(null);
	let markConfirmOpen = $state(false);
	let undoConfirmMeal = $state<MealOption | null>(null);
	let undoConfirmOpen = $state(false);
	let toastOpen = $state(false);
	let toastMessage = $state('');
	let toastSub = $state('');
	let prevDayComplete = $state(false);

	$effect(() => {
		dayNum;
		prevDayComplete = isDayFullyResolved($challengeStore, dayNum);
	});

	$effect(() => {
		const complete = isDayFullyResolved($challengeStore, dayNum);
		if (complete && !prevDayComplete) {
			const idx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
			toastMessage = MOTIVATIONAL_MESSAGES[idx] ?? MOTIVATIONAL_MESSAGES[0];
			if (dayNum < 14) {
				toastSub = dayUnlockMessage(dayNum + 1);
			} else {
				toastSub = 'Você completou os 14 dias!';
			}
			toastOpen = true;
		}
		prevDayComplete = complete;
	});

	function getBlockForOption(optionId: string): MealBlockId {
		for (const block of MEAL_BLOCK_ORDER) {
			if (plan?.blocks[block].some((m) => m.id === optionId)) return block;
		}
		return 'cafe';
	}

	function getMealStatus(optionId: string) {
		const key = `${dayNum}-${getBlockForOption(optionId)}-${optionId}`;
		return $challengeStore.meals[key] ?? 'pending';
	}

	function isBlockResolved(block: MealBlockId): boolean {
		const prefix = `${dayNum}-${block}-`;
		return Object.entries($challengeStore.meals).some(
			([k, v]) => k.startsWith(prefix) && (v === 'completed' || v === 'skipped')
		);
	}

	function openMeal(meal: MealOption) {
		selectedMeal = meal;
		sheetOpen = true;
	}

	function openMarkConfirm(meal: MealOption) {
		const block = getBlockForOption(meal.id);
		if (isBlockResolved(block)) return;
		if (getMealStatus(meal.id) !== 'pending') return;
		markConfirmMeal = meal;
		markConfirmOpen = true;
	}

	function closeMarkConfirm() {
		markConfirmOpen = false;
		markConfirmMeal = null;
	}

	function confirmMarkMeal() {
		if (!markConfirmMeal) return;
		const block = getBlockForOption(markConfirmMeal.id);
		challengeStore.markMeal(dayNum, block, markConfirmMeal.id);
	}

	function openUndoConfirm(meal: MealOption) {
		const status = getMealStatus(meal.id);
		if (status !== 'completed' && status !== 'skipped') return;
		undoConfirmMeal = meal;
		undoConfirmOpen = true;
	}

	function closeUndoConfirm() {
		undoConfirmOpen = false;
		undoConfirmMeal = null;
	}

	function confirmUndoMeal() {
		if (!undoConfirmMeal) return;
		const block = getBlockForOption(undoConfirmMeal.id);
		challengeStore.unmarkMeal(dayNum, block, undoConfirmMeal.id);
	}

	function closeSheet() {
		sheetOpen = false;
		selectedMeal = null;
	}

	function handleComplete() {
		if (!selectedMeal) return;
		const block = getBlockForOption(selectedMeal.id);
		challengeStore.markMeal(dayNum, block, selectedMeal.id);
		closeSheet();
	}

	function handleUndo() {
		if (!selectedMeal) return;
		const block = getBlockForOption(selectedMeal.id);
		challengeStore.unmarkMeal(dayNum, block, selectedMeal.id);
	}

	const selectedStatus = $derived(selectedMeal ? getMealStatus(selectedMeal.id) : 'pending');
	const selectedBlockResolved = $derived(
		selectedMeal ? isBlockResolved(getBlockForOption(selectedMeal.id)) : false
	);

	let expandedBlocks = $state<Set<MealBlockId>>(new Set(MEAL_BLOCK_ORDER));

	$effect(() => {
		dayNum;
		expandedBlocks = new Set(MEAL_BLOCK_ORDER);
	});

	function toggleBlock(blockId: MealBlockId) {
		const next = new Set(expandedBlocks);
		if (next.has(blockId)) {
			next.delete(blockId);
		} else {
			next.add(blockId);
		}
		expandedBlocks = next;
	}
</script>

{#if plan}
	<div class="flex flex-col divide-y divide-challenge-border">
		{#each MEAL_BLOCK_ORDER as blockId, i (blockId)}
			<div class="py-5 {i === 0 ? 'pt-0' : ''} {i === MEAL_BLOCK_ORDER.length - 1 ? 'pb-0' : ''}">
				<MealSection
					blockId={blockId}
					meals={plan.blocks[blockId]}
					getStatus={getMealStatus}
					isBlockResolved={isBlockResolved(blockId)}
					selectedOptionId={selectedMeal?.id ?? null}
					expanded={expandedBlocks.has(blockId)}
					onToggle={() => toggleBlock(blockId)}
					onSelect={openMeal}
					onMarkClick={openMarkConfirm}
					onUndoClick={openUndoConfirm}
				/>
			</div>
		{/each}
	</div>

	<MealMarkConfirmSheet
		open={markConfirmOpen}
		message="Deseja marcar como refeição feita?"
		onClose={closeMarkConfirm}
		onConfirm={confirmMarkMeal}
	/>

	<MealMarkConfirmSheet
		open={undoConfirmOpen}
		message="Deseja desfazer a conclusão dessa refeição?"
		onClose={closeUndoConfirm}
		onConfirm={confirmUndoMeal}
	/>

	<MealDetailSheet
		open={sheetOpen}
		meal={selectedMeal}
		status={selectedStatus}
		blockResolved={selectedBlockResolved}
		onClose={closeSheet}
		onComplete={handleComplete}
		onUndo={handleUndo}
	/>

	<DayCompleteToast
		open={toastOpen}
		message={toastMessage}
		submessage={toastSub}
		onClose={() => {
			toastOpen = false;
		}}
	/>
{/if}
