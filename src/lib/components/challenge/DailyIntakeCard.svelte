<script lang="ts">
	import { challengeStore } from '$lib/stores/challenge.store';
	import { quizStore } from '$lib/stores/quiz.store';
	import { getDayIntakeConsumed, intakeProgress } from '$lib/utils/daily-intake';
	import { formatKcalNumber, resolveDailyMacroGoals } from '$lib/utils/macros';

	interface Props {
		day: number;
		embedded?: boolean;
		class?: string;
	}

	let { day, embedded = false, class: className = '' }: Props = $props();

	const shellClass = $derived(
		embedded
			? `w-full ${className}`
			: `rounded-challenge border border-challenge-border bg-surface px-4 py-4 ${className}`
	);

	/** Mesma meta do funil/results (Etapa 1), não a média do cardápio. */
	const goals = $derived(resolveDailyMacroGoals($quizStore.answers));
	const rawConsumed = $derived(getDayIntakeConsumed($challengeStore, day));

	const consumed = $derived({
		kcal: Math.round(rawConsumed.kcal),
		proteinG: Math.round(rawConsumed.proteinG),
		carbsG: Math.round(rawConsumed.carbsG),
		fatG: Math.round(rawConsumed.fatG)
	});

	const kcalPct = $derived(intakeProgress(consumed.kcal, goals.kcal));
	const carbsPct = $derived(intakeProgress(consumed.carbsG, goals.carbsG));
	const proteinPct = $derived(intakeProgress(consumed.proteinG, goals.proteinG));
	const fatPct = $derived(intakeProgress(consumed.fatG, goals.fatG));
</script>

<div class={shellClass} aria-label="Ingestão diária do dia {day}">
	<div class="mb-3 flex items-center justify-between gap-3">
		<span class="text-sm font-bold text-heading">Ingestão diária</span>
		<span class="text-xs font-medium tabular-nums text-muted">
			{formatKcalNumber(consumed.kcal)} / {formatKcalNumber(goals.kcal)} kcal
		</span>
	</div>

	<div
		class="mb-5 h-2 w-full overflow-hidden rounded-full bg-challenge-progress-track"
		role="progressbar"
		aria-valuenow={kcalPct}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label="Calorias consumidas"
	>
		<div
			class="h-full rounded-full bg-accent transition-all duration-500 ease-out"
			style="width: {kcalPct}%"
		></div>
	</div>

	<div class="grid grid-cols-3 gap-3">
		<div class="flex flex-col items-center gap-2">
			<span class="text-xs font-semibold text-heading">Carboidratos</span>
			<div
				class="h-1.5 w-full overflow-hidden rounded-full bg-challenge-progress-track"
				role="progressbar"
				aria-valuenow={carbsPct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					class="h-full rounded-full bg-accent transition-all duration-500 ease-out"
					style="width: {carbsPct}%"
				></div>
			</div>
			<span class="text-[11px] font-medium tabular-nums text-muted">
				{consumed.carbsG} / {goals.carbsG} g
			</span>
		</div>

		<div class="flex flex-col items-center gap-2">
			<span class="text-xs font-semibold text-heading">Proteína</span>
			<div
				class="h-1.5 w-full overflow-hidden rounded-full bg-challenge-progress-track"
				role="progressbar"
				aria-valuenow={proteinPct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					class="h-full rounded-full bg-accent transition-all duration-500 ease-out"
					style="width: {proteinPct}%"
				></div>
			</div>
			<span class="text-[11px] font-medium tabular-nums text-muted">
				{consumed.proteinG} / {goals.proteinG} g
			</span>
		</div>

		<div class="flex flex-col items-center gap-2">
			<span class="text-xs font-semibold text-heading">Gordura</span>
			<div
				class="h-1.5 w-full overflow-hidden rounded-full bg-challenge-progress-track"
				role="progressbar"
				aria-valuenow={fatPct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					class="h-full rounded-full bg-accent transition-all duration-500 ease-out"
					style="width: {fatPct}%"
				></div>
			</div>
			<span class="text-[11px] font-medium tabular-nums text-muted">
				{consumed.fatG} / {goals.fatG} g
			</span>
		</div>
	</div>
</div>
