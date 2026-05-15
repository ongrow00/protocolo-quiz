<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	export type HeroProgressStep = { label: string };

	interface Props {
		/** Passo atual (1-based). Ex.: 3 = “Acesso”. */
		currentStep: number;
		steps: readonly HeroProgressStep[];
		/** Preenche os passos 1…N em sequência ao montar (ex.: ativação de conta). */
		introAnimation?: boolean;
		onIntroComplete?: () => void;
	}

	let { currentStep, steps, introAnimation = false, onIntroComplete }: Props = $props();

	const INTRO_INITIAL_MS = 380;
	const INTRO_STEP_MS = 520;

	const totalSteps = $derived(steps.length);

	/** Passo efetivo exibido (0 = todos pendentes durante intro). */
	let visualStep = $state(introAnimation ? 0 : currentStep);

	const effectiveStep = $derived(introAnimation ? visualStep : currentStep);

	const allComplete = $derived(effectiveStep > totalSteps);

	const trackInset = $derived(`${100 / (2 * totalSteps)}%`);

	/** Borda direita do preenchimento: alinhada ao centro do passo ativo (ex.: passo 3 = Acesso). */
	const trackFillEnd = $derived(
		totalSteps <= 1 || effectiveStep <= 0
			? '0%'
			: allComplete
				? `calc(100% - ${trackInset})`
				: `${((2 * effectiveStep - 1) / (2 * totalSteps)) * 100}%`
	);

	function stepState(index: number): 'done' | 'current' | 'pending' {
		const n = index + 1;
		if (allComplete) return 'done';
		if (effectiveStep <= 0) return 'pending';
		if (n < effectiveStep) return 'done';
		if (n === effectiveStep) return 'current';
		return 'pending';
	}

	onMount(() => {
		if (!introAnimation || !browser) return;

		const reducedMotion =
			typeof matchMedia !== 'undefined' &&
			matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (reducedMotion) {
			visualStep = currentStep;
			onIntroComplete?.();
			return;
		}

		visualStep = 0;
		const timers: ReturnType<typeof setTimeout>[] = [];
		let step = 0;

		const advance = () => {
			step += 1;
			visualStep = step;
			if (step >= currentStep) {
				onIntroComplete?.();
				return;
			}
			timers.push(setTimeout(advance, INTRO_STEP_MS));
		};

		timers.push(setTimeout(advance, INTRO_INITIAL_MS));

		return () => timers.forEach(clearTimeout);
	});
</script>

<nav class="w-full" aria-label="Progresso do acesso">
	<div
		class="grid w-full gap-y-0"
		style="grid-template-columns: repeat({totalSteps}, minmax(0, 1fr))"
		role="list"
	>
		{#each steps as step, i (step.label)}
			<div class="flex justify-center items-end h-3 mb-1 min-w-0" role="listitem">
				{#if stepState(i) === 'current'}
					<svg
						class="w-3 h-3 text-muted shrink-0 hero-progress-chevron"
						viewBox="0 0 12 12"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M3 4.5 6 7.5 9 4.5" />
					</svg>
				{/if}
				<span class="sr-only">{step.label}</span>
			</div>
		{/each}

		<div
			class="col-span-full relative grid items-center min-h-8"
			style="grid-template-columns: repeat({totalSteps}, minmax(0, 1fr))"
		>
			<div
				class="pointer-events-none absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-line"
				style:left={trackInset}
				style:right={trackInset}
				aria-hidden="true"
			></div>
			<div
				class="pointer-events-none absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-accent hero-progress-track-fill"
				style:left={trackInset}
				style:width="calc({trackFillEnd} - {trackInset})"
				aria-hidden="true"
			></div>

			{#each steps as step, i (step.label)}
				{@const state = stepState(i)}
				{@const stepNum = i + 1}
				<div class="flex justify-center min-w-0" role="listitem">
					<div
						class="hero-progress-dot relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border-2
							{state === 'pending'
							? 'border-line bg-surface text-muted'
							: 'border-accent bg-accent text-bg'}"
						aria-current={state === 'current' ? 'step' : undefined}
					>
						{#if state === 'done'}
							<svg
								class="size-4 shrink-0 hero-progress-check"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.003L3.29 9.257a1 1 0 1 1 1.415-1.414l4.04 4.04 6.543-6.594a1 1 0 0 1 1.416 0Z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<span class="text-sm font-bold tabular-nums leading-none">{stepNum}</span>
						{/if}
					</div>
					<span class="sr-only">{step.label}</span>
				</div>
			{/each}
		</div>

		{#each steps as step, i (step.label)}
			{@const state = stepState(i)}
			<div class="flex justify-center min-w-0 mt-2" role="listitem">
				<span
					class="hero-progress-label text-center text-[11px] leading-tight sm:text-xs
						{state === 'pending' ? 'text-muted font-normal' : 'text-heading font-medium'}"
				>
					{step.label}
				</span>
			</div>
		{/each}
	</div>
</nav>

<style>
	.hero-progress-track-fill {
		transition: width 0.52s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hero-progress-dot {
		transition:
			background-color 0.42s cubic-bezier(0.22, 1, 0.36, 1),
			border-color 0.42s cubic-bezier(0.22, 1, 0.36, 1),
			color 0.42s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hero-progress-dot:not(.border-line) {
		animation: hero-progress-dot-pop 0.42s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hero-progress-check {
		animation: hero-progress-check-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hero-progress-chevron {
		animation: hero-progress-chevron-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.hero-progress-label {
		transition:
			color 0.42s cubic-bezier(0.22, 1, 0.36, 1),
			font-weight 0.2s ease;
	}

	@keyframes hero-progress-dot-pop {
		from {
			transform: scale(0.88);
		}
		to {
			transform: scale(1);
		}
	}

	@keyframes hero-progress-check-in {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes hero-progress-chevron-in {
		from {
			opacity: 0;
			transform: translateY(-3px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-progress-track-fill,
		.hero-progress-dot,
		.hero-progress-label {
			transition: none;
		}

		.hero-progress-dot:not(.border-line),
		.hero-progress-check,
		.hero-progress-chevron {
			animation: none;
		}
	}
</style>
