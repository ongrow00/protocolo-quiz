<script lang="ts">
	import { page } from '$app/stores';
	import ChallengeDayMeals from '$lib/components/challenge/ChallengeDayMeals.svelte';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import ProtocolOverviewCarousel from '$lib/components/challenge/ProtocolOverviewCarousel.svelte';
	import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
	import { challengeStore } from '$lib/stores/challenge.store';
	import {
		getAllDaySummaries,
		globalPercentComplete,
		isDayNavigable
	} from '$lib/utils/challenge-progress';

	let selectedDay = $state(1);
	let lastKnownCurrent = $state(1);
	let timelineInitialized = $state(false);

	$effect(() => {
		const cd = $challengeStore.currentDay;
		if (!timelineInitialized) {
			selectedDay = cd;
			lastKnownCurrent = cd;
			timelineInitialized = true;
			return;
		}
		if (cd > lastKnownCurrent && selectedDay === lastKnownCurrent) {
			selectedDay = cd;
		}
		lastKnownCurrent = cd;
	});

	$effect(() => {
		const param = parseInt($page.url.searchParams.get('dia') ?? '', 10);
		if (param >= 1 && param <= CHALLENGE_TOTAL_DAYS && isDayNavigable($challengeStore, param)) {
			selectedDay = param;
		}
	});

	const summaries = $derived(getAllDaySummaries($challengeStore));
	const globalPercent = $derived(globalPercentComplete($challengeStore));
	const canViewDay = $derived(isDayNavigable($challengeStore, selectedDay));
</script>

<ChallengePageShell>
	<div class="mx-auto flex w-full max-w-sm flex-col gap-5">
		<ProtocolOverviewCarousel
			days={summaries}
			{selectedDay}
			globalPercent={globalPercent}
			intakeDay={selectedDay}
			showIntake={canViewDay}
			onSelectDay={(day) => {
				selectedDay = day;
			}}
		/>

		{#if canViewDay}
			<ChallengeDayMeals dayNum={selectedDay} />
		{/if}
	</div>
</ChallengePageShell>
