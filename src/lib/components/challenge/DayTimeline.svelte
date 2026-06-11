<script lang="ts">
	import type { DaySummary } from '$lib/utils/challenge-progress';

	interface Props {
		days: DaySummary[];
		selectedDay: number;
		/** Sem card próprio — encaixa num bloco pai */
		embedded?: boolean;
		onSelectDay: (day: number) => void;
		/** Clique na bolinha — ex.: abrir ingestão diária do dia */
		onOpenIntake?: (day: number) => void;
		onOpenInfo?: () => void;
	}

	let { days, selectedDay, embedded = false, onSelectDay, onOpenIntake, onOpenInfo }: Props = $props();

	const rootClass = $derived(
		embedded ? 'p-4 pb-3' : 'rounded-challenge border border-challenge-border bg-surface p-4'
	);

	const phases = [
		{ num: 1, name: 'Desbloqueio', from: 1, to: 3 },
		{ num: 2, name: 'Aceleração', from: 4, to: 6 },
		{ num: 3, name: 'Consolidação', from: 7, to: 10 },
		{ num: 4, name: 'Finalização', from: 11, to: 14 }
	] as const;

	function phaseDays(from: number, to: number): DaySummary[] {
		return days.filter((d) => d.day >= from && d.day <= to);
	}

	function isActivePhase(from: number, to: number): boolean {
		return selectedDay >= from && selectedDay <= to;
	}

	let timelineEl = $state<HTMLDivElement | null>(null);
	let isDragging = $state(false);
	let dragStartX = 0;
	let scrollStart = 0;
	let didDrag = false;
	let activePointerId: number | null = null;

	function handleDayClick(day: number, navigable: boolean) {
		if (didDrag || !navigable) return;
		onSelectDay(day);
		scrollDayIntoView(day);
	}


	function scrollDayIntoView(day: number) {
		requestAnimationFrame(() => {
			if (!timelineEl) return;
			const btn = timelineEl.querySelector<HTMLElement>(`[data-day="${day}"]`);
			if (!btn) return;
			const target = btn.offsetLeft - timelineEl.clientWidth / 2 + btn.offsetWidth / 2;
			timelineEl.scrollTo({ left: target, behavior: 'smooth' });
		});
	}

	function onPointerDown(e: PointerEvent) {
		e.stopPropagation();
		if (!timelineEl || e.button !== 0) return;
		isDragging = true;
		didDrag = false;
		dragStartX = e.clientX;
		scrollStart = timelineEl.scrollLeft;
		activePointerId = e.pointerId;
	}

	function onPointerMove(e: PointerEvent) {
		e.stopPropagation();
		if (!isDragging || !timelineEl) return;
		const dx = e.clientX - dragStartX;
		if (Math.abs(dx) > 5) {
			didDrag = true;
			if (activePointerId !== null && !timelineEl.hasPointerCapture(activePointerId)) {
				try { timelineEl.setPointerCapture(activePointerId); } catch { /* */ }
			}
		}
		if (didDrag) {
			timelineEl.scrollLeft = scrollStart - dx;
		}
	}

	function endDrag(e: PointerEvent) {
		e.stopPropagation();
		if (!timelineEl) return;
		isDragging = false;
		activePointerId = null;
		if (timelineEl.hasPointerCapture(e.pointerId)) {
			timelineEl.releasePointerCapture(e.pointerId);
		}
		if (didDrag) {
			setTimeout(() => {
				didDrag = false;
			}, 0);
		}
	}

	$effect(() => {
		scrollDayIntoView(selectedDay);
	});
</script>

<div class={rootClass}>
	<div class="mb-3 flex items-center justify-between" data-carousel-drag-zone>
		<p class="text-sm font-bold text-heading">Protocolo de Desbloqueio</p>
		<button
			type="button"
			onclick={() => onOpenInfo?.()}
			class="flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors active:bg-line/30"
			aria-label="Ver tutorial do protocolo"
		>
			<span class="text-[10px] font-semibold text-accent">Ver Tutorial</span>
			<svg class="h-3.5 w-3.5 shrink-0 text-accent" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M8 5v14l11-7z" />
			</svg>
		</button>
	</div>

	<div
		bind:this={timelineEl}
		class="timeline-scroll flex gap-3 overflow-x-auto pb-1 scrollbar-hidden select-none
			{isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
		role="group"
		aria-label="Timeline de 14 dias — arraste para ver os dias"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
		onpointerleave={endDrag}
	>
		{#each phases as phase}
			{@const active = isActivePhase(phase.from, phase.to)}
			<div class="phase-group flex shrink-0 flex-col items-center">
				<div class="flex gap-1.5">
					{#each phaseDays(phase.from, phase.to) as item (item.day)}
						{@const isSelected = item.day === selectedDay}
						<button
							type="button"
							data-day={item.day}
							onclick={() => handleDayClick(item.day, item.navigable)}
							disabled={!item.navigable}
							aria-label="Selecionar dia {item.day}"
							aria-pressed={isSelected}
							class="flex w-10 shrink-0 snap-center flex-col items-center gap-1 rounded-challenge border-2 px-1 py-2 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed
								{isSelected
								? 'border-accent bg-surface text-heading'
								: item.status === 'completed'
									? 'border-accent/40 bg-accent-soft text-accent'
									: 'border-challenge-border bg-surface text-muted'}"
						>
							<span class="text-[10px] font-bold">D{item.day}</span>
							{#if item.status === 'completed'}
								<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path
										d="M3 8.5 L6.5 12 L13 5"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							{:else if item.status === 'current' && !isSelected}
								<span
									class="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-bg"
									aria-hidden="true">●</span
								>
							{:else if !isSelected}
								<span class="h-4 w-4 rounded-full bg-line/80" aria-hidden="true"></span>
							{:else}
								<span class="h-4 w-4 rounded-full bg-line/90" aria-hidden="true"></span>
							{/if}
						</button>
					{/each}
				</div>
				<div class="mt-3 flex w-full flex-col items-center gap-0.5">
					<div
						class="h-px w-full transition-colors duration-200 {active ? 'bg-accent' : 'bg-line'}"
					></div>
					<span
						class="whitespace-nowrap text-[9px] font-semibold leading-tight transition-colors duration-200 {active
							? 'text-accent'
							: 'text-muted/70'}"
					>
						Fase {phase.num} · {phase.name}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.timeline-scroll {
		touch-action: pan-x;
		-webkit-overflow-scrolling: touch;
		scroll-snap-type: x proximity;
		overscroll-behavior-x: contain;
	}
</style>
