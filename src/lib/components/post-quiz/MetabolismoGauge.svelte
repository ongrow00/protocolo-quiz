<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		percent?: number;
		label?: string;
	}

	let { percent = 87, label = 'Nível de bloqueio' }: Props = $props();

	const p = $derived(Math.min(100, Math.max(0, percent)));

	/** Meia-lua maior; um único arco evita artefatos no vértice. */
	const CX = 180;
	const CY = 138;
	const R = 112;
	/** Espessura do arco (metade do valor original — ~50% mais fino). */
	const SW = 13;
	const arcD = `M ${CX - R} ${CY} A ${R} ${R} 0 1 1 ${CX + R} ${CY}`;

	const G_X1 = CX - R;
	const G_X2 = CX + R;

	/** Centro vertical aproximado da “concha” (percentual dentro da meia-lua). */
	const textY = CY - R * 0.36;
	/** Percentual central da meia-lua. */
	const pctFontSize = 37;
	/** Rótulo logo abaixo do percentual. */
	const labelY = textY + pctFontSize * 0.5 + 10;

	/** Bolinha do rótulo: mesmo tamanho das da legenda (`h-2` / 8px em escala típica do SVG). */
	const LABEL_DOT_R = 4;

	const animPct = tweened(0, { duration: 1500, easing: cubicOut });

	onMount(() => {
		requestAnimationFrame(() => requestAnimationFrame(() => animPct.set(p)));
	});

	const displayPct = $derived(Math.round($animPct));
	const dashArray = $derived(`${$animPct} ${100 - $animPct}`);

	let labelTextEl = $state<SVGTextElement | undefined>();
	let redDot = $state<{ cx: number; cy: number } | null>(null);

	async function layoutRedDot() {
		await tick();
		const el = labelTextEl;
		if (!el) {
			redDot = null;
			return;
		}
		const b = el.getBBox();
		const dotR = LABEL_DOT_R;
		const gap = 5;
		redDot = { cx: b.x - gap - dotR, cy: b.y + b.height * 0.5 };
	}

	$effect(() => {
		label;
		void layoutRedDot();
	});
</script>

<div
	class="w-full rounded-2xl border border-line bg-surface px-4 pt-5 pb-4"
	aria-label="Indicador visual: {p}% de bloqueio metabólico"
>
	<div class="flex flex-col items-center gap-2">
		<svg
			viewBox="0 0 360 168"
			class="block w-full max-w-[min(100%,400px)]"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<defs>
				<linearGradient
					id="gauge-grad-metabolismo"
					gradientUnits="userSpaceOnUse"
					x1={G_X1}
					y1="0"
					x2={G_X2}
					y2="0"
				>
					<stop offset="0%" stop-color="var(--color-accent)" />
					<stop offset="50%" stop-color="var(--color-farol-yellow)" />
					<stop offset="100%" stop-color="var(--color-farol-red)" />
				</linearGradient>
			</defs>

			<path
				d={arcD}
				stroke="var(--color-line)"
				stroke-width={SW}
				stroke-linecap="butt"
				stroke-linejoin="round"
			/>

			<path
				d={arcD}
				stroke="url(#gauge-grad-metabolismo)"
				stroke-width={SW}
				stroke-linecap="butt"
				stroke-linejoin="round"
				pathLength="100"
				stroke-dasharray={dashArray}
				stroke-dashoffset="0"
			/>

			<text
				x={CX}
				y={textY}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size={pctFontSize}
				style:line-height={`${pctFontSize}px`}
				font-weight="800"
				font-family="inherit"
				fill="var(--color-heading)"
				class="tabular-nums"
			>
				{displayPct}%
			</text>
			<text
				bind:this={labelTextEl}
				x={CX}
				y={labelY}
				text-anchor="middle"
				dominant-baseline="middle"
				font-size="12"
				font-weight="500"
				font-family="inherit"
				fill="var(--color-muted)"
			>
				{label}
			</text>
			{#if redDot}
				<circle
					cx={redDot.cx}
					cy={redDot.cy}
					r={LABEL_DOT_R}
					fill="var(--color-farol-red)"
					aria-hidden="true"
				/>
			{/if}
		</svg>
	</div>

	<div class="mt-3 flex items-center justify-center gap-[20px]">
		<div class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 shrink-0 rounded-full" style="background:var(--color-accent)"></span>
			<span class="text-[10px] font-medium text-muted">Normal</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 shrink-0 rounded-full" style="background:var(--color-farol-yellow)"></span>
			<span class="text-[10px] font-medium text-muted">Moderado</span>
		</div>
		<div class="flex items-center gap-1.5">
			<span class="inline-block h-2 w-2 shrink-0 rounded-full" style="background:var(--color-farol-red)"></span>
			<span class="text-[10px] font-medium text-muted">Grave</span>
		</div>
	</div>
</div>
