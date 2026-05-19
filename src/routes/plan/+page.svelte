<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart, trackQuestionAnswer } from '$lib/services/analytics.service';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';
	import ScrollViewportFill from '$lib/components/ui/ScrollViewportFill.svelte';
	import QuestionCard from '$lib/components/quiz/QuestionCard.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';

	const goalQuestion = $derived(quizConfig.questions.find((q) => q.id === 'goal_type'));
	const goalAnswer = $derived($quizStore.answers['goal_type']);

	/** /plan é sempre a tela de objetivo — não retomar outro passo da sessão. */
	$effect.pre(() => {
		if (!browser) return;
		quizStore.goTo('goal_type');
	});

	async function handleSelect(questionId: string, value: string | string[]) {
		if (questionId !== 'goal_type' || typeof value !== 'string' || !goalQuestion) return;

		const state = get(quizStore);
		if (!state.startedAt) {
			quizStore.start();
			trackQuizStart();
		}

		quizStore.answer(questionId, value);
		trackQuestionAnswer(questionId, value);

		const nextAnswers = { ...get(quizStore).answers };
		const visible = computeVisibleQuestions(quizConfig.questions, nextAnswers);
		const idx = visible.findIndex((q) => q.id === 'goal_type');
		const nextQ = idx >= 0 ? (visible[idx + 1] ?? null) : null;

		if (nextQ) {
			quizTransitionDirection.set('forward');
			quizStore.goTo(nextQ.id);
			await goto(`/plan/${nextQ.id}`);
		}
	}
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
</svelte:head>

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
