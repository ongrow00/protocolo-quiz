<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';

	const PAUSE_MS = 400;
	/** Modal «deseja emagrecer» aos 60% deste passo. */
	const PROTEIN_STEP_INDEX = 1;
	/** Modal «meta de peso» aos 35% deste passo. */
	const PREFERENCES_STEP_INDEX = 2;
	/** Modal «compromisso com o plano» aos 87% deste passo. */
	const RESTRICTIONS_STEP_INDEX = 3;

	type GateModalKind = 'lose_weight_intent' | 'weight_goal' | 'plan_commit';

	const STEPS: { label: string; durationMs: number; pauseAt?: number }[] = [
		{ label: 'Analisando meta de calorias', durationMs: 3000 },
		{ label: 'Analisando meta de proteína', durationMs: 4000, pauseAt: 60 },
		{ label: 'Analisando preferências alimentares', durationMs: 2000, pauseAt: 35 },
		{ label: 'Analisando restrições', durationMs: 3000, pauseAt: 87 }
	];

	let activeIndex = $state(0);
	let progress = $state(0); // 0..100 for current step
	let allDone = $state(false);

	let startTime = 0;
	let rafId = 0;

	const quiz = $derived($quizStore);

	const goalKgLabel = $derived.by(() => {
		const raw = quiz.answers['weight_goal_kg'];
		if (raw == null) return '—';
		const n =
			typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(String(raw[0])) : NaN;
		return Number.isFinite(n) ? String(Math.round(n)) : '—';
	});

	const weightGoalFeelingWord = $derived('realizada');

	let gateModalOpen = $state(false);
	let gateModalKind = $state<GateModalKind | null>(null);
	let proteinGatePassed = $state(false);
	let preferencesGatePassed = $state(false);
	let restrictionsGatePassed = $state(false);

	function phaseDurations(step: (typeof STEPS)[number]) {
		const phaseDuration = step.durationMs - PAUSE_MS;
		const phase1Duration = phaseDuration * ((step.pauseAt ?? 0) / 100);
		const phase2Duration = phaseDuration * (1 - (step.pauseAt ?? 0) / 100);
		return { phaseDuration, phase1Duration, phase2Duration };
	}

	function gateFreezesProgress(): boolean {
		if (!gateModalOpen || gateModalKind == null) return false;
		if (
			activeIndex === PROTEIN_STEP_INDEX &&
			gateModalKind === 'lose_weight_intent' &&
			!proteinGatePassed
		) {
			return true;
		}
		if (activeIndex === PREFERENCES_STEP_INDEX && gateModalKind === 'weight_goal' && !preferencesGatePassed) {
			return true;
		}
		if (activeIndex === RESTRICTIONS_STEP_INDEX && gateModalKind === 'plan_commit' && !restrictionsGatePassed) {
			return true;
		}
		return false;
	}

	/** Enquanto o modal de gate está aberto, o progresso do passo atual congela no patamar. */
	function effectiveElapsed(now: number): number {
		if (gateFreezesProgress()) {
			const step = STEPS[activeIndex];
			const { phase1Duration } = phaseDurations(step);
			return phase1Duration;
		}
		return now - startTime;
	}

	function shouldHoldForGate(): boolean {
		if (activeIndex === PROTEIN_STEP_INDEX && !proteinGatePassed) return true;
		if (activeIndex === PREFERENCES_STEP_INDEX && !preferencesGatePassed) return true;
		if (activeIndex === RESTRICTIONS_STEP_INDEX && !restrictionsGatePassed) return true;
		return false;
	}

	function tick(now: number) {
		if (activeIndex >= STEPS.length) {
			allDone = true;
			return;
		}
		const step = STEPS[activeIndex];
		const elapsed = effectiveElapsed(now);
		let p: number;
		if (step.pauseAt != null) {
			const { phase1Duration, phase2Duration } = phaseDurations(step);
			if (elapsed < phase1Duration) {
				p = (elapsed / phase1Duration) * step.pauseAt;
			} else if (shouldHoldForGate()) {
				p = step.pauseAt;
				if (!gateModalOpen) {
					gateModalOpen = true;
					gateModalKind =
						activeIndex === PROTEIN_STEP_INDEX
							? 'lose_weight_intent'
							: activeIndex === PREFERENCES_STEP_INDEX
								? 'weight_goal'
								: 'plan_commit';
				}
			} else if (elapsed <= phase1Duration + PAUSE_MS) {
				p = step.pauseAt;
			} else {
				const phase2Elapsed = elapsed - phase1Duration - PAUSE_MS;
				p = step.pauseAt + (phase2Elapsed / phase2Duration) * (100 - step.pauseAt);
			}
			p = Math.min(100, p);
		} else {
			p = Math.min(100, (elapsed / step.durationMs) * 100);
		}
		progress = p;
		if (p >= 100) {
			activeIndex += 1;
			startTime = now;
			progress = 0;
		}
		rafId = requestAnimationFrame(tick);
	}

	function dismissGateAndContinue() {
		if (!gateModalOpen || gateModalKind == null) return;
		const step = STEPS[activeIndex];
		const { phase1Duration } = phaseDurations(step);
		const kind = gateModalKind;
		gateModalOpen = false;
		if (kind === 'lose_weight_intent') {
			proteinGatePassed = true;
		} else if (kind === 'weight_goal') {
			preferencesGatePassed = true;
		} else {
			restrictionsGatePassed = true;
		}
		gateModalKind = null;
		startTime = performance.now() - (phase1Duration + PAUSE_MS);
	}

	function handleGateSim() {
		dismissGateAndContinue();
	}

	function handleGateNao() {
		dismissGateAndContinue();
	}

	onMount(() => {
		startTime = performance.now();
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});
</script>

