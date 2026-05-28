<script lang="ts">
	import { goto } from '$app/navigation';
	import ResultsOfferPage from '$lib/components/post-quiz/ResultsOfferPage.svelte';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { challengeStore } from '$lib/stores/challenge.store';
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

	async function handleActivation() {
		if (completing) return;
		completing = true;

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
	onDeclineCta={handleActivation}
/>

{#if completing}
	<div class="flex items-center justify-center py-8">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
	</div>
{/if}
