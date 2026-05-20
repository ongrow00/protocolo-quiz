<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { quizStore } from '$lib/stores/quiz.store';
	import ResultsOfferPage from '$lib/components/post-quiz/ResultsOfferPage.svelte';

	const RESULTS_VIDEO_HASH = '#video-protocolo';
	const BLOCO_PRECO_ID = 'bloco-preco';

	function scrollToResultsBlock(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	/** Aguarda o bloco de preço sair de `display:none` (reveal pós-vídeo / bónus). */
	async function scrollToBlocoPrecoWhenReady() {
		await tick();
		await tick();
		for (let attempt = 0; attempt < 24; attempt++) {
			const el = document.getElementById(BLOCO_PRECO_ID);
			if (el && getComputedStyle(el).display !== 'none') {
				scrollToResultsBlock(BLOCO_PRECO_ID);
				return;
			}
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		}
	}

	$effect(() => {
		if (!browser) return;
		const state = $quizStore;
		if (state.completedAt == null) {
			goto('/plan', { replaceState: true });
		}
	});

	afterNavigate(({ to }) => {
		if (!browser || !to?.url.pathname.startsWith('/results')) return;

		if (to.url.searchParams.get('offer') === 'OF002') {
			void scrollToBlocoPrecoWhenReady();
			return;
		}

		if (to.url.hash !== RESULTS_VIDEO_HASH) return;
		void tick().then(() => scrollToResultsBlock('video-protocolo'));
	});
</script>

<ResultsOfferPage />
