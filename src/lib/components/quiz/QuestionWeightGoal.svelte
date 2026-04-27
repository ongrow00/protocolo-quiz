<script lang="ts">
	import type { Question } from '$lib/data/types';
	import RulerPickerH from './RulerPickerH.svelte';
	import SwipeRightIcon from '$lib/components/ui/SwipeRightIcon.svelte';

	/** BMI saudável (OMS): 18,5–24,9 */
	const BMI_MIN_HEALTHY = 18.5;
	const BMI_MAX_HEALTHY = 24.9;

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
		/** Respostas já preenchidas (precisa de height_cm para faixa e insight) */
		answers: Record<string, string | string[]>;
	}

	let { question, value, onSelect, answers }: Props = $props();

	const rulerMin = $derived(question.min ?? 30);
	const rulerMax = $derived(question.max ?? 200);
	// Se a pessoa quer emagrecer, não permitir selecionar peso acima do atual
	const currentKg = $derived.by(() => {
		const raw = answers['weight_current_kg'];
		if (raw === undefined || raw === null) return null;
		const n =
			typeof raw === 'string' ? parseInt(raw, 10) : Array.isArray(raw) ? parseInt(raw[0], 10) : NaN;
		return Number.isFinite(n) && n >= 30 && n <= 200 ? n : null;
	});
	const userWantsToLose = $derived(answers['goal_type'] === 'goal-emagrecer');
	// Emagrecimento: objetivo tem que ser menor que o peso atual (máx. = atual - 1, respeitando rulerMin)
	const effectiveRulerMax = $derived.by(() => {
		if (userWantsToLose && currentKg != null)
			return Math.min(rulerMax, Math.max(rulerMin, currentKg - 1));
		return rulerMax;
	});
	const baseDefault = 70;
	const baseValue = $derived(
		value !== undefined && value !== '' ? parseInt(value) : baseDefault
	);

	let rulerValue = $state(Math.min(effectiveRulerMax, Math.max(rulerMin, baseValue)));

	$effect(() => {
		const v = value !== undefined && value !== '' ? parseInt(value) : baseDefault;
		const clamped = Math.min(effectiveRulerMax, Math.max(rulerMin, v));
		rulerValue = clamped;
		// Emagrecimento: se o valor salvo for >= peso atual, persistir o valor limitado
		if (userWantsToLose && currentKg != null && v > effectiveRulerMax && clamped !== v) {
			onSelect(question.id, String(Math.round(clamped)));
		}
	});

	function handleRulerChange(v: number) {
		rulerValue = v;
		onSelect(question.id, String(v));
	}

	const displayNum = $derived(String(Math.round(rulerValue)));
	const hint = $derived('← Arraste para ajustar →');

	// Altura em cm (pergunta height_cm vem antes do objetivo de peso)
	const heightCm = $derived.by(() => {
		const raw = answers['height_cm'];
		if (raw === undefined || raw === null) return null;
		const n =
			typeof raw === 'string' ? parseInt(raw, 10) : Array.isArray(raw) ? parseInt(raw[0], 10) : NaN;
		return Number.isFinite(n) && n >= 100 && n <= 220 ? n : null;
	});

	// Faixa recomendada (IMC 18,5–24,9) em kg
	const recommendedRange = $derived.by(() => {
		if (heightCm == null) return null;
		const heightM = heightCm / 100;
		const minKg = Math.round(BMI_MIN_HEALTHY * heightM * heightM);
		const maxKg = Math.round(BMI_MAX_HEALTHY * heightM * heightM);
		return { minKg, maxKg };
	});

	// IMC da meta e classificação
	const goalInsight = $derived.by(() => {
		if (heightCm == null) return null;
		const heightM = heightCm / 100;
		const goalKg = Math.round(rulerValue);
		const bmi = goalKg / (heightM * heightM);
		const range = recommendedRange;
		if (!range) return null;

		if (bmi < BMI_MIN_HEALTHY) {
			return {
				type: 'below' as const,
				bmi,
				range
			};
		}
		if (bmi <= BMI_MAX_HEALTHY) {
			return {
				type: 'healthy' as const,
				bmi,
				range
			};
		}
		return {
			type: 'above' as const,
			bmi,
			range
		};
	});

	type LegendHighlightColor = 'green' | 'amber' | 'accent';

	/** Legenda: título, destaque, cor, subtexto, ícone. Prioriza intenção (ganhar/perder) sobre faixa IMC. */
	const goalLegend = $derived.by((): {
		title: string;
		highlight: string;
		highlightColor: LegendHighlightColor;
		subtext: string;
		icon: string;
	} | null => {
		if (!goalInsight) return null;
		const goalKg = Math.round(rulerValue);
		const { type, range } = goalInsight;
		const cur = currentKg ?? goalKg;

		const isGain = goalKg > cur; // meta acima do peso atual
		const isLoss = goalKg < cur;
		const percentChange =
			cur > 0 ? Math.round((Math.abs(goalKg - cur) / cur) * 100) : 0;

		// Meta acima do peso atual
		if (isGain) {
			// Usuário disse que quer emagrecer mas meta está acima do atual → mensagem simples
			if (userWantsToLose) {
				return {
					title: 'Você vai ganhar',
					highlight: `${percentChange}% em relação ao peso atual`,
					highlightColor: 'amber',
					subtext: '',
					icon: '💪'
				};
			}
			return {
				title: 'Boa meta para ganho de massa, você vai ganhar',
				highlight: `${percentChange}% em relação ao peso atual`,
				highlightColor: 'green',
				subtext: 'O ganho de massa magra com treino e nutrição adequados melhora a composição corporal.',
				icon: '💪'
			};
		}

		if (type === 'below') {
			return {
				title: 'Meta abaixo da faixa saudável. Para sua altura, o mínimo recomendado é',
				highlight: `${range.minKg} kg`,
				highlightColor: 'amber',
				subtext: 'Uma meta muito baixa pode prejudicar a saúde. Considere ajustar para a faixa saudável.',
				icon: '⚠️'
			};
		}

		if (type === 'above') {
			return {
				title: 'Meta acima da faixa saudável. Para sua altura, o máximo recomendado é',
				highlight: `${range.maxKg} kg`,
				highlightColor: 'amber',
				subtext: 'Pequenos ajustes na alimentação e no exercício ajudam a chegar na faixa saudável.',
				icon: '💪'
			};
		}

		// type === 'healthy' e meta < peso atual = quer perder peso

		if (isLoss) {
			// Peso atual > meta → a pessoa quer perder peso
			if (percentChange <= 6) {
				return {
					title: 'Meta leve, você vai perder',
					highlight: `${percentChange}% do seu peso`,
					highlightColor: 'green',
					subtext: 'Uma perda moderada traz benefícios significativos para a saúde e o bem-estar.',
					icon: '👍'
				};
			}
			if (percentChange <= 18) {
				return {
					title: 'Meta alcançável, você vai perder',
					highlight: `${percentChange}% do seu peso`,
					highlightColor: 'accent',
					subtext: 'A ciência mostra que perdas de 5–10% já melhoram problemas relacionados ao peso.',
					icon: '👍'
				};
			}
			return {
				title: 'Meta desafiadora, você vai perder',
				highlight: `${percentChange}% do seu peso`,
				highlightColor: 'amber',
				subtext: 'Persistir no exercício e na alimentação é o caminho para alcançar uma melhor forma.',
				icon: '💪'
			};
		}

		// goal ≈ current (meta igual ou muito próxima do peso atual)
		return {
			title: 'Manter o peso está na faixa saudável.',
			highlight: 'Ótimo objetivo',
			highlightColor: 'green',
			subtext: 'Siga com alimentação equilibrada e atividade física para manter os resultados.',
			icon: '👍'
		};
	});
