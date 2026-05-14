<script lang="ts">
	interface Props {
		value: number;
		min: number;
		max: number;
		onchange?: (v: number) => void;
	}

	let { value = $bindable(), min, max, onchange }: Props = $props();

	const TICK_H = 6; // pixels per unit
	const RULER_H = 300; // visible container height

	let isDragging = $state(false);
	let dragStartY = 0;
	let dragStartRaw = 0;
	let rawValue = $state(value);

	// Sync rawValue when value changes externally (e.g. unit switch)
	$effect(() => {
		if (!isDragging) rawValue = value;
	});

	const displayValue = $derived(Math.round(Math.min(max, Math.max(min, rawValue))));
	const translateY = $derived(-(rawValue - min) * TICK_H);

	function startDrag(y: number) {
		isDragging = true;
		dragStartY = y;
		dragStartRaw = rawValue;
	}

	function moveDrag(y: number) {
		if (!isDragging) return;
		const dy = dragStartY - y; // positive = dragging up = value increases
		rawValue = Math.min(max, Math.max(min, dragStartRaw + dy / TICK_H));
		const snapped = Math.round(rawValue);
		if (snapped !== value) {
			value = snapped;
			onchange?.(snapped);
		}
	}

	function endDrag() {
		if (!isDragging) return;
		isDragging = false;
		rawValue = Math.round(rawValue);
		value = rawValue;
		onchange?.(value);
	}

	const ticks = $derived(Array.from({ length: max - min + 1 }, (_, i) => min + i));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative select-none touch-none overflow-hidden"
	style="height: {RULER_H}px; cursor: {isDragging ? 'grabbing' : 'grab'}"
	onmousedown={(e) => {
		e.preventDefault();
		startDrag(e.clientY);
	}}
	onmousemove={(e) => moveDrag(e.clientY)}
	onmouseup={endDrag}
	onmouseleave={endDrag}
	ontouchstart={(e) => startDrag(e.touches[0].clientY)}
	ontouchmove={(e) => moveDrag(e.touches[0].clientY)}
	ontouchend={endDrag}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={displayValue}
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'ArrowUp') { value = Math.min(max, value + 1); onchange?.(value); }
		else if (e.key === 'ArrowDown') { value = Math.max(min, value - 1); onchange?.(value); }
	}}
>
	<!-- Scrolling ruler -->
	<div
		class="absolute inset-x-0"
		style="
			transform: translateY({translateY}px);
			transition: {isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
			will-change: transform;
		"
	>
		<!-- Top padding so min value can reach center -->
		<div style="height: {RULER_H / 2}px"></div>

		{#each ticks as tick}
			<div
				class="flex items-center justify-end"
				style="height: {TICK_H}px; padding-right: 2.5rem"
			>
				{#if tick % 10 === 0}
					<span class="text-[10px] leading-none text-muted mr-2 tabular-nums font-medium"
						>{tick}</span
					>
					<div class="h-[1.5px] w-8 bg-line rounded-full"></div>
				{:else if tick % 5 === 0}
					<div class="h-px w-5 bg-line opacity-70 rounded-full"></div>
				{:else}
					<div class="h-px w-3 bg-line opacity-40 rounded-full"></div>
				{/if}
			</div>
		{/each}

		<!-- Bottom padding so max value can reach center -->
		<div style="height: {RULER_H / 2}px"></div>
	</div>

	<!-- Fixed center indicator line: linha igual; número + bolinha encostados à direita -->
	<div
		class="pointer-events-none absolute inset-x-0 z-10 flex items-center"
		style="top: {RULER_H / 2}px; transform: translateY(-50%)"
	>
		<div class="flex-1 h-[1.5px] bg-accent"></div>
		<div class="flex items-center shrink-0 ml-auto">
			<div class="w-2 h-2 rounded-full bg-accent flex-shrink-0 mx-0.5"></div>
			<span class="text-sm font-bold text-accent tabular-nums whitespace-nowrap">
				{displayValue}
			</span>
		</div>
	</div>

	<!-- Top fade -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 z-20"
		style="height: {RULER_H / 3.5}px; background: linear-gradient(to bottom, var(--color-bg) 0%, transparent 100%)"
	></div>
	<!-- Bottom fade -->
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 z-20"
		style="height: {RULER_H / 3.5}px; background: linear-gradient(to top, var(--color-bg) 0%, transparent 100%)"
	></div>
</div>
