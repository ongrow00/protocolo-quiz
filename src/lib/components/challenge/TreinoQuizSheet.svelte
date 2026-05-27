<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { treinoQuizQuestions, type TreinoQuizQuestion } from '$lib/data/treino-quiz';

	interface Props {
		open: boolean;
		onClose: () => void;
		onFinish?: (answers: Record<string, string | string[]>) => void;
	}

	let { open, onClose, onFinish }: Props = $props();

	let currentStep = $state(0);
	let answers: Record<string, string | string[]> = $state({});
	let direction: 'forward' | 'back' = $state('forward');
	let animKey = $state(0);

	function isQuestionVisible(q: TreinoQuizQuestion): boolean {
		if (!q.showIf) return true;
		const val = answers[q.showIf.questionId];
		if (!val) return false;
		const arr = Array.isArray(val) ? val : [val];
		return q.showIf.values.some((v) => arr.includes(v));
	}

	const visibleQuestions = $derived(treinoQuizQuestions.filter(isQuestionVisible));
	const totalSteps = $derived(visibleQuestions.length);
	const question: TreinoQuizQuestion = $derived(visibleQuestions[currentStep]);
	const progress = $derived(((currentStep + 1) / totalSteps) * 100);

	const noneOptionIds: Record<string, string[]> = {
		treino_dores: ['nenhuma'],
		treino_restricoes_exercicio: ['sem_restricao']
	};

	/** Restrições de exercício: pode finalizar sem seleção (= nenhuma restrição). */
	const allowsEmptySelection = $derived(question.id === 'treino_restricoes_exercicio');

	const selectedIds = $derived.by(() => {
		const q = visibleQuestions[currentStep];
		if (!q) return [];
		const val = answers[q.id];
		if (!val) return [];
		return Array.isArray(val) ? val : [val];
	});

	const noneIdsForQuestion = $derived(noneOptionIds[question.id] ?? []);
	const hasNoneSelected = $derived(noneIdsForQuestion.some((id) => selectedIds.includes(id)));

	function setAnswer(questionId: string, value: string | string[]) {
		answers = { ...answers, [questionId]: value };
	}

	function handleSelect(optionId: string) {
		if (question.type === 'single') {
			setAnswer(question.id, optionId);
			advanceAfterDelay();
			return;
		}

		const noneIds = noneOptionIds[question.id] ?? [];
		const isNone = noneIds.includes(optionId);

		if (isNone) {
			setAnswer(
				question.id,
				selectedIds.includes(optionId)
					? selectedIds.filter((id) => id !== optionId)
					: [optionId]
			);
			return;
		}

		if (hasNoneSelected) return;

		if (selectedIds.includes(optionId)) {
			setAnswer(
				question.id,
				selectedIds.filter((id) => id !== optionId)
			);
		} else {
			setAnswer(question.id, [...selectedIds.filter((id) => !noneIds.includes(id)), optionId]);
		}
	}

	let autoAdvanceTimer: ReturnType<typeof setTimeout> | undefined;

	function advanceAfterDelay() {
		clearTimeout(autoAdvanceTimer);
		autoAdvanceTimer = setTimeout(() => {
			if (currentStep < totalSteps - 1) {
				direction = 'forward';
				animKey++;
				currentStep++;
			} else {
				handleFinish();
			}
		}, 300);
	}

	function goBack() {
		if (currentStep > 0) {
			direction = 'back';
			animKey++;
			currentStep--;
		}
	}

	function goNext() {
		if (selectedIds.length === 0 && !allowsEmptySelection) return;
		if (selectedIds.length === 0 && allowsEmptySelection) {
			setAnswer(question.id, []);
		}
		if (currentStep < totalSteps - 1) {
			direction = 'forward';
			animKey++;
			currentStep++;
		} else {
			handleFinish();
		}
	}

	function handleFinish() {
		const snapshot = { ...answers };
		resetAndClose();
		onFinish?.(snapshot);
	}

	function resetAndClose() {
		currentStep = 0;
		answers = {};
		onClose();
	}

	$effect(() => {
		if (!open) {
			currentStep = 0;
			answers = {};
		}
	});

	$effect(() => {
		if (totalSteps > 0 && currentStep >= totalSteps) {
			currentStep = totalSteps - 1;
		}
	});

	$effect(() => () => clearTimeout(autoAdvanceTimer));