</script>

<div class="flex flex-col items-center gap-3">
	<div class="w-full space-y-1 mb-1">
		<h2 class="text-2xl font-extrabold text-heading leading-tight">{question.text}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>

	<!-- Faixa recomendada (acima do valor) -->
	{#if recommendedRange}
		<p class="w-full text-center text-xs text-muted leading-relaxed" role="status">
			Faixa recomendada (IMC saudável): {recommendedRange.minKg}–{recommendedRange.maxKg} kg
		</p>
	{/if}

	<!-- Big value display -->
	<div class="flex items-baseline gap-2 self-center">
		<span class="text-7xl font-extrabold text-heading tabular-nums tracking-tight leading-none">
			{displayNum}
		</span>
		<span class="text-2xl font-semibold text-muted">kg</span>
	</div>

	<!-- Ruler -->
	<div class="w-full">
		<RulerPickerH
			value={rulerValue}
			min={rulerMin}
			max={effectiveRulerMax}
			onchange={handleRulerChange}
		/>
	</div>

	<div class="flex flex-col items-center justify-center gap-1">
		<p class="text-xs text-white text-center">{hint}</p>
		<SwipeRightIcon />
	</div>

	<!-- Legenda (só texto) — aparece quando há seleção de meta -->
	{#if goalLegend && value !== undefined && value !== ''}
		<div class="w-full flex items-center justify-center gap-3 pt-5 pb-5" role="status" aria-live="polite">
			<span class="text-lg shrink-0 mt-0.5" aria-hidden="true">{goalLegend.icon}</span>
			<p class="text-[12px] text-heading leading-[1.2] min-w-0">
				{goalLegend.title}
				<span
					class="font-semibold {goalLegend.highlightColor === 'green'
						? 'text-green-500'
						: goalLegend.highlightColor === 'amber'
							? 'text-amber-500'
							: 'text-accent'}"
				>
					{goalLegend.highlight}
				</span>
				{goalLegend.title.endsWith('.') ? '' : '.'}
			</p>
		</div>
	{/if}
</div>
