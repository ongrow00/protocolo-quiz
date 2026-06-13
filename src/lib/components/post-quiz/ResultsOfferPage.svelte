<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { quizStore } from '$lib/stores/quiz.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	import VturbPlayer from '$lib/components/ui/VturbPlayer.svelte';
	import { ATIVACAO_VTURB_DELAY_SEC, RESULTS_VTURB_DELAY_SEC } from '$lib/constants/mr3-vturb';
	import { RESULTS_OFFER } from '$lib/data/results-offer';
	import Mr1TestimonialCarousel from '$lib/components/ui/Mr1TestimonialCarousel.svelte';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import OfferHeroProgress from '$lib/components/post-quiz/OfferHeroProgress.svelte';
	import MealFoodPreferencePicker from '$lib/components/post-quiz/MealFoodPreferencePicker.svelte';
	import MealFollowUpQuestions from '$lib/components/post-quiz/MealFollowUpQuestions.svelte';
	import type { MealBlockId, MealSelections } from '$lib/data/meal-preferences';
	import type { MealFollowUpAnswer } from '$lib/data/meal-follow-up-questions';
	import { computePhase1Macros, DEFAULT_DAILY_MACRO_GOALS } from '$lib/utils/macros';
	import { persistActivationMealPlan } from '$lib/services/meal-plan-activation.service';
	import type { UtmParams } from '$lib/data/types';
	import { authStore } from '$lib/stores/auth.store';
	import { sessionStore } from '$lib/stores/session.store';
	import { loadAppCheckoutState, loadProfileUtm } from '$lib/services/profile-utm.service';
	import {
		appendCheckoutParams,
		buildAppCheckoutUrl,
		EMPTY_APP_CHECKOUT_STATE,
		mergeUtmParams,
		type AppCheckoutState
	} from '$lib/utils/checkout-url';

	type ResultsOfferVariant = 'results' | 'ativacao';

	export type OfferFeatureIcon =
		| 'calendar'
		| 'clipboard'
		| 'mobile'
		| 'chat'
		| 'lessons'
		| 'video'
		| 'food'
		| 'chart'
		| 'fire'
		| 'shield';

	export type OfferFeatureItem = {
		title: string;
		description: string;
		bonus?: boolean;
		icon: OfferFeatureIcon;
	};

	export type OfferGuarantee = {
		badgeSrc: string;
		badgeAlt: string;
		daysLabel: string;
		productName: string;
		body: string;
	};

	export type OfferFaqItem = { q: string; a: string };

	export type OfferFaq = {
		intro: string;
		items: OfferFaqItem[];
	};

	const DEFAULT_OFFER_FAQ: OfferFaq = {
		intro: 'Aqui estão algumas das perguntas que mais recebemos sobre o protocolo de desbloqueio.',
		items: [
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
		]
	};

	export type OfferPricing = {
		/** Título do card de preço (substitui "Protocolo de desbloqueio {nome}"). */
		productTitle?: string;
		/** Ex.: "12x de" — `text-sm` ao lado do valor principal. */
		mainPricePrefix?: string;
		mainPriceAmount?: string;
		/** Fallback em uma linha só (sem prefixo menor). */
		mainPrice?: string;
		secondaryLabel: string;
		compareAtPrice: string;
	};

	export type HeroHeadlineSegment = { text: string; bold?: boolean };
	export type HeroHeadline = string | readonly HeroHeadlineSegment[];

	export type HeroProgress = {
		currentStep: number;
		steps: readonly { label: string }[];
	};

	export type OfferDeclineModal = {
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
	};

	export type OfferCta = {
		primaryLabel: string;
		declineLabel: string;
		/** Checkout Lastlink do CTA principal (abre em nova aba com UTMs + src). */
		checkoutUrl?: string;
		checkoutSrc?: string;
		declineModal?: OfferDeclineModal;
	};

	export type OfferAccessSection = {
		title: readonly HeroHeadlineSegment[];
		subtitle: string | readonly HeroHeadlineSegment[];
	};

	interface Props {
		/** `ativacao`: sem faixa fixa, profissional nem carrossel (só /atiavacao-de-conta). */
		variant?: ResultsOfferVariant;
		/** Lista customizada do bloco "Você vai receber" (ex.: `/atiavacao-de-conta`). */
		offerFeatures?: OfferFeatureItem[];
		/** Preços customizados do bloco (ex.: `/atiavacao-de-conta`). */
		offerPricing?: OfferPricing;
		/** Bloco de garantia customizado (ex.: `/atiavacao-de-conta`). */
		offerGuarantee?: OfferGuarantee;
		/** FAQ customizado (ex.: `/atiavacao-de-conta`). */
		offerFaq?: OfferFaq;
		/** Headline do hero (substitui o título padrão acima do vídeo). */
		heroHeadline?: HeroHeadline;
		/** Subtítulo abaixo do headline do hero (ex.: /ativacao). */
		heroSubheadline?: HeroHeadline;
		/** Stepper de progresso acima do hero. */
		heroProgress?: HeroProgress;
		/** CTAs do bloco de preço (ex.: `/atiavacao-de-conta`). */
		offerCta?: OfferCta;
		/** Textos da seção acima do bloco de preço (ex.: `/atiavacao-de-conta`). */
		offerAccessSection?: OfferAccessSection;
		/** When provided, the primary CTA becomes a button that calls this instead of navigating to checkout. */
		onPrimaryCta?: () => void;
		/** When provided, declining the offer calls this instead of navigating back. */
		onDeclineCta?: () => void;
		/** Link "Sair" no rodapé (ex.: logout na /ativacao). */
		onExitCta?: () => void | Promise<void>;
		/** Área logada: nome, telefone e e-mail vêm do `profiles` (não do funil). */
		useAppCheckoutBuyer?: boolean;
	}

	let {
		variant = 'results',
		offerFeatures,
		offerPricing,
		offerGuarantee,
		offerFaq,
		heroHeadline,
		heroSubheadline,
		heroProgress,
		offerCta,
		offerAccessSection,
		onPrimaryCta,
		onDeclineCta,
		onExitCta,
		useAppCheckoutBuyer = false
	}: Props = $props();

	const isAtivacaoVariant = $derived(variant === 'ativacao');

	const hasCustomHeroHeadline = $derived(heroHeadline != null && heroHeadline !== '');

	const activeFaq = $derived(offerFaq ?? DEFAULT_OFFER_FAQ);

	const quiz = $derived($quizStore);
	const postQuiz = $derived($postQuizStore);
	const name = $derived(postQuiz.name);

	/** Primeiro token do nome (ex.: saudação "Maria, ..."). */
	const firstName = $derived.by(() => {
		const n = (name || '').trim();
		if (!n) return '';
		return n.split(/\s+/)[0] ?? '';
	});

	type VturbPlayerConfig = {
		smartplayerId: string;
		scriptSrc: string;
	};

	/** Vídeo: /results (funil pós-quiz). */
	const vturbProtocoloAccessResults: VturbPlayerConfig = {
		smartplayerId: 'vid-6a2ad748127dad2cb2ccc1ed',
		scriptSrc:
			'https://scripts.converteai.net/cb674c2a-44f8-4af3-949d-f12749d714fb/players/6a2ad748127dad2cb2ccc1ed/v4/player.js'
	};

	/** Vídeo: /ativacao e /atiavacao-de-conta. */
	const vturbProtocoloAccessAtivacao: VturbPlayerConfig = {
		smartplayerId: 'vid-6a2ada3e3244f7b854ab90e4',
		scriptSrc:
			'https://scripts.converteai.net/cb674c2a-44f8-4af3-949d-f12749d714fb/players/6a2ada3e3244f7b854ab90e4/v4/player.js'
	};

	const vturbProtocoloAccess = $derived(
		isAtivacaoVariant ? vturbProtocoloAccessAtivacao : vturbProtocoloAccessResults
	);


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

	const goalLabel = $derived(
		quiz.answers['goal_type'] === 'goal-definir' ? 'definir o corpo' : 'emagrecer'
	);

	const phase1Macros = $derived(computePhase1Macros(quiz.answers));
	const displayKcal = $derived(phase1Macros?.kcal ?? DEFAULT_DAILY_MACRO_GOALS.kcal);
	const displayProteinG = $derived(phase1Macros?.proteinG ?? DEFAULT_DAILY_MACRO_GOALS.proteinG);

	/** R$37 + checkout OF002: só após aceitar bónus e voltar com `?offer=OF002` (não basta query na landing). */
	const showOf002Offer = $derived(
		$page.url.searchParams.get('offer') === 'OF002' && postQuiz.bonusDiscountAccepted
	);
	const offerMainPrice = $derived(showOf002Offer ? 'R$37,00' : 'R$47,00');
	const offerInstallmentLabel = $derived(
		showOf002Offer ? RESULTS_OFFER.installmentLabelOf002 : RESULTS_OFFER.installmentLabel
	);

	const checkoutUrl = $derived(
		showOf002Offer ? RESULTS_OFFER.checkoutUrlOf002 : RESULTS_OFFER.checkoutUrl
	);

	const session = $derived($sessionStore);

	let profileUtm = $state<UtmParams>({});
	let appCheckoutState = $state<AppCheckoutState>(EMPTY_APP_CHECKOUT_STATE);

	const checkoutUtm = $derived(mergeUtmParams(session.utm, profileUtm));

	/** Campanha `?offer=` (URL atual ou sessão) → parâmetro `src` no Lastlink (exceto OF002 sem bónus). */
	const funnelOfferForCheckout = $derived(
		$page.url.searchParams.get('offer')?.trim() || session.offer?.trim() || undefined
	);

	$effect(() => {
		if (!browser || useAppCheckoutBuyer) return;
		const userId = $authStore.user?.id;
		if (!userId) {
			profileUtm = {};
			return;
		}
		let cancelled = false;
		void loadProfileUtm(userId).then((utm) => {
			if (!cancelled) profileUtm = utm;
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!browser || !useAppCheckoutBuyer) return;
		const user = $authStore.user;
		if (!user?.id) {
			appCheckoutState = EMPTY_APP_CHECKOUT_STATE;
			return;
		}
		let cancelled = false;
		void loadAppCheckoutState(user.id, user.email).then((state) => {
			if (!cancelled) appCheckoutState = state;
		});
		return () => {
			cancelled = true;
		};
	});

	const primaryCheckoutUrl = $derived.by(() => {
		const baseUrl = offerCta?.checkoutUrl ?? checkoutUrl;
		const src =
			offerCta?.checkoutSrc ??
			(isAtivacaoVariant
				? undefined
				: showOf002Offer
					? 'OF002'
					: funnelOfferForCheckout && funnelOfferForCheckout !== 'OF002'
						? funnelOfferForCheckout
						: undefined);

		if (useAppCheckoutBuyer) {
			return buildAppCheckoutUrl(baseUrl, {
				sessionUtm: session.utm,
				checkout: appCheckoutState,
				extra: src ? { src } : undefined
			});
		}

		const funnelSessionId = quiz.funnelSessionId?.trim();
		return appendCheckoutParams(baseUrl, {
			utm: checkoutUtm,
			buyer: {
				name: postQuiz.name,
				phone: postQuiz.whatsapp,
				...(funnelSessionId ? { sck: funnelSessionId } : {})
			},
			extra: src ? { src } : undefined
		});
	});

	const primaryCtaIsLink = $derived(!!offerCta?.checkoutUrl || !onPrimaryCta);

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

	// Faixa: só após o VTurb revelar o conteúdo (10s); depois, visível com 50px de scroll no <main>
	let scrollY = $state(0);
	const showFaixa = $derived($postQuizStore.resultsContentRevealed && scrollY >= 50);

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

	let countdownSeconds = $state(10 * 60); // 10:00 — só decrementa após o gatilho do vídeo (resultsContentRevealed)
	function getPostQuizScrollRoot(): HTMLElement | null {
		return (
			document.querySelector<HTMLElement>('div.app-inner-scroll main.overflow-y-auto') ??
			document.querySelector<HTMLElement>('main.overflow-y-auto')
		);
	}

	function updateBlocoPrecoInView(): void {
		if (isAtivacaoVariant || !$postQuizStore.resultsContentRevealed) {
			blocoPrecoInView = false;
			return;
		}

		const el = document.getElementById('bloco-preco');
		if (!el) {
			blocoPrecoInView = false;
			return;
		}

		const root = getPostQuizScrollRoot();
		const rootRect = root?.getBoundingClientRect();
		const elRect = el.getBoundingClientRect();
		const viewTop = rootRect?.top ?? 0;
		const viewBottom = rootRect?.bottom ?? window.innerHeight;
		blocoPrecoInView = elRect.top < viewBottom - 120 && elRect.bottom > viewTop + 80;
	}

	onMount(() => {
		let cancelled = false;
		let target: HTMLElement | Window = window;
		let onScroll = () => {};

		(async () => {
			if (typeof window === 'undefined') return;
			// Garante que o <main> do post-quiz existe (slot + transições).
			await tick();
			await tick();
			if (cancelled) return;

			const root = getPostQuizScrollRoot();
			target = root ?? window;

			onScroll = () => {
				scrollY = root ? root.scrollTop : window.scrollY;
				updateBlocoPrecoInView();
			};

			target.addEventListener('scroll', onScroll, { passive: true });
			onScroll();
		})();

		return () => {
			cancelled = true;
			target.removeEventListener('scroll', onScroll);
		};
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

	let declineModalOpen = $state(false);
	const storedAtivacaoOfferRevealed = $postQuizStore.ativacaoOfferRevealed;
	/** Ativação: headline e vídeo só após animação do stepper (ou imediato se oferta já revelada). */
	let ativacaoHeroUnlocked = $state(variant !== 'ativacao' || storedAtivacaoOfferRevealed);
	/** Ativação: cardápio + perguntas antes do hero/vídeo/oferta. Resume from store if available. */
	const storedSelections = $postQuizStore.mealSelections;
	const storedFollowUp = $postQuizStore.followUpAnswers;
	let mealPreferencesComplete = $state(variant !== 'ativacao' || storedSelections !== null);
	let followUpQuestionsComplete = $state(variant !== 'ativacao' || storedFollowUp !== null);
	let mealPreferences = $state<MealSelections | null>(storedSelections);
	let followUpAnswers = $state<Record<string, MealFollowUpAnswer> | null>(storedFollowUp);
	let mealPlanPersistInFlight = $state(false);
	let mealPlanPersisted = $state(false);

	const ativacaoPreOfferComplete = $derived(
		!isAtivacaoVariant || (mealPreferencesComplete && followUpQuestionsComplete)
	);

	function handleMealPreferencesComplete(selections: MealSelections) {
		mealPreferences = selections;
		mealPreferencesComplete = true;
		postQuizStore.setMealSelections(selections);
	}

	/** Gera e salva o plano em segundo plano; loading fica só em /inicio. */
	function triggerMealPlanPersist() {
		if (!isAtivacaoVariant || mealPlanPersistInFlight || mealPlanPersisted) return;

		const selections = mealPreferences ?? $postQuizStore.mealSelections;
		if (!selections) return;

		mealPlanPersistInFlight = true;
		void persistActivationMealPlan(selections).then((result) => {
			mealPlanPersistInFlight = false;
			if (result.ok) {
				mealPlanPersisted = true;
			} else {
				console.warn('persistActivationMealPlan:', result.error);
			}
		});
	}

	function handleFollowUpQuestionsComplete(answers: Record<string, MealFollowUpAnswer>) {
		followUpAnswers = answers;
		postQuizStore.setFollowUpAnswers(answers);
		followUpQuestionsComplete = true;

		if (isAtivacaoVariant) triggerMealPlanPersist();
	}

	$effect(() => {
		if (!browser || !isAtivacaoVariant) return;
		if (!mealPreferencesComplete || !followUpQuestionsComplete) return;
		triggerMealPlanPersist();
	});

	function openDeclineModal() {
		declineModalOpen = true;
	}

	function closeDeclineModal() {
		declineModalOpen = false;
	}

	function confirmDeclineOffer() {
		declineModalOpen = false;
		if (onDeclineCta) {
			onDeclineCta();
		} else if (browser) {
			if (window.history.length > 1) {
				window.history.back();
			} else {
				void goto('/');
			}
		}
	}

	function revealResultsAfterVideo() {
		if (isAtivacaoVariant) {
			postQuizStore.markAtivacaoOfferRevealed();
		} else {
			postQuizStore.markResultsContentRevealed();
		}
	}

	/** Estável: revela no tempo real do vídeo (currentTime >= delay). */
	const resultsPlaybackGate = $derived({
		seconds: isAtivacaoVariant ? ATIVACAO_VTURB_DELAY_SEC : RESULTS_VTURB_DELAY_SEC,
		onReached: revealResultsAfterVideo
	});

	const showResultsStickyFooter = $derived(!isAtivacaoVariant && ativacaoHeroUnlocked);
	const showAtivacaoCloseButton = $derived($postQuizStore.resultsContentRevealed);
	const resultsStickyFooterLoading = $derived(
		showResultsStickyFooter && !$postQuizStore.resultsContentRevealed
	);
	let blocoPrecoInView = $state(false);
	const showStickyFooterBar = $derived(
		showResultsStickyFooter &&
			(resultsStickyFooterLoading ||
				($postQuizStore.resultsContentRevealed && !blocoPrecoInView))
	);

	$effect(() => {
		if (!browser || isAtivacaoVariant) return;
		postQuizStore.restoreResultsContentIfOfferRevealed();
	});

	$effect(() => {
		if (!browser || isAtivacaoVariant || !$postQuizStore.resultsContentRevealed) {
			blocoPrecoInView = false;
			return;
		}

		void tick().then(() => updateBlocoPrecoInView());
	});
</script>

{#snippet offerDeclineButton()}
	{#if offerCta?.declineLabel}
		<button
			type="button"
			class="w-full mt-2.5 flex items-center justify-center rounded-2xl border-2 border-red-700 px-5 py-4 text-base font-bold text-red-700 bg-transparent transition-all duration-200 active:scale-[0.98] hover:bg-red-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			onclick={() => (offerCta.declineModal ? openDeclineModal() : undefined)}
		>
			{offerCta.declineLabel}
		</button>
	{/if}
{/snippet}

<div
	class="flex flex-col gap-2.5 w-full min-w-0 min-h-0 text-center {showStickyFooterBar
		? 'pb-fixed-cta-reserve'
		: ''}"
>
	{#if isAtivacaoVariant}
		<header
			class="fixed inset-x-0 top-0 z-40 flex shrink-0 items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-challenge-hero/90 backdrop-blur-md supports-[backdrop-filter]:bg-challenge-hero/75"
		>
			<div class="w-9 h-9 shrink-0" aria-hidden="true"></div>

			<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
				<Logo class="block h-7 w-auto" />
			</div>

			{#if showAtivacaoCloseButton}
				<button
					type="button"
					class="w-9 h-9 flex items-center justify-center rounded-xl border border-black text-heading transition-colors hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
					aria-label="Fechar"
					onclick={() =>
						offerCta?.declineModal ? openDeclineModal() : onDeclineCta?.()}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<path d="M6 6l12 12M18 6 6 18" />
					</svg>
				</button>
			{:else}
				<div class="w-9 h-9 shrink-0" aria-hidden="true"></div>
			{/if}
		</header>
		<div
			class="shrink-0"
			style:height="calc(3.75rem + max(0.75rem, env(safe-area-inset-top)))"
			aria-hidden="true"
		></div>
	{/if}
	{#if isAtivacaoVariant && !ativacaoPreOfferComplete}
		<div class="ativacao-onboarding-transition">
			{#key mealPreferencesComplete ? 'follow-up' : 'meals'}
				<div
					in:fly={{ x: 30, duration: 260, delay: 40 }}
					out:fly={{ x: -30, duration: 180 }}
				>
					{#if !mealPreferencesComplete}
						<MealFoodPreferencePicker hideLogo onComplete={handleMealPreferencesComplete} />
					{:else if !followUpQuestionsComplete}
						<MealFollowUpQuestions hideLogo onComplete={handleFollowUpQuestionsComplete} />
					{/if}
				</div>
			{/key}
		</div>
	{:else}
	{#if heroProgress}
		<div
			class="mb-3 w-full rounded-2xl border border-line/40 bg-surface p-4"
			in:fly={{ y: cascadeY, duration: cascadeDur, delay: 0, easing: cubicOut }}
		>
			<OfferHeroProgress
				currentStep={heroProgress.currentStep}
				steps={heroProgress.steps}
				introAnimation={isAtivacaoVariant && !storedAtivacaoOfferRevealed}
				onIntroComplete={() => {
					ativacaoHeroUnlocked = true;
				}}
			/>
		</div>
	{/if}
	{#if ativacaoHeroUnlocked}
	<h1
		class="text-2xl font-medium text-heading leading-[24px] text-center px-1 [&_strong]:font-extrabold"
		in:fly={{ y: cascadeY, duration: cascadeDur, delay: 0, easing: cubicOut }}
	>
		{#if Array.isArray(heroHeadline)}
			{#each heroHeadline as segment}
				{#if segment.bold}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
			{/each}
		{:else if heroHeadline}
			{heroHeadline}
		{:else}
			<strong>Assista o video</strong> para entender como acessar <strong>seu protocolo</strong> para
			<strong class="text-accent">{goalLabel}</strong>.
		{/if}
	</h1>
	{#if heroSubheadline}
	<p
		class="text-sm text-body leading-relaxed max-w-md mx-auto min-w-0 mb-[25px] mt-3 px-1 text-center [&_strong]:font-extrabold"
		in:fly={{ y: cascadeY, duration: cascadeDur, delay: cascadeGap, easing: cubicOut }}
	>
		{#if Array.isArray(heroSubheadline)}
			{#each heroSubheadline as segment}
				{#if segment.bold}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
			{/each}
		{:else}
			{heroSubheadline}
		{/if}
	</p>
	{/if}
	{#if !hasCustomHeroHeadline}
	<p
		class="text-sm text-body leading-[14px] max-w-md mx-auto min-w-0 mb-[25px]"
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
	{/if}
	<div
		id="video-protocolo"
		class="scroll-mt-24 w-full max-w-[400px] mx-auto min-w-0 {isAtivacaoVariant ? '' : '-mt-2.5'}"
		in:fly={{ y: cascadeY, duration: cascadeDur, delay: cascadeGap, easing: cubicOut }}
	>
		<div class={isAtivacaoVariant ? 'w-full' : 'pt-2.5'}>
		{#if !isAtivacaoVariant}
			<!-- Aba de macros (/results): mesma largura do player; o vídeo cobre a base da aba -->
			<div
				class="relative z-0 flex w-full items-stretch justify-center gap-0 rounded-t-2xl border border-b-0 border-line/50 bg-white px-4 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
				aria-label="Metas diárias do seu protocolo: calorias e proteína"
			>
				<div class="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-0.5">
					<span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Calorias</span>
					<span class="text-sm font-extrabold tabular-nums text-heading">
						{displayKcal.toLocaleString('pt-BR')} kcal
					</span>
				</div>
				<div class="my-1 w-px shrink-0 self-stretch bg-line/50" aria-hidden="true"></div>
				<div class="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-0.5">
					<span class="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Proteína</span>
					<span class="text-sm font-extrabold tabular-nums text-heading">{displayProteinG} g</span>
				</div>
			</div>
		{/if}
		<div
			class="w-full {isAtivacaoVariant ? '' : 'relative z-10 -mt-2'}"
		>
			<VturbPlayer
				playerId={vturbProtocoloAccess.smartplayerId}
				scriptSrc={vturbProtocoloAccess.scriptSrc}
				playbackGate={resultsPlaybackGate}
			/>
		</div>
		</div>
	</div>
	{/if}

	{#if !isAtivacaoVariant}
		<!-- Faixa fixa: fora do bloco VTurb; scroll no <main>, não em window -->
		<button
			type="button"
			onclick={scrollToPreco}
			class="fixed left-0 right-0 top-0 z-30 flex w-full border-b border-line bg-surface px-4 py-3 text-left shadow-sm transition-all duration-300 ease-out hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent {showFaixa
				? 'translate-y-0 opacity-100'
				: '-translate-y-full opacity-0 pointer-events-none'}"
			aria-label="Ver oferta e preço"
			aria-hidden={!showFaixa}
		>
			<div class="mx-auto flex w-full max-w-lg items-center justify-between gap-4">
				<div class="flex flex-col gap-2.5">
					<span class="text-xs font-normal text-muted">Desconto aplicado</span>
					<span
						class="inline-flex w-fit rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-bold text-heading"
						>{discountCode}</span
					>
				</div>
				<div class="flex flex-col items-end gap-2.5">
					<span class="text-xs font-normal text-muted">Se encerra em</span>
					<span class="text-lg font-bold tabular-nums text-red-500">{countdownDisplay}</span>
				</div>
			</div>
		</button>
	{/if}

	{#if $postQuizStore.resultsContentRevealed}
	<div
		id="results-after-video"
		class="results-vturb-delay results-vturb-delay--revealed"
	>
	{#if !isAtivacaoVariant}
	<section
		class="w-full max-w-md mx-auto mt-3 mb-1 flex flex-col gap-4 py-[50px]"
		aria-labelledby="profissional-saude-heading"
	>
		<h2
			id="profissional-saude-heading"
			class="text-2xl font-medium text-heading leading-[24px] text-center px-1 [&_strong]:font-extrabold"
		>
			{#if firstName}
				<strong>{firstName}</strong>, seu protocolo é assinado por um <strong>profissional da saúde</strong>
			{:else}
				Seu protocolo é assinado por um <strong>profissional da saúde</strong>
			{/if}
		</h2>
		<div
			class="overflow-hidden rounded-2xl border border-line/40 bg-surface text-left shadow-sm"
		>
			<div class="bg-accent-dark px-4 py-2.5 text-center">
				<p class="text-[10px] font-bold uppercase tracking-[0.12em] text-bg">
					Protocolo assinado por
				</p>
			</div>
			<div class="flex items-center gap-4 p-4 sm:p-5">
				<div
					class="relative size-[72px] shrink-0 overflow-hidden rounded-full border border-line/60 bg-surface-2"
				>
					<img
						src="/avatars/lucas-rabelo-profissional.png"
						alt="Foto de Lucas Rabelo"
						class="size-full object-cover object-center"
						width="72"
						height="72"
						loading="lazy"
						decoding="async"
					/>
				</div>
				<div class="flex min-w-0 flex-1 flex-col gap-0.5">
					<span class="text-base font-bold text-heading leading-tight">Lucas Rabelo</span>
					<span class="text-sm font-normal text-muted leading-snug">@lucasrabelonutri</span>
				</div>
			</div>
		</div>
	</section>
	{/if}

	<div id="secao-acessar-protocolo" class="flex flex-col items-center gap-2.5 scroll-mt-4 mt-5 py-[10px]">
		{#if !offerAccessSection}
			<div class="flex justify-center">
				<AvatarStack initials={nameInitials} size="md" />
			</div>
		{/if}
		<h2 class="text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold">
			{#if offerAccessSection}
				{#each offerAccessSection.title as segment}
					{#if segment.bold}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
				{/each}
			{:else}
				<strong>Seu protocolo</strong> está te esperando.
			{/if}
		</h2>
		<p class="text-sm text-body leading-[14px] max-w-md mx-auto [&_strong]:font-bold">
			{#if offerAccessSection && Array.isArray(offerAccessSection.subtitle)}
				{#each offerAccessSection.subtitle as segment}
					{#if segment.bold}<strong>{segment.text}</strong>{:else}{segment.text}{/if}
				{/each}
			{:else}
				{typeof offerAccessSection?.subtitle === 'string'
					? offerAccessSection.subtitle
					: 'Você recebe todos esses itens ao contratar seu protocolo para emagrecer agora.'}
			{/if}
		</p>
	</div>

	<!-- Price Card: um único bloco verde (borda + fundo) com conteúdo arredondado em cima e embaixo -->
	<div
		id="bloco-preco"
		class="bloco-preco-shimmer scroll-mt-24 relative w-full flex flex-col gap-2.5 text-left rounded-2xl border-[2px] border-accent bg-accent overflow-hidden mt-2.5"
	>
		<div class="flex flex-col gap-5 p-5 mx-0.5 mt-0.5 mb-0.5 rounded-2xl overflow-hidden border border-line/30 bg-surface">
			<!-- Header: título + preço (+ 20% OFF à direita se ?offer=OF002) e R$197 -->
			<div class="flex flex-col gap-2.5">
				<h3 class="text-lg font-extrabold text-heading leading-snug">
					{offerPricing?.productTitle ??
						`Protocolo de desbloqueio${name.trim() ? ` ${name.trim()}` : ''}`}
				</h3>
				<div class="flex items-center justify-between gap-3 flex-wrap">
					<div class="flex flex-wrap items-center gap-2 min-w-0">
						{#if offerPricing?.mainPricePrefix != null && offerPricing.mainPriceAmount != null}
							<span class="inline-flex items-baseline gap-1.5 min-w-0">
								<span class="text-sm font-medium text-muted">{offerPricing.mainPricePrefix}</span>
								<span class="text-[32px] font-extrabold text-heading leading-none">
									{offerPricing.mainPriceAmount}
								</span>
							</span>
						{:else}
							<span class="text-[32px] font-extrabold text-heading leading-none">
								{offerPricing?.mainPrice ?? offerMainPrice}
							</span>
						{/if}
						{#if !offerPricing && showOf002Offer}
							<span
								class="inline-flex shrink-0 rounded-md border border-accent bg-accent/15 px-2 py-0.5 text-xs font-extrabold tracking-tight text-accent"
							>
								+ 20% OFF
							</span>
						{/if}
					</div>
					<span class="shrink-0 text-base text-heading line-through">
						{offerPricing?.compareAtPrice ?? 'R$197'}
					</span>
				</div>
				<span class="text-sm text-muted">
					{offerPricing?.secondaryLabel ?? `ou ${offerInstallmentLabel}`}
				</span>
			</div>

			<!-- Divider -->
			<div class="border-t border-line/50"></div>

			<!-- Título da categoria -->
			<span class="text-xs font-medium text-muted">Você vai receber</span>

			<!-- Features: ícone 15×15 por item -->
			<ul class="flex flex-col gap-4">
				{#if offerFeatures}
					{#each offerFeatures as feature}
						<li class="flex items-start gap-3">
							<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
								{#if feature.icon === 'calendar'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
								{:else if feature.icon === 'clipboard'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
								{:else if feature.icon === 'mobile'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
								{:else if feature.icon === 'chat'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
								{:else if feature.icon === 'lessons'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
								{:else if feature.icon === 'video'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
								{:else if feature.icon === 'food'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
								{:else if feature.icon === 'chart'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-3"/></svg>
								{:else if feature.icon === 'fire'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
								{:else}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
								{/if}
							</span>
							<div class="flex flex-col gap-[3px] min-w-0 flex-1">
								{#if feature.bonus}
									<div class="flex flex-wrap items-center gap-2 min-w-0 text-left">
										<span class="text-sm font-bold text-heading">{feature.title}</span>
										<span class="inline-flex w-fit rounded-lg border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-heading">Bônus</span>
									</div>
								{:else}
									<span class="text-sm font-bold text-heading">{feature.title}</span>
								{/if}
								<span class="text-xs text-muted leading-relaxed">{feature.description}</span>
							</div>
						</li>
					{/each}
				{:else}
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
					</span>
					<div class="flex flex-col gap-[3px]">
						<span class="text-sm font-bold text-heading">Protocolo de Desbloqueio Personalizado</span>
						<span class="text-xs text-muted leading-relaxed">Calculado com base no seu metabolismo, objetivo, rotina e respostas do teste.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15v2c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2v-2"/><path d="M17 15V2"/></svg>
					</span>
					<div class="flex flex-col gap-[3px]">
						<span class="text-sm font-bold text-heading">Plano Alimentar Personalizado</span>
						<span class="text-xs text-muted leading-relaxed">Com alimentos simples e adaptados ao seu dia a dia para acelerar o emagrecimento.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
					</span>
					<div class="flex flex-col gap-[3px] min-w-0 flex-1">
						<span class="text-sm font-bold text-heading">Acesso ao Aplicativo</span>
						<span class="text-xs text-muted leading-relaxed">Seu protocolo disponível na palma da sua mão.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
					</span>
					<div class="flex flex-col gap-[3px]">
						<span class="text-sm font-bold text-heading">Acompanhamento pelo WhatsApp</span>
						<span class="text-xs text-muted leading-relaxed">Suporte direto da equipe durante todo o protocolo para acompanhar sua evolução.</span>
					</div>
				</li>
				<li class="flex items-start gap-3">
					<span class="w-[15px] h-[15px] shrink-0 mt-1.5 text-heading" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
					</span>
					<div class="flex flex-col gap-[3px] min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2 min-w-0 text-left">
							<span class="text-sm font-bold text-heading">Mapa dos 14 Dias</span>
							<div class="inline-flex shrink-0 items-center gap-2">
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
					<div class="flex flex-col gap-[3px] min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2 min-w-0 text-left">
							<span class="text-sm font-bold text-heading">Guia do Fim de Semana</span>
							<div class="inline-flex shrink-0 items-center gap-2">
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
					<div class="flex flex-col gap-[3px]">
						<span class="text-sm font-bold text-heading">Garantia Total de 14 Dias</span>
						<span class="text-xs text-muted leading-relaxed">Faça o protocolo completo. Se não tiver resultado, devolvemos 100% do seu dinheiro.</span>
					</div>
				</li>
				{/if}
			</ul>

			{#if hasAnyEspecificidade && !isAtivacaoVariant}
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
					<div class="flex flex-col gap-0 min-w-0">
						<span class="text-sm font-bold text-heading">Adaptação ao tratamento</span>
						<span class="text-xs text-muted leading-[12px]">Treino alinhado ao uso de medicamentos como <span class="text-accent">Mounjaro</span> ou <span class="text-accent">Ozempic</span>.</span>
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
		{#if primaryCtaIsLink}
			<a
				href={primaryCheckoutUrl || '#'}
				target={primaryCheckoutUrl ? '_blank' : undefined}
				rel={primaryCheckoutUrl ? 'noopener noreferrer' : undefined}
				class="mx-0.5 mb-0.5 flex w-full items-center justify-center gap-2 rounded-b-2xl px-5 py-[27.5px] font-black text-base tracking-widest text-bg bg-transparent transition-all duration-200 active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-inset"
				onclick={(e) => {
					postQuizStore.markComecarAgoraClicked();
					if (!primaryCheckoutUrl) e.preventDefault();
				}}
			>
				{offerCta?.primaryLabel ?? 'COMEÇAR AGORA'}
				{#if !offerCta}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cta-arrow">
						<path d="M5 12h14M12 5l7 7-7 7"/>
					</svg>
				{/if}
			</a>
		{:else}
			<button
				type="button"
				class="mx-0.5 mb-0.5 flex w-full items-center justify-center gap-2 rounded-b-2xl px-5 py-[27.5px] font-black text-base tracking-widest text-bg bg-transparent transition-all duration-200 active:scale-[0.98] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg focus-visible:ring-inset"
				onclick={() => {
					postQuizStore.markComecarAgoraClicked();
					onPrimaryCta?.();
				}}
			>
				{offerCta?.primaryLabel ?? 'COMEÇAR AGORA'}
			</button>
		{/if}
	</div>

	{@render offerDeclineButton()}

	{#if declineModalOpen && offerCta?.declineModal}
		<div
			class="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/35 backdrop-blur-md"
			role="presentation"
			onclick={closeDeclineModal}
			onkeydown={(e) => e.key === 'Escape' && closeDeclineModal()}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="decline-offer-dialog-title"
				class="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-line bg-surface p-6 shadow-xl"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<p
					id="decline-offer-dialog-title"
					class="text-center text-base font-medium leading-relaxed text-heading"
				>
					{offerCta.declineModal.message}
				</p>
				<div class="grid shrink-0 grid-cols-2 gap-3 pt-5">
					<button
						type="button"
						onclick={closeDeclineModal}
						class="h-12 rounded-xl border-2 border-accent bg-accent font-semibold text-bg transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
					>
						{offerCta.declineModal.cancelLabel ?? 'Não'}
					</button>
					<button
						type="button"
						onclick={confirmDeclineOffer}
						class="h-12 rounded-xl border-2 border-red-700 bg-transparent font-semibold text-red-700 transition-colors hover:bg-red-700/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
					>
						{offerCta.declineModal.confirmLabel ?? 'Sim'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if !isAtivacaoVariant}
	<img
		src="/payment-methods.png"
		alt="Formas de pagamento: Pix, Apple Pay, Google Pay, Mastercard, Visa e outros"
		class="w-full h-auto object-contain mt-2.5"
	/>
	{/if}

	{#if !isAtivacaoVariant}
		<h2 class="pt-[50px] text-2xl font-medium text-heading leading-[24px] text-center [&_strong]:font-extrabold">
			Veja o resultado de algumas pessoas que aplicaram o <strong>Protocolo Desbloqueio</strong>.
		</h2>

		<div class="mt-2.5 w-full min-w-0 max-w-full overflow-hidden">
			<Mr1TestimonialCarousel compactTop />
		</div>
	{/if}

	<!-- Bloco de garantia -->
	<div
		class="my-[25px] w-full rounded-2xl bg-accent px-4 py-[25px] text-left text-bg"
		role="region"
		aria-labelledby="garantia-heading"
	>
		<img
			src={offerGuarantee?.badgeSrc ?? '/garantia-14-dias-badge.png'}
			alt={offerGuarantee?.badgeAlt ?? 'Selo: reembolso garantia 14 dias'}
			class="h-20 w-20 shrink-0 object-contain"
		/>
		<h2
			id="garantia-heading"
			class="mt-2.5 text-2xl font-extrabold leading-[24px] text-bg"
		>
			<span>Garantia incondicional</span><br />
			<span>{offerGuarantee?.daysLabel ?? 'de 14 dias'}</span>
		</h2>
		<p class="mt-2.5 text-sm font-normal leading-relaxed text-bg/90">
			{#if offerGuarantee}
				{offerGuarantee.body}
			{:else}
				Confiamos tanto no <span class="font-semibold">Protocolo de Desbloqueio</span> que você pode
				testá-lo com total tranquilidade. Se, em até 14 dias, você sentir que não é para você, basta
				enviar uma mensagem para nossa equipe e devolveremos 100% do seu dinheiro.
			{/if}
		</p>
	</div>

	<!-- Perguntas Frequentes -->
	<section class="w-full flex flex-col gap-2.5 text-center" aria-labelledby="faq-heading">
		<h2
			id="faq-heading"
			class="mt-[25px] mb-2.5 pt-[25px] text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold"
		>
			<strong>Perguntas Frequentes</strong>
		</h2>
		<p class="text-sm text-body leading-[14px] max-w-md mx-auto pb-2.5">
			{activeFaq.intro}
		</p>
		<div class="w-full flex flex-col text-left border-t border-line/50 mt-2.5">
			{#each activeFaq.items as faq, i}
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

	{@render offerDeclineButton()}

	<div class="w-full pt-10 pb-2 border-t border-line/70 shrink-0">
		<LegalFooter />
		{#if isAtivacaoVariant && onExitCta}
			<p class="mt-4 text-center text-[11px] leading-snug text-[#C1C1C1]">
				<button
					type="button"
					class="text-accent underline underline-offset-2"
					onclick={() => void onExitCta()}
				>
					Sair
				</button>
			</p>
		{/if}
	</div>

	</div>
	{/if}
	{/if}

	{#if showResultsStickyFooter}
		<div
			class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none transition-all duration-300 ease-out {showStickyFooterBar
				? 'translate-y-0 opacity-100'
				: 'translate-y-full opacity-0'}"
			aria-hidden={!showStickyFooterBar}
		>
			<div
				class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] {showStickyFooterBar
					? 'pointer-events-auto'
					: 'pointer-events-none'}"
			>
				{#if resultsStickyFooterLoading}
					<div
						class="flex h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-line bg-surface text-sm font-medium text-body"
						aria-live="polite"
						aria-busy="true"
					>
						<svg
							class="h-5 w-5 shrink-0 animate-spin text-accent"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<span>Preparando seu protocolo...</span>
					</div>
				{:else}
					<div class="results-sticky-cta-pulse w-full">
						<button
							type="button"
							onclick={scrollToProtocoloSection}
							class="results-sticky-cta relative w-full h-[60px] flex items-center justify-center overflow-hidden rounded-2xl font-bold text-base bg-accent text-bg transition-colors duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
						>
							<span class="relative z-[1]">Acessar Protocolo</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.ativacao-onboarding-transition {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		width: 100%;
	}

	.ativacao-onboarding-transition > * {
		grid-row: 1;
		grid-column: 1;
		min-width: 0;
	}

	/* Revelação instantânea no gatilho do VTurb — sem atraso de animação */
	.results-vturb-delay--revealed > :nth-child(n + 1) {
		opacity: 1;
		transform: none;
	}

	/* Respostas do FAQ: mini texto (Pulse 1) */
	.faq-answer {
		font-size: 0.8125rem; /* 13px - Pulse 1 */
		line-height: 1.4;
	}

	.results-sticky-cta-pulse {
		animation: results-sticky-cta-pulse 2.4s ease-in-out infinite;
	}

	.results-sticky-cta::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 38%,
			rgba(255, 255, 255, 0.38) 50%,
			transparent 62%,
			transparent 100%
		);
		background-size: 220% 100%;
		animation: results-sticky-cta-shimmer 2.8s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes results-sticky-cta-pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.025);
		}
	}

	@keyframes results-sticky-cta-shimmer {
		0% {
			background-position: 220% 0;
		}
		100% {
			background-position: -220% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.results-sticky-cta-pulse {
			animation: none;
		}

		.results-sticky-cta::after {
			animation: none;
			opacity: 0;
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
