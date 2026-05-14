<script lang="ts" module>
	let wlcUid = 0;
	function nextWlcUid() {
		return `wlc-${++wlcUid}`;
	}

	/** Progressão 0→1 com aceleração suave no meio (evita queda “em linha reta” entre os pontos). */
	function smoothProgress(t: number): number {
		const x = Math.min(1, Math.max(0, t));
		return x * x * (3 - 2 * x);
	}

	/** Ex.: 51 kg ou 50,4 kg (vírgula decimal). */
	function formatProtocolWeightKg(kg: number): string {
		const v = Math.round(kg * 10) / 10;
		if (Math.abs(v - Math.round(v)) < 1e-9) return `${Math.round(v)} kg`;
		return `${v.toFixed(1).replace('.', ',')} kg`;
	}

	/** Maior = curva mais suave (menos tensão nos nós). Padrão Catmull–Rom clássico = 6. */
	function catmullRomToPath(
		points: { x: number; y: number }[],
		tensionDivisor: number = 14
	): string {
		const n = points.length;
		if (n < 2) return '';
		const t = Math.max(6, tensionDivisor);
		const get = (i: number) => points[Math.max(0, Math.min(n - 1, i))];
		let d = `M ${points[0].x} ${points[0].y}`;
		for (let i = 0; i < n - 1; i++) {
			const p0 = get(i - 1);
			const p1 = get(i);
			const p2 = get(i + 1);
			const p3 = get(i + 2);
			const cp1x = p1.x + (p2.x - p0.x) / t;
			const cp1y = p1.y + (p2.y - p0.y) / t;
			const cp2x = p2.x - (p3.x - p1.x) / t;
			const cp2y = p2.y - (p3.y - p1.y) / t;
			d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
		}
		return d;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { CHART_LINE_ANIM_SEC, protocolNodeRevealDelaySec } from '$lib/constants/chart-animation';

	interface Props {
		currentKg: number;
		goalKg: number;
		weeks: number;
		/** Oculta os rótulos "Semana 1" / "Semana N" no eixo */
		hideAxisLabels?: boolean;
		/** Se definidos, substituem "Semana 1" / "Semana N" (ex.: Hoje / 14 dias) */
		axisLabelStart?: string;
		axisLabelEnd?: string;
		/** Curva em 4 fases (Desbloqueio → Finalização), eixo Dia 1 / 5 / 10 / 14 */
		protocolFases?: boolean;
	}

	let {
		currentKg,
		goalKg,
		weeks,
		hideAxisLabels = false,
		axisLabelStart,
		axisLabelEnd,
		protocolFases = false
	}: Props = $props();

	const weeksDisplay = $derived(Math.max(1, weeks));
	const CHART_HEIGHT = 200;
	const CHART_WIDTH = 340;
	/** Caixas de fase + tipografia: ~0,6× o base, +30% em relação a isso (= 0,78× o layout base). */
	const PROTOCOL_LABEL_SCALE = 0.78;

	const uid = nextWlcUid();

	const chartGeom = $derived.by(() => {
		const minKg = Math.min(currentKg, goalKg);
		const maxKg = Math.max(currentKg, goalKg);
		const range = maxKg - minKg || 1;
		const padYTop = protocolFases ? 80 : 44;
		/* Margem interna do desenho; rótulos das fases são clampados ao SVG (ver rectX). */
		const padX = protocolFases ? 28 : 0;
		const padYBottom = protocolFases ? 26 : 32;
		const gh = CHART_HEIGHT - padYTop - padYBottom;
		const gw = CHART_WIDTH - 2 * padX;
		const xs = padX;
		const xe = CHART_WIDTH - padX;
		const yAt = (kg: number) => padYTop + ((maxKg - kg) / range) * gh;

		if (protocolFases) {
			const days = [1, 5, 10, 14] as const;
			const protocolPoints = days.map((d) => {
				const tLin = (d - 1) / 13;
				const t = smoothProgress(tLin);
				const kg = currentKg + (goalKg - currentKg) * t;
				return {
					day: d,
					x: xs + ((d - 1) / 13) * gw,
					y: yAt(kg),
					kg
				};
			});
			const pathD = catmullRomToPath(protocolPoints);
			const areaD = `${pathD} L ${xe} ${padYTop + gh} L ${xs} ${padYTop + gh} Z`;
			return {
				padYTop,
				padX,
				padYBottom,
				gh,
				gw,
				xs,
				xe,
				yAt,
				pathD,
				areaD,
				protocolPoints,
				yStart: yAt(currentKg),
				yEnd: yAt(goalKg)
			};
		}

		const yStart = yAt(currentKg);
		const yEnd = yAt(goalKg);
		const dy = yEnd - yStart;
		const cp1X = xs + gw * 0.42;
		const cp1Y = yStart + dy * 0.2;
		const cp2X = xe - gw * 0.42;
		const cp2Y = yEnd - dy * 0.2;
		const pathD = `M ${xs} ${yStart} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${xe} ${yEnd}`;
		const areaD = `${pathD} L ${xe} ${padYTop + gh} L ${xs} ${padYTop + gh} Z`;
		return {
			padYTop,
			padX,
			padYBottom,
			gh,
			gw,
			xs,
			xe,
			yAt,
			pathD,
			areaD,
			protocolPoints: null as null | { day: number; x: number; y: number; kg: number }[],
			yStart,
			yEnd
		};
	});

	const gridLines = [0, 1, 2, 3];
	const dotRadius = 7;
	const labelWidth = 52;
	const labelHeight = 24;
	const axisPadPercent = $derived((chartGeom.padX / CHART_WIDTH) * 100);

	const protocolSteps = $derived.by(() => {
		const pts = chartGeom.protocolPoints;
		if (!protocolFases || !pts || pts.length < 4) return [];
		return (
			[
				{ p: pts[0], w: Math.round(80 * PROTOCOL_LABEL_SCALE), stage: 'Desbloqueio' },
				{ p: pts[1], w: Math.round(80 * PROTOCOL_LABEL_SCALE), stage: 'Aceleração' },
				{ p: pts[2], w: Math.round(86 * PROTOCOL_LABEL_SCALE), stage: 'Consolidação' },
				{ p: pts[3], w: Math.round(80 * PROTOCOL_LABEL_SCALE), stage: 'Finalização' }
			] as const
		).map((s) => ({
			...s,
			weightLine: formatProtocolWeightKg(s.p.kg)
		}));
	});

	let lineEl: SVGPathElement | undefined = $state();
	let totalLength = $state(1000);
	let animate = $state(false);

	onMount(() => {
		if (lineEl) totalLength = lineEl.getTotalLength();
		requestAnimationFrame(() => requestAnimationFrame(() => { animate = true; }));
	});
</script>

<div
	class="flex flex-col w-full"
	style="--wlc-anim: {CHART_LINE_ANIM_SEC}s; --wlc-ease: cubic-bezier(0.22, 1, 0.36, 1); --wlc-marker-end-delay: {(CHART_LINE_ANIM_SEC * 0.81).toFixed(2)}s; --wlc-chart-axis-delay: {(CHART_LINE_ANIM_SEC * 0.85).toFixed(2)}s;"
	role="img"
	aria-label={protocolFases
		? `Gráfico do protocolo em 14 dias: Desbloqueio, Aceleração, Consolidação e Finalização, com peso estimado em cada marco até a meta de ${goalKg} kg`
		: axisLabelStart && axisLabelEnd
			? `Gráfico de evolução do peso de ${axisLabelStart} a ${axisLabelEnd}`
			: `Gráfico de evolução do peso da semana 1 à semana ${weeksDisplay}`}
>
	<div class="relative w-full">
		<svg
			width="100%"
			viewBox="0 0 {CHART_WIDTH} {CHART_HEIGHT}"
			class="overflow-visible block"
			style="height: auto;"
			fill="none"
		>
			<defs>
				<linearGradient id="{uid}-area-default" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stop-color="var(--color-heading)" stop-opacity="0.15" />
					<stop offset="100%" stop-color="var(--color-heading)" stop-opacity="0" />
				</linearGradient>
				<linearGradient id="{uid}-area-protocol" x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.15" />
					<stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
				</linearGradient>
				<linearGradient
					id="{uid}-line-protocol"
					gradientUnits="userSpaceOnUse"
					x1={chartGeom.protocolPoints?.[0]?.x ?? chartGeom.xs}
					y1={chartGeom.protocolPoints?.[0]?.y ?? chartGeom.yStart}
					x2={chartGeom.protocolPoints?.[3]?.x ?? chartGeom.xe}
					y2={chartGeom.protocolPoints?.[3]?.y ?? chartGeom.yEnd}
				>
					<stop offset="0%" stop-color="color-mix(in srgb, var(--color-accent) 72%, white)" />
					<stop offset="52%" stop-color="var(--color-accent)" />
					<stop offset="100%" stop-color="var(--color-accent-dark)" />
				</linearGradient>
				<filter id="{uid}-weight-dot-shadow" x="-50%" y="-50%" width="200%" height="200%">
					<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="var(--color-heading)" flood-opacity="0.25" />
				</filter>
				<filter id="{uid}-weight-dot-shadow-accent" x="-50%" y="-50%" width="200%" height="200%">
					<feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="var(--color-accent)" flood-opacity="0.28" />
				</filter>
				<clipPath id="{uid}-weight-area-reveal">
					<rect
						x={chartGeom.xs}
						y="0"
						width={animate ? chartGeom.gw : 0}
						height={CHART_HEIGHT + 50}
						class="chart-clip-rect"
					/>
				</clipPath>
			</defs>

			{#if protocolFases}
				<!-- Grade vertical (Dia 1 / 5 / 10 / 14) -->
				<g
					stroke="var(--color-line)"
					stroke-width="0.5"
					stroke-opacity="0.55"
					class="chart-grid"
					class:chart-animate={animate}
				>
					{#each chartGeom.protocolPoints ?? [] as pt}
						<line
							x1={pt.x}
							y1={chartGeom.padYTop}
							x2={pt.x}
							y2={chartGeom.padYTop + chartGeom.gh}
							stroke-dasharray="5 5"
						/>
					{/each}
					{#each gridLines as i}
						{@const y = chartGeom.padYTop + ((i + 1) * chartGeom.gh) / 5}
						<line x1={chartGeom.xs} y1={y} x2={chartGeom.xe} y2={y} stroke-dasharray="5 5" />
					{/each}
				</g>

				<path
					d={chartGeom.areaD}
					fill="url(#{uid}-area-protocol)"
					clip-path="url(#{uid}-weight-area-reveal)"
				/>

				<path
					bind:this={lineEl}
					d={chartGeom.pathD}
					stroke="url(#{uid}-line-protocol)"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="chart-line"
					style="stroke-dasharray: {totalLength}; stroke-dashoffset: {animate ? 0 : totalLength};"
				/>

				<g class="chart-protocol-markers">
					{#each protocolSteps as step}
						{@const revealDelay = protocolNodeRevealDelaySec(step.p.x, chartGeom.xs, chartGeom.gw)}
						{@const boxH = Math.round(30 * PROTOCOL_LABEL_SCALE)}
						{@const cx = step.p.x}
						{@const cy = step.p.y}
						{@const rx = Math.round(5 * PROTOCOL_LABEL_SCALE)}
						{@const gapBelowBox = Math.max(16, Math.round(14 * PROTOCOL_LABEL_SCALE))}
						{@const tailH = Math.max(7, Math.round(8 * PROTOCOL_LABEL_SCALE))}
						{@const tailHalfW = Math.max(5, Math.round(6 * PROTOCOL_LABEL_SCALE))}
						{@const rectX = Math.min(CHART_WIDTH - 2 - step.w, Math.max(2, cx - step.w / 2))}
						{@const textX = rectX + step.w / 2}
						{@const rectY = cy - boxH - gapBelowBox - tailH}
						{@const fsStage = 9.5 * PROTOCOL_LABEL_SCALE}
						{@const fsWeight = 9 * PROTOCOL_LABEL_SCALE}
						{@const yStage = rectY + Math.round(13 * PROTOCOL_LABEL_SCALE)}
						{@const yWeight = rectY + Math.round(25 * PROTOCOL_LABEL_SCALE)}
						<g
							class="chart-protocol-marker-node"
							class:chart-animate={animate}
							style="--reveal-delay: {revealDelay}s"
						>
						<!-- Círculos primeiro; legenda tipo “speech bubble” (cores atuais) -->
						<circle
							cx={cx}
							cy={cy}
							r={dotRadius + 5}
							fill="var(--color-accent)"
							opacity="0.2"
						/>
						<circle
							cx={cx}
							cy={cy}
							r={dotRadius}
							fill="var(--color-accent)"
							stroke="var(--color-bg)"
							stroke-width="2"
							filter="url(#{uid}-weight-dot-shadow-accent)"
						/>
						<g
							fill="var(--color-surface-2)"
							stroke="var(--color-line)"
							stroke-opacity="0.6"
							stroke-width="0.5"
							stroke-linejoin="round"
						>
							<rect x={rectX} y={rectY} width={step.w} height={boxH} rx={rx} ry={rx} />
							<polygon
								points="{cx - tailHalfW},{rectY + boxH} {cx + tailHalfW},{rectY + boxH} {cx},{rectY + boxH + tailH}"
							/>
						</g>
						<text
							x={textX}
							y={yStage}
							text-anchor="middle"
							fill="var(--color-heading)"
							font-size={fsStage}
							font-weight="600"
							font-family="system-ui, -apple-system, sans-serif"
						>
							{step.stage}
						</text>
						<text
							x={textX}
							y={yWeight}
							text-anchor="middle"
							fill="var(--color-heading)"
							font-size={fsWeight * 1.08}
							font-weight="700"
							font-family="system-ui, -apple-system, sans-serif"
							class="tabular-nums"
						>
							{step.weightLine}
						</text>
						</g>
					{/each}
				</g>

				<g
					class="chart-protocol-axis"
					fill="var(--color-muted)"
					font-size={10 * PROTOCOL_LABEL_SCALE}
					font-family="system-ui, -apple-system, sans-serif"
					font-weight="500"
				>
					{#each [{ d: 1, label: 'Dia 1' }, { d: 5, label: 'Dia 5' }, { d: 10, label: 'Dia 10' }, { d: 14, label: 'Dia 14' }] as row}
						{@const x =
							chartGeom.xs + ((row.d - 1) / 13) * chartGeom.gw}
						{@const axisReveal = protocolNodeRevealDelaySec(x, chartGeom.xs, chartGeom.gw)}
						<g
							class="chart-protocol-axis-node"
							class:chart-animate={animate}
							style="--reveal-delay: {axisReveal}s"
						>
							<text x={x} y={CHART_HEIGHT - Math.round(6 * PROTOCOL_LABEL_SCALE)} text-anchor="middle">{row.label}</text>
						</g>
					{/each}
				</g>
			{:else}
				<!-- Grid horizontal -->
				<g
					stroke="var(--color-line)"
					stroke-width="0.5"
					stroke-opacity="0.5"
					class="chart-grid"
					class:chart-animate={animate}
				>
					{#each gridLines as _, i}
						{@const y = chartGeom.padYTop + (i + 1) * (chartGeom.gh / 5)}
						<line x1={chartGeom.xs} y1={y} x2={CHART_WIDTH - chartGeom.padX} y2={y} stroke-dasharray="6 4" />
					{/each}
				</g>

				<path
					d={chartGeom.areaD}
					fill="url(#{uid}-area-default)"
					clip-path="url(#{uid}-weight-area-reveal)"
				/>

				<path
					bind:this={lineEl}
					d={chartGeom.pathD}
					stroke="var(--color-heading)"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="chart-line"
					style="stroke-dasharray: {totalLength}; stroke-dashoffset: {animate ? 0 : totalLength};"
				/>

				<g class="chart-marker-start" class:chart-animate={animate}>
					<circle
						cx={chartGeom.xs}
						cy={chartGeom.yStart}
						r={dotRadius + 5}
						class="fill-[var(--color-heading)]"
						opacity="0.2"
					/>
					<circle
						cx={chartGeom.xs}
						cy={chartGeom.yStart}
						r={dotRadius}
						class="fill-[var(--color-heading)] stroke-[var(--color-bg)]"
						stroke-width="2"
						filter="url(#{uid}-weight-dot-shadow)"
					/>
					<rect
						x={chartGeom.xs - labelWidth / 2}
						y={chartGeom.yStart - labelHeight - 10}
						width={labelWidth}
						height={labelHeight}
						rx="8"
						ry="8"
						class="fill-surface-2 stroke-line/60"
						stroke-width="0.5"
					/>
					<text
						x={chartGeom.xs}
						y={chartGeom.yStart - labelHeight / 2 - 2}
						text-anchor="middle"
						class="fill-heading text-[13px] font-semibold tabular-nums"
					>
						{currentKg} kg
					</text>
				</g>

				<g class="chart-marker-end" class:chart-animate={animate}>
					<circle
						cx={chartGeom.xe}
						cy={chartGeom.yEnd}
						r={dotRadius + 5}
						class="fill-[var(--color-heading)]"
						opacity="0.2"
					/>
					<circle
						cx={chartGeom.xe}
						cy={chartGeom.yEnd}
						r={dotRadius}
						class="fill-[var(--color-heading)] stroke-[var(--color-bg)]"
						stroke-width="2"
						filter="url(#{uid}-weight-dot-shadow)"
					/>
					<rect
						x={chartGeom.xe - labelWidth / 2}
						y={chartGeom.yEnd - labelHeight - 10}
						width={labelWidth}
						height={labelHeight}
						rx="8"
						ry="8"
						class="fill-surface-2 stroke-line/60"
						stroke-width="0.5"
					/>
					<text
						x={chartGeom.xe}
						y={chartGeom.yEnd - labelHeight / 2 - 2}
						text-anchor="middle"
						class="fill-heading text-[13px] font-semibold tabular-nums"
					>
						{goalKg} kg
					</text>
				</g>
			{/if}
		</svg>
	</div>
	{#if !hideAxisLabels && !protocolFases}
		<div
			class="flex justify-between w-full -mt-1 chart-axis"
			class:chart-animate={animate}
			style="padding-left: {axisPadPercent}%; padding-right: {axisPadPercent}%;"
		>
			<span class="text-xs font-medium text-muted tracking-wide">{axisLabelStart ?? 'Semana 1'}</span>
			<span class="text-xs font-medium text-muted tracking-wide">{axisLabelEnd ?? `Semana ${weeksDisplay}`}</span>
		</div>
	{/if}
</div>

<style>
	.chart-line {
		transition: stroke-dashoffset var(--wlc-anim) var(--wlc-ease) 0.08s;
	}

	.chart-clip-rect {
		transition: width var(--wlc-anim) var(--wlc-ease) 0.08s;
	}

	.chart-grid {
		opacity: 0;
		transition: opacity 0.65s ease-out 0.06s;
	}
	.chart-grid.chart-animate {
		opacity: 1;
	}

	.chart-marker-start {
		opacity: 0;
		transition: opacity 0.55s ease-out 0.12s;
	}
	.chart-marker-start.chart-animate {
		opacity: 1;
	}

	.chart-marker-end {
		opacity: 0;
		transition: opacity 0.5s ease-out var(--wlc-marker-end-delay, 2.43s);
	}
	.chart-marker-end.chart-animate {
		opacity: 1;
	}

	.chart-protocol-marker-node {
		opacity: 0;
		transition: opacity 0.38s var(--wlc-ease, cubic-bezier(0.22, 1, 0.36, 1)) var(--reveal-delay, 0s);
	}
	.chart-protocol-marker-node.chart-animate {
		opacity: 1;
	}

	.chart-protocol-axis-node {
		opacity: 0;
		transition: opacity 0.35s var(--wlc-ease, cubic-bezier(0.22, 1, 0.36, 1)) var(--reveal-delay, 0s);
	}
	.chart-protocol-axis-node.chart-animate {
		opacity: 1;
	}

	.chart-axis {
		opacity: 0;
		transition: opacity 0.45s ease-out var(--wlc-chart-axis-delay, 2.55s);
	}
	.chart-axis.chart-animate {
		opacity: 1;
	}
</style>
