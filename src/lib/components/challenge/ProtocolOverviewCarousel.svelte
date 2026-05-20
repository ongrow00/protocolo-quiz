<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChallengeOverviewBar from '$lib/components/challenge/ChallengeOverviewBar.svelte';
	import DailyIntakeCard from '$lib/components/challenge/DailyIntakeCard.svelte';
	import DayTimeline from '$lib/components/challenge/DayTimeline.svelte';
	import type { DaySummary } from '$lib/utils/challenge-progress';

	const SLIDE_GAP_PX = 12;

	interface Props {
		days: DaySummary[];
		selectedDay: number;
		globalPercent: number;
		intakeDay: number;
		showIntake: boolean;
		onSelectDay: (day: number) => void;
	}

	let { days, selectedDay, globalPercent, intakeDay, showIntake, onSelectDay }: Props = $props();

	let carouselEl = $state<HTMLDivElement | null>(null);
	let activeSlide = $state(0);

	const slideCount = $derived(showIntake ? 2 : 1);

	function slideStep(): number {
		if (!carouselEl) return 0;
		const slide = carouselEl.querySelector<HTMLElement>('[data-carousel-slide]');
		if (!slide) return carouselEl.clientWidth;
		return slide.offsetWidth + (showIntake ? SLIDE_GAP_PX : 0);
	}

	function scrollToSlide(index: 0 | 1) {
		if (!carouselEl) return;
		const step = slideStep();
		if (step <= 0) return;
		carouselEl.scrollTo({ left: index * step, behavior: 'smooth' });
		activeSlide = index;
	}

	function onCarouselScroll() {
		if (!carouselEl) return;
		const step = slideStep();
		if (step <= 0) return;
		activeSlide = Math.min(slideCount - 1, Math.round(carouselEl.scrollLeft / step));
	}

	function openIntakePanel() {
		scrollToSlide(1);
	}
</script>

{#snippet consultoriaCta()}
	<a
		href="/consultoria"
		class="protocol-slide-cta block w-full shrink-0 bg-accent text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
	>
		<span class="flex min-h-11 items-center justify-between gap-3 px-4 py-3.5">
			<span class="text-xs font-medium leading-snug">Quer um acompanhamento individual?</span>
			<svg
				class="h-4 w-4 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M5 12h14M13 6l6 6-6 6" />
			</svg>
		</span>
	</a>
{/snippet}

{#snippet protocolFace()}
	<DayTimeline embedded days={days} {selectedDay} {onSelectDay} onOpenIntake={openIntakePanel} />
	<div class="border-t border-challenge-border px-4 pb-4 pt-4">
		<ChallengeOverviewBar percent={globalPercent} />
	</div>
{/snippet}

{#snippet intakeFace()}
	<div class="flex flex-1 flex-col justify-center p-4">
		<DailyIntakeCard day={intakeDay} embedded />
	</div>
{/snippet}

{#snippet protocolSlide(face: Snippet)}
	<div
		data-carousel-slide
		class="protocol-slide carousel-slide-box flex shrink-0 snap-start snap-always flex-col overflow-hidden rounded-challenge border border-challenge-border"
	>
		<div class="protocol-slide-face relative flex min-h-0 flex-1 flex-col bg-surface">
			{@render face()}
		</div>
		{@render consultoriaCta()}
	</div>
{/snippet}

<div class="flex flex-col gap-3">
	<div
		bind:this={carouselEl}
		class="protocol-carousel flex overflow-x-auto snap-x snap-mandatory scrollbar-hidden {showIntake
			? 'gap-3 protocol-carousel--peek'
			: ''}"
		role="region"
		aria-label="Protocolo e ingestão diária"
		aria-roledescription="carrossel"
		onscroll={onCarouselScroll}
	>
		{@render protocolSlide(protocolFace)}
		{#if showIntake}
			{@render protocolSlide(intakeFace)}
		{/if}
	</div>

	{#if showIntake}
		<div class="flex items-center justify-center gap-2" role="tablist" aria-label="Painéis do protocolo">
			<button
				type="button"
				role="tab"
				aria-selected={activeSlide === 0}
				aria-label="Protocolo de Desbloqueio"
				onclick={() => scrollToSlide(0)}
				class="h-2 rounded-full transition-all duration-200 {activeSlide === 0
					? 'w-5 bg-accent'
					: 'w-2 bg-line'}"
			></button>
			<button
				type="button"
				role="tab"
				aria-selected={activeSlide === 1}
				aria-label="Ingestão diária"
				onclick={() => scrollToSlide(1)}
				class="h-2 rounded-full transition-all duration-200 {activeSlide === 1
					? 'w-5 bg-accent'
					: 'w-2 bg-line'}"
			></button>
		</div>
	{/if}
</div>

<style>
	.protocol-carousel {
		touch-action: pan-x;
		-webkit-overflow-scrolling: touch;
		scroll-snap-type: x mandatory;
		align-items: stretch;
	}

	.protocol-slide {
		align-self: stretch;
	}

	.protocol-carousel--peek .carousel-slide-box {
		/* card + gap (12px) + 5px do próximo box visível = largura do viewport */
		flex: 0 0 calc(100% - 17px);
		width: calc(100% - 17px);
	}

	.protocol-carousel:not(.protocol-carousel--peek) .carousel-slide-box {
		flex: 0 0 100%;
		width: 100%;
	}

	.protocol-slide-face {
		flex: 1 1 auto;
		min-height: 0;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
	}

	.protocol-slide-cta {
		position: relative;
		flex-shrink: 0;
		overflow: hidden;
		border-radius: 0 0 var(--radius-challenge) var(--radius-challenge);
	}

	.protocol-slide-cta::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 38%,
			rgba(255, 255, 255, 0.22) 50%,
			transparent 62%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: protocol-slide-cta-shine 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	.protocol-slide-cta > span {
		position: relative;
		z-index: 1;
	}

	@keyframes protocol-slide-cta-shine {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.protocol-slide-cta::after {
			animation: none;
		}
	}
</style>
