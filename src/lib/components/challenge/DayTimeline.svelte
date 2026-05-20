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
	}

	let { days, selectedDay, embedded = false, onSelectDay, onOpenIntake }: Props = $props();

	const rootClass = $derived(
		embedded ? 'p-4 pb-3' : 'rounded-challenge border border-challenge-border bg-surface p-4'
	);

	let timelineEl = $state<HTMLDivElement | null>(null);
	let isDragging = $state(false);
	let dragStartX = 0;
	let scrollStart = 0;
	let didDrag = false;

	function handleDayClick(day: number, navigable: boolean) {
		if (didDrag || !navigable) return;
		onSelectDay(day);
		scrollDayIntoView(day);
	}

	function handleIntakeClick(e: MouseEvent, day: number, navigable: boolean) {
		e.stopPropagation();
		if (didDrag || !navigable || !onOpenIntake) return;
		onOpenIntake(day);
	}

	function scrollDayIntoView(day: number) {
		requestAnimationFrame(() => {
			const btn = timelineEl?.querySelector(`[data-day="${day}"]`);
			btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
		});
	}

	function onPointerDown(e: PointerEvent) {
		if (!timelineEl || e.button !== 0) return;
		isDragging = true;
		didDrag = false;
		dragStartX = e.clientX;
		scrollStart = timelineEl.scrollLeft;
		timelineEl.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging || !timelineEl) return;
		const dx = e.clientX - dragStartX;
		if (Math.abs(dx) > 5) didDrag = true;
		timelineEl.scrollLeft = scrollStart - dx;
	}

	function endDrag(e: PointerEvent) {
		if (!timelineEl) return;
		isDragging = false;
		if (timelineEl.hasPointerCapture(e.pointerId)) {
			timelineEl.releasePointerCapture(e.pointerId);
		}
		// Evita clique fantasma após arrastar
		if (didDrag) {
			setTimeout(() => {
				didDrag = false;
			}, 0);
		}
	}

	$effect(() => {
		selectedDay;
		if (!isDragging) scrollDayIntoView(selectedDay);
	});
</script>

<div class={rootClass}>
	<p class="mb-3 text-sm font-bold text-heading">Protocolo de Desbloqueio</p>

	<div
		bind:this={timelineEl}
		class="timeline-scroll flex gap-2 overflow-x-auto pb-1 scrollbar-hidden select-none
			{isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
		role="group"
		aria-label="Timeline de 14 dias — arraste para ver os dias"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
		onpointerleave={endDrag}
	>
		{#each days as item (item.day)}
			{@const isSelected = item.day === selectedDay}
			<div
				data-day={item.day}
				class="flex w-11 shrink-0 snap-center flex-col items-center gap-1 rounded-challenge border border-challenge-border px-1 py-2 transition-all duration-200
					{isSelected
					? 'bg-surface text-heading'
					: item.status === 'completed'
						? 'bg-accent-soft text-accent'
						: !item.navigable
							? 'bg-surface-2 opacity-40'
							: 'bg-surface text-muted'}"
			>
				<button
					type="button"
					disabled={!item.navigable}
					onclick={() => handleDayClick(item.day, item.navigable)}
					class="flex w-full flex-col items-center rounded-md transition-colors active:opacity-70 disabled:cursor-not-allowed"
					aria-label="Selecionar dia {item.day}"
					aria-pressed={isSelected}
				>
					<span class="text-[10px] font-bold">D{item.day}</span>
				</button>
				<button
					type="button"
					disabled={!item.navigable || !onOpenIntake}
					onclick={(e) => handleIntakeClick(e, item.day, item.navigable)}
					class="flex h-4 w-4 items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-not-allowed"
					aria-label="Ver ingestão diária do dia {item.day}"
				>
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
			</div>
		{/each}
	</div>
</div>

<style>
	.timeline-scroll {
		touch-action: pan-x;
		-webkit-overflow-scrolling: touch;
		scroll-snap-type: x proximity;
	}
</style>
