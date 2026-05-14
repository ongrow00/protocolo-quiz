<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { TransitionConfig } from 'svelte/transition';

	interface Props {
		key: string;
		children?: import('svelte').Snippet;
	}

	let { key, children }: Props = $props();

	let prevKeyChange = 0;
	let currentKeyChange = 0;

	$effect.pre(() => {
		key;
		prevKeyChange = currentKeyChange;
		currentKeyChange = Date.now();
	});

	function isRapidNav(): boolean {
		return prevKeyChange > 0 && currentKeyChange - prevKeyChange < 400;
	}

	function outFlyNoBlock(node: HTMLElement): TransitionConfig {
		node.style.pointerEvents = 'none';
		if (isRapidNav()) return { duration: 0 };
		return fly(node, { x: -30, duration: 200 });
	}

	function inFlyMaybe(node: HTMLElement): TransitionConfig {
		if (isRapidNav()) return { duration: 0 };
		return fly(node, { x: 30, duration: 250, delay: 50 });
	}
</script>

<div class="transition-container">
	{#key key}
		<div in:inFlyMaybe out:outFlyNoBlock>
			{@render children?.()}
		</div>
	{/key}
</div>

<style>
	.transition-container {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		min-height: 0;
		width: 100%;
		min-width: 0;
	}
	.transition-container > * {
		grid-row: 1;
		grid-column: 1;
		min-width: 0;
		max-width: 100%;
		/* visible: rótulos do gráfico (SVG overflow) não são cortados à esquerda/direita */
		overflow-x: visible;
	}
</style>
