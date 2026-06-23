<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, preloadData } from '$app/navigation';
	import { tick } from 'svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { navigating } from '$app/state';
	import { quizStore } from '$lib/stores/quiz.store';
	import {
		trackMetaAddToWishlistPlanV2,
		trackMetaViewContentPlanV2,
		trackQuizStart,
		trackQuizView,
		trackQuizStepComplete
	} from '$lib/services/analytics.service';
	import LegalFooter from '$lib/components/ui/LegalFooter.svelte';
	import ScrollViewportFill from '$lib/components/ui/ScrollViewportFill.svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	import PlanV2BeforeAfterCarousel from './PlanV2BeforeAfterCarousel.svelte';
	import { quizConfig } from '$lib/data/quiz.config';
	import { PROTOCOL_SOCIAL_COUNT_DISPLAY } from '$lib/data/social-proof';
	import { computeVisibleQuestions } from '$lib/utils/branching';
	import { quizTransitionDirection } from '$lib/stores/quiz-transition.store';

	/** Após a 1ª pergunta, o funil segue em `/plan` (A/B só na entrada). */
	const PLAN_FUNNEL = '/plan';
	const DEFAULT_GOAL = 'goal-emagrecer';

	const deliverables = [
		{
			text: 'Seu número exato de calorias pra destravar o metabolismo',
			icon: 'calories' as const
		},
		{
			text: 'Sua meta de proteína pra queimar gordura sem perder músculo',
			icon: 'protein' as const
		},
		{
			text: 'Seu Protocolo de Desbloqueio passo a passo: o que fazer já amanhã',
			icon: 'protocol' as const
		}
	];

	const goalQuestion = $derived(quizConfig.questions.find((q) => q.id === 'goal_type'));
	const goalAnswer = $derived($quizStore.answers['goal_type']);

	let advancing = $state(false);

	onMount(() => {
		if (!browser) return;
		trackQuizView();
		trackMetaViewContentPlanV2();
		quizStore.goTo('goal_type');
	});

	async function handleSelect(questionId: string, value: string | string[]) {
		if (advancing || questionId !== 'goal_type' || typeof value !== 'string' || !goalQuestion) return;

		const state = get(quizStore);
		if (!state.startedAt) {
			quizStore.start();
			trackQuizStart();
		}

		quizStore.answer(questionId, value);

		const visible = computeVisibleQuestions(quizConfig.questions, get(quizStore).answers);
		const idx = visible.findIndex((q) => q.id === 'goal_type');
		const nextQ = idx >= 0 ? (visible[idx + 1] ?? null) : null;
		if (!nextQ) return;

		trackQuizStepComplete({
			step_id: questionId,
			step_index: idx >= 0 ? idx + 1 : undefined,
			steps_total: visible.length,
			next_step_id: nextQ.id,
			is_last_step: idx >= 0 ? idx === visible.length - 1 : undefined
		});

		advancing = true;
		try {
			quizTransitionDirection.set('forward');
			const dest = `${PLAN_FUNNEL}/${nextQ.id}`;
			preloadData(dest).catch(() => {});
			await tick();
			await goto(dest);
		} finally {
			advancing = false;
		}
	}

	async function handleStart() {
		const value =
			typeof goalAnswer === 'string' && goalAnswer.trim() !== '' ? goalAnswer : DEFAULT_GOAL;
		trackMetaAddToWishlistPlanV2();
		await handleSelect('goal_type', value);
	}
</script>

