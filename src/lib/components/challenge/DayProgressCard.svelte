<script lang="ts">
	interface Props {
		mealsDone: number;
		mealsTotal: number;
		dayPercent: number;
		streak: number;
		completedDays: number;
		totalDays?: number;
		/** Ex.: "hoje" ou "neste dia" */
		dayScopeLabel?: string;
	}

	let {
		mealsDone,
		mealsTotal,
		dayPercent,
		streak,
		completedDays,
		totalDays = 14,
		dayScopeLabel = 'hoje'
	}: Props = $props();
</script>

<div class="rounded-challenge border border-line bg-surface p-5 shadow-sm">
	<p class="text-sm text-muted">
		Você completou <span class="font-bold text-heading">{mealsDone}/{mealsTotal}</span> refeições {dayScopeLabel}
	</p>
	<div class="mt-4 flex items-end justify-between gap-4">
		<div>
			<p class="text-4xl font-extrabold text-heading leading-none">{dayPercent}%</p>
			<p class="mt-1 text-xs text-muted">do dia concluído</p>
		</div>
		<div class="flex gap-4 text-center">
			<div>
				<p class="text-xl font-extrabold text-accent">{streak}</p>
				<p class="text-[10px] font-medium text-muted uppercase tracking-wide">Streak</p>
			</div>
			<div>
				<p class="text-xl font-extrabold text-heading">{completedDays}</p>
				<p class="text-[10px] font-medium text-muted uppercase tracking-wide">Dias ok</p>
			</div>
		</div>
	</div>
	<div
		class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
		role="progressbar"
		aria-valuenow={dayPercent}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label="Progresso do dia"
	>
		<div
			class="h-full rounded-full bg-accent transition-all duration-500"
			style="width: {dayPercent}%"
		></div>
	</div>
	<p class="mt-3 text-xs text-muted">
		{completedDays} de {totalDays} dias completos no desafio
	</p>
</div>
