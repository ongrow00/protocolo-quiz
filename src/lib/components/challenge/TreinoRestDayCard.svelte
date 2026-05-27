<script lang="ts">
	import type { WorkoutPlanDay } from '$lib/data/treino-types';

	interface Props {
		day: WorkoutPlanDay;
	}

	let { day }: Props = $props();
</script>

<div class="mx-auto flex max-w-xs flex-col items-center px-4 text-center">
	<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-line/20">
		<svg class="h-6 w-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
			<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
			<path d="M12 6v6l4 2" />
		</svg>
	</div>
	<h2 class="text-base font-bold text-heading">Dia de descanso do treino</h2>
	<p class="mt-2 text-sm leading-relaxed text-body">
		Siga o protocolo alimentar do <strong class="text-heading">Dia {day.protocolDay}</strong>
		(Fase {day.phase} · {day.phaseName}). Seu próximo treino está em outro dia do protocolo.
	</p>
</div>
