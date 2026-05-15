<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Logo from '$lib/components/ui/Logo.svelte';
	import StepProgressBar from '$lib/components/quiz/StepProgressBar.svelte';
	import { startPostQuizFunnelSync, stopPostQuizFunnelSync } from '$lib/services/quiz-progress-sync.service';
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	let { children } = $props();

	onMount(() => {
		startPostQuizFunnelSync();
	});

	onDestroy(() => {
		stopPostQuizFunnelSync();
	});

	/** Passos lineares do funil (sem /plan/bonus: o bónus só abre no 1.º Voltar em /results ou link direto). */
	const FUNNEL_STEPS = [
		'/carregando',
		'/nome',
		'/whatsapp',
		'/metabolismo',
		'/results'
	] as const;

	const pathname = $derived(page.url.pathname);

	function funnelStepIndex(path: string): number {
		const idx = FUNNEL_STEPS.findIndex((p) => path === p || path.startsWith(p + '/'));
		if (idx >= 0) return idx;
		if (path === '/plan/bonus' || path.startsWith('/plan/bonus/')) return 4;
		return -1;
	}

	const currentIndex = $derived(funnelStepIndex(pathname));
	const stepIndex = $derived(currentIndex >= 0 ? currentIndex : 0);
	// Nome, WhatsApp e results: barra sempre 100%
	const progressPercent = $derived(
		stepIndex >= 1 ? 100 : ((stepIndex + 1) / FUNNEL_STEPS.length) * 100
	);

	const bonusInteracted = $derived($postQuizStore.bonusInteracted);

	/** Destino do “Continuar”: calculado no clique com `page.url` atual — nunca `/plan/bonus`. */
	const RESULTS_VIDEO_HREF = '/results#video-protocolo';

	function handlePostQuizContinuar() {
		const path = page.url.pathname;
		if (path === '/metabolismo' || path.startsWith('/metabolismo/')) {
			void goto(RESULTS_VIDEO_HREF);
			return;
		}
		const idx = FUNNEL_STEPS.findIndex((p) => path === p || path.startsWith(p + '/'));
		const i = idx >= 0 ? idx : 0;
		if (i >= FUNNEL_STEPS.length - 1) return;
		let dest: string = FUNNEL_STEPS[i + 1];
		if (dest === '/plan/bonus' || dest.startsWith('/plan/bonus')) {
			dest = '/results';
		}
		if (dest === '/results') {
			void goto(RESULTS_VIDEO_HREF);
			return;
		}
		void goto(dest);
	}

	const isResultsPage = $derived(pathname === '/results' || pathname.startsWith('/results/'));
	/** Só por link direto — fora do funil linear (sem Continuar / Voltar do funil). */
	const isAtivacaoContaPage = $derived(
		pathname === '/atiavacao-de-conta' || pathname.startsWith('/atiavacao-de-conta/')
	);
	const isResultsLikePage = $derived(isResultsPage || isAtivacaoContaPage);
	/** Voltar em /results: 1.ª vez (ainda sem interação no bónus) → /plan/bonus; depois → /metabolismo. */
	const prevUrl = $derived.by(() => {
		if (stepIndex <= 0) return '/';
		if (isResultsPage) {
			if (!bonusInteracted) return '/plan/bonus';
			return '/metabolismo';
		}
		return FUNNEL_STEPS[stepIndex - 1];
	});

	const isCarregandoPage = $derived(pathname === '/carregando');
	const isWhatsappPage = $derived(pathname === '/whatsapp' || pathname.startsWith('/whatsapp/'));
	const isBonusPage = $derived(pathname === '/plan/bonus' || pathname.startsWith('/plan/bonus/'));
	const hideNavOnThisPage = $derived(isResultsLikePage);
	const showStandardContinuar = $derived(
		!isCarregandoPage && !isResultsLikePage && !isBonusPage
	);
	const showBonusDualFooter = $derived(isBonusPage && !isCarregandoPage);
	const contentSlotBottomPadding = $derived(
		isCarregandoPage || isResultsLikePage
			? 'pb-8'
			: showBonusDualFooter
				? 'pb-44'
				: showStandardContinuar
					? 'pb-32'
					: 'pb-8'
	);
	/** Nome, WhatsApp, metabolismo e bonus: sem barra de progresso no header. */
	const hidePostQuizProgressBar = $derived(
		pathname === '/nome' ||
			pathname.startsWith('/nome/') ||
			pathname === '/whatsapp' ||
			pathname.startsWith('/whatsapp/') ||
			pathname === '/metabolismo' ||
			pathname.startsWith('/metabolismo/') ||
			pathname === '/plan/bonus' ||
			pathname.startsWith('/plan/bonus/')
	);
	// Contagem continua do quiz (último passo antes do loading = 13): nome=14, whatsapp=15, metabolismo=16, …
	const POST_QUIZ_COUNTER_START = 13;
	const headerCounter = $derived(stepIndex >= 1 ? POST_QUIZ_COUNTER_START + stepIndex : 0);

	// WhatsApp obrigatório: só avança com telefone válido (10 ou 11 dígitos: DDD + número)
	const whatsappDigits = $derived.by(() => {
		const raw = ($postQuizStore.whatsapp || '').replace(/\D/g, '');
		const withoutCountry = raw.startsWith('55') && raw.length > 2 ? raw.slice(2) : raw;
		return withoutCountry.slice(0, 11);
	});
	const hasValidWhatsapp = $derived(whatsappDigits.length >= 10);
	const canAdvance = $derived(!isWhatsappPage || hasValidWhatsapp);

	const showPostQuizBackButton = $derived(
		!isCarregandoPage &&
			!isBonusPage &&
			!isAtivacaoContaPage &&
			(!hideNavOnThisPage || (isResultsPage && $postQuizStore.resultsContentRevealed))
	);

	/** Destino do “Aceitar desconto”: preço OF002 só com este query na URL. */
	const ACCEPT_BONUS_RESULTS_HREF = '/results?offer=OF002';

	function acceptBonusDiscount() {
		postQuizStore.acceptBonusDiscount();
	}

	function declineBonusDiscount() {
		void goto(prevUrl);
	}

	$effect(() => {
		if (!isResultsLikePage) postQuizStore.resetResultsContentRevealed();
	});
