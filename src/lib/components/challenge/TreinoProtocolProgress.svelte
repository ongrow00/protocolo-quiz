<script lang="ts">
	interface Props {
		completed: number;
		total: number;
	}

	let { completed, total }: Props = $props();

	const percent = $derived(total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0);
</script>

{#if total > 0}
	<div class="mt-3">
		<div class="mb-1.5 flex items-center justify-between gap-2">
			<span class="text-xs font-medium text-muted">Progresso do treino</span>
			<span class="text-xs font-bold tabular-nums text-heading">{completed}/{total}</span>
		</div>
		<div
			class="h-2 w-full overflow-hidden rounded-full bg-challenge-progress-track"
			role="progressbar"
			aria-valuenow={completed}
			aria-valuemin={0}
			aria-valuemax={total}
			aria-label="Sessões de treino concluídas: {completed} de {total}"
		>
			<div
				class="h-full rounded-full bg-accent transition-all duration-300"
				style="width: {percent}%"
			></div>
		</div>
	</div>
{/if}
