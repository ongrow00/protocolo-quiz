<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';
	import ResultsOfferPage from '$lib/components/post-quiz/ResultsOfferPage.svelte';

	const RESULTS_VIDEO_HASH = '#video-protocolo';

	$effect(() => {
		if (!browser) return;
		const state = $quizStore;
		if (state.completedAt == null) {
			goto('/', { replaceState: true });
		}
	});

	afterNavigate(({ to }) => {
		if (!browser || !to?.url.pathname.startsWith('/results')) return;
		if (to.url.hash !== RESULTS_VIDEO_HASH) return;
		void tick().then(() => {
			document.getElementById('video-protocolo')?.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		});
	});
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
</svelte:head>

<ResultsOfferPage />
