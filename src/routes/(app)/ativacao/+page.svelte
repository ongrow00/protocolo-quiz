<script lang="ts">
	import { goto } from '$app/navigation';
	import ResultsOfferPage from '$lib/components/post-quiz/ResultsOfferPage.svelte';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { authStore } from '$lib/stores/auth.store';
	import { supabase } from '$lib/supabase';
	import { getAnonymousId } from '$lib/stores/identity.store';
	import { generateChallengePlan } from '$lib/data/meal-plan-generator';
	import {
		ATIVACAO_OFFER_FEATURES,
		ATIVACAO_OFFER_PRICING,
		ATIVACAO_OFFER_GUARANTEE,
		ATIVACAO_OFFER_FAQ,
		ATIVACAO_HERO_HEADLINE,
		ATIVACAO_HERO_PROGRESS,
		ATIVACAO_OFFER_CTA,
		ATIVACAO_OFFER_ACCESS_SECTION
	} from '$lib/data/ativacao-offer';

	let completing = $state(false);
	let saveError = $state<string | null>(null);

	async function handleActivation() {
		if (completing) return;
		completing = true;
		saveError = null;

		const selections = $postQuizStore.mealSelections;
		if (!selections) {
			saveError = 'Nenhuma seleção encontrada. Tente novamente.';
			completing = false;
			return;
		}

		const { data: { session }, error: sessionError } = await supabase.auth.getSession();

		if (sessionError || !session) {
			await authStore.signOut();
			goto('/', { replaceState: true });
			return;
		}

		const user = session.user;

		try {
			const plan = generateChallengePlan(selections);
			const anonymousId = getAnonymousId();

			const { data: mealPlan, error: mpError } = await supabase
				.from('meal_plans')
				.insert({
					user_id: user.id,
					anonymous_id: anonymousId,
					selections,
					generated_plan: plan,
					is_active: true
				})
				.select('id')
				.single();

			if (mpError) {
				console.error('meal_plans insert failed:', mpError.message, mpError.code);
				saveError = `Erro ao salvar plano: ${mpError.message}`;
				completing = false;
				return;
			}

			const { error: cpError } = await supabase
				.from('challenge_progress')
				.insert({
					user_id: user.id,
					anonymous_id: anonymousId,
					meal_plan_id: mealPlan.id,
					current_day: 1,
					started_at: new Date().toISOString(),
					streak: 0,
					days_status: { 1: 'current' },
					meals_status: {}
				});

			if (cpError) console.warn('challenge_progress insert failed:', cpError.message);

			const { error: slError } = await supabase
				.from('shopping_lists')
				.insert({
					user_id: user.id,
					anonymous_id: anonymousId,
					meal_plan_id: mealPlan.id,
					checked_items: []
				});

			if (slError) console.warn('shopping_lists insert failed:', slError.message);
		} catch (err: any) {
			console.error('Supabase persist failed:', err?.message);
			saveError = 'Erro de conexão. Tente novamente.';
			completing = false;
			return;
		}

		postQuizStore.markOnboardingComplete();
		challengeStore.hydrate();
		challengeStore.ensureStarted();
		goto('/inicio', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Configure seu protocolo</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<ResultsOfferPage
	variant="ativacao"
	offerFeatures={ATIVACAO_OFFER_FEATURES}
	offerPricing={ATIVACAO_OFFER_PRICING}
	offerGuarantee={ATIVACAO_OFFER_GUARANTEE}
	offerFaq={ATIVACAO_OFFER_FAQ}
	heroHeadline={ATIVACAO_HERO_HEADLINE}
	heroProgress={ATIVACAO_HERO_PROGRESS}
	offerCta={ATIVACAO_OFFER_CTA}
	offerAccessSection={ATIVACAO_OFFER_ACCESS_SECTION}
	onPrimaryCta={handleActivation}
	onDeclineCta={handleActivation}
/>

{#if saveError}
	<div class="mx-auto w-full max-w-md px-4 pb-4">
		<p class="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
			{saveError}
		</p>
	</div>
{/if}

{#if completing}
	<div class="flex items-center justify-center py-8">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
	</div>
{/if}
