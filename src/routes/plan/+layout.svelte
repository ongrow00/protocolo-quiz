<script lang="ts">
	import { setContext } from 'svelte';
	import { get } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';
	import { progressPercent, prevQuestion, currentQuestion, quizStore } from '$lib/stores/quiz.store';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import StepProgressBar from '$lib/components/quiz/StepProgressBar.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import SocialProof from '$lib/components/ui/SocialProof.svelte';

	const FIRST_CHECKPOINT_ID = 'mr-1'; // Checkpoint: Objetivo definido

	let { children } = $props();

	/** Contagem – sobe para 4 ao atingir o primeiro checkpoint; 0 ao voltar para home */
	let contagem = $state(0);
	/** Lock para evitar duplo clique em Voltar */
	let goingBack = $state(false);

	const prev = $derived($prevQuestion);
	const question = $derived($currentQuestion);
	const section = $derived(question?.section ?? '');
	const isCheckpointScreen = $derived(question?.type === 'microresult');
	const hideProgressAndCount = $derived(isCheckpointScreen);
	const isMr1Screen = $derived(question?.id === FIRST_CHECKPOINT_ID);
	const isMr2Screen = $derived(question?.id === 'mr-2');
	const isMr3Screen = $derived(question?.id === 'mr-3');
	const isMr5Screen = $derived(question?.id === 'mr-5');
	const isGoalTypeScreen = $derived(question?.id === 'goal_type');
	const hideHeaderUi = $derived(hideProgressAndCount || isGoalTypeScreen);

	// setContext chamado uma vez na inicialização com getter reativo
	// (não usar $effect para setContext — setContext só é válido na inicialização do componente)
	setContext('quizContagem', { get value() { return contagem; } });

	// $effect.pre roda ANTES do DOM atualizar, garantindo que contagem esteja correto
	// quando os filhos montam (ex: MicroResultScreen lê o contexto ao inicializar)
	$effect.pre(() => {
		if (question?.id === FIRST_CHECKPOINT_ID) contagem = 4;
		else if (question?.id === 'mr-2') contagem = 7;
		else if (question?.id === 'mr-3') contagem = 10;
		else if (question?.id === 'mr-5') contagem = 13;
	});

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
			contagem = 0;
			await goto('/');
			return;
		}
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const idx = visible.findIndex((q) => q.id === state.currentQuestionId);
		const prevQuestionAtClick = idx > 0 ? visible[idx - 1] : null;
		const targetId = prevQuestionAtClick?.id;
		if (!targetId) {
			contagem = 0;
			await goto('/');
			return;
		}
		goingBack = true;
		try {
			quizStore.goTo(targetId);
			await goto(`/plan/${targetId}`);
		} finally {
			goingBack = false;
		}
	}
</script>

<!-- DOM order: header (0), main (1), spacer (2), slot content (3) so quiz content div is 4th child of root -->
<header class="sticky top-0 z-10 bg-bg px-4 pt-4 pb-3">
	<!-- Row 1: Back ← | Logo | Contagem (oculta na mr-1; na mr-1 vai para o conteúdo) -->
	<div class="flex items-center justify-between mb-3">
		{#if !isGoalTypeScreen && !isMr5Screen}
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

		{#if !hideHeaderUi && !isMr1Screen && !isMr2Screen && !isMr3Screen && !isMr5Screen}
			<div
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent"
				aria-label="Contagem"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-accent shrink-0" aria-hidden="true">
					<path
						d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
						fill="currentColor"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="text-sm text-muted font-medium tabular-nums inline-block min-w-[1ch]">
					{#key contagem}
						<span
							in:fly={{ y: 14, duration: 320, easing: (t) => 1 - Math.pow(1 - t, 3) }}
							out:fly={{ y: -8, duration: 180 }}
							class="inline-block"
						>{contagem}</span>
					{/key}
				</span>
			</div>
		{:else}
			<div class="w-[59px]" aria-hidden="true"></div>
		{/if}
	</div>

	<!-- Row 2: Section label (oculto na tela de checkpoint e info medicamento) -->
	{#if section && !hideHeaderUi}
		<p class="text-xs text-muted text-center mb-2 tracking-wide">{section}</p>
	{/if}

	<!-- Row 3: Step progress bar (oculto na tela de checkpoint e info medicamento) -->
	{#if !hideHeaderUi}
		<StepProgressBar percent={$progressPercent} steps={5} />
	{/if}
</header>

<main class="flex flex-col min-h-0 max-w-lg mx-auto w-full" aria-hidden="true"></main>

<div aria-hidden="true" class="hidden" style="display: none"></div>

{@render children()}

{#if isGoalTypeScreen}
	<div class="fixed bottom-0 left-0 right-0 z-[60] bg-bg">
		<div class="max-w-lg mx-auto w-full px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
			<div class="flex justify-center">
				<SocialProof bordered={false} />
			</div>
		</div>
	</div>
{/if}