<style>
	.progress-fill {
		position: relative;
	}
	.progress-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0) 30%,
			rgba(255, 255, 255, 0.35) 50%,
			rgba(255, 255, 255, 0) 70%,
			transparent 100%
		);
		background-size: 60% 100%;
		animation: shimmer 1.2s ease-in-out infinite;
	}
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(200%);
		}
	}
</style>

{#if gateModalOpen && gateModalKind != null}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/35 backdrop-blur-md"
		role="presentation"
		aria-hidden="false"
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="gate-dialog-title"
			class="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-line bg-surface p-6 shadow-xl"
		>
			<div class="flex flex-col items-center justify-center px-0.5 pb-1">
				<h2 id="gate-dialog-title" class="text-center text-2xl font-extrabold leading-6 text-heading">
					{#if gateModalKind === 'lose_weight_intent'}
						Você realmente deseja emagrecer nos próximos 14 dias?
					{:else if gateModalKind === 'weight_goal'}
						{#if goalKgLabel !== '—'}
							Você se sentiria {weightGoalFeelingWord} em chegar a {goalKgLabel} kg nos próximos 14 dias?
						{:else}
							Você confirma a meta de peso que definiu para os próximos 14 dias?
						{/if}
					{:else}
						Você se compromete a seguir o plano nos próximos 14 dias?
					{/if}
				</h2>
			</div>
			<div class="grid shrink-0 grid-cols-2 gap-3 pt-4">
				<button
					type="button"
					onclick={handleGateNao}
					class="h-12 rounded-xl border-2 border-line bg-transparent font-semibold text-body transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
				>
					Não
				</button>
				<button
					type="button"
					onclick={handleGateSim}
					class="h-12 rounded-xl border-2 border-accent bg-accent font-semibold text-bg transition-colors hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
				>
					Sim
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="flex flex-col gap-8 w-full pb-24">
	<div class="flex flex-col gap-2">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">Estamos finalizando seu protocolo</h2>
		<p class="text-sm text-body leading-relaxed">
			Isso leva apenas alguns segundos enquanto montamos seu plano.
		</p>
	</div>

	<div class="flex flex-col gap-6 w-full">
		{#each STEPS as step, i}
			{@const stepProgress = i < activeIndex ? 100 : i === activeIndex ? progress : 0}
			{@const isActive = i <= activeIndex}
			<div class="flex flex-col gap-2 w-full">
				<div class="flex justify-between items-baseline gap-2">
					<span class="text-sm font-medium {isActive ? 'text-heading' : 'text-muted'}">
						<span class="inline-flex items-center gap-2">
							<span>{step.label}</span>
							{#if stepProgress >= 100}
								<svg class="w-4 h-4 text-heading shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.003L3.29 9.257a1 1 0 1 1 1.415-1.414l4.04 4.04 6.543-6.594a1 1 0 0 1 1.416 0Z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</span>
					</span>
					<span class="text-sm tabular-nums font-medium {isActive ? 'text-heading' : 'text-muted'}">{Math.round(stepProgress)}%</span>
				</div>
				<div class="w-full h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={stepProgress} aria-valuemin={0} aria-valuemax={100}>
					<div
						class="progress-fill h-full rounded-full transition-none relative overflow-hidden"
						style="width: {stepProgress}%; background: linear-gradient(to right, rgba(22, 46, 33, 0.12), #162e21);"
					>
						{#if i === activeIndex && stepProgress > 0 && stepProgress < 100}
							<div class="progress-shimmer" aria-hidden="true"></div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if allDone}
		<div class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none">
			<div class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto">
			<button
				type="button"
				onclick={() => goto('/nome')}
				class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			>
				<span>Continuar</span>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
				</svg>
			</button>
			</div>
		</div>
	{/if}
</div>
