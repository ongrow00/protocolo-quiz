<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ResultsOfferPage from '$lib/components/post-quiz/ResultsOfferPage.svelte';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { challengeStore } from '$lib/stores/challenge.store';
	import { authStore } from '$lib/stores/auth.store';
	import { accessStore } from '$lib/stores/access.store';
	import { profileStore } from '$lib/stores/profile.store';
	import {
		loadOnboardingStatus,
		markOnboardingCompletedInDb
	} from '$lib/services/onboarding-completion.service';
	import {
		ATIVACAO_OFFER_FEATURES,
		ATIVACAO_OFFER_PRICING,
		ATIVACAO_OFFER_GUARANTEE,
		ATIVACAO_OFFER_FAQ,
		ATIVACAO_HERO_HEADLINE,
		ATIVACAO_HERO_SUBHEADLINE,
		ATIVACAO_HERO_PROGRESS,
		ATIVACAO_OFFER_CTA,
		ATIVACAO_OFFER_ACCESS_SECTION
	} from '$lib/data/ativacao-offer';

	let completing = $state(false);
	let declineError = $state<string | null>(null);
	let checkingPurchase = $state(false);

	async function enterAppAfterOnboarding() {
		postQuizStore.markOnboardingComplete();
		challengeStore.hydrate();
		challengeStore.ensureStarted();
		await goto('/inicio', { replaceState: true });
	}

	async function syncOnboardingAfterCheckout() {
		const userId = $authStore.user?.id;
		if (!userId || completing || checkingPurchase) return;

		checkingPurchase = true;
		try {
			await accessStore.load();
			const { complete } = await loadOnboardingStatus(userId);
			if (complete) {
				await enterAppAfterOnboarding();
			}
		} finally {
			checkingPurchase = false;
		}
	}

	onMount(() => {
		if (!browser) return;

		const onReturn = () => {
			if (document.visibilityState !== 'visible') return;
			void syncOnboardingAfterCheckout();
		};

		window.addEventListener('focus', onReturn);
		document.addEventListener('visibilitychange', onReturn);

		return () => {
			window.removeEventListener('focus', onReturn);
			document.removeEventListener('visibilitychange', onReturn);
		};
	});

	async function handleActivation() {
		if (completing) return;
		completing = true;
		declineError = null;

		const result = await markOnboardingCompletedInDb();
		if (!result.ok) {
			declineError = result.error;
			completing = false;
			return;
		}

		await enterAppAfterOnboarding();
	}

	async function handleExit() {
		await authStore.signOut();
		challengeStore.reset();
		postQuizStore.reset();
		profileStore.reset();
		await goto('/', { replaceState: true });
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
	heroSubheadline={ATIVACAO_HERO_SUBHEADLINE}
	heroProgress={ATIVACAO_HERO_PROGRESS}
	offerCta={ATIVACAO_OFFER_CTA}
	offerAccessSection={ATIVACAO_OFFER_ACCESS_SECTION}
	useAppCheckoutBuyer
	onDeclineCta={handleActivation}
	onExitCta={handleExit}
/>

{#if declineError}
	<p class="fixed bottom-6 left-4 right-4 z-[110] mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
		{declineError}
	</p>
{/if}

{#if completing || checkingPurchase}
	<div class="flex items-center justify-center py-8">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"></div>
	</div>
{/if}
