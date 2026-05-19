<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import animationData from '$lib/assets/hand-tap.json';

	interface Props {
		/** Largura e altura do ícone (px). */
		size?: number;
		class?: string;
	}

	let { size = 24, class: className = '' }: Props = $props();

	let el: HTMLDivElement | undefined = $state();
	let anim: { destroy: () => void } | null = null;

	function forceBlackColors(node: unknown) {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const item of node) forceBlackColors(item);
			return;
		}
		const obj = node as Record<string, unknown>;
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
		const data = JSON.parse(JSON.stringify(animationData)) as unknown;
		forceBlackColors(data);
		void (async () => {
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

<div
	class="shrink-0 {className}"
	style="width: {size}px; height: {size}px;"
	bind:this={el}
	role="img"
	aria-label="Toque para selecionar"
></div>
