<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import DailyIntakeCard from '$lib/components/challenge/DailyIntakeCard.svelte';
	import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { treinoStore } from '$lib/stores/treino.store';
	import { isDayNavigable } from '$lib/utils/challenge-progress';
	import { workoutPlanStore } from '$lib/data/treino-plan';
	import { resolveDayView } from '$lib/utils/treino-day-resolve';

	const dayNum = $derived(parseInt($page.params.day ?? '', 10));

	$effect(() => {
		const d = dayNum;
		if (!Number.isFinite(d) || d < 1 || d > CHALLENGE_TOTAL_DAYS) {
			goto('/inicio');
			return;
		}
		if (!isDayNavigable($challengeStore, d)) {
			goto('/inicio');
		}
	});

	const canViewMeals = $derived(
		Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= CHALLENGE_TOTAL_DAYS && isDayNavigable($challengeStore, dayNum)
	);
	const dayView = $derived(
		$workoutPlanStore
			? resolveDayView($workoutPlanStore, $treinoStore.progress, dayNum)
			: null
	);
</script>

<ChallengePageShell>
	<div class="mx-auto flex w-full max-w-sm flex-col gap-5">
		<button
			type="button"
			onclick={() => goto('/inicio')}
			class="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted transition-colors hover:text-heading"
		>
			<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
			</svg>
			Protocolo
		</button>

		<div>
			<p class="mb-3 text-sm font-bold text-heading">Dia {dayNum}</p>
			{#if dayView?.kind === 'workout'}
				<a
					href="/treino?day={dayNum}"
					class="mb-4 flex items-center justify-between gap-3 rounded-challenge border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-medium text-heading transition-all active:scale-[0.98]"
				>
					<span>💪 Treino {dayView.day.workoutLetter} — abrir protocolo</span>
					<svg class="h-4 w-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
				</a>
			{:else if dayView?.kind === 'choice'}
				<a
					href="/treino?day={dayNum}"
					class="mb-4 flex items-center justify-between gap-3 rounded-challenge border border-challenge-border bg-surface px-4 py-3 text-sm font-medium text-heading transition-all active:scale-[0.98]"
				>
					<span>💪 Escolher treino ou descanso</span>
					<svg class="h-4 w-4 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
				</a>
			{/if}
			{#if canViewMeals}
				<DailyIntakeCard day={dayNum} />
			{/if}
		</div>

	</div>
</ChallengePageShell>
