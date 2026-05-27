<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ChallengeBottomNav from '$lib/components/challenge/ChallengeBottomNav.svelte';
	import ChallengeGreetingHeader from '$lib/components/challenge/ChallengeGreetingHeader.svelte';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { authStore, isAuthenticated, authLoading } from '$lib/stores/auth.store';
	import { accessStore } from '$lib/stores/access.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { supabase } from '$lib/supabase';
	import type { MealSelections } from '$lib/data/meal-preferences';
	import { setChallengePlanDirect, type DayPlan } from '$lib/data/challenge-plan';
	import { setWorkoutPlanDirect } from '$lib/data/treino-plan';
	import type { WorkoutPlan } from '$lib/data/treino-types';
	import { loadActiveWorkoutPlan } from '$lib/services/treino-plan-sync.service';
	import { treinoStore } from '$lib/stores/treino.store';

	let { children } = $props();
	let hydrationDone = $state(false);
	let hydrating = false;

	const isAtivacaoPage = $derived($page.url.pathname === '/ativacao');
	const isConsultoriaPage = $derived($page.url.pathname === '/consultoria');
	const hasSelections = $derived($postQuizStore.mealSelections !== null);
	const onboardingComplete = $derived($postQuizStore.onboardingComplete);
	const needsOnboarding = $derived(hydrationDone && !onboardingComplete && !isAtivacaoPage);

	onMount(() => {
		authStore.init();
		challengeStore.hydrate();
		challengeStore.ensureStarted();
		accessStore.load();
		treinoStore.hydrate();
	});

	$effect(() => {
		if ($isAuthenticated && !$authLoading) {
			void hydrateWorkoutFromSupabase();
		}
	});

	async function hydrateWorkoutFromSupabase() {
		const userId = $authStore.user?.id;
		if (!userId) return;

		const { plan, answers, error } = await loadActiveWorkoutPlan(userId);
		if (error) console.warn('hydrateWorkout:', error);
		if (plan) {
			setWorkoutPlanDirect(plan as WorkoutPlan, answers);
			treinoStore.markQuizComplete();
		}
		await treinoStore.hydrateProgressFromSupabase();
	}

	$effect(() => {
		if (!$authLoading && !$isAuthenticated) {
			goto('/', { replaceState: true });
		}
	});

	$effect(() => {
		if (!$authLoading && $isAuthenticated && !onboardingComplete && !hydrationDone) {
			hydrateFromSupabase();
		} else if (onboardingComplete) {
			hydrationDone = true;
		}
	});

	async function hydrateFromSupabase() {
		if (hydrating || hydrationDone) return;
		hydrating = true;

		try {
			const userId = $authStore.user?.id;
			if (!userId) return;

			const { data, error } = await supabase
				.from('meal_plans')
				.select('selections, generated_plan')
				.eq('user_id', userId)
				.eq('is_active', true)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (error) {
				console.error('hydrateFromSupabase error:', error.message, error.code);
			}

		if (data?.selections) {
			postQuizStore.setMealSelections(data.selections as MealSelections);
			postQuizStore.markOnboardingComplete();

			if (data.generated_plan && Array.isArray(data.generated_plan) && data.generated_plan.length > 0) {
				setChallengePlanDirect(data.generated_plan as DayPlan[]);
			}
		}

			await challengeStore.hydrateFromSupabase();
		} catch (e) {
			console.error('hydrateFromSupabase unexpected error:', e);
		} finally {
			hydrating = false;
			hydrationDone = true;
		}
	}

	$effect(() => {
		if (!$authLoading && $isAuthenticated && needsOnboarding) {
			goto('/ativacao', { replaceState: true });
		}
	});

	$effect(() => {
		if (hydrationDone && onboardingComplete && isAtivacaoPage) {
			goto('/inicio', { replaceState: true });
		}
	});
</script>

{#if $authLoading || (!hydrationDone && !onboardingComplete)}
	<div class="flex min-h-0 flex-1 items-center justify-center">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
	</div>
{:else if $isAuthenticated && isAtivacaoPage}
	<div class="flex min-h-0 flex-1 flex-col bg-challenge-hero">
		<main class="scrollbar-hidden flex flex-1 flex-col min-h-0 overflow-y-auto overscroll-contain bg-challenge-hero px-4 py-8">
			{@render children()}
		</main>
	</div>
{:else if $isAuthenticated}
	<div class="flex min-h-0 flex-1 flex-col bg-challenge-hero">
		<main class="relative min-h-0 flex-1 overflow-hidden overscroll-contain">
		<div
			class="scrollbar-hidden h-full min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))]"
			style:background={isConsultoriaPage ? 'linear-gradient(90deg, #464E46, #697169)' : undefined}
		>
			<div
				class="sticky top-0 z-10 -mx-4 mb-2 flex h-[75px] items-center px-4 backdrop-blur-md {isConsultoriaPage ? 'bg-transparent' : 'bg-[#ececec]/80 supports-[backdrop-filter]:bg-[#ececec]/70'}"
			>
					<div class="mx-auto flex w-full max-w-sm items-center">
						<ChallengeGreetingHeader light={isConsultoriaPage} />
					</div>
				</div>

				{#key $page.url.pathname}
					<div in:fade={{ duration: 140, delay: 60 }}>
						{@render children()}
					</div>
				{/key}
			</div>
		</main>

		<ChallengeBottomNav />
	</div>
{/if}
