<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import loadingAnimation from './loading-animation.json';

	const LOADING_MS = 5000;

	interface Props {
		onComplete: () => void;
	}

	let { onComplete }: Props = $props();

	let lottieEl = $state<HTMLDivElement | undefined>();
	let anim: { destroy: () => void } | null = null;

	onMount(() => {
		if (!browser) return;

		const data = JSON.parse(JSON.stringify(loadingAnimation)) as object;
		void (async () => {
			if (!lottieEl) return;
			const mod = await import('lottie-web');
			const lottie = mod.default ?? mod;
			anim = lottie.loadAnimation({
				container: lottieEl,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				animationData: data
			});
		})().catch(() => {});

		const timer = window.setTimeout(() => {
			onComplete();
		}, LOADING_MS);

		return () => window.clearTimeout(timer);
	});

	onDestroy(() => {
		anim?.destroy();
		anim = null;
	});
</script>

<div
	class="fixed inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-bg px-4"
	role="status"
	aria-live="polite"
	aria-busy="true"
	aria-label="Carregando os seus dados"
>
	<div class="size-56 shrink-0 sm:size-64" bind:this={lottieEl} aria-hidden="true"></div>
	<p class="text-base font-medium text-heading text-center">Carregando os seus dados...</p>
</div>
