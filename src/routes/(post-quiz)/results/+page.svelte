<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { quizStore } from '$lib/stores/quiz.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import OfertaBeforeAfter from '$lib/components/oferta/OfertaBeforeAfter.svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	import VturbPlayer from '$lib/components/ui/VturbPlayer.svelte';
	import Mr1TestimonialCarousel from '$lib/components/ui/Mr1TestimonialCarousel.svelte';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';

	const checkoutUrl = env.PUBLIC_CHECKOUT_URL ?? '';

	const quiz = $derived($quizStore);
	const name = $derived($postQuizStore.name);

	type VturbPlayerConfig = {
		smartplayerId: string;
		scriptSrc: string;
	};

	/** Vídeo: como acessar o protocolo (ConverteAI / VTurb). */
	const vturbProtocoloAccess: VturbPlayerConfig = {
		smartplayerId: 'vid-67acd27d8fb98f1be6c5f861',
		scriptSrc:
			'https://scripts.converteai.net/a258539d-3567-40da-9aac-f9a431adf59f/players/67acd27d8fb98f1be6c5f861/v4/player.js'
	};


	/** Iniciais do nome: "Maria Silva" → "MS", "Pedro" → "PE" */
	const nameInitials = $derived.by(() => {
		const n = (name || '').trim();
		if (!n) return undefined;
		const words = n.split(/\s+/).filter(Boolean);
		if (words.length >= 2) {
			return (words[0][0] + words[words.length - 1][0]).toUpperCase();
		}
		return n.slice(0, 2).toUpperCase() || undefined;
	});

	// Só permite acessar esta tela se o usuário tiver completado o quiz (respondeu às perguntas)
	$effect(() => {
		if (!browser) return;
		const state = $quizStore;
		const hasCompletedQuiz = state.completedAt != null;
		if (!hasCompletedQuiz) {
			goto('/', { replaceState: true });
		}
	});

	const bodyFatLevel = $derived.by(() => {
		const v = quiz.answers['body_fat_level'];
		if (v == null) return null;
		const n = typeof v === 'string' ? parseInt(v, 10) : Array.isArray(v) ? parseInt(String(v[0]), 10) : Number(v);
		return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : null;
	});
	const bodyFatGoal = $derived.by(() => {
		const v = quiz.answers['body_fat_goal'];
		if (v == null) return null;
		const n = typeof v === 'string' ? parseInt(v, 10) : Array.isArray(v) ? parseInt(String(v[0]), 10) : Number(v);
		return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : null;
	});
	const genderAnswer = $derived(
		typeof quiz.answers['gender'] === 'string' ? quiz.answers['gender'] : undefined
	);

	const currentKg = $derived.by(() => {
		const raw = quiz.answers['weight_current_kg'];
		if (raw == null) return null;
		const n = typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(raw[0]) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});

	const goalKg = $derived.by(() => {
		const raw = quiz.answers['weight_goal_kg'];
		if (raw == null) return null;
		const n = typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(raw[0]) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});

	const eventTypeId = $derived(quiz.answers['event_type']);
	const hasEvent = $derived(
		typeof eventTypeId === 'string' && eventTypeId !== '' && eventTypeId !== 'event-nenhuma'
	);

	const EVENT_LABELS: Record<string, string> = {
		'event-viagem': 'suas férias',
		'event-casamento': 'o casamento',
		'event-aniversario': 'seu aniversário',
		'event-formatura': 'sua formatura',
		'event-familia': 'a reunião de família',
		'event-outro': 'seu evento'
	};
	const eventLabel = $derived(
		typeof eventTypeId === 'string' ? EVENT_LABELS[eventTypeId] ?? 'seu evento' : null
	);

	const rawEventDate = $derived(quiz.answers['event_date']);
	const eventDateFormatted = $derived.by(() => {
		const raw = typeof rawEventDate === 'string' ? rawEventDate : Array.isArray(rawEventDate) ? rawEventDate[0] : null;
		if (!raw) return null;
		const d = new Date(raw);
		return Number.isFinite(d.getTime()) ? formatDate(d) : null;
	});

	const kgToLose = $derived.by(() => {
		if (currentKg != null && goalKg != null && currentKg >= goalKg) return currentKg - goalKg;
		return null;
	});

	const goalLabel = $derived(
		quiz.answers['goal_type'] === 'goal-definir' ? 'definir o corpo' : 'emagrecer'
	);

	// Itens "Suas especificidades": só mostram se o usuário escolheu no quiz
	const showAdaptacao = $derived.by(() => {
		const v = quiz.answers['weight_medication_use'];
		const val = Array.isArray(v) ? v[0] : v;
		return val === 'med-glp1' || val === 'med-outro' || val === 'med-gostaria';
	});
	const showAerobico = $derived(false);
	const hasAnyEspecificidade = $derived(
		showAdaptacao || showAerobico || (hasEvent && !!eventLabel)
	);

	function formatDate(d: Date) {
		return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
	}

	// Faixa: visível após 50px de scroll, fixa no topo, clique leva ao bloco de preço
	let scrollY = $state(0);
	const showFaixa = $derived(scrollY >= 50);

	// Código de desconto: # + 4 primeiras letras do nome + 3 dígitos aleatórios (estável na sessão)
	let randomDigits = $state<number | null>(null);
	$effect(() => {
		if (typeof window !== 'undefined' && randomDigits === null) {
			randomDigits = Math.floor(100 + Math.random() * 900); // 100..999
		}
	});
	const discountCode = $derived.by(() => {
		const four = (name || '').trim().slice(0, 4).toUpperCase().replace(/\s/g, '') || 'LOTZ';
		const digits = randomDigits ?? 0;
		return `#${four}${digits}`;
	});

	// Toggles dos itens (Adaptação, Aeróbico, Acelerador) — começam ativados
	let toggleAdaptacao = $state(true);
	let toggleAerobico = $state(true);
	let toggleAcelerador = $state(true);

	let countdownSeconds = $state(15 * 60 + 9); // 15:09 — só decrementa após o gatilho do vídeo (resultsContentRevealed)
	$effect(() => {
		if (typeof window === 'undefined') return;
		const onScroll = () => { scrollY = window.scrollY };
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	});
	$effect(() => {
		if (typeof window === 'undefined' || !$postQuizStore.resultsContentRevealed) return;
		const t = setInterval(() => {
			const next = Math.max(0, countdownSeconds - 1);
			countdownSeconds = next;
		}, 1000);
		return () => clearInterval(t);
	});
	const countdownDisplay = $derived.by(() => {
		const m = Math.floor(countdownSeconds / 60);
		const s = countdownSeconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	});

	function scrollToPreco() {
		document.getElementById('bloco-preco')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function scrollToProtocoloSection() {
		document
			.getElementById('secao-acessar-protocolo')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/** Entrada em cascata (hero + bloco após o vídeo) */
	const cascadeDur = 520;
	const cascadeGap = 72;
	const cascadeY = 14;

	let resultsVturbDelayEl = $state<HTMLDivElement | undefined>();

	function isVturbDelaySlotVisible(el: HTMLElement) {
		return getComputedStyle(el).display !== 'none';
	}

	$effect(() => {
		if (!browser || !resultsVturbDelayEl) return;
		const el = resultsVturbDelayEl;
		if (isVturbDelaySlotVisible(el)) {
			postQuizStore.markResultsContentRevealed();
			return;
		}
		const mo = new MutationObserver(() => {
			if (isVturbDelaySlotVisible(el)) {
				postQuizStore.markResultsContentRevealed();
				mo.disconnect();
			}
		});
		mo.observe(el, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
		return () => mo.disconnect();
	});
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
</svelte:head>

<div class="flex flex-col gap-2.5 w-full min-w-0 min-h-full bg-bg text-center">
	<h1
		class="text-2xl font-extrabold text-heading leading-6 min-w-0"
		in:fly={{ y: cascadeY, duration: cascadeDur, delay: 0, easing: cubicOut }}
	>
		Assista o video para entender como acessar seu protocolo para <span class="text-accent">{goalLabel}</span>.
	</h1>
	<p
		class="text-sm text-body leading-[14px] max-w-md mx-auto min-w-0"
		in:fly={{ y: cascadeY, duration: cascadeDur, delay: cascadeGap, easing: cubicOut }}
	>
		Nesse video você vai entender como acessar o protocolo desenhado para você sair de
		{#if currentKg != null}
			<span class="text-accent font-bold">{currentKg}kg</span>
		{:else}
			<span class="text-accent">—</span>
		{/if}
		para
		{#if goalKg != null}
			<span class="text-accent font-bold">{goalKg}kg</span>
		{:else}
			<span class="text-accent">—</span>
		{/if}
		{#if hasEvent && eventLabel}
			, e estar pronto para <span class="text-accent font-bold">{eventLabel}</span>
		{/if}
		.
	</p>
	<div
		class="w-full max-w-md mx-auto min-w-0"
		in:fly={{ y: cascadeY, duration: cascadeDur, delay: cascadeGap * 2, easing: cubicOut }}
	>
		<VturbPlayer
			playerId={vturbProtocoloAccess.smartplayerId}
			scriptSrc={vturbProtocoloAccess.scriptSrc}
			revealHiddenAfterPlayback={{ seconds: 10, selectors: ['.results-vturb-delay'] }}
		/>
	</div>

	<div class="results-vturb-delay" bind:this={resultsVturbDelayEl}>
	<!-- Faixa fixa: desconto + countdown, aparece após 50px de scroll com transição suave; clique leva ao bloco de preço -->
	<button
		type="button"
		onclick={scrollToPreco}
		class="fixed left-0 right-0 top-0 z-20 flex w-full items-center justify-between gap-4 border-b border-line bg-surface px-4 py-3 text-left shadow-sm transition-all duration-300 ease-out hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent {showFaixa
			? 'translate-y-0 opacity-100'
			: '-translate-y-full opacity-0 pointer-events-none'}"
		aria-label="Ver oferta e preço"
		aria-hidden={!showFaixa}
	>
		<div class="flex flex-col gap-2.5">
			<span class="text-xs font-normal text-muted">Desconto aplicado</span>
			<span class="inline-flex w-fit rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-heading">{discountCode}</span>
		</div>
		<div class="flex flex-col items-end gap-2.5">
			<span class="text-xs font-normal text-muted">Se encerra em</span>
			<span class="text-lg font-bold tabular-nums text-red-500">{countdownDisplay}</span>
		</div>
	</button>

	<button
		type="button"
		onclick={scrollToProtocoloSection}
		class="w-full max-w-md mx-auto my-2.5 h-[60px] flex items-center justify-center rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
	>
		Acessar Protocolo
	</button>
	<h2 class="mt-[50px] py-[10px] text-2xl font-extrabold text-heading leading-[24px] text-center">
		{#if name.trim()}
			<span class="text-accent">{name.trim()}</span>, seu protocolo de desbloqueio feito para perder até
		{:else}
			Seu protocolo de desbloqueio feito para perder até
		{/if}
		{#if kgToLose != null}
			<span class="text-accent font-bold">{kgToLose}kg</span>
		{:else}
			<span class="text-accent font-bold">—</span>
		{/if}
		.
	</h2>
	<OfertaBeforeAfter
		bodyFatLevel={bodyFatLevel}
		bodyFatGoal={bodyFatGoal}
		genderAnswer={genderAnswer}
		weightCurrentKg={currentKg}
		weightGoalKg={goalKg}
	/>

	<div id="secao-acessar-protocolo" class="flex flex-col items-center gap-2.5 scroll-mt-4 mt-5 py-[10px]">
		<div class="flex justify-center">
			<AvatarStack initials={nameInitials} size="md" />
		</div>
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
			Seu protocolo está te esperando.
		</h2>
		<p class="text-sm text-body leading-[14px] max-w-md mx-auto">
			Você recebe todos esses itens ao contratar seu protocolo para emagrecer agora.
		</p>
	</div>

	<!-- Price Card: um único bloco verde (borda + fundo) com conteúdo arredondado em cima e embaixo -->
	<div
		id="bloco-preco"
		class="bloco-preco-shimmer relative w-full flex flex-col gap-2.5 text-left rounded-2xl border-[2px] border-accent bg-accent overflow-hidden mt-2.5"
	>
		<div class="flex flex-col gap-5 p-5 mx-0.5 mt-0.5 mb-0.5 rounded-2xl overflow-hidden border border-line/30 bg-surface">
			<!-- Header: título + R$47,00 e R$197 na mesma linha -->
			<div class="flex flex-col gap-2.5">
				<h3 class="text-lg font-extrabold text-heading leading-snug">
					Protocolo de desbloqueio{name.trim() ? ` ${name.trim()}` : ''}
				</h3>
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<span class="text-[32px] font-extrabold text-heading leading-none">R$47,00</span>
					<span class="text-base text-heading line-through shrink-0">R$197</span>
				</div>
				<span class="text-sm text-muted">ou 6x de R$7,83</span>
			</div>

			<!-- Divider -->
			<div class="border-t border-line/50"></div>

			<!-- Título da categoria -->
			<span class="text-xs font-medium text-muted">Você vai receber</span>

			<!-- Features: ícone 15×15 por item -->
			<ul class="flex flex-col gap-4">
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
					</span>
					<div class="flex flex-col gap-2.5">
						<span class="text-sm font-bold text-heading">Protocolo de Desbloqueio Personalizado</span>
						<span class="text-xs text-muted leading-relaxed">Calculado com base no seu metabolismo, objetivo, rotina e respostas do teste.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15v2c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2v-2"/><path d="M17 15V2"/></svg>
					</span>
					<div class="flex flex-col gap-2.5">
						<span class="text-sm font-bold text-heading">Plano Alimentar Personalizado</span>
						<span class="text-xs text-muted leading-relaxed">Com alimentos simples e adaptados ao seu dia a dia para acelerar o emagrecimento.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
					</span>
					<div class="flex flex-col gap-2.5 min-w-0 flex-1">
						<span class="text-sm font-bold text-heading">Acesso ao Aplicativo</span>
						<span class="text-xs text-muted leading-relaxed">Seu protocolo disponível na palma da sua mão.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
					</span>
					<div class="flex flex-col gap-2.5">
						<span class="text-sm font-bold text-heading">Acompanhamento pelo WhatsApp</span>
						<span class="text-xs text-muted leading-relaxed">Suporte direto da equipe durante todo o protocolo para acompanhar sua evolução.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
					</span>
					<div class="flex flex-col gap-2.5 min-w-0 flex-1">
						<div class="flex items-center justify-between gap-3 min-w-0">
							<span class="text-sm font-bold text-heading min-w-0 text-left">Mapa dos 14 Dias</span>
							<div class="flex shrink-0 items-center gap-2">
								<span class="inline-flex w-fit rounded-lg border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-heading">Bônus</span>
								<span class="text-sm font-bold tabular-nums text-red-500" aria-hidden="true">{countdownDisplay}</span>
							</div>
						</div>
						<span class="text-xs text-muted leading-relaxed">Checklist diário para acompanhar cada etapa e visualizar sua evolução.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
					</span>
					<div class="flex flex-col gap-2.5 min-w-0 flex-1">
						<div class="flex items-center justify-between gap-3 min-w-0">
							<span class="text-sm font-bold text-heading min-w-0 text-left">Guia do Fim de Semana</span>
							<div class="flex shrink-0 items-center gap-2">
								<span class="inline-flex w-fit rounded-lg border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-heading">Bônus</span>
								<span class="text-sm font-bold tabular-nums text-red-500" aria-hidden="true">{countdownDisplay}</span>
							</div>
						</div>
						<span class="text-xs text-muted leading-relaxed">Estratégia para refeições livres sem perder os resultados do protocolo.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
					</span>
					<div class="flex flex-col gap-2.5">
						<span class="text-sm font-bold text-heading">Garantia Total de 14 Dias</span>
						<span class="text-xs text-muted leading-relaxed">Faça o protocolo completo. Se não tiver resultado, devolvemos 100% do seu dinheiro.</span>
					</div>
				</li>
			</ul>

			{#if hasAnyEspecificidade}
			<!-- Divider -->
			<div class="border-t border-line/50"></div>

			<!-- Título da categoria -->
			<span class="text-xs font-medium text-muted">Suas especificidades</span>

			<!-- Itens com toggle à esquerda (ativar/desativar) — só os que o usuário escolheu no quiz -->
			<ul class="flex flex-col gap-4">
				{#if showAdaptacao}
				<li class="flex items-center gap-3">
					<button
						type="button"
						class="results-toggle shrink-0 w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 {toggleAdaptacao ? 'bg-accent' : 'bg-line/50'}"
						aria-pressed={toggleAdaptacao}
						aria-label="Alternar adaptação ao tratamento"
						onclick={() => (toggleAdaptacao = !toggleAdaptacao)}
					>
						<span
							class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 {toggleAdaptacao ? 'left-[18px]' : 'left-0.5'}"
						></span>
					</button>
					<div class="flex flex-col gap-2.5 min-w-0">
						<span class="text-sm font-bold text-heading">Adaptação ao tratamento</span>
						<span class="text-xs text-muted leading-[19.5px]">Treino alinhado ao uso de medicamentos como <span class="text-accent">Mounjaro</span> ou <span class="text-accent">Ozempic</span>.</span>
					</div>
				</li>
				{/if}
				{#if showAerobico}
				<li class="flex items-center gap-3">
					<button
						type="button"
						class="results-toggle shrink-0 w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 {toggleAerobico ? 'bg-accent' : 'bg-line/50'}"
						aria-pressed={toggleAerobico}
						aria-label="Alternar treino aeróbico estratégico"
						onclick={() => (toggleAerobico = !toggleAerobico)}
					>
						<span
							class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 {toggleAerobico ? 'left-[18px]' : 'left-0.5'}"
						></span>
					</button>
					<div class="flex flex-col gap-2.5 min-w-0">
						<span class="text-sm font-bold text-heading">Treino aeróbico estratégico</span>
						<span class="text-xs text-muted leading-[19.5px]">Sessões incluídas para aumentar o gasto calórico dentro do seu protocolo para <span class="text-accent">{goalLabel}</span>.</span>
					</div>
				</li>
				{/if}
				{#if hasEvent && eventLabel}
					<li class="flex items-center gap-3">
						<button
							type="button"
							class="results-toggle shrink-0 w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 {toggleAcelerador ? 'bg-accent' : 'bg-line/50'}"
							aria-pressed={toggleAcelerador}
							aria-label="Alternar acelerador"
							onclick={() => (toggleAcelerador = !toggleAcelerador)}
						>
							<span
								class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 {toggleAcelerador ? 'left-[18px]' : 'left-0.5'}"
							></span>
						</button>
						<div class="flex flex-col gap-2.5 min-w-0">
							<span class="text-sm font-bold text-heading">Acelerador para {name?.trim() || 'você'}</span>
							<span class="text-xs text-muted leading-[19.5px]">
								Plano adaptado para intensificar sua evolução até <span class="text-accent">{eventLabel}</span>
								{#if eventDateFormatted} em <span class="text-accent">{eventDateFormatted}</span>{/if}.
							</span>
						</div>
					</li>
				{/if}
			</ul>
			{/if}
		</div>

		<!-- Bloco do botão: div "debaixo" com efeito sobreposto -->
		<a
			href={checkoutUrl || '#'}
			target={checkoutUrl ? '_blank' : undefined}
			rel={checkoutUrl ? 'noopener noreferrer' : undefined}
			class="mx-0.5 mb-0.5 flex items-center justify-center gap-2 rounded-b-2xl px-5 py-[27.5px] font-black text-base tracking-widest text-bg bg-transparent transition-all duration-200 active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-inset"
			onclick={(e) => {
				postQuizStore.markComecarAgoraClicked();
				if (!checkoutUrl) e.preventDefault();
			}}
		>
			COMEÇAR AGORA
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cta-arrow">
				<path d="M5 12h14M12 5l7 7-7 7"/>
			</svg>
		</a>
	</div>

	<img
		src="/payment-methods.png"
		alt="Formas de pagamento: Pix, Apple Pay, Google Pay, Mastercard, Visa e outros"
		class="w-full h-auto object-contain mt-2.5"
	/>

	<h2 class="pt-[25px] text-2xl font-extrabold text-heading leading-[24px] text-center">
		Veja o resultado de algumas pessoas que aplicaram o Protocolo Desbloqueio.
	</h2>

	<div class="mt-2.5 w-full min-w-0 max-w-full overflow-hidden">
		<Mr1TestimonialCarousel compactTop />
	</div>

	<!-- Bloco de garantia 14 dias -->
	<div
		class="my-[25px] w-full rounded-2xl bg-accent px-4 py-[25px] text-left text-bg"
		role="region"
		aria-labelledby="garantia-heading"
	>
		<img
			src="/garantia-14-dias-badge.png"
			alt="Selo: reembolso garantia 14 dias"
			class="h-20 w-20 shrink-0 object-contain"
		/>
		<h2
			id="garantia-heading"
			class="mt-2.5 text-2xl font-extrabold leading-[24px] text-bg"
		>
			<span>Garantia incondicional</span><br />
			<span>de 14 dias</span>
		</h2>
		<p class="mt-2.5 text-sm font-normal leading-relaxed text-bg/90">
			Confiamos tanto no <span class="font-semibold">Protocolo de Desbloqueio</span> que você pode testá-lo com total tranquilidade. Se, em até 14 dias, você sentir que não é para você, basta enviar uma mensagem para nossa equipe e devolveremos 100% do seu dinheiro.
		</p>
	</div>

	<!-- Perguntas Frequentes -->
	<section class="w-full flex flex-col gap-2.5 text-center" aria-labelledby="faq-heading">
		<h2 id="faq-heading" class="mt-[25px] mb-2.5 pt-[25px] text-2xl font-extrabold text-heading leading-[24px]">
			Perguntas Frequentes
		</h2>
		<p class="text-sm text-body leading-[14px] max-w-md mx-auto pb-2.5">
			Aqui estão algumas das perguntas que mais recebemos sobre o protocolo de desbloqueio.
		</p>
		<div class="w-full flex flex-col text-left border-t border-line/50 mt-2.5">
			{#each [
				{
					q: 'Isso realmente funciona ou é só mais uma dieta da internet?',
					a: 'Não é uma dieta genérica. O protocolo é calculado com base nos seus números, rotina, objetivo e histórico para criar um desbloqueio metabólico rápido e personalizado.'
				},
				{
					q: 'Em quanto tempo começo a ver resultado?',
					a: 'A maior parte das mulheres começa a perceber diferença já nos primeiros dias, principalmente em desinchaço, leveza e medidas. O protocolo foi estruturado para acelerar resultados nos 14 primeiros dias.'
				},
				{
					q: 'Vou precisar cortar tudo que gosto de comer?',
					a: 'Não. O protocolo foi pensado para funcionar na vida real, com alimentos simples, baratos e do dia a dia. Inclusive existe um Guia do Fim de Semana para você conseguir seguir mesmo em momentos sociais.'
				},
				{
					q: 'E se eu já tiver tentado emagrecer várias vezes antes?',
					a: 'Na verdade, a maioria das mulheres que entram no protocolo já tentou várias dietas antes e sentia que o corpo "travava". O foco aqui é justamente destravar esse padrão metabólico.'
				},
				{
					q: 'Vou passar fome durante o processo?',
					a: 'O protocolo não foi criado para você sofrer. As etapas e a quantidade de proteína são ajustadas para acelerar o metabolismo enquanto preservam sua saciedade e massa muscular.'
				},
				{
					q: 'Como recebo meu protocolo personalizado?',
					a: 'Após finalizar sua inscrição e formulário, sua análise é feita pela equipe e o protocolo completo é enviado diretamente no seu WhatsApp em até 24 horas.'
				},
				{
					q: 'Tem acompanhamento durante os 14 dias?',
					a: 'Sim. Você terá suporte direto pelo WhatsApp para tirar dúvidas e receber orientações durante todo o processo.'
				},
				{
					q: 'E se eu não gostar ou não funcionar para mim?',
					a: 'Você fica protegida pela garantia completa. Pode fazer o protocolo inteiro e, se sentir que não era para você, basta pedir o reembolso dentro do prazo informado. Sem burocracia.'
				}
			] as faq, i}
				<details
					class="group border-b border-line/50"
					aria-label="{faq.q}"
				>
					<summary
						class="flex items-center justify-between gap-3 list-none py-4 cursor-pointer text-heading text-base font-medium transition-colors [&::-webkit-details-marker]:hidden"
					>
						<span>{faq.q}</span>
						<svg
							class="w-5 h-5 shrink-0 text-body transition-transform duration-200 group-open:rotate-180"
							aria-hidden="true"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</summary>
					<div class="pb-4 faq-answer text-body leading-relaxed">
						<p>{faq.a}</p>
					</div>
				</details>
			{/each}
		</div>
	</section>

	<div class="w-full pt-10 pb-2 border-t border-line/70 shrink-0">
		<LegalFooter />
	</div>

	</div>
</div>

<style>
	/* Conteúdo revelado após o vídeo: entra em cascata quando o bloco deixa display:none */
	@keyframes results-cascade-in {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	/* 1º filho = faixa fixa (opacity/translate controlados pelo scroll) — sem animação */
	.results-vturb-delay > :nth-child(n + 2) {
		opacity: 0;
		transform: translateY(14px);
		animation: results-cascade-in 0.52s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}
	.results-vturb-delay > :nth-child(2) {
		animation-delay: 0.05s;
	}
	.results-vturb-delay > :nth-child(3) {
		animation-delay: 0.11s;
	}
	.results-vturb-delay > :nth-child(4) {
		animation-delay: 0.17s;
	}
	.results-vturb-delay > :nth-child(5) {
		animation-delay: 0.23s;
	}
	.results-vturb-delay > :nth-child(6) {
		animation-delay: 0.29s;
	}
	.results-vturb-delay > :nth-child(7) {
		animation-delay: 0.35s;
	}
	.results-vturb-delay > :nth-child(8) {
		animation-delay: 0.41s;
	}
	.results-vturb-delay > :nth-child(9) {
		animation-delay: 0.47s;
	}
	.results-vturb-delay > :nth-child(10) {
		animation-delay: 0.53s;
	}
	.results-vturb-delay > :nth-child(11) {
		animation-delay: 0.59s;
	}
	.results-vturb-delay > :nth-child(12) {
		animation-delay: 0.65s;
	}
	@media (prefers-reduced-motion: reduce) {
		.results-vturb-delay > :nth-child(n + 2) {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}

	/* Respostas do FAQ: mini texto (Pulse 1) */
	.faq-answer {
		font-size: 0.8125rem; /* 13px - Pulse 1 */
		line-height: 1.4;
	}

	.bloco-preco-shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 40%,
			rgba(255, 255, 255, 0.24) 50%,
			transparent 60%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: bloco-preco-shimmer 2.5s ease-in-out infinite;
		pointer-events: none;
		z-index: 0;
	}
	.bloco-preco-shimmer > * {
		position: relative;
		z-index: 1;
	}
	@keyframes bloco-preco-shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	.cta-arrow {
		animation: cta-arrow-bounce 1.2s ease-in-out infinite;
	}
	@keyframes cta-arrow-bounce {
		0%,
		100% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(5px);
		}
	}
</style>
