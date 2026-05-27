<script lang="ts">
	import type { Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import DailyIntakeCard from '$lib/components/challenge/DailyIntakeCard.svelte';
	import DayTimeline from '$lib/components/challenge/DayTimeline.svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import type { DaySummary } from '$lib/utils/challenge-progress';
	import { canAccessConsultoria } from '$lib/stores/access.store';
	import { generateShoppingList, SHOPPING_LIST, type ShoppingCategory } from '$lib/data/shopping-list';
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	interface Props {
		days: DaySummary[];
		selectedDay: number;
		intakeDay: number;
		showIntake: boolean;
		onSelectDay: (day: number) => void;
		onOpenInfo?: () => void;
	}

	let { days, selectedDay, intakeDay, showIntake, onSelectDay, onOpenInfo }: Props = $props();

	let activeSlide = $state(0);
	let listaSheetOpen = $state(false);

	let isCarouselDragging = $state(false);
	let carouselDragDx = $state(0);
	let carouselDragBaseSlide = 0;
	let carouselDragStartX = 0;
	let carouselDragStartY = 0;
	let carouselLockAxis: 'x' | 'y' | null = null;
	let carouselDidDrag = false;
	let carouselPointerDownTarget: HTMLElement | null = null;
	let carouselPointerDownSlide = 0;

	const AXIS_LOCK_PX = 8;

	const SWIPE_THRESHOLD_PX = 48;
	const listaSlideIndex = $derived((showIntake ? 2 : 1) as 0 | 1 | 2);
	const maxSlideIndex = $derived(showIntake ? 2 : 1);

	function scrollToSlide(index: number) {
		activeSlide = Math.min(maxSlideIndex, Math.max(0, index)) as 0 | 1 | 2;
	}

	const carouselTransform = $derived.by(() => {
		const slide = isCarouselDragging ? carouselDragBaseSlide : activeSlide;
		const drag = isCarouselDragging ? `${carouselDragDx}px` : '0px';
		return `translateX(calc(${slide} * (-100% - 12px) + ${drag}))`;
	});

	const carouselTransition = $derived(
		isCarouselDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
	);

	function shouldIgnoreCarouselPointer(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		return Boolean(target.closest('.timeline-scroll, a[href]'));
	}

	$effect(() => {
		if (activeSlide > maxSlideIndex) {
			activeSlide = maxSlideIndex as 0 | 1 | 2;
		}
	});

	function cancelCarouselDrag() {
		if (!isCarouselDragging) return;
		isCarouselDragging = false;
		carouselLockAxis = null;
		carouselDragDx = 0;
		detachWindowDragListeners();
	}

	function updateCarouselDrag(clientX: number, clientY: number, preventDefault?: () => void) {
		const dx = clientX - carouselDragStartX;
		const dy = clientY - carouselDragStartY;

		if (carouselLockAxis === null) {
			if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
			carouselLockAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
			if (carouselLockAxis === 'y') {
				cancelCarouselDrag();
				return;
			}
		}

		if (carouselLockAxis === 'x') {
			preventDefault?.();
			carouselDragDx = dx;
			if (Math.abs(dx) > 6) carouselDidDrag = true;
		}
	}

	function onWindowPointerMove(e: PointerEvent) {
		if (!isCarouselDragging) return;
		updateCarouselDrag(e.clientX, e.clientY, () => e.preventDefault());
	}

	function onWindowTouchMove(e: TouchEvent) {
		if (!isCarouselDragging) return;
		const touch = e.touches[0];
		if (!touch) return;
		updateCarouselDrag(touch.clientX, touch.clientY, () => e.preventDefault());
	}

	function detachWindowDragListeners() {
		window.removeEventListener('pointermove', onWindowPointerMove);
		window.removeEventListener('touchmove', onWindowTouchMove);
		window.removeEventListener('pointerup', onWindowPointerUp);
		window.removeEventListener('pointercancel', onWindowPointerUp);
		window.removeEventListener('touchend', onWindowPointerUp);
		window.removeEventListener('touchcancel', onWindowPointerUp);
	}

	function onWindowPointerUp() {
		if (!isCarouselDragging) return;
		isCarouselDragging = false;
		carouselLockAxis = null;
		detachWindowDragListeners();

		if (carouselDidDrag) {
			if (carouselDragDx < -SWIPE_THRESHOLD_PX && activeSlide < maxSlideIndex) {
				scrollToSlide(activeSlide + 1);
			} else if (carouselDragDx > SWIPE_THRESHOLD_PX && activeSlide > 0) {
				scrollToSlide(activeSlide - 1);
			}
			setTimeout(() => {
				carouselDidDrag = false;
			}, 0);
		} else {
			const target = carouselPointerDownTarget;
			if (
				activeSlide === listaSlideIndex &&
				target?.closest('[data-lista-trigger]')
			) {
				listaSheetOpen = true;
			} else if (carouselPointerDownSlide !== activeSlide) {
				scrollToSlide(carouselPointerDownSlide);
			}
		}

		carouselDragDx = 0;
		carouselPointerDownTarget = null;
	}

	function onSlidePointerDown(e: PointerEvent, slideIndex: number) {
		if (e.button !== 0 || shouldIgnoreCarouselPointer(e.target)) return;
		isCarouselDragging = true;
		carouselDidDrag = false;
		carouselLockAxis = null;
		carouselDragStartX = e.clientX;
		carouselDragStartY = e.clientY;
		carouselDragBaseSlide = activeSlide;
		carouselDragDx = 0;
		carouselPointerDownSlide = slideIndex;
		carouselPointerDownTarget =
			e.target instanceof HTMLElement ? e.target : null;

		window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
		window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
		window.addEventListener('pointerup', onWindowPointerUp);
		window.addEventListener('pointercancel', onWindowPointerUp);
		window.addEventListener('touchend', onWindowPointerUp);
		window.addEventListener('touchcancel', onWindowPointerUp);
	}

	function openIntakePanel() {
		scrollToSlide(1);
	}

	const shoppingList = $derived(
		$postQuizStore.mealSelections
			? generateShoppingList($postQuizStore.mealSelections)
			: SHOPPING_LIST
	);

	const STORAGE_KEY = 'pd-shopping-checked';

	function loadChecked(): Set<string> {
		if (!browser) return new Set();
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return new Set();
			return new Set(JSON.parse(raw) as string[]);
		} catch {
			return new Set();
		}
	}

	function saveChecked(set: Set<string>) {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
		} catch {}
	}

	let checked = $state<Set<string>>(loadChecked());

	function toggle(id: string) {
		const next = new Set(checked);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		checked = next;
		saveChecked(next);
	}

	function checkedInCat(cat: ShoppingCategory) {
		return cat.items.filter((i) => checked.has(i.id)).length;
	}
