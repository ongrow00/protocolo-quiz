<script lang="ts">
	import type { Question } from '$lib/data/types';
	import RulerPicker from './RulerPicker.svelte';
	import RulerPickerH from './RulerPickerH.svelte';
	import SwipeRightIcon from '$lib/components/ui/SwipeRightIcon.svelte';

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
	}

	let { question, value, onSelect }: Props = $props();

	const isHeight = $derived(question.unit === 'cm');
	const isWeight = $derived(question.unit === 'kg');
	const isAge = $derived(question.unit === 'anos');
	const isHorizontal = $derived(isWeight || isAge || isHeight);

	const baseDefault = $derived(
		isHeight ? 170 : isWeight ? 70 : isAge ? 25 : question.min ?? 30
	);
	const baseValue = $derived(
		value !== undefined && value !== '' ? parseInt(value) : baseDefault
	);

	const rulerMin = $derived(
		isHeight ? 100 : isWeight ? 30 : (question.min ?? 18)
	);
	const rulerMax = $derived(
		isHeight ? 220 : isWeight ? 200 : (question.max ?? 99)
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
	const displayUnit = $derived(question.unit ?? '');
	const unitLabel = $derived(isAge ? 'anos' : displayUnit);
	const hint = $derived('← Arraste para ajustar →');
</script>

<div class="flex flex-col items-center gap-3">
	<div class="w-full space-y-1 mb-1">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{question.text}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>

	<!-- Big value display (shared by all types) -->
	<div class="flex items-baseline gap-2 self-center">
		<span class="text-7xl font-extrabold text-heading tabular-nums tracking-tight leading-none">
			{displayNum}
		</span>
		{#if isAge}
			<span class="text-xs font-medium text-muted">{unitLabel}</span>
		{:else if displayUnit}
			<span class="text-2xl font-semibold text-muted">{displayUnit}</span>
		{/if}
	</div>

	<!-- Ruler -->
	<div class="w-full">
		{#if isHorizontal}
			<RulerPickerH
				value={rulerValue}
				min={rulerMin}
				max={rulerMax}
				onchange={handleRulerChange}
			/>
		{:else}
			<RulerPicker
				value={rulerValue}
				min={rulerMin}
				max={rulerMax}
				onchange={handleRulerChange}
			/>
		{/if}
	</div>

	<div class="flex flex-col items-center justify-center gap-1">
		<p class="text-xs text-muted text-center">{hint}</p>
		<SwipeRightIcon />
	</div>
</div>
