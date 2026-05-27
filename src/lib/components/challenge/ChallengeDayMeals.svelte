<script lang="ts">
	import DayCompleteToast from '$lib/components/challenge/DayCompleteToast.svelte';
	import MealDetailSheet from '$lib/components/challenge/MealDetailSheet.svelte';
	import MealMarkConfirmSheet from '$lib/components/challenge/MealMarkConfirmSheet.svelte';
	import MealSection from '$lib/components/challenge/MealSection.svelte';
	import {
		getDayPlan,
		activeBlocksForDay,
		replaceMealOption,
		CHALLENGE_PLAN,
		MEAL_BLOCK_ORDER,
		type MealBlockId,
		type MealOption
	} from '$lib/data/challenge-plan';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { supabase } from '$lib/supabase';
	import {
		dayUnlockMessage,
		isDayFullyResolved,
		MOTIVATIONAL_MESSAGES
	} from '$lib/utils/challenge-progress';
	import { fireCelebrationConfetti } from '$lib/utils/celebration-confetti';

	interface Props {
		dayNum: number;
	}

	let { dayNum }: Props = $props();

	const plan = $derived.by(() => {
		planVersion;
		const p = getDayPlan(dayNum);
		if (!p) return null;
		return {
			...p,
			blocks: {
				cafe: [...p.blocks.cafe],
				almoco: [...p.blocks.almoco],
				lanche: [...p.blocks.lanche],
				janta: [...p.blocks.janta]
			}
		};
	});

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

	const visibleBlocks = $derived(activeBlocksForDay(dayNum));

	function getBlockForOption(optionId: string): MealBlockId {
		for (const block of MEAL_BLOCK_ORDER) {
			if (plan?.blocks[block]?.some((m) => m.id === optionId)) return block;
		}
		return 'almoco';
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
		const block = getBlockForOption(meal.id);
		if (isBlockResolved(block) && getMealStatus(meal.id) === 'pending') return;
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
		fireCelebrationConfetti();
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
		fireCelebrationConfetti();
	}

	function handleUndo() {
		if (!selectedMeal) return;
		const block = getBlockForOption(selectedMeal.id);
		challengeStore.unmarkMeal(dayNum, block, selectedMeal.id);
		closeSheet();
	}

	let planVersion = $state(0);

	function handleSubstitute(carbId: string, proteinId: string) {
		if (!selectedMeal) return;
		const block = getBlockForOption(selectedMeal.id);
		const newMeal = replaceMealOption(dayNum, block, selectedMeal.id, carbId, proteinId);
		if (newMeal) {
			selectedMeal = { ...newMeal };
			planVersion++;
			syncPlanToSupabase();
		}
	}

	async function syncPlanToSupabase() {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			const { error } = await supabase
				.from('meal_plans')
				.update({
					generated_plan: CHALLENGE_PLAN,
					updated_at: new Date().toISOString()
				})
				.eq('user_id', user.id)
				.eq('is_active', true);

			if (error) console.warn('meal_plans sync failed:', error.message);
		} catch (e) {
			console.warn('meal_plans sync error:', e);
		}
	}

	const selectedStatus = $derived(selectedMeal ? getMealStatus(selectedMeal.id) : 'pending');
	const selectedBlockResolved = $derived(
		selectedMeal ? isBlockResolved(getBlockForOption(selectedMeal.id)) : false
	);

	let expandedBlocks = $state<Set<MealBlockId>>(new Set(visibleBlocks));

	$effect(() => {
		dayNum;
		expandedBlocks = new Set(activeBlocksForDay(dayNum));
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
	<div class="flex flex-col">
		{#each visibleBlocks as blockId, i (blockId)}
			<div class="border-b border-line/20 py-5 {i === 0 ? 'pt-0' : ''}">
				<MealSection
					blockId={blockId}
					{dayNum}
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
{:else}
	<div class="flex flex-col items-center justify-center py-12 px-6 text-center">
		<div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 mb-4">
			<svg class="h-7 w-7 text-muted/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
				<path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" />
				<circle cx="12" cy="12" r="9" />
			</svg>
		</div>
		<p class="text-base font-semibold text-heading">Nenhuma refeição disponível</p>
		<p class="mt-1 text-sm text-muted leading-relaxed max-w-[240px]">
			O plano para este dia ainda não foi gerado. Configure suas preferências alimentares para começar.
		</p>
	</div>
{/if}

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
	onSubstitute={handleSubstitute}
/>

<DayCompleteToast
	open={toastOpen}
	message={toastMessage}
	submessage={toastSub}
	onClose={() => {
		toastOpen = false;
	}}
/>