{#if goalQuestion}
	<div class="flex flex-col w-full flex-1 min-h-0">
		<div class="max-w-lg mx-auto w-full px-4 pt-8 pb-8 flex-1 flex flex-col min-h-0">
			<ScrollViewportFill>
				<div class="flex flex-col gap-6">
					<div class="space-y-2">
						<div class="flex justify-center">
							<span
								class="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent"
							>
								<span class="metabolism-tag-dot" aria-hidden="true"></span>
								Teste do Metabolismo · 3 min
							</span>
						</div>
						<h2 class="text-2xl font-medium text-heading leading-[28px] text-center px-2">
							Seu <strong class="font-bold text-[#2E7D5B]">corpo</strong> pode estar
							<strong class="font-bold text-[#2E7D5B]">bloqueado</strong> e queimando
							<strong class="font-bold text-[#2E7D5B]">menos calorias</strong> do que deveria.
						</h2>
						<p class="text-sm text-body leading-relaxed text-center px-4">
							Faça este <strong class="font-bold">teste</strong> para descobrir se o seu
							<strong class="font-bold">metabolismo está bloqueando seu emagrecimento</strong> e receba um
							<strong class="font-bold">plano personalizado</strong> para
							<strong class="font-bold">destravá-lo nos próximos 14 dias</strong>.
						</p>
						<div class="flex justify-center pt-1" aria-hidden="true">
							<div class="h-6 w-px bg-line"></div>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<p class="text-center text-sm font-normal uppercase text-[#6E7C72]">
							Seu resultado inclui
						</p>

						<div
							class="overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_8px_24px_rgba(22,46,33,0.06)]"
						>
							<ul class="flex flex-col divide-y divide-line/50">
							{#each deliverables as item (item.icon)}
								<li class="flex items-center gap-3 px-4 py-3.5">
									<span
										class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"
										aria-hidden="true"
									>
										{#if item.icon === 'calories'}
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M12 2c1 3 2.5 5.5 2.5 8.5a2.5 2.5 0 1 1-5 0C9.5 7.5 11 5 12 2Z" />
												<path d="M8.5 14.5A4.5 4.5 0 0 0 12 19a4.5 4.5 0 0 0 3.5-4.5" />
											</svg>
										{:else if item.icon === 'protein'}
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<line x1="18" y1="20" x2="18" y2="10" />
												<line x1="12" y1="20" x2="12" y2="4" />
												<line x1="6" y1="20" x2="6" y2="14" />
											</svg>
										{:else}
											<svg
												width="18"
												height="18"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
												<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
												<path d="M9 12h6" />
												<path d="M9 16h6" />
												<path d="M9 8h.01" />
											</svg>
										{/if}
									</span>
									<p class="min-w-0 flex-1 text-sm leading-snug text-body">
										{item.text}
									</p>
								</li>
							{/each}
						</ul>
						</div>
						<div class="flex justify-center py-1" aria-hidden="true">
							<div class="h-6 w-px bg-line"></div>
						</div>
					</div>

					<PlanV2BeforeAfterCarousel />
				</div>
			</ScrollViewportFill>

			<div
				class="shrink-0 mt-10 border-t border-line/70 pt-10 pb-[calc(11rem+env(safe-area-inset-bottom))]"
			>
				<LegalFooter />
			</div>
		</div>
	</div>

	<div
		class="fixed bottom-0 left-0 right-0 z-[60] bg-gradient-bottom-fade-white pt-12 pointer-events-none"
	>
		<div
			class="max-w-lg mx-auto w-full px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1 pointer-events-auto flex flex-col gap-2.5"
		>
			<div class="plan-v2-cta-pulse w-full">
				<button
					type="button"
					onclick={handleStart}
					disabled={advancing || navigating.from != null}
					class="plan-v2-cta relative w-full h-[60px] flex items-center justify-center gap-2 overflow-hidden rounded-2xl font-bold text-base uppercase tracking-wide bg-accent text-bg transition-colors duration-200 active:scale-[0.98] hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-40 disabled:pointer-events-none"
				>
					<span class="relative z-[1]">Começar teste gratuito</span>
					<svg
						class="relative z-[1] w-4 h-4 shrink-0"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
						/>
					</svg>
				</button>
			</div>

			<div class="flex items-center justify-center gap-2 min-w-0 px-1">
				<AvatarStack variant="default" size="sm" />
				<p class="text-xs text-muted leading-none whitespace-nowrap">
					<span class="tabular-nums font-bold text-heading">+{PROTOCOL_SOCIAL_COUNT_DISPLAY}</span>
					{' '}mulheres já fizeram o teste
				</p>
			</div>
		</div>
	</div>
{/if}

<style>
	.metabolism-tag-dot {
		width: 8px;
		height: 8px;
		flex-shrink: 0;
		border-radius: 9999px;
		background: var(--color-accent);
		animation: metabolism-dot-pulse 1.4s ease-in-out infinite;
	}

	@keyframes metabolism-dot-pulse {
		0%,
		100% {
			opacity: 1;
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 45%, transparent);
		}

		50% {
			opacity: 0.35;
			box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 0%, transparent);
		}
	}

	.plan-v2-cta-pulse {
		animation: plan-v2-cta-pulse 2.4s ease-in-out infinite;
	}

	.plan-v2-cta-pulse:has(:disabled) {
		animation: none;
	}

	.plan-v2-cta::after {
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
		animation: plan-v2-cta-shimmer 2.8s ease-in-out infinite;
		pointer-events: none;
	}

	.plan-v2-cta:disabled::after {
		animation: none;
		opacity: 0;
	}

	@keyframes plan-v2-cta-pulse {
		0%,
		100% {
			transform: scale(1);
		}

		50% {
			transform: scale(1.025);
		}
	}

	@keyframes plan-v2-cta-shimmer {
		0% {
			background-position: 220% 0;
		}

		100% {
			background-position: -220% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.plan-v2-cta-pulse {
			animation: none;
		}

		.plan-v2-cta::after {
			animation: none;
			opacity: 0;
		}
	}
</style>
