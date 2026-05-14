<script lang="ts">
	import type { Question } from '$lib/data/types';
	import RulerPickerH from './RulerPickerH.svelte';
	import SwipeRightIcon from '$lib/components/ui/SwipeRightIcon.svelte';

	/** Meta em 14 dias: perda declarada entre 1 e 7 kg (valor guardado continua sendo peso-alvo em kg). */
	const MAX_LOSS_KG_14D = 7;
	const MIN_LOSS_KG_14D = 1;
	const DEFAULT_LOSS_KG = 3;

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
		/** Respostas já preenchidas (precisa de weight_current_kg para limite da régua) */
		answers: Record<string, string | string[]>;
	}

	let { question, value, onSelect, answers }: Props = $props();

	const rulerMin = $derived(question.min ?? 30);
	const rulerMax = $derived(question.max ?? 200);
	const currentKg = $derived.by(() => {
		const raw = answers['weight_current_kg'];
		if (raw === undefined || raw === null) return null;
		const n =
			typeof raw === 'string' ? parseInt(raw, 10) : Array.isArray(raw) ? parseInt(raw[0], 10) : NaN;
		return Number.isFinite(n) && n >= 30 && n <= 200 ? n : null;
	});
	const userWantsToLose = $derived(
		answers['goal_type'] === 'goal-emagrecer' || answers['goal_type'] === 'goal-definir'
	);
	const isFourteenDayGoal = $derived(question.id === 'weight_goal_kg');
	const lossSliderMode = $derived(isFourteenDayGoal && userWantsToLose && currentKg != null);

	/** Modo perda 14d: régua 1–7 kg; caso contrário: peso-alvo absoluto (kg). */
	const effectiveRulerMax = $derived.by(() => {
		if (lossSliderMode) return MAX_LOSS_KG_14D;
		if (userWantsToLose && currentKg != null)
			return Math.min(rulerMax, Math.max(rulerMin, currentKg - 1));
		return rulerMax;
	});
	const effectiveRulerMin = $derived.by(() => {
		if (lossSliderMode) return MIN_LOSS_KG_14D;
		return rulerMin;
	});

	const baseDefault = 70;
	const baseValue = $derived.by(() => {
		if (lossSliderMode && currentKg != null) {
			if (value === undefined || value === '') return DEFAULT_LOSS_KG;
			const goal = parseInt(String(value), 10);
			if (!Number.isFinite(goal)) return DEFAULT_LOSS_KG;
			const loss = Math.round(currentKg - goal);
			return Math.min(MAX_LOSS_KG_14D, Math.max(MIN_LOSS_KG_14D, loss));
		}
		if (value === undefined || value === '') return baseDefault;
		const n = parseInt(String(value), 10);
		return Number.isFinite(n) ? n : baseDefault;
	});

	let rulerValue = $state(Math.min(effectiveRulerMax, Math.max(effectiveRulerMin, baseValue)));

	$effect(() => {
		if (lossSliderMode && currentKg != null) {
			let loss = DEFAULT_LOSS_KG;
			if (value !== undefined && value !== '') {
				const goal = parseInt(String(value), 10);
				if (Number.isFinite(goal)) loss = Math.round(currentKg - goal);
			}
			const clamped = Math.min(MAX_LOSS_KG_14D, Math.max(MIN_LOSS_KG_14D, loss));
			rulerValue = clamped;
			const expectedGoal = currentKg - clamped;
			const stored =
				value !== undefined && value !== '' ? parseInt(String(value), 10) : NaN;
			if (!Number.isFinite(stored) || Math.round(stored) !== expectedGoal) {
				onSelect(question.id, String(expectedGoal));
			}
			return;
		}

		const raw = value !== undefined && value !== '' ? parseInt(String(value), 10) : baseDefault;
		const v = Number.isFinite(raw) ? raw : baseDefault;
		const clamped = Math.min(effectiveRulerMax, Math.max(effectiveRulerMin, v));
		rulerValue = clamped;
		if (v !== clamped) {
			onSelect(question.id, String(Math.round(clamped)));
		}
	});

	function handleRulerChange(v: number) {
		rulerValue = v;
		if (lossSliderMode && currentKg != null) {
			const loss = Math.min(MAX_LOSS_KG_14D, Math.max(MIN_LOSS_KG_14D, Math.round(v)));
			onSelect(question.id, String(currentKg - loss));
		} else {
			onSelect(question.id, String(v));
		}
	}

	const displayNum = $derived(String(Math.round(rulerValue)));
	const hint = $derived('← Arraste para ajustar →');
</script>

<div class="flex flex-col items-center gap-3">
	<div class="w-full space-y-1 mb-1">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{question.text}</h2>
		{#if question.subtext}
			<p
				class="text-sm text-body leading-relaxed [&_strong]:font-bold [&_strong]:text-heading"
			>
				{@html question.subtext.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
			</p>
		{/if}
	</div>

	<!-- Big value display -->
	<div class="flex flex-col items-center gap-0.5 self-center">
		<div class="flex items-baseline gap-1">
			{#if lossSliderMode}
				<span
					class="text-7xl font-extrabold text-heading tabular-nums tracking-tight leading-none select-none shrink-0"
					aria-hidden="true">-</span>
			{/if}
			<span class="text-7xl font-extrabold text-heading tabular-nums tracking-tight leading-none">
				{displayNum}
			</span>
			<span class="text-2xl font-semibold text-muted">kg</span>
		</div>
	</div>

	<!-- Ruler -->
	<div class="w-full">
		<RulerPickerH
			value={rulerValue}
			min={effectiveRulerMin}
			max={effectiveRulerMax}
			onchange={handleRulerChange}
			showTickNumbers={!lossSliderMode}
			tickWidth={lossSliderMode ? 15 : undefined}
			largeSteps={lossSliderMode}
		/>
	</div>

	<div class="flex flex-col items-center justify-center gap-1">
		<p class="text-xs text-muted text-center">{hint}</p>
		<SwipeRightIcon />
	</div>
</div>
