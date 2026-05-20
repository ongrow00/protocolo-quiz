<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import Logo from '$lib/components/ui/Logo.svelte';
	import OptionButton from '$lib/components/quiz/OptionButton.svelte';
	import type { QuizOption } from '$lib/data/types';
	import {
		MEAL_FOLLOW_UP_QUESTIONS,
		type MealFollowUpAnswer
	} from '$lib/data/meal-follow-up-questions';

	interface Props {
		onComplete?: (answers: Record<string, MealFollowUpAnswer>) => void;
	}

	let { onComplete }: Props = $props();

	const YES_NO_OPTIONS: QuizOption[] = [
		{ id: 'sim', text: 'Sim', scores: {} },
		{ id: 'nao', text: 'Não', scores: {} }
	];

	const stepFlyIn = { x: 30, duration: 260, delay: 40 };
	const stepFlyOut = { x: -30, duration: 180 };

	const answers = $state<Record<string, MealFollowUpAnswer>>({});

	const activeIndex = $derived(
		MEAL_FOLLOW_UP_QUESTIONS.findIndex((q) => answers[q.id] == null)
	);

	const allComplete = $derived(activeIndex === -1);

	const currentQuestion = $derived(
		activeIndex >= 0 ? MEAL_FOLLOW_UP_QUESTIONS[activeIndex] : null
	);

	let advancing = $state(false);
	let completionNotified = $state(false);

	$effect(() => {
		if (!allComplete || completionNotified) return;
		const t = setTimeout(() => {
			completionNotified = true;
			onComplete?.({ ...answers });
		}, 320);
		return () => clearTimeout(t);
	});

	async function handleOptionClick(optionId: string) {
		if (!currentQuestion || advancing || answers[currentQuestion.id] != null) return;

		answers[currentQuestion.id] = optionId as MealFollowUpAnswer;
		advancing = true;
		await tick();
		await new Promise((resolve) => setTimeout(resolve, 280));
		advancing = false;
	}
</script>

<div class="meal-follow-up w-full max-w-md mx-auto min-w-0 text-left">
	<div class="flex justify-center mb-6">
		<Logo class="block h-7 w-auto" />
	</div>

	{#if currentQuestion}
		<div class="content-transition-root min-h-[280px]">
			{#key currentQuestion.id}
				<div
					class="flex flex-col gap-6"
					in:fly={stepFlyIn}
					out:fly={stepFlyOut}
				>
					<div class="space-y-2">
						<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
							{currentQuestion.text}
						</h2>
					</div>

					<div class="grid w-full grid-cols-2 gap-3">
						{#each YES_NO_OPTIONS as option (option.id)}
							<OptionButton
								{option}
								selected={answers[currentQuestion.id] === option.id}
								type="single"
								horizontal
								disabled={advancing}
								onclick={handleOptionClick}
							/>
						{/each}
					</div>
				</div>
			{/key}
		</div>
	{/if}
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

	.meal-follow-up :global(.grid.grid-cols-2 > button) {
		width: 100%;
	}
</style>
