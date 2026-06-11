<script lang="ts">
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import { get } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { goto, preloadData } from '$app/navigation';
	import { navigating } from '$app/state';
	import {
		quizStore,
		currentQuestion,
		isLastQuestion,
		nextQuestion,
		quizNavigationEnded
	} from '$lib/stores/quiz.store';
import { trackQuizFinishQuestions, trackQuizStepComplete } from '$lib/services/analytics.service';
	import { flushQuizProgressImmediate } from '$lib/services/quiz-progress-sync.service';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';
	import QuestionCard from './QuestionCard.svelte';
	import InfoScreen from './InfoScreen.svelte';
	import MicroResultScreen from './MicroResultScreen.svelte';
	import QuestionInputNumber from './QuestionInputNumber.svelte';
	import QuestionInputDate from './QuestionInputDate.svelte';
	import QuestionInputText from './QuestionInputText.svelte';
	import QuestionSlider from './QuestionSlider.svelte';
	import QuestionRuler from './QuestionRuler.svelte';
	import QuestionWeightCurrent from './QuestionWeightCurrent.svelte';
	import QuestionWeightGoal from './QuestionWeightGoal.svelte';
	import QuestionBodyFatGrid from './QuestionBodyFatGrid.svelte';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';
	import ScrollViewportFill from '$lib/components/ui/ScrollViewportFill.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { PROTEIN_COUNT_ANIM_MS, protocolChartCtaDelayMs } from '$lib/constants/chart-animation';
	import { MR3_CTA_REVEAL_EVENT, isMr3PitchRevealed, setMr3PitchRevealed } from '$lib/constants/mr3-vturb';
	const quiz = $derived($quizStore);
	const question = $derived($currentQuestion);
	const isLast = $derived($isLastQuestion);
	const next = $derived($nextQuestion);

	// body_fat_grid uses a slider + Continuar; no auto-advance on every slider move
	const isSingleChoiceQuestion = $derived(
		question?.type === 'single' ||
			question?.type === 'boolean' ||
			question?.type === 'scale'
	);

	const isInfoOrMicroResult = $derived(
		question?.type === 'info' || question?.type === 'microresult'
	);

	const currentAnswer = $derived(question ? quiz.answers[question.id] : undefined);

	/** Para body_fat_goal: estágio "antes" = resposta de body_fat_level (0..5). */
	const bodyFatBeforeStage = $derived.by(() => {
		if (question?.id !== 'body_fat_goal') return undefined;
		const v = quiz.answers['body_fat_level'];
		if (typeof v !== 'string') return undefined;
		const n = parseInt(v, 10);
		return Number.isNaN(n) ? 0 : Math.min(5, Math.max(0, n));
	});
	const hasValidAnswer = $derived(
		currentAnswer !== undefined &&
			(Array.isArray(currentAnswer)
				? currentAnswer.length > 0
				: typeof currentAnswer === 'string'
					? currentAnswer.trim() !== ''
					: true)
	);
	const canGoNext = $derived(
		question
			? isInfoOrMicroResult
				? true
				: question.required
					? hasValidAnswer
					: true
			: false
	);

	const showNextButton = $derived(!isSingleChoiceQuestion);

	/** Demais microresultados (ex.: mr-1). */
	const MICRORESULT_DEFAULT_CTA_DELAY_MS = 2800;

	/**
	 * Delay do fade-in do botão Continuar (microresult).
	 * mr-2: após o último bullet (Finalização) no gráfico — ver `protocolChartCtaDelayMs`.
	 * mr-3 / mr-4 / mr-protein: 0 — CTA controlado por VTurb, calendário ou contagem.
	 */
	const buttonCascadeDelay = $derived.by(() => {
		if (question?.type !== 'microresult' || !question) return 0;
		if (question.id === 'mr-3' || question.id === 'mr-4') return 0;
		if (question.id === 'mr-2') return protocolChartCtaDelayMs();
		if (question.id === 'mr-protein') return 0;
		return MICRORESULT_DEFAULT_CTA_DELAY_MS;
	});

	/** Lock para evitar duplo clique em Continuar */
	let advancing = $state(false);

	/** Duração total da sequência do calendário ilustrativo (mr-4) — manter alinhado a `ProtocolCalendarIllustration`. */
	const MR4_CTA_DELAY_MS = 10_000;

	/** mr-3: mostra “Analisando…” até o gate de reprodução revelar o CTA. */
	let mr3FooterLoading = $state(false);
	/** mr-3: CTA revelado no segundo exato do vídeo (gate de `currentTime`). */
	let mr3CtaRevealed = $state(false);

	/** mr-4: false no 1º frame — esconde o CTA até o fim da animação do calendário (10s). */
	let mr4CtaRevealed = $state(false);

	/** mr-protein: CTA só após a contagem 0 → meta (4s). */
	let mrProteinCtaLocked = $state(false);

	// mr-3: “Analisando…” até o gate de reprodução do vídeo disparar (currentTime >= delay).
	$effect(() => {
		if (!browser || !showNextButton || question?.id !== 'mr-3') {
			mr3FooterLoading = false;
			mr3CtaRevealed = false;
			return;
		}

		if (isMr3PitchRevealed()) {
			mr3FooterLoading = false;
			mr3CtaRevealed = true;
			return;
		}

		mr3FooterLoading = true;
		mr3CtaRevealed = false;

		const onVturbRevealEvent = () => {
			setMr3PitchRevealed();
			mr3FooterLoading = false;
			mr3CtaRevealed = true;
		};

		document.addEventListener(MR3_CTA_REVEAL_EVENT, onVturbRevealEvent);

		return () => {
			document.removeEventListener(MR3_CTA_REVEAL_EVENT, onVturbRevealEvent);
		};
	});

	// mr-4: CTA só após a animação ilustrativa dos 14 dias
	$effect(() => {
		if (question?.id !== 'mr-4') {
			mr4CtaRevealed = false;
			return;
		}

		if (!browser || !showNextButton) return;

		mr4CtaRevealed = false;

		let cancelled = false;
		const t = setTimeout(() => {
			if (!cancelled) mr4CtaRevealed = true;
		}, MR4_CTA_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	});

	// mr-protein: CTA só após a contagem da meta de proteína
	$effect(() => {
		if (!browser || !showNextButton || question?.id !== 'mr-protein') {
			mrProteinCtaLocked = false;
			return;
		}

		mrProteinCtaLocked = true;
		let cancelled = false;
		const t = setTimeout(() => {
			if (!cancelled) mrProteinCtaLocked = false;
		}, PROTEIN_COUNT_ANIM_MS);

		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	});

	// Rede de segurança: quando a navegação termina (afterNavigate), limpa o lock advancing
	$effect(() => {
		$quizNavigationEnded; // track store so effect re-runs when it's bumped
		advancing = false;
	});

	// Timeout de segurança: se advancing ficar true por muito tempo (ex.: goto nunca resolve), libera a UI
	const ADVANCING_TIMEOUT_MS = 4000;
	$effect(() => {
		if (!advancing) return;
		const t = setTimeout(() => {
			advancing = false;
		}, ADVANCING_TIMEOUT_MS);
		return () => clearTimeout(t);
	});

	// whatsapp: address user by name (e.g. "Maria, qual o seu WhatsApp para receber o seu protocolo?")
	const whatsappTitle = $derived.by(() => {
		if (question?.id !== 'whatsapp') return undefined;
		const name = quiz.answers['user_name'];
		if (!name || typeof name !== 'string' || !name.trim()) return undefined;
		const firstName = name.trim().split(/\s+/)[0] ?? name.trim();
		return `${firstName}, qual o seu WhatsApp para receber o seu protocolo?`;
	});

	// All steps use same CTA: "Continuar" with thin arrow on the right
	const buttonLabel = $derived('Continuar');

	function handleSelect(questionId: string, value: string | string[]) {
		if (navigating.from != null || advancing) return;
		quizStore.answer(questionId, value);

		const def = quizConfig.questions.find((q) => q.id === questionId);
		const autoAdvance =
			def?.type === 'single' || def?.type === 'boolean' || def?.type === 'scale';

		if (autoAdvance) {
			// Respostas já normalizadas no store (ex.: single + array → string)
			const newAnswers = get(quizStore).answers;
			const visible = computeVisibleQuestions(quizConfig.questions, newAnswers);
			const idx = visible.findIndex((q) => q.id === questionId);
			if (idx >= 0) {
				const nextQ = visible[idx + 1] ?? null;
				const isLastStep = idx === visible.length - 1;
				trackQuizStepComplete({
					step_id: questionId,
					step_index: idx + 1,
					steps_total: visible.length,
					next_step_id: nextQ?.id ?? null,
					is_last_step: isLastStep
				});
				tick().then(() => handleNext(nextQ?.id ?? null, isLastStep));
			} else {
				trackQuizStepComplete({ step_id: questionId });
				tick().then(() => handleNext());
			}
		}
	}

	/** Lê o próximo passo a partir do estado atual do store (valor no momento do clique). */
	function getNextStepFromStore(): { nextId: string | null; isLast: boolean } {
		const state = get(quizStore);
		if (!state.currentQuestionId) return { nextId: null, isLast: false };
		const visible = computeVisibleQuestions(quizConfig.questions, state.answers);
		const idx = visible.findIndex((q) => q.id === state.currentQuestionId);
		if (idx < 0) return { nextId: null, isLast: false };
		const nextQ = visible[idx + 1] ?? null;
		return { nextId: nextQ?.id ?? null, isLast: idx === visible.length - 1 };
	}

	async function handleNext(nextIdOrUndefined?: string | null, isLastStep?: boolean) {
		if (navigating.from != null || advancing) return;

		const useExplicit = nextIdOrUndefined !== undefined || isLastStep !== undefined;
		let step = useExplicit
			? { nextId: nextIdOrUndefined ?? null, isLast: isLastStep ?? false }
			: getNextStepFromStore();
		/** Evita ficar preso se nextId explícito vier null sem ser último passo (ex.: dessincronia reativa). */
		if (useExplicit && !step.isLast && (!step.nextId || typeof step.nextId !== 'string')) {
			step = getNextStepFromStore();
		}
		const { nextId, isLast: last } = step;

		if (last) {
			advancing = true;
			try {
				quizStore.complete();
				flushQuizProgressImmediate();
				trackQuizFinishQuestions();
				await goto('/carregando');
			} finally {
				advancing = false;
			}
		} else if (nextId && typeof nextId === 'string') {
			advancing = true;
			try {
				quizTransitionDirection.set('forward');
				preloadData(`/plan/${nextId}`).catch(() => {});
				quizStore.goTo(nextId);
				await goto(`/plan/${nextId}`);
			} finally {
				advancing = false;
			}
		}
	}

</script>

{#if question}
	{@const isGoalType = question.id === 'goal_type'}
	<div
		class="flex flex-col w-full {isGoalType
			? 'shrink-0 pb-[calc(7.5rem+env(safe-area-inset-bottom))]'
			: 'flex-1 min-h-0'}"
	>
		{#if isGoalType}
			<ScrollViewportFill>
				<div class="max-w-lg mx-auto w-full px-4 pt-8 pb-8">
					<QuestionCard
						{question}
						selectedValue={currentAnswer}
						onSelect={handleSelect}
					/>
				</div>
			</ScrollViewportFill>

			<div
				class="max-w-lg mx-auto w-full shrink-0 border-t border-line/70 px-4 pt-10 pb-[calc(9rem+env(safe-area-inset-bottom))]"
			>
				<LegalFooter />
			</div>
		{:else}
		<div
			class="max-w-lg mx-auto w-full px-4 pt-8 {showNextButton ? 'pb-32' : 'pb-8'} flex-1 flex flex-col min-h-0 {question.id === 'info_medication'
				? 'justify-start'
				: question.type === 'microresult'
					? 'justify-start'
					: ''}"
		>
			{#if question.type === 'info'}
				<InfoScreen
					{question}
					center={question.id === 'info_medication'}
					textCenter={question.id === 'protocolo_4_etapas'}
				/>
			{:else if question.type === 'microresult'}
				<MicroResultScreen {question} answers={quiz.answers} />
			{:else if question.type === 'number'}
				<QuestionInputNumber
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else if question.type === 'date'}
				<div class="flex flex-col gap-4">
				<QuestionInputDate
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
				</div>
			{:else if question.type === 'text'}
				<QuestionInputText
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
					titleOverride={whatsappTitle}
				/>
			{:else if question.type === 'slider'}
				<QuestionSlider
					{question}
					value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else if question.type === 'ruler'}
				{#if question.id === 'weight_current_kg'}
					<QuestionWeightCurrent
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						answers={quiz.answers}
					/>
				{:else if question.id === 'weight_goal_kg'}
					<QuestionWeightGoal
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
						answers={quiz.answers}
					/>
				{:else}
					<QuestionRuler
						{question}
						value={typeof currentAnswer === 'string' ? currentAnswer : undefined}
						onSelect={(id, val) => handleSelect(id, val)}
					/>
				{/if}
			{:else if question.type === 'body_fat_grid'}
				<QuestionBodyFatGrid
					{question}
					selectedValue={typeof currentAnswer === 'string' ? currentAnswer : undefined}
					beforeStage={bodyFatBeforeStage}
					onSelect={(id, val) => handleSelect(id, val)}
				/>
			{:else}
				<QuestionCard
					{question}
					selectedValue={currentAnswer}
					onSelect={handleSelect}
				/>
			{/if}
		</div>
		{/if}
	</div>

	<!-- Fixed bottom box — hidden for single choice. Botão entra na cascata (delay 300ms entre itens) em microresult. -->
	{#if showNextButton}
		<div
			class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none"
		>
			<div
				class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto"
			>
				{#if question?.id === 'mr-3' && mr3FooterLoading}
					<div
						class="mb-3 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-line bg-surface text-sm font-medium text-body"
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
						<span>Analisando seus dados...</span>
					</div>
				{:else if question?.id === 'mr-4' && !mr4CtaRevealed}
					<div
						class="mb-3 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-line bg-transparent text-sm font-medium text-body"
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
						<span>Calculando suas calorias e macros</span>
					</div>
				{/if}
				{#if !(question?.id === 'mr-protein' && mrProteinCtaLocked) && !(question?.id === 'mr-4' && !mr4CtaRevealed) && !(question?.id === 'mr-3' && !mr3CtaRevealed)}
				<div id={question?.id === 'mr-4' ? 'quiz-mr4-cta-wrap' : undefined}>
			<button
				type="button"
				onclick={() => handleNext()}
				disabled={!canGoNext || navigating.from != null || advancing}
				class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
				in:fade={question?.id === 'mr-3'
					? { duration: 0, delay: 0 }
					: { duration: 550, delay: buttonCascadeDelay }}
				out:fade={{ duration: question?.id === 'mr-3' ? 0 : 200 }}
			>
				<span>{buttonLabel}</span>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</button>
				</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}
