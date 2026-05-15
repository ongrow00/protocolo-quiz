<script lang="ts">
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import ResultsOfferPage from '$lib/components/post-quiz/ResultsOfferPage.svelte';
	import AtivacaoLoadingScreen from './AtivacaoLoadingScreen.svelte';
	import { ATIVACAO_OFFER_FEATURES } from './offer-features';
	import { ATIVACAO_OFFER_PRICING } from './offer-pricing';
	import { ATIVACAO_OFFER_GUARANTEE } from './offer-guarantee';
	import { ATIVACAO_OFFER_FAQ } from './offer-faq';
	import { ATIVACAO_HERO_HEADLINE, ATIVACAO_HERO_PROGRESS } from './offer-hero';
	import { ATIVACAO_OFFER_CTA } from './offer-cta';
	import { ATIVACAO_OFFER_ACCESS_SECTION } from './offer-access-section';

	let pageReady = $state(false);

	function handleLoadingComplete() {
		postQuizStore.resetResultsContentRevealed();
		pageReady = true;
	}
</script>

<svelte:head>
	<title>Ativação de conta — Protocolo Desbloqueio</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !pageReady}
	<AtivacaoLoadingScreen onComplete={handleLoadingComplete} />
{:else}
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
	/>
{/if}
