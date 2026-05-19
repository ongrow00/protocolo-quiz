<script lang="ts">
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { get } from 'svelte/store';
	import {
		flushQuizProgressNow,
		startQuizProgressSync,
		stopQuizProgressSync
	} from '$lib/services/quiz-progress-sync.service';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { progressPercent, currentQuestion, quizStore } from '$lib/stores/quiz.store';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import StepProgressBar from '$lib/components/quiz/StepProgressBar.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';

	let { children } = $props();

	const questionKey = $derived($currentQuestion?.id ?? 'plan-idle');

	/** Mesmo padrão do funil pós-quiz (`content-transition-root`). */
	const stepFlyIn = $derived(
		$quizTransitionDirection === 'forward'
			? { x: 30, duration: 260, delay: 40 }
			: { x: -30, duration: 260, delay: 40 }
	);
	const stepFlyOut = $derived(
		$quizTransitionDirection === 'forward'
			? { x: -30, duration: 180 }
			: { x: 30, duration: 180 }
	);

	onMount(() => {
		startQuizProgressSync();
	});

	onDestroy(() => {
		stopQuizProgressSync();
	});

	beforeNavigate(({ from, to }) => {
		if (!browser) return;
		const leavingPlan =
			from?.url.pathname.startsWith('/plan') && !to?.url.pathname.startsWith('/plan');
		if (leavingPlan) {
			return flushQuizProgressNow();
		}
	});

	/** Lock para evitar duplo clique em Voltar */
	let goingBack = $state(false);

	const question = $derived($currentQuestion);
	const section = $derived(question?.section ?? '');
	const isCheckpointScreen = $derived(question?.type === 'microresult');
	const hideProgressAndCount = $derived(isCheckpointScreen);
	const isGoalTypeScreen = $derived(question?.id === 'goal_type');
	const hideHeaderUi = $derived(hideProgressAndCount || isGoalTypeScreen);

	// Se a navegação terminou, libera o lock do Voltar (rede de segurança)
	$effect(() => {
		if (navigating.from == null) goingBack = false;
	});

	// Timeout de segurança: se goingBack ficar true por muito tempo, libera a UI
	const GOING_BACK_TIMEOUT_MS = 4000;
	$effect(() => {
		if (!goingBack) return;
		const t = setTimeout(() => {
			goingBack = false;
		}, GOING_BACK_TIMEOUT_MS);
		return () => clearTimeout(t);
	});

	async function handleBack() {
		if (navigating.from != null || goingBack) return;

		// Calcula alvo no momento do clique a partir do store (evita dessincronia com $prevQuestion)
		const state = get(quizStore);
		if (!state.currentQuestionId) {
			await goto('/plan');
			return;
		}
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const idx = visible.findIndex((q) => q.id === state.currentQuestionId);
		const prevQuestionAtClick = idx > 0 ? visible[idx - 1] : null;
		const targetId = prevQuestionAtClick?.id;
		if (!targetId) {
			await goto('/plan');
			return;
		}

		goingBack = true;
		try {
			quizTransitionDirection.set('back');
			quizStore.goTo(targetId);
			await goto(`/plan/${targetId}`);
		} finally {
			goingBack = false;
		}
	}
</script>

<!-- Fundo explícito em todo o /plan; degradês do rodapé usam o mesmo token em app.css -->
<div class="flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg">
<!-- DOM order: header (0), main (1), spacer (2), slot content (3) so quiz content div is 4th child of plan root -->
<header class="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3">
	<!-- Row 1: Voltar | Logo | (espaço espelha a esquerda para centralizar o logo) -->
	<div class="flex items-center justify-between mb-3">
		{#if !isGoalTypeScreen}
			<button
				onclick={handleBack}
				disabled={navigating.from != null || goingBack}
				class="w-9 h-9 flex items-center justify-center text-heading rounded-xl transition-colors hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 disabled:pointer-events-none"
				aria-label="Voltar"
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path d="M12 15L7 10l5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>
		{:else}
			<div class="w-9 h-9" aria-hidden="true"></div>
		{/if}

		<Logo />

		<div class="w-9 h-9 shrink-0" aria-hidden="true"></div>
	</div>

	<!-- Row 2: Section label (oculto na tela de checkpoint e info medicamento) -->
	{#if section && !hideHeaderUi}
		<p class="text-xs text-muted text-center mb-2 tracking-wide">{section}</p>
	{/if}

	<!-- Row 3: Step progress bar (oculto na tela de checkpoint e info medicamento) -->
	{#if !hideHeaderUi}
		<StepProgressBar percent={$progressPercent} steps={4} />
	{/if}
</header>

<main class="flex flex-col min-h-0 max-w-lg mx-auto w-full" aria-hidden="true"></main>

<div aria-hidden="true" class="hidden" style="display: none"></div>

<div
	data-scroll-viewport
	class="scrollbar-hidden flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
>
	<div class="content-transition-root">
		{#key questionKey}
			<div
				class="content-transition-slot flex w-full min-h-0 flex-1 flex-col"
				in:fly={stepFlyIn}
				out:fly={stepFlyOut}
			>
				{@render children()}
			</div>
		{/key}
	</div>
</div>

{#if isGoalTypeScreen}
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

<style>
	.content-transition-root {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		flex: 1;
		min-height: 0;
		width: 100%;
	}

	.content-transition-root > * {
		grid-row: 1;
		grid-column: 1;
		min-width: 0;
		min-height: 0;
		justify-self: stretch;
	}

	.content-transition-slot {
		overflow: visible;
		width: 100%;
		box-sizing: border-box;
	}
</style>