</script>

<BottomSheet open={open} onClose={resetAndClose}>
	<div class="flex min-h-0 flex-1 flex-col">
		<!-- Fixed header: progress + question -->
		<div class="shrink-0 pb-4">
			<div class="flex items-center gap-3">
				{#if currentStep > 0}
					<button
						type="button"
						onclick={goBack}
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:bg-surface-2"
						aria-label="Voltar"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M19 12H5M12 19l-7-7 7-7" />
						</svg>
					</button>
				{/if}
				<div class="flex-1">
					<div class="h-1.5 w-full overflow-hidden rounded-full bg-line/30">
						<div
							class="h-full rounded-full bg-accent transition-all duration-300"
							style="width: {progress}%"
						></div>
					</div>
				</div>
				<span class="shrink-0 text-[11px] font-medium tabular-nums text-muted">
					{currentStep + 1}/{totalSteps}
				</span>
			</div>

			{#key animKey}
				<h2 class="mt-4 text-xl font-extrabold leading-tight text-heading quiz-slide {direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}">
					{question.text}
				</h2>
			{/key}
		</div>

		<!-- Scrollable options -->
		<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
			{#key animKey}
				<div class="flex flex-col gap-3 quiz-slide {direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}">
					{#each question.options as option (option.id)}
						{@const isSelected = selectedIds.includes(option.id)}
						{@const isMultiple = question.type === 'multiple'}
						{@const isNoneOption = noneIdsForQuestion.includes(option.id)}
						{@const isDisabled = hasNoneSelected && !isNoneOption}
						<button
							type="button"
							role={isMultiple ? 'checkbox' : 'radio'}
							aria-checked={isSelected}
							aria-disabled={isDisabled}
							disabled={isDisabled}
							onclick={() => !isDisabled && handleSelect(option.id)}
							class="flex w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
								{isSelected
								? 'border-accent bg-accent text-bg'
								: isDisabled
									? 'border-line/40 bg-line/10 text-muted/60'
									: 'border-line bg-surface text-body hover:border-accent/50 hover:bg-surface-2'}"
						>
							{#if isMultiple}
								<span
									class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors
										{isSelected ? 'border-bg' : isDisabled ? 'border-line/40' : 'border-line'}"
								>
									{#if isSelected}
										<svg class="h-3 w-3 text-bg" viewBox="0 0 12 12" fill="none">
											<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{/if}
								</span>
							{/if}
							<span class="font-medium leading-snug">{option.text}</span>
						</button>
					{/each}
				</div>
			{/key}
		</div>
	</div>

	{#snippet footer()}
		{#if question.type === 'multiple'}
			{@const canContinue = selectedIds.length > 0 || allowsEmptySelection}
			<button
				type="button"
				disabled={!canContinue}
				onclick={goNext}
				class="flex h-[52px] w-full items-center justify-center rounded-challenge text-base font-bold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
					{canContinue
					? 'bg-accent text-bg hover:bg-accent-dark'
					: 'bg-line/30 text-muted cursor-not-allowed'}"
			>
				{currentStep < totalSteps - 1 ? 'Continuar' : 'Finalizar'}
			</button>
		{/if}
	{/snippet}
</BottomSheet>

<style>
	.quiz-slide {
		will-change: transform, opacity;
	}

	.slide-in-right {
		animation: slide-from-right 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	}

	.slide-in-left {
		animation: slide-from-left 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
	}

	@keyframes slide-from-right {
		from {
			opacity: 0;
			transform: translateX(40px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slide-from-left {
		from {
			opacity: 0;
			transform: translateX(-40px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slide-in-right,
		.slide-in-left {
			animation: none;
		}
	}
</style>
