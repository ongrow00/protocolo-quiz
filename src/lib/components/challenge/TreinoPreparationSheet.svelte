<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import type { WorkoutPlanDay } from '$lib/data/treino-types';
	import { formatDurationMinutes } from '$lib/utils/treino-duration';

	interface Props {
		open: boolean;
		day: WorkoutPlanDay | null;
		onClose: () => void;
	}

	let { open, day, onClose }: Props = $props();
</script>

<BottomSheet {open} {onClose} title="Preparação do treino">
	{#if day?.isWorkoutDay}
		<div class="flex flex-col gap-5">
			<div class="grid grid-cols-3 divide-x divide-line/40 rounded-challenge border border-line/30 py-3">
				<div class="text-center px-1">
					<p class="text-base font-extrabold text-heading">
						{formatDurationMinutes(day.estimatedMinutes)}
					</p>
					<p class="text-[10px] font-medium text-muted">duração estimada</p>
				</div>
				<div class="text-center px-1">
					<p class="text-base font-extrabold text-heading">{day.timing.exerciseSeconds}s</p>
					<p class="text-[10px] font-medium text-muted">exercício</p>
				</div>
				<div class="text-center px-1">
					<p class="text-base font-extrabold text-heading">{day.timing.restBetweenExercises}s</p>
					<p class="text-[10px] font-medium text-muted">descanso depois</p>
				</div>
			</div>
			<p class="text-center text-[10px] font-medium text-muted">
				{day.timing.rounds} circuitos no total
			</p>

			<div>
				<p class="text-xs font-semibold uppercase tracking-wide text-accent">Materiais necessários</p>
				<p class="mt-1 mb-3 text-sm text-muted">Separe os equipamentos abaixo antes de iniciar a sessão.</p>
				<ul class="flex flex-col gap-2">
					{#each day.materials as item (item)}
						<li class="flex gap-2 text-sm text-body">
							<span class="text-accent" aria-hidden="true">•</span>
							<span>{item}</span>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</BottomSheet>