</script>

{#snippet consultoriaCta()}
	<a
		href="/consultoria"
		class="protocol-slide-cta block w-full shrink-0 bg-accent text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
	>
		<span class="flex min-h-11 items-center justify-between gap-3 px-4 py-3.5">
			<span class="text-xs font-medium leading-snug">Tenha <strong>1 ano</strong> de acompanhamento <strong>individual</strong></span>
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
	<DayTimeline embedded days={days} {selectedDay} {onSelectDay} onOpenIntake={openIntakePanel} {onOpenInfo} />
{/snippet}

{#snippet intakeFace()}
	<div class="flex flex-1 flex-col justify-center p-4">
		<DailyIntakeCard day={intakeDay} embedded />
	</div>
{/snippet}

{#snippet listaFace()}
	<div
		data-lista-trigger
		role="button"
		tabindex="0"
		class="flex min-h-0 flex-1 flex-col justify-center gap-3 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				listaSheetOpen = true;
			}
		}}
	>
		<span class="text-sm font-extrabold text-heading">Lista de compras</span>
		<p class="text-xs leading-relaxed text-body">Geramos sua lista de compras para 14 dias com base na sua seleção de alimentos.</p>
		<span class="mt-1 flex items-center gap-1 text-xs font-bold text-accent">
			Ver lista
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M5 12h14M13 6l6 6-6 6" />
			</svg>
		</span>
	</div>
{/snippet}

