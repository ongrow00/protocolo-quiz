<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import DailyIntakeCard from '$lib/components/challenge/DailyIntakeCard.svelte';
	import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { isDayNavigable } from '$lib/utils/challenge-progress';

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
			{#if canViewMeals}
				<DailyIntakeCard day={dayNum} />
			{/if}
		</div>

	</div>
</ChallengePageShell>
