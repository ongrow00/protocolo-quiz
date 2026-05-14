<script lang="ts">
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart, trackQuestionAnswer } from '$lib/services/analytics.service';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';
	import QuestionCard from '$lib/components/quiz/QuestionCard.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';

	const goalQuestion = $derived(quizConfig.questions.find((q) => q.id === 'goal_type'));

	function handleSelect(questionId: string, value: string | string[]) {
		if (questionId !== 'goal_type' || typeof value !== 'string' || !goalQuestion) return;

		const state = get(quizStore);
		if (!state.startedAt) {
			quizStore.start();
			trackQuizStart();
		}

		quizStore.answer(questionId, value);
		trackQuestionAnswer(questionId, value);

		const nextAnswers = { ...state.answers, [questionId]: value };
		const visible = computeVisibleQuestions(quizConfig.questions, nextAnswers);
		const idx = visible.findIndex((q) => q.id === 'goal_type');
		const nextQ = idx >= 0 ? (visible[idx + 1] ?? null) : null;

		if (nextQ) {
			quizStore.goTo(nextQ.id);
			goto(`/plan/${nextQ.id}`);
		} else {
			quizStore.goTo('goal_type');
			goto('/plan/goal_type');
		}
	}
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
</svelte:head>

<div class="flex flex-1 flex-col min-h-0">
	<header class="flex justify-center pt-6 px-4">
		<Logo />
	</header>

	{#if goalQuestion}
		<main class="flex-1 flex flex-col min-h-0 max-w-lg mx-auto w-full px-4 pt-8 pb-8">
			<QuestionCard question={goalQuestion} selectedValue={undefined} onSelect={handleSelect} />
			<div class="w-full flex justify-center mt-auto pt-8 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
				<SocialProof bordered={false} />
			</div>
		</main>
	{/if}
</div>