</script>

{#snippet postQuizHeaderInner()}
		<div class="relative flex items-center justify-between mb-3">
			{#if showPostQuizBackButton}
			<button
				type="button"
				onclick={() => goto(prevUrl)}
				class="w-9 h-9 flex items-center justify-center text-heading rounded-xl transition-colors hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
				aria-label="Voltar"
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
					<path
						d="M12 15L7 10l5-5"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			{:else}
			<div class="w-9 h-9 shrink-0" aria-hidden="true"></div>
			{/if}

			<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
				<Logo />
			</div>

			{#if !hideNavOnThisPage && !isCarregandoPage && !hidePostQuizProgressBar}
				<div
					class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-transparent shrink-0"
					aria-label="Contagem"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-heading shrink-0" aria-hidden="true">
						<path
							d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
							fill="currentColor"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span class="text-sm text-muted font-medium tabular-nums min-w-[1ch]">{headerCounter}</span>
				</div>
			{:else}
				<div class="w-[59px] shrink-0" aria-hidden="true"></div>
			{/if}
		</div>

	{#if !hideNavOnThisPage && !isCarregandoPage && !hidePostQuizProgressBar}
		<StepProgressBar percent={progressPercent} steps={5} />
	{/if}
{/snippet}

<div class="min-h-screen flex flex-col bg-bg">
	{#if isAtivacaoContaPage}
		<p
			class="fixed top-0 left-0 right-0 z-20 w-full px-4 py-2.5 text-center text-xs font-semibold leading-snug text-white bg-gradient-to-r from-red-800 via-red-600 to-red-800"
			role="alert"
		>
			Não feche ou atualize essa página, isso pode gerar duplicação de cobrança.
		</p>
	{:else}
		<header class="bg-bg px-4 pt-4 pb-3 {!isResultsLikePage ? 'sticky top-0 z-10' : ''}">
			{@render postQuizHeaderInner()}
		</header>
	{/if}

	<main
		class="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden bg-bg {isAtivacaoContaPage
			? 'pt-10'
			: ''}"
	>
		<div class="content-transition-root">
			{#key pathname}
				<div
					in:fly={{ x: 30, duration: 260, delay: 40 }}
					out:fly={{ x: -30, duration: 180 }}
					class="content-transition-slot max-w-lg mx-auto w-full px-4 pt-8 {contentSlotBottomPadding}"
					style="pointer-events: auto;"
				>
					{@render children()}
				</div>
			{/key}
		</div>
	</main>

	{#if showStandardContinuar}
	<div class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none">
		<div class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto">
		<button
			type="button"
			onclick={handlePostQuizContinuar}
			disabled={!canAdvance}
			class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:pointer-events-none"
		>
			<span>Continuar</span>
			<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
			</svg>
		</button>
		</div>
	</div>
	{/if}

	{#if showBonusDualFooter}
	<div class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none">
		<div class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto flex flex-col gap-3">
			<a
				href={ACCEPT_BONUS_RESULTS_HREF}
				onclick={acceptBonusDiscount}
				class="w-full h-[60px] flex items-center justify-center rounded-2xl font-bold text-base no-underline bg-accent text-bg transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				Aceitar desconto
			</a>
			<button
				type="button"
				onclick={declineBonusDiscount}
				class="w-full h-[60px] flex items-center justify-center rounded-2xl font-bold text-base border-2 border-accent bg-transparent text-accent transition-all duration-200 active:scale-[0.98] hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				Recusar desconto
			</button>
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
		justify-self: center;
	}
	.content-transition-slot {
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: stretch;
		overflow: visible;
		width: 100%;
		max-width: 32rem;
		box-sizing: border-box;
	}
</style>
