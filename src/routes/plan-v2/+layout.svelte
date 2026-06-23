<script lang="ts">
	import { browser } from '$app/environment';
	import { beforeNavigate } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		flushQuizProgressNow,
		startQuizProgressSync,
		stopQuizProgressSync
	} from '$lib/services/quiz-progress-sync.service';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { progressPercent, currentQuestion } from '$lib/stores/quiz.store';
	import StepProgressBar from '$lib/components/quiz/StepProgressBar.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';

	const PLAN_V2_ENTRY = '/plan-v2';

	let { children } = $props();

	const questionKey = $derived($currentQuestion?.id ?? 'plan-v2-idle');

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

	const isPlanV2Path = (pathname: string) =>
		pathname === PLAN_V2_ENTRY || pathname.startsWith(`${PLAN_V2_ENTRY}/`);

	beforeNavigate(({ from, to }) => {
		if (!browser) return;
		const fromPath = from?.url.pathname ?? '';
		const toPath = to?.url.pathname ?? '';
		const leavingPlan = isPlanV2Path(fromPath) && !isPlanV2Path(toPath);
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
		await goto(PLAN_V2_ENTRY);
	}
</script>

<div class="flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg">
<header class="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3">
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

	{#if section && !hideHeaderUi}
		<p class="text-xs text-muted text-center mb-2 tracking-wide">{section}</p>
	{/if}

	{#if !hideHeaderUi}
		<StepProgressBar percent={$progressPercent} steps={4} />
	{/if}
</header>

<main class="flex flex-col min-h-0 max-w-lg mx-auto w-full" aria-hidden="true"></main>

<div aria-hidden="true" class="hidden" style="display: none"></div>

<div
	data-scroll-viewport
	class="scrollbar-hidden scroll-pb-fixed-cta-reserve flex min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
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
