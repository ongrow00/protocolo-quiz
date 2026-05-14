<script lang="ts">
	import type { Question } from '$lib/data/types';
	import RulerPickerH from './RulerPickerH.svelte';
	import SwipeRightIcon from '$lib/components/ui/SwipeRightIcon.svelte';

	/** Escala visual da barra (para posicionar o pill) */
	const BMI_BAR_MIN = 15;
	const BMI_BAR_MAX = 35;

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
		answers: Record<string, string | string[]>;
	}

	let { question, value, onSelect, answers }: Props = $props();

	const rulerMin = $derived(question.min ?? 30);
	const rulerMax = $derived(question.max ?? 200);
	const baseDefault = 70;
	const baseValue = $derived(
		value !== undefined && value !== '' ? parseInt(value) : baseDefault
	);

	let rulerValue = $state(Math.min(rulerMax, Math.max(rulerMin, baseValue)));

	$effect(() => {
		const v = value !== undefined && value !== '' ? parseInt(value) : baseDefault;
		rulerValue = Math.min(rulerMax, Math.max(rulerMin, v));
	});

	function handleRulerChange(v: number) {
		rulerValue = v;
		onSelect(question.id, String(v));
	}

	const displayNum = $derived(String(Math.round(rulerValue)));
	const hint = $derived('← Arraste para ajustar →');

	const heightCm = $derived.by(() => {
		const raw = answers['height_cm'];
		if (raw === undefined || raw === null) return null;
		const n =
			typeof raw === 'string' ? parseInt(raw, 10) : Array.isArray(raw) ? parseInt(raw[0], 10) : NaN;
		return Number.isFinite(n) && n >= 100 && n <= 220 ? n : null;
	});

	const bmiInsight = $derived.by((): { bmi: number } | null => {
		if (heightCm == null) return null;
		const heightM = heightCm / 100;
		const weightKg = Math.round(rulerValue);
		const bmi = weightKg / (heightM * heightM);

		return { bmi };
	});

	/** Percentual (0–100) na barra; limitado às bordas para o indicador não sair da barra */
	const INDICATOR_EDGE_MARGIN = 14;
	const bmiBarPercent = $derived.by(() => {
		if (!bmiInsight) return 50;
		const p =
			((bmiInsight.bmi - BMI_BAR_MIN) / (BMI_BAR_MAX - BMI_BAR_MIN)) * 100;
		const clamped = Math.min(100 - INDICATOR_EDGE_MARGIN, Math.max(INDICATOR_EDGE_MARGIN, p));
		return clamped;
	});

	/** Cor do indicador pelo segmento da barra onde ele cai (cada terço = uma cor), não pela categoria OMS */
	const indicatorSegment = $derived.by((): 'blue' | 'green' | 'amber' => {
		const p = bmiBarPercent;
		if (p < 100 / 3) return 'blue';
		if (p < (2 * 100) / 3) return 'green';
		return 'amber';
	});
</script>

<div class="flex flex-col items-center gap-3">
	<div class="w-full space-y-1 mb-1">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{question.text}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>

	<div class="flex items-baseline gap-2 self-center">
		<span class="text-7xl font-extrabold text-heading tabular-nums tracking-tight leading-none">
			{displayNum}
		</span>
		<span class="text-2xl font-semibold text-muted">kg</span>
	</div>

	<div class="w-full">
		<RulerPickerH
			value={rulerValue}
			min={rulerMin}
			max={rulerMax}
			suppressOnUnchangedRelease={true}
			onchange={handleRulerChange}
		/>
	</div>

	<div class="flex flex-col items-center justify-center gap-1">
		<p class="text-xs text-muted text-center">{hint}</p>
		<SwipeRightIcon />
	</div>

	{#if bmiInsight && value !== undefined && value !== ''}
		<div class="w-full mt-2" role="status" aria-live="polite">
			<div class="mb-3">
				<span class="text-xs font-medium text-muted">IMC atual</span>
			</div>

			<!-- Barra de faixas IMC com pill do valor centralizado sobre a barra -->
			<div class="relative w-full pt-4 pb-4">
				<span
					class="absolute top-1/2 rounded px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums whitespace-nowrap {indicatorSegment ===
					'blue'
						? 'bg-blue-500'
						: indicatorSegment === 'green'
							? 'bg-green-500'
							: 'bg-amber-500'}"
					style="left: {bmiBarPercent}%; transform: translate(-50%, -50%);"
				>
					{bmiInsight.bmi.toFixed(1)}
				</span>
				<div class="flex w-full rounded-full overflow-hidden h-1" aria-hidden="true">
					<div class="flex-1 bg-blue-500 min-w-0" title="Abaixo do peso"></div>
					<div class="flex-1 bg-green-500 min-w-0" title="Normal"></div>
					<div class="flex-1 bg-amber-500 min-w-0" title="Sobrepeso"></div>
				</div>
			</div>
			<div class="flex w-full text-[10px] text-muted gap-0">
				<span class="flex-1 text-center">Abaixo do peso</span>
				<span class="flex-1 text-center">Normal</span>
				<span class="flex-1 text-center">Sobrepeso</span>
			</div>
		</div>
	{/if}
</div>
