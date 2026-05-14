<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		selected: string[];
	}

	let { selected }: Props = $props();

	const PARTS = [
		{ id: 'fa-ombros', label: 'Ombros' },
		{ id: 'fa-peito', label: 'Peito' },
		{ id: 'fa-biceps', label: 'Bíceps' },
		{ id: 'fa-abdomen', label: 'Abdômen' },
		{ id: 'fa-gluteos', label: 'Glúteos' },
		{ id: 'fa-pernas', label: 'Pernas' },
		{ id: 'fa-costas', label: 'Costas' }
	];

	const N = PARTS.length;
	const CX = 170;
	const CY = 162;
	const R = 85;
	const MIN_VAL = 0.18;
	const LABEL_OFFSET = 26;

	const isAll = $derived(selected.includes('fa-inteiro'));

	const targetValues = $derived(PARTS.map((p) => (isAll ? 1 : selected.includes(p.id) ? 1 : MIN_VAL)));

	// Começa quase no centro para efeito de gráfico sendo preenchido; duração maior para ser bem visível
	const FILL_START = 0.04;
	const animValues = tweened(PARTS.map(() => FILL_START), { duration: 1200, easing: cubicOut });

	onMount(() => {
		let active = true;
		animValues.set(targetValues);
		return () => {
			active = false;
			// Para a animação imediatamente ao desmontar para evitar updates em componente destruído
			animValues.set(targetValues, { duration: 0 });
		};
	});

	function angle(i: number) {
		return (i / N) * 2 * Math.PI - Math.PI / 2;
	}

	function pt(i: number, val: number) {
		const a = angle(i);
		return { x: CX + R * val * Math.cos(a), y: CY + R * val * Math.sin(a) };
	}

	function polyPoints(vals: number[]) {
		return vals.map((v, i) => `${pt(i, v).x.toFixed(2)},${pt(i, v).y.toFixed(2)}`).join(' ');
	}

	// Static grid rings
	const outerPts = polyPoints(PARTS.map(() => 1));
	const mid1Pts = polyPoints(PARTS.map(() => 0.6));
	const mid2Pts = polyPoints(PARTS.map(() => 0.35));

	// Animated data polygon
	const dataPts = $derived(polyPoints($animValues));

	function labelPt(i: number) {
		const a = angle(i);
		return {
			x: CX + (R + LABEL_OFFSET) * Math.cos(a),
			y: CY + (R + LABEL_OFFSET) * Math.sin(a)
		};
	}

	function textAnchor(i: number) {
		const x = Math.cos(angle(i));
		if (x > 0.2) return 'start';
		if (x < -0.2) return 'end';
		return 'middle';
	}

	function dominantBaseline(i: number) {
		const y = Math.sin(angle(i));
		if (y < -0.3) return 'auto';
		if (y > 0.3) return 'hanging';
		return 'middle';
	}
</script>

<div class="flex flex-col items-center gap-2 w-full">
	<svg viewBox="0 0 340 325" class="w-full max-w-[300px]" aria-hidden="true">
		<!-- Axis lines -->
		{#each PARTS as _, i}
			{@const op = pt(i, 1)}
			<line x1={CX} y1={CY} x2={op.x} y2={op.y} stroke="var(--color-line)" stroke-width="1" />
		{/each}

		<!-- Grid rings -->
		<polygon points={mid2Pts} fill="none" stroke="var(--color-surface-2)" stroke-width="1" />
		<polygon points={mid1Pts} fill="none" stroke="var(--color-line)" stroke-width="1" />
		<polygon points={outerPts} fill="none" stroke="var(--color-muted)" stroke-width="1.5" />

		<!-- Animated data area -->
		<polygon
			points={dataPts}
			fill="var(--color-accent)"
			fill-opacity="0.18"
			stroke="var(--color-accent)"
			stroke-width="2"
			stroke-linejoin="round"
		/>

		<!-- Dots at active axes -->
		{#each PARTS as part, i}
			{@const active = isAll || selected.includes(part.id)}
			{@const p = pt(i, 1)}
			<circle
				cx={p.x}
				cy={p.y}
				r={active ? 5 : 3}
				fill={active ? 'var(--color-accent)' : 'var(--color-line)'}
				stroke={active ? 'var(--color-accent)' : 'var(--color-muted)'}
				stroke-width="1"
			/>
		{/each}

		<!-- Labels -->
		{#each PARTS as part, i}
			{@const lp = labelPt(i)}
			{@const active = isAll || selected.includes(part.id)}
			<text
				x={lp.x}
				y={lp.y}
				text-anchor={textAnchor(i)}
				dominant-baseline={dominantBaseline(i)}
				font-size="12"
				font-family="inherit"
				fill={active ? 'var(--color-accent)' : 'var(--color-muted)'}
				font-weight={active ? '700' : '400'}
			>{part.label}</text>
		{/each}
	</svg>

	<p class="text-xs text-muted tracking-wide">Grupos musculares de foco</p>
</div>
