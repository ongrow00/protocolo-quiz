<script lang="ts">
	interface Props {
		value: number;
		min: number;
		max: number;
		onchange?: (v: number) => void;
		/** Números abaixo das marcas (desligar ex.: escala 1–7 kg; o valor grande já mostra a escolha) */
		showTickNumbers?: boolean;
		/** Largura em px por unidade na régua (maior = “passos” mais espaçados) */
		tickWidth?: number;
		/** Marcações verticais mais altas e legíveis (ex.: faixa curta 1–7) */
		largeSteps?: boolean;
		/**
		 * Se true, ao soltar não emite onchange quando o valor arredondado não mudou
		 * desde o início do arrasto e não houve passo inteiro durante o arrasto
		 * (evita “confirmar” só com toque sem ajustar — ex.: peso atual + IMC).
		 */
		suppressOnUnchangedRelease?: boolean;
	}

	let {
		value = $bindable(),
		min,
		max,
		onchange,
		showTickNumbers = true,
		tickWidth: tickWidthProp,
		largeSteps = false,
		suppressOnUnchangedRelease = false
	}: Props = $props();

	const TICK_W = $derived(tickWidthProp ?? 6);
	const H = $derived(largeSteps ? 88 : 80);
	const LABEL_H = $derived(showTickNumbers ? 22 : 12);

	let containerWidth = $state(320);
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartRaw = 0;
	/** Houve cruzamento de inteiro em moveDrag neste gesto (snapped !== value antes de atualizar). */
	let dragEmittedChange = $state(false);
	let rawValue = $state(value);

	$effect(() => {
		if (!isDragging) rawValue = value;
	});

	const translateX = $derived(-(rawValue - min) * TICK_W);

	function startDrag(x: number) {
		isDragging = true;
		dragEmittedChange = false;
		dragStartX = x;
		dragStartRaw = rawValue;
	}

	function moveDrag(x: number) {
		if (!isDragging) return;
		// Drag left = value increases (ruler slides left → larger values come to center)
		const dx = dragStartX - x;
		rawValue = Math.min(max, Math.max(min, dragStartRaw + dx / TICK_W));
		const snapped = Math.round(rawValue);
		if (snapped !== value) {
			dragEmittedChange = true;
			value = snapped;
			onchange?.(snapped);
		}
	}

	function endDrag() {
		if (!isDragging) return;
		isDragging = false;
		rawValue = Math.round(rawValue);
		value = rawValue;
		const next = value;
		const startSnap = Math.round(dragStartRaw);
		if (
			suppressOnUnchangedRelease &&
			!dragEmittedChange &&
			startSnap === next
		) {
			return;
		}
		onchange?.(value);
	}

	const ticks = $derived(Array.from({ length: max - min + 1 }, (_, i) => min + i));
	/** Faixas curtas (ex.: 1–7 kg): mostrar número em cada marca */
	const labelEveryTick = $derived(max - min <= 8);

	function tickHeight(v: number): number {
		if (largeSteps) {
			if (v % 10 === 0) return 36;
			if (v % 5 === 0) return 32;
			return 28;
		}
		if (v % 10 === 0) return 28;
		if (v % 5 === 0) return 17;
		return 9;
	}

	function tickOpacity(v: number): number {
		if (largeSteps) return 1;
		if (v % 10 === 0) return 1;
		if (v % 5 === 0) return 0.65;
		return 0.35;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative overflow-hidden select-none touch-none"
	style="height: {H}px; cursor: {isDragging ? 'grabbing' : 'grab'}"
	bind:clientWidth={containerWidth}
	onmousedown={(e) => {
		e.preventDefault();
		startDrag(e.clientX);
	}}
	onmousemove={(e) => moveDrag(e.clientX)}
	onmouseup={endDrag}
	onmouseleave={endDrag}
	ontouchstart={(e) => startDrag(e.touches[0].clientX)}
	ontouchmove={(e) => moveDrag(e.touches[0].clientX)}
	ontouchend={endDrag}
	role="slider"
	aria-valuemin={min}
	aria-valuemax={max}
	aria-valuenow={Math.round(rawValue)}
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'ArrowRight') {
			value = Math.min(max, value + 1);
			onchange?.(value);
		} else if (e.key === 'ArrowLeft') {
			value = Math.max(min, value - 1);
			onchange?.(value);
		}
	}}
>
	<!-- Scrolling ruler -->
	<div
		class="absolute top-0 bottom-0 flex items-stretch"
		style="
			left: 0;
			transform: translateX({translateX}px);
			transition: {isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'};
			will-change: transform;
		"
	>
		<!-- Left padding: keeps min value reachable at center -->
		<div style="width: {containerWidth / 2}px; flex-shrink: 0"></div>

		{#each ticks as tick}
			<div class="relative flex-shrink-0" style="width: {TICK_W}px">
				<!-- Tick line, anchored above the label area -->
				<div
					class="absolute rounded-full bg-line"
					style="
						width: 1px;
						height: {tickHeight(tick)}px;
						bottom: {LABEL_H}px;
						left: 50%;
						transform: translateX(-50%);
						opacity: {tickOpacity(tick)};
					"
				></div>
				{#if showTickNumbers && (labelEveryTick || tick % 10 === 0)}
					<span
						class="absolute text-muted tabular-nums font-medium"
						style="
							font-size: {labelEveryTick ? '10px' : '9px'};
							bottom: 4px;
							left: 50%;
							transform: translateX(-50%);
							white-space: nowrap;
							line-height: 1;
						">{tick}</span
					>
				{/if}
			</div>
		{/each}

		<!-- Right padding: keeps max value reachable at center -->
		<div style="width: {containerWidth / 2}px; flex-shrink: 0"></div>
	</div>

	<!-- Fixed center indicator (vertical green line) -->
	<div
		class="pointer-events-none absolute top-0 z-10 flex flex-col items-center"
		style="left: 50%; transform: translateX(-50%); height: {H - LABEL_H + 4}px"
	>
		<div class="flex-1 w-[1.5px] bg-accent"></div>
		<div class="w-2 h-2 rounded-full bg-accent flex-shrink-0"></div>
		<div class="w-[1.5px] bg-accent flex-shrink-0" style="height: {LABEL_H - 4}px"></div>
	</div>

	<!-- Left fade -->
	<div
		class="pointer-events-none absolute top-0 bottom-0 left-0 z-20"
		style="width: {containerWidth / 4}px; background: linear-gradient(to right, var(--color-bg) 0%, transparent 100%)"
	></div>
	<!-- Right fade -->
	<div
		class="pointer-events-none absolute top-0 bottom-0 right-0 z-20"
		style="width: {containerWidth / 4}px; background: linear-gradient(to left, var(--color-bg) 0%, transparent 100%)"
	></div>
</div>