{#snippet protocolSlide(face: Snippet, index: 0 | 1 | 2)}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		data-carousel-slide
		class="protocol-slide carousel-slide-box flex shrink-0 snap-start snap-always flex-col overflow-hidden rounded-challenge border border-challenge-border transition-opacity duration-300"
		style:opacity={activeSlide === index ? 1 : 0.5}
		onpointerdown={(e) => onSlidePointerDown(e, index)}
	>
		<div class="protocol-slide-face relative flex min-h-0 flex-1 flex-col bg-surface">
			{@render face()}
		</div>
		{#if !$canAccessConsultoria}
			{@render consultoriaCta()}
		{/if}
	</div>
{/snippet}

<div class="flex flex-col gap-3">
	<div
		class="carousel-outer {activeSlide > 0 ? 'carousel-outer--peek-left' : ''} {carouselLockAxis === 'x' ? 'carousel-outer--panning' : ''}"
		role="region"
		aria-label="Protocolo e ingestão diária"
		aria-roledescription="carrossel"
	>
		<div
			class="protocol-carousel flex gap-3"
			style:transform={carouselTransform}
			style:transition={carouselTransition}
		>
			{@render protocolSlide(protocolFace, 0)}
			{#if showIntake}
				{@render protocolSlide(intakeFace, 1)}
			{/if}
			{@render protocolSlide(listaFace, listaSlideIndex)}
		</div>
	</div>

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
		{#if showIntake}
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
		{/if}
		<button
			type="button"
			role="tab"
			aria-selected={activeSlide === listaSlideIndex}
			aria-label="Lista de compras"
			onclick={() => scrollToSlide(listaSlideIndex)}
			class="h-2 rounded-full transition-all duration-200 {activeSlide === listaSlideIndex
				? 'w-5 bg-accent'
				: 'w-2 bg-line'}"
		></button>
	</div>

</div>

<BottomSheet open={listaSheetOpen} title="Lista de compras" onClose={() => (listaSheetOpen = false)}>
	<div class="space-y-5 px-5 pb-6 pt-[25px]">
		{#each shoppingList as category (category.id)}
			{@const done = checkedInCat(category)}
			{@const total = category.items.length}
			{@const catDone = done === total}

			<section>
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-[15px] font-bold leading-tight {catDone ? 'text-muted/50' : 'text-heading'}">
						{category.title}
					</h3>
					<span
						class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold {catDone
							? 'bg-accent/10 text-accent'
							: 'bg-surface-2 text-muted'}"
					>
						{done}/{total}
					</span>
				</div>

				<div class="overflow-hidden rounded-2xl bg-surface">
					{#each category.items as item, i (item.id)}
						{@const isChecked = checked.has(item.id)}
						{@const isLast = i === category.items.length - 1}

						<button
							type="button"
							onclick={() => toggle(item.id)}
							class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-2/60 {!isLast
								? 'border-b border-line/40'
								: ''}"
						>
							<span
								class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 {isChecked
									? 'border-accent bg-accent'
									: 'border-line'}"
							>
								{#if isChecked}
									<svg class="h-3 w-3 text-bg" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="2,6 5,9 10,3" />
									</svg>
								{/if}
							</span>

							<span class="flex-1 text-[15px] font-medium leading-snug transition-all duration-150 {isChecked ? 'text-muted/50 line-through' : 'text-body'}">
								{item.name}
							</span>

							<span class="shrink-0 text-[13px] font-medium {isChecked ? 'text-muted/40' : 'text-muted'}">
								{item.qty}
							</span>
						</button>
					{/each}
				</div>
			</section>
		{/each}

		<p class="text-center text-xs leading-relaxed text-muted/50">
			Quantidades estimadas para 14 dias, 1 pessoa.
		</p>
	</div>
</BottomSheet>

<style>
	.carousel-outer {
		overflow: hidden;
		margin-right: -40px;
		padding-right: 40px;
		touch-action: pan-x;
		overscroll-behavior-x: contain;
	}

	.carousel-outer--panning {
		touch-action: none;
	}

	.carousel-outer--peek-left {
		margin-left: -40px;
		padding-left: 40px;
	}

	.protocol-carousel {
		align-items: stretch;
	}

	.protocol-slide {
		align-self: stretch;
	}

	.carousel-slide-box {
		flex: 0 0 100%;
		width: 100%;
		transition: opacity 0.3s ease;
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
