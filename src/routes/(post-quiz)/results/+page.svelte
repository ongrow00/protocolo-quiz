<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { quizStore } from '$lib/stores/quiz.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import OfertaBeforeAfter from '$lib/components/oferta/OfertaBeforeAfter.svelte';
	import WeightLossLineChart from '$lib/components/quiz/WeightLossLineChart.svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';

	const checkoutUrl = env.PUBLIC_CHECKOUT_URL ?? '';

	const quiz = $derived($quizStore);
	const name = $derived($postQuizStore.name);

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

	/** Semanas estimadas para o gráfico (mesma lógica do micro-result mr-3) */
	const weeksEstimate = $derived.by(() => {
		if (currentKg == null || goalKg == null) return 12;
		const kgToReach = Math.abs(goalKg - currentKg);
		return kgToReach > 0 ? Math.ceil(kgToReach * 2) : 12;
	});

	const goalLabel = $derived(
		quiz.answers['goal_type'] === 'goal-massa' ? 'ganhar massa' : 'emagrecer'
	);

	// Itens "Suas especificidades": só mostram se o usuário escolheu no quiz
	const showAdaptacao = $derived.by(() => {
		const v = quiz.answers['weight_medication_use'];
		const val = Array.isArray(v) ? v[0] : v;
		return val === 'med-sim' || val === 'med-interesse';
	});
	const showAerobico = $derived.by(() => {
		const v = quiz.answers['cardio_enabled'];
		const val = Array.isArray(v) ? v[0] : v;
		return val === 'cardio-sim';
	});
	const hasAnyEspecificidade = $derived(
		showAdaptacao || showAerobico || (hasEvent && !!eventLabel)
	);

	// Timeline: datas para hoje, dia 3 e dia 7 (dd/MM/yyyy)
	const today = new Date();
	function formatDate(d: Date) {
		return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
	}
	const dateHoje = $derived(formatDate(today));
	const dateDia3 = $derived(formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)));
	const dateDia7 = $derived(formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)));

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

	let countdownSeconds = $state(15 * 60 + 9); // 15:09
	$effect(() => {
		if (typeof window === 'undefined') return;
		const onScroll = () => { scrollY = window.scrollY };
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	});
	$effect(() => {
		if (typeof window === 'undefined' || !showFaixa) return;
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
</script>

<svelte:head>
	<title>Seus Resultados | Lotz</title>
</svelte:head>

<div class="flex flex-col gap-8 w-full min-w-0 text-center">
	<!-- Faixa fixa: desconto + countdown, aparece após 50px de scroll com transição suave; clique leva ao bloco de preço -->
	<button
		type="button"
		onclick={scrollToPreco}
		class="fixed left-0 right-0 top-0 z-20 flex w-full items-center justify-between gap-4 bg-[#212121] px-4 py-3 text-left transition-all duration-300 ease-out hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent {showFaixa
			? 'translate-y-0 opacity-100'
			: '-translate-y-full opacity-0 pointer-events-none'}"
		aria-label="Ver oferta e preço"
		aria-hidden={!showFaixa}
	>
		<div class="flex flex-col gap-1">
			<span class="text-xs font-normal text-white/80">Desconto aplicado</span>
			<span class="inline-flex w-fit rounded-lg bg-[#3A3A3A] px-3 py-1.5 text-xs font-bold text-white">{discountCode}</span>
		</div>
		<div class="flex flex-col items-end gap-1">
			<span class="text-xs font-normal text-white/80">Se encerra em</span>
			<span class="text-lg font-bold tabular-nums text-red-500">{countdownDisplay}</span>
		</div>
	</button>

	<h1 class="text-2xl font-extrabold text-heading leading-6">
		Assista o video para entender como acessar seu protocolo para <span class="text-accent">emagrecer</span>.
	</h1>
	<p class="text-sm text-body leading-[14px] max-w-md mx-auto">
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
	<img
		src="/oferta-video-thumbnail.png"
		alt="Assista o vídeo para acessar seu protocolo"
		class="w-full max-w-md mx-auto rounded-2xl"
	/>
	<h2 class="text-2xl font-extrabold text-heading leading-6 text-center">
		{#if name.trim()}
			<span class="text-accent">{name.trim()}</span>, seu protocolo
		{:else}
			Seu protocolo
		{/if}
		<span class="text-accent">milimetricamente</span> desenhado para perder até
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

	{#if currentKg != null && goalKg != null}
		<div class="flex flex-col gap-3 w-full items-center px-4">
			<h3 class="text-heading text-base font-medium w-full text-left">Evolução de peso</h3>
			<div class="w-full">
				<WeightLossLineChart
					currentKg={currentKg}
					goalKg={goalKg}
					weeks={weeksEstimate}
					hideAxisLabels
				/>
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-4">
		<div class="flex justify-center">
			<AvatarStack initials={nameInitials} size="md" />
		</div>
		<h2 class="text-2xl font-extrabold text-heading leading-6">
			Acesse seu protocolo para ter resultados <span class="text-accent">2.5X</span> mais rápido.
		</h2>
		<p class="text-sm text-body leading-[14px] max-w-md mx-auto">
			Você recebe todos esses itens ao contratar seu protocolo para emagrecer agora.
		</p>
	</div>

	<!-- Price Card: um único bloco verde (borda + fundo) com conteúdo arredondado em cima e embaixo -->
	<div
		id="bloco-preco"
		class="bloco-preco-shimmer relative w-full flex flex-col text-left rounded-2xl border-[2px] border-accent bg-accent overflow-hidden"
	>
		<div class="flex flex-col gap-5 p-5 mx-0.5 mt-0.5 mb-0.5 rounded-2xl overflow-hidden border border-line/30 bg-surface">
			<!-- Header: título + 12x de acima do preço + R$33,12 e R$597 na mesma linha -->
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-extrabold text-heading pt-2.5 pb-[15px]">
					Protocolo{name.trim() ? ` ${name.trim()}` : ''}
				</h3>
				<span class="text-sm text-muted">12x de</span>
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<span class="text-[32px] font-extrabold text-heading leading-none">R$33,12</span>
					<span class="text-base text-heading line-through shrink-0">R$597</span>
				</div>
				<span class="text-sm text-muted">Ou R$397 à vista</span>
			</div>

			<!-- Divider -->
			<div class="border-t border-line/50"></div>

			<!-- Título da categoria -->
			<span class="text-xs font-medium text-muted">Você vai receber</span>

			<!-- Features: ícone 10×10 por categoria -->
			<ul class="flex flex-col gap-4">
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-accent" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
					</span>
					<div class="flex flex-col gap-0.5">
						<span class="text-sm font-bold text-heading">Protocolo Personalizado para {goalLabel === 'emagrecer' ? 'Emagrecer' : 'Ganhar Massa'}</span>
						<span class="text-xs text-muted leading-relaxed">Plano de treino desenhado milimetricamente pelo Lotz com base nas suas respostas e no seu objetivo.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-accent" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
					</span>
					<div class="flex flex-col gap-0.5 min-w-0 flex-1">
						<span class="flex items-center gap-2 flex-wrap">
							<span class="text-sm font-bold text-heading">Acesso ao Aplicativo</span>
							<span class="flex items-center gap-1 shrink-0" aria-hidden="true">
								<img src="/apple-logo.png" alt="" width="14" height="14" class="w-[14px] h-[14px] object-contain" />
								<img src="/google-play-logo.png" alt="" width="14" height="14" class="w-[14px] h-[14px] object-contain" />
							</span>
						</span>
						<span class="text-xs text-muted leading-relaxed">Sua ficha de treino e acompanhamento da sua evolução sempre na palma da mão.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-accent" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
					</span>
					<div class="flex flex-col gap-0.5">
						<span class="text-sm font-bold text-heading">3 Meses de Acompanhamento Individual</span>
						<span class="text-xs text-muted leading-relaxed">Acesso ao WhatsApp individual para acompanhar sua evolução e adaptar o protocolo.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-accent" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15v2c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2v-2"/><path d="M17 15V2"/></svg>
					</span>
					<div class="flex flex-col gap-0.5">
						<span class="flex items-center gap-2 flex-wrap">
							<span class="text-sm font-bold text-heading">Plano Alimentar Personalizado</span>
							<span class="flex items-center gap-1.5 shrink-0">
								<span class="rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-accent">bônus</span>
								<span class="text-[9px] font-medium tabular-nums text-red-500">{countdownDisplay}</span>
							</span>
						</span>
						<span class="text-xs text-muted leading-relaxed">Feito por uma nutricionista exclusivamente para você e para o seu objetivo de <span class="text-accent">{goalLabel}</span>.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-accent" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
					</span>
					<div class="flex flex-col gap-0.5">
						<span class="flex items-center gap-2 flex-wrap">
							<span class="text-sm font-bold text-heading">Lotz Academy</span>
							<span class="flex items-center gap-1.5 shrink-0">
								<span class="rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-accent">bônus</span>
								<span class="text-[9px] font-medium tabular-nums text-red-500">{countdownDisplay}</span>
							</span>
						</span>
						<span class="text-xs text-muted leading-relaxed">Acesso à nossa plataforma de videoaulas com mais de 5 categorias de treino.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-accent" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
					</span>
					<div class="flex flex-col gap-0.5">
						<span class="text-sm font-bold text-heading">Garantia de 7 Dias</span>
						<span class="text-xs text-muted leading-relaxed">Experimente nosso serviço por 7 dias e veja se é para você. Se não for, devolvemos tudo.</span>
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
					<div class="flex flex-col gap-0.5 min-w-0">
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
					<div class="flex flex-col gap-0.5 min-w-0">
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
						<div class="flex flex-col gap-0.5 min-w-0">
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
		class="w-full h-auto object-contain"
	/>
	<h2 class="text-2xl font-extrabold text-heading leading-6 text-center">
		Como serão os próximos passos a partir daqui.
	</h2>

	<!-- Timeline: Hoje, Dia 3, Dia 7 -->
	<div class="w-full rounded-2xl bg-bg overflow-hidden text-left">
		<div class="relative px-4 py-6">
			<!-- Linha vertical da timeline (centralizada com as bolinhas: left-7 = 28px = 16px padding + 12px meio do círculo) -->
			<div
				class="absolute left-7 top-8 bottom-8 w-[3px] -translate-x-1/2 bg-line"
				aria-hidden="true"
			></div>

			<!-- Hoje -->
			<div class="relative flex gap-4 pb-8">
				<div
					class="timeline-dot-shimmer relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface"
					aria-hidden="true"
				>
					<span class="h-2 w-2 rounded-full bg-accent"></span>
				</div>
				<div class="flex-1 min-w-0 pt-0.5 text-left">
					<p class="font-bold text-heading">Hoje — <span class="font-normal">{dateHoje}</span></p>
					<p class="mt-1 text-sm text-body leading-none text-left">
						Você garante seu Protocolo Personalizado de Emagrecimento e já recebe acesso imediato ao aplicativo exclusivo e aos bônus. Nossa equipe entra em contato com você no WhatsApp para iniciar seu acompanhamento.
					</p>
				</div>
			</div>

			<!-- Dia 3 -->
			<div class="relative flex gap-4 pb-8">
				<div
					class="relative z-10 h-6 w-6 shrink-0 rounded-full border-2 border-line bg-line"
					aria-hidden="true"
				></div>
				<div class="flex-1 min-w-0 pt-0.5 text-left">
					<p class="font-bold text-heading">Dia 3 — <span class="font-normal">{dateDia3}</span></p>
					<p class="mt-1 text-sm text-body leading-none text-left">
						Entregamos seu plano de treino totalmente desenhado para você, com orientações claras para começar da forma certa e já sentir evolução nas primeiras semanas.
					</p>
				</div>
			</div>

			<!-- Dia 7 -->
			<div class="relative flex gap-4">
				<div
					class="relative z-10 h-6 w-6 shrink-0 rounded-full border-2 border-line bg-line"
					aria-hidden="true"
				></div>
				<div class="flex-1 min-w-0 pt-0.5 text-left">
					<p class="font-bold text-heading">Dia 7 — <span class="font-normal">{dateDia7}</span></p>
					<p class="mt-1 text-sm text-body leading-none text-left">
						Você recebe seu plano alimentar individualizado, criado por nutricionista para acelerar seu plano de emagrecimento.
					</p>
				</div>
			</div>
		</div>
	</div>

	<h2 class="text-2xl font-extrabold text-heading leading-6 text-center">
		Veja o resultado de algumas pessoas que aplicaram o protocolo Lotz
	</h2>

	<div class="mt-4 w-full aspect-video rounded-lg bg-gray-300" aria-hidden="true"></div>

	<!-- Bloco de garantia 7 dias -->
	<div
		class="w-full rounded-2xl bg-[#1B1B1E] px-4 py-6 text-left"
		role="region"
		aria-labelledby="garantia-heading"
	>
		<img
			src="/garantia-7-dias-badge.png"
			alt="Selo: Reembolso garantia 7 dias"
			class="h-20 w-20 shrink-0 object-contain"
		/>
		<h2
			id="garantia-heading"
			class="mt-4 text-2xl font-extrabold leading-tight text-white"
		>
			<span>Garantia incondicional</span><br />
			<span>de 7 dias</span>
		</h2>
		<p class="mt-4 text-sm font-normal leading-none text-white">
			Nós confiamos tanto no método protocolo Lotz que você pode testar o protocolo com total tranquilidade. Se dentro de 7 dias você sentir que não é para você, basta enviar uma mensagem para nossa equipe e devolveremos 100% do seu dinheiro.
		</p>
	</div>

	<!-- Perguntas Frequentes -->
	<section class="w-full flex flex-col gap-4 text-center" aria-labelledby="faq-heading">
		<h2 id="faq-heading" class="text-2xl font-extrabold text-heading leading-6">
			Perguntas Frequentes
		</h2>
		<p class="text-sm text-body leading-[14px] max-w-md mx-auto">
			Aqui estão algumas das perguntas que mais recebemos em relação ao protocolo Lotz Para emagrecer.
		</p>
		<div class="w-full flex flex-col text-left border-t border-line/50">
			{#each [
				{
					q: 'Isso é só mais um curso ou planilha?',
					a: 'Não. Aqui você não está comprando conteúdo genérico. Você recebe um protocolo construído do zero com base nas suas respostas, considerando seu corpo, sua rotina e o seu objetivo. E mais importante: você não fica sozinho. Existe acompanhamento individual no WhatsApp e ajustes ao longo do processo. Curso você abandona. Planilha você ignora. Aqui você é acompanhado até o resultado.'
				},
				{
					q: 'Vou ter acompanhamento individual mesmo?',
					a: 'Sim, de verdade. Você vai ter uma pessoa do nosso time falando com você diretamente no WhatsApp. Não é grupo, não é robô. É alguém acompanhando seu processo, tirando dúvidas, ajustando o plano e garantindo que você continue avançando, mesmo quando a motivação oscila.'
				},
				{
					q: 'Já tentei de tudo… por que isso seria diferente?',
					a: 'Porque dessa vez o ponto de partida muda. Tudo que você tentou antes provavelmente era genérico, feito para qualquer pessoa. Aqui o protocolo é construído a partir das suas respostas, entendendo como o seu corpo funciona e qual é a sua rotina real. Não é mais uma tentativa. É a primeira vez que o método se adapta a você, e não o contrário.'
				},
				{
					q: 'Funciona para quem tem pouco tempo?',
					a: 'Funciona principalmente para quem tem pouco tempo. O protocolo é ajustado com base na sua disponibilidade real. Quantos dias você pode treinar, quanto tempo você tem e como é a sua rotina. A ideia não é encaixar sua vida no treino, é encaixar o treino na sua vida. E o mais importante: resultado não vem de treinar mais, vem de treinar certo.'
				},
				{
					q: 'Existe garantia se eu não tiver resultado?',
					a: 'Sim. Você tem duas garantias. A primeira é de 7 dias, onde você pode pedir 100% do seu dinheiro de volta por qualquer motivo. A segunda é a garantia de resultado. Se você seguir o protocolo durante os 90 dias e não tiver evolução, nós devolvemos o seu dinheiro. Ou seja, o risco fica todo com a gente.'
				},
				{
					q: 'Quais são as formas de pagamento?',
					a: 'Você pode pagar com cartão de crédito, podendo parcelar, ou via PIX à vista. Assim que o pagamento for confirmado, o acesso já é liberado e você recebe todas as instruções.'
				},
				{
					q: 'Em quanto tempo começo a ver resultado?',
					a: 'Os primeiros sinais aparecem rápido. Você começa a sentir mais disposição, melhor recuperação e a sensação de que o treino está funcionando de verdade. As mudanças no corpo começam a aparecer nas primeiras semanas e evoluem ao longo dos 90 dias.'
				},
				{
					q: 'Preciso treinar em academia?',
					a: 'Não precisa. O protocolo é adaptado para o ambiente que você tem disponível. Pode ser academia, casa ou condomínio. Tudo é ajustado para a sua realidade.'
				},
				{
					q: 'Preciso fazer dieta restritiva?',
					a: 'Não. Você recebe um plano alimentar personalizado, pensado para o seu objetivo e sua rotina. A ideia não é cortar tudo, é criar uma estratégia que você consiga manter e que funcione no longo prazo.'
				},
				{
					q: 'E se eu perder a motivação no meio do caminho?',
					a: 'Você não depende só de motivação. Quando você abre o app e já sabe exatamente o que fazer, fica muito mais fácil seguir. E além disso, você tem acompanhamento no WhatsApp para ajustar o plano e te manter em movimento. E tem uma coisa importante: quando você começa a ver resultado, a motivação aparece naturalmente.'
				},
				{
					q: 'Quando eu começo depois da compra?',
					a: 'Na hora. Assim que o pagamento é aprovado, você já recebe acesso ao aplicativo e as instruções por WhatsApp e email. No próximo dia útil, seu coach entra em contato e o seu protocolo começa a ser montado. A partir daí, o seu acompanhamento já começa.'
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
</div>

<style>
	/* Respostas do FAQ: mini texto (Pulse 1) */
	.faq-answer {
		font-size: 0.8125rem; /* 13px - Pulse 1 */
		line-height: 1.4;
	}

	.timeline-dot-shimmer {
		animation: timeline-dot-shimmer 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}
	@keyframes timeline-dot-shimmer {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(157, 187, 84, 0.5), 0 0 10px 2px rgba(157, 187, 84, 0.25);
			opacity: 1;
		}
		50% {
			box-shadow: 0 0 0 6px rgba(157, 187, 84, 0), 0 0 18px 4px rgba(157, 187, 84, 0.12);
			opacity: 0.95;
		}
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
