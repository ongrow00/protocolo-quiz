<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';

	interface Exercise {
		name: string;
		sets: number;
		reps: number;
		rest: string;
		muscle: string;
	}

	interface Props {
		open: boolean;
		exercise: Exercise | null;
		onClose: () => void;
		onComplete?: (exerciseName: string) => void;
	}

	let { open, exercise, onClose, onComplete }: Props = $props();

	let completedSets = $state<Set<number>>(new Set());

	const setsList = $derived(
		exercise ? Array.from({ length: exercise.sets }, (_, i) => i + 1) : []
	);

	function toggleSet(setNum: number) {
		const next = new Set(completedSets);
		if (next.has(setNum)) {
			next.delete(setNum);
		} else {
			next.add(setNum);
		}
		completedSets = next;

		if (exercise && next.size === exercise.sets) {
			setTimeout(() => {
				onComplete?.(exercise!.name);
				completedSets = new Set();
				onClose();
			}, 400);
		}
	}

	$effect(() => {
		if (!open) {
			completedSets = new Set();
		}
	});
</script>

<BottomSheet {open} {onClose}>
	{#if exercise}
		<div class="flex flex-col gap-5 pb-2">
			<!-- Image placeholder -->
			<div class="relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-challenge bg-accent-soft px-5 py-10 text-center">
				<svg class="h-12 w-12 text-accent/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
					<circle cx="8.5" cy="8.5" r="1.5" />
					<polyline points="21 15 16 10 5 21" />
				</svg>
				<h2 class="mt-2 text-lg font-extrabold leading-tight text-heading">{exercise.name}</h2>
			</div>

			<!-- Stats grid (same style as MealDetailSheet) -->
			<div class="grid grid-cols-4 divide-x divide-line/40 rounded-challenge border border-line/30 py-3">
				<div class="text-center">
					<p class="text-base font-extrabold text-heading">{exercise.reps}</p>
					<p class="text-[10px] font-medium text-muted">reps</p>
				</div>
				<div class="text-center">
					<p class="text-base font-extrabold text-heading">{exercise.sets}</p>
					<p class="text-[10px] font-medium text-muted">séries</p>
				</div>
				<div class="text-center">
					<p class="text-base font-extrabold text-heading">{exercise.rest}</p>
					<p class="text-[10px] font-medium text-muted">descanso</p>
				</div>
				<div class="text-center">
					<p class="text-base font-extrabold text-heading">{exercise.muscle}</p>
					<p class="text-[10px] font-medium text-muted">músculo</p>
				</div>
			</div>

			<!-- Sets list -->
			<div class="flex flex-col gap-2">
				{#each setsList as setNum (setNum)}
					{@const isDone = completedSets.has(setNum)}
					<button
						type="button"
						onclick={() => toggleSet(setNum)}
						class="flex w-full items-center gap-3 rounded-challenge border border-challenge-border bg-surface px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]"
					>
						<span
							class="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200
								{isDone ? 'border-accent bg-accent text-bg' : 'border-line bg-transparent'}"
						>
							{#if isDone}
								<svg class="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none">
									<path d="M3 8.5 L6.5 12 L13 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							{/if}
						</span>
						<span class="text-sm font-bold {isDone ? 'text-muted line-through' : 'text-heading'}">
							{setNum}ª série
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</BottomSheet>
