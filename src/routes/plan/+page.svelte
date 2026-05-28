<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, preloadData } from '$app/navigation';
	import { tick } from 'svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart, trackQuizView, trackQuizStepComplete } from '$lib/services/analytics.service';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';
	import ScrollViewportFill from '$lib/components/ui/ScrollViewportFill.svelte';
	import QuestionCard from '$lib/components/quiz/QuestionCard.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';

	const goalQuestion = $derived(quizConfig.questions.find((q) => q.id === 'goal_type'));
	const goalAnswer = $derived($quizStore.answers['goal_type']);

	let advancing = $state(false);

	/** Uma vez no mount — evita $effect que resetava o passo após o clique. */
	onMount(() => {
		if (!browser) return;
		trackQuizView();
		quizStore.goTo('goal_type');
	});

	async function handleSelect(questionId: string, value: string | string[]) {
		if (advancing || questionId !== 'goal_type' || typeof value !== 'string' || !goalQuestion) return;

		const state = get(quizStore);
		if (!state.startedAt) {
			quizStore.start();
			trackQuizStart();
		}

		quizStore.answer(questionId, value);

		const visible = computeVisibleQuestions(quizConfig.questions, get(quizStore).answers);
		const idx = visible.findIndex((q) => q.id === 'goal_type');
		const nextQ = idx >= 0 ? (visible[idx + 1] ?? null) : null;
		if (!nextQ) return;

		trackQuizStepComplete({
			step_id: questionId,
			step_index: idx >= 0 ? idx + 1 : undefined,
			steps_total: visible.length,
			next_step_id: nextQ.id,
			is_last_step: idx >= 0 ? idx === visible.length - 1 : undefined
		});

		advancing = true;
		try {
			quizTransitionDirection.set('forward');
			const dest = `/plan/${nextQ.id}`;
			preloadData(dest).catch(() => {});
			await tick();
			await goto(dest);
		} finally {
			advancing = false;
		}
	}
</script>

{#if goalQuestion}
	<div class="flex flex-col w-full flex-1 min-h-0">
		<div class="max-w-lg mx-auto w-full px-4 pt-8 pb-8 flex-1 flex flex-col min-h-0">
			<ScrollViewportFill>
				<QuestionCard
					question={goalQuestion}
					selectedValue={goalAnswer}
					onSelect={handleSelect}
				/>
			</ScrollViewportFill>

			<div
				class="shrink-0 mt-10 border-t border-line/70 pt-10 pb-[calc(9rem+env(safe-area-inset-bottom))]"
			>
				<LegalFooter />
			</div>
		</div>
	</div>
{/if}
