<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import animationData from '$lib/assets/swipe-right.json';
	
	let el: HTMLDivElement | null = $state(null);
	let anim: { destroy: () => void } | null = null;

	function forceBlackColors(node: unknown) {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const item of node) forceBlackColors(item);
			return;
		}
		const obj = node as Record<string, unknown>;
		// Lottie colors are typically stored under shape items: { c: { k: [r,g,b,a] } } (0–1)
		const c = obj['c'];
		if (c && typeof c === 'object' && !Array.isArray(c)) {
			const ck = (c as Record<string, unknown>)['k'];
			if (Array.isArray(ck) && ck.length === 4 && ck.every((v) => typeof v === 'number')) {
				(c as Record<string, unknown>)['k'] = [0, 0, 0, 1];
			}
		}
		for (const key of Object.keys(obj)) forceBlackColors(obj[key]);
	}
	
	onMount(() => {
		if (!el) return;
		// Clone so we don't mutate the imported JSON module.
		// (structuredClone isn't supported everywhere we run.)
		const data = JSON.parse(JSON.stringify(animationData)) as unknown;
		forceBlackColors(data);
		(async () => {
			const mod = await import('lottie-web');
			const lottie = mod.default ?? mod;
			anim = lottie.loadAnimation({
				container: el,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				animationData: data as object
			});
		})().catch(() => {});
	});
	
	onDestroy(() => {
		anim?.destroy();
		anim = null;
	});
</script>
	
<div class="w-[40px] h-[40px]" bind:this={el} aria-hidden="true"></div>

