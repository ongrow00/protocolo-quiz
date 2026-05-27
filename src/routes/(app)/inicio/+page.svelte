<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import ChallengeDayMeals from '$lib/components/challenge/ChallengeDayMeals.svelte';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import ProtocolOverviewCarousel from '$lib/components/challenge/ProtocolOverviewCarousel.svelte';
	import ProtocolInfoSheet from '$lib/components/challenge/ProtocolInfoSheet.svelte';
	import { CHALLENGE_TOTAL_DAYS } from '$lib/constants/challenge-storage-keys';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { generatingPlan } from '$lib/stores/generating.store';
	import { authStore } from '$lib/stores/auth.store';
	import { supabase } from '$lib/supabase';
	import {
		getAllDaySummaries,
		isDayNavigable
	} from '$lib/utils/challenge-progress';

	const GENERATING_DURATION_MS = 30_000;

	let infoSheetOpen = $state(false);

	let ready = $state(false);
	let generating = $state(false);
	let selectedDay = $state(1);
	let lastKnownCurrent = $state(1);
	let timelineInitialized = $state(false);

	onMount(async () => {
		const userId = $authStore.user?.id;
		if (userId) {
			const { data } = await supabase
				.from('meal_plans')
				.select('created_at')
				.eq('user_id', userId)
				.eq('is_active', true)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (data?.created_at) {
				const elapsed = Date.now() - new Date(data.created_at).getTime();
				const remaining = GENERATING_DURATION_MS - elapsed;

				if (remaining > 0) {
					generating = true;
					generatingPlan.set(true);
					setTimeout(() => {
						generating = false;
						generatingPlan.set(false);
					}, remaining);
				}
			}
		}

		requestAnimationFrame(() => { ready = true; });
	});

	onDestroy(() => {
		generatingPlan.set(false);
	});

	function selectDay(day: number) {
		selectedDay = day;
	}

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
	const canViewDay = $derived(isDayNavigable($challengeStore, selectedDay));
</script>

<ChallengePageShell>
	{#if generating}
		<div class="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-sm flex-col items-center justify-center gap-6 px-2 py-8">
			<div class="h-10 w-10 animate-spin rounded-full border-[3px] border-accent/20 border-t-accent"></div>
			<p class="text-center text-sm font-medium text-muted">Gerando seu plano, aguarde…</p>
		</div>
	{:else}
	<div class="mx-auto flex w-full max-w-sm flex-col gap-5">
		{#if !ready}
			<div class="flex flex-col gap-4 animate-pulse">
				<div class="h-[120px] rounded-2xl bg-surface"></div>
				<div class="h-[56px] rounded-2xl bg-white"></div>
				<div class="flex flex-col gap-3">
					<div class="h-[72px] rounded-xl bg-surface"></div>
					<div class="h-[72px] rounded-xl bg-surface"></div>
					<div class="h-[72px] rounded-xl bg-surface"></div>
				</div>
			</div>
		{:else}
			<ProtocolOverviewCarousel
				days={summaries}
				{selectedDay}
				intakeDay={selectedDay}
				showIntake={canViewDay}
				onSelectDay={selectDay}
				onOpenInfo={() => (infoSheetOpen = true)}
			/>

			<ChallengeDayMeals dayNum={selectedDay} />
		{/if}
	</div>
	{/if}
</ChallengePageShell>

<ProtocolInfoSheet open={infoSheetOpen} onClose={() => (infoSheetOpen = false)} />
