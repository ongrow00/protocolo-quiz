<script lang="ts">
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { quizStore } from '$lib/stores/quiz.store';
	import { trackQuizStart, trackQuestionAnswer } from '$lib/services/analytics.service';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';
	import ScrollViewportFill from '$lib/components/ui/ScrollViewportFill.svelte';
	import QuestionCard from '$lib/components/quiz/QuestionCard.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';

	const goalQuestion = $derived(quizConfig.questions.find((q) => q.id === 'goal_type'));

	async function handleSelect(questionId: string, value: string | string[]) {
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
			quizTransitionDirection.set('forward');
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

<div class="relative flex min-h-0 flex-1 flex-col bg-bg">
	<header class="shrink-0 flex justify-center pt-6 px-4">
		<Logo />
	</header>

	{#if goalQuestion}
		<main
			data-scroll-viewport
			class="scrollbar-hidden flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain max-w-lg mx-auto w-full px-4 pt-8"
		>
			<ScrollViewportFill>
				<QuestionCard question={goalQuestion} selectedValue={undefined} onSelect={handleSelect} />
			</ScrollViewportFill>

			<div
				class="shrink-0 mt-10 border-t border-line/70 pt-10 pb-[calc(9rem+env(safe-area-inset-bottom))]"
			>
				<LegalFooter />
			</div>
		</main>

		<div
			class="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-bottom-fade-white pt-12 pointer-events-none"
		>
			<div
				class="max-w-lg mx-auto w-full bg-bg px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1 pointer-events-auto"
			>
				<SocialProof bordered={false} />
			</div>
		</div>
	{/if}
</div>
