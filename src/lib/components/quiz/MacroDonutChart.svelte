<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { PROTEIN_COUNT_ANIM_MS } from '$lib/constants/chart-animation';
	import type { MacroSplit } from '$lib/utils/macros';

	interface Props {
		proteinG: number;
		split: MacroSplit;
	}

	let { proteinG, split }: Props = $props();

	const animProtein = tweened(0, {
		duration: PROTEIN_COUNT_ANIM_MS,
		easing: cubicOut
	});

	onMount(() => {
		requestAnimationFrame(() => requestAnimationFrame(() => animProtein.set(proteinG)));
	});

	const displayProteinG = $derived(Math.round($animProtein));
	/** 0 → 1: preenche o arco verde em sincronia com a contagem. */
	const proteinFill = $derived(proteinG > 0 ? Math.min(1, $animProtein / proteinG) : 0);

	const SIZE = 260;
	const CX = SIZE / 2;
	const CY = SIZE / 2;
	const R = 88;
	const STROKE = 8;
	const GAP_DEG = 5;

	const C = 2 * Math.PI * R;
	const USABLE_DEG = 360 - GAP_DEG * 3;

	const VALUE_FONT = 40;
	const LABEL_FONT = 9;
	const LABEL_GAP = 6;
	const labelBlockH = VALUE_FONT + LABEL_GAP + LABEL_FONT;
	const valueY = CY - labelBlockH / 2 + VALUE_FONT / 2;
	const labelY = CY + labelBlockH / 2 - LABEL_FONT / 2;

	const segments = $derived([
		{ pct: split.proteinPct * proteinFill, stroke: 'var(--color-accent)', key: 'protein' },
		{ pct: split.carbsPct, stroke: 'var(--color-surface-2)', key: 'carbs' },
		{ pct: split.fatPct, stroke: 'var(--color-line)', key: 'fat' }
	]);

	const arcs = $derived.by(() => {
		let cursor = 0;
		return segments.map((seg) => {
			const arcDeg = USABLE_DEG * seg.pct;
			const arcLen = (arcDeg / 360) * C;
			const gapLen = (GAP_DEG / 360) * C;
			const dasharray = `${arcLen} ${C - arcLen}`;
			const dashoffset = -cursor;
			cursor += arcLen + gapLen;
			return { ...seg, dasharray, dashoffset };
		});
	});
</script>

<div
	class="relative mx-auto w-full max-w-[364px] aspect-square"
	aria-hidden="true"
>
	<svg
		viewBox="0 0 {SIZE} {SIZE}"
		class="block h-full w-full"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g transform="rotate(-90 {CX} {CY})">
			{#each arcs as arc (arc.key)}
				<circle
					cx={CX}
					cy={CY}
					r={R}
					stroke={arc.stroke}
					stroke-width={STROKE}
					stroke-linecap="butt"
					stroke-dasharray={arc.dasharray}
					stroke-dashoffset={arc.dashoffset}
				/>
			{/each}
		</g>

		<text
			x={CX}
			y={valueY}
			text-anchor="middle"
			dominant-baseline="middle"
			font-size={VALUE_FONT}
			font-weight="800"
			font-family="inherit"
			fill="var(--color-heading)"
			class="tabular-nums"
		>
			{displayProteinG}g
		</text>
		<text
			x={CX}
			y={labelY}
			text-anchor="middle"
			dominant-baseline="middle"
			font-size={LABEL_FONT}
			font-weight="500"
			font-family="inherit"
			fill="var(--color-muted)"
		>
			Proteína Diária
		</text>
	</svg>
</div>
