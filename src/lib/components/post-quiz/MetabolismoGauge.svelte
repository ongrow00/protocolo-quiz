<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		percent?: number;
		label?: string;
	}

	let { percent = 87, label = 'Nível de bloqueio' }: Props = $props();

	const p = $derived(Math.min(100, Math.max(0, percent)));

	const SEGMENT_COUNT = 26;
	const CX = 180;
	const CY = 178;
	const INNER_R = 82;
	const OUTER_R = 128;
	const SEG_LEN = 25;
	const SEG_W = 8;

	const animPct = tweened(0, { duration: 1500, easing: cubicOut });

	onMount(() => {
		requestAnimationFrame(() => requestAnimationFrame(() => animPct.set(p)));
	});

	const displayPct = $derived(Math.round($animPct));

	const segments = $derived.by(() => {
		const filled = Math.round(($animPct / 100) * SEGMENT_COUNT);
		return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
			const t = SEGMENT_COUNT > 1 ? i / (SEGMENT_COUNT - 1) : 0;
			const angle = Math.PI - t * Math.PI;
			const midR = (INNER_R + OUTER_R) / 2;
			const x = CX + midR * Math.cos(angle);
			const y = CY - midR * Math.sin(angle);
			const deg = 90 - (angle * 180) / Math.PI;
			const isFilled = i < filled;
			let color = 'var(--color-line)';
			if (isFilled) {
				if (t < 0.34) color = 'var(--color-accent)';
				else if (t < 0.67) color = 'var(--color-farol-yellow)';
				else color = 'var(--color-farol-red)';
			}
			return { x, y, deg, color, isFilled };
		});
	});

	const PERCENT_FONT_SIZE = 38;
	const LABEL_FONT_SIZE = 13;
	const LABEL_OFFSET = 22;
	const LABEL_GAP = 12;
	const DOT_R = 4;
	const midR = (INNER_R + OUTER_R) / 2;

	/** Centro do % alinhado à base do arco (y = CY). */
	const textY = $derived(CY - PERCENT_FONT_SIZE / 2);
	/** Rótulo abaixo da base do gráfico. */
	const labelY = $derived(CY + LABEL_OFFSET);

	const VIEW_W = 360;
	const VIEW_PAD_TOP = 8;
	const VIEW_PAD_BOTTOM = 10;
	const arcTopY = CY - midR - SEG_LEN / 2;
	const viewMinY = arcTopY - VIEW_PAD_TOP;
	const viewHeight =
		CY + LABEL_OFFSET + LABEL_FONT_SIZE / 2 + DOT_R + VIEW_PAD_BOTTOM - viewMinY;
	const viewBox = `0 ${viewMinY} ${VIEW_W} ${viewHeight}`;
	const showGraveDot = $derived(displayPct >= 67);

	/** Largura aproximada do rótulo em unidades SVG (font-size 13). */
	const labelTextWidth = $derived(label.length * 7.2);
	const labelGroupWidth = $derived(
		showGraveDot ? DOT_R * 2 + LABEL_GAP + labelTextWidth : labelTextWidth
	);
	const labelDotX = $derived(-labelGroupWidth / 2 + DOT_R);
	const labelTextX = $derived(
		showGraveDot ? -labelGroupWidth / 2 + DOT_R * 2 + LABEL_GAP : 0
	);
</script>

<div
	class="w-full rounded-2xl border border-line bg-surface px-3 pt-3 pb-3.5"
	aria-label="Indicador visual: {p}% de bloqueio metabólico"
>
	<div class="flex flex-col items-center">
		<svg
			viewBox={viewBox}
			class="block w-full max-h-[min(52vw,200px)]"
			style="aspect-ratio: {VIEW_W} / {viewHeight}"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			preserveAspectRatio="xMidYMid meet"
		>
			{#each segments as seg, i (i)}
				<rect
					x={-SEG_W / 2}
					y={-SEG_LEN / 2}
					width={SEG_W}
					height={SEG_LEN}
					rx={SEG_W / 2}
					ry={SEG_W / 2}
					fill={seg.color}
					transform="translate({seg.x}, {seg.y}) rotate({seg.deg})"
				/>
			{/each}

			<text
				x={CX}
				y={textY}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size={PERCENT_FONT_SIZE}
				font-weight="800"
				font-family="inherit"
				fill="var(--color-heading)"
				class="tabular-nums"
			>
				{displayPct}%
			</text>
			<g transform="translate({CX}, {labelY})">
				{#if showGraveDot}
					<circle
						cx={labelDotX}
						cy={0}
						r={DOT_R}
						fill="var(--color-farol-red)"
						aria-hidden="true"
					/>
				{/if}
				<text
					x={labelTextX}
					y={0}
					text-anchor={showGraveDot ? 'start' : 'middle'}
					dominant-baseline="middle"
					font-size={LABEL_FONT_SIZE}
					font-weight="500"
					font-family="inherit"
					fill="var(--color-muted)"
				>
					{label}
				</text>
			</g>
		</svg>
	</div>

	<div class="mt-1 flex items-center justify-center gap-5 px-1">
		<div class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 shrink-0 rounded-full" style="background:var(--color-accent)"></span>
			<span class="text-[10px] font-medium text-muted">Normal</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span
				class="inline-block h-2 w-2 shrink-0 rounded-full"
				style="background:var(--color-farol-yellow)"
			></span>
			<span class="text-[10px] font-medium text-muted">Moderado</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 shrink-0 rounded-full" style="background:var(--color-farol-red)"></span>
			<span class="text-[10px] font-medium text-muted">Grave</span>
		</div>
	</div>
</div>
