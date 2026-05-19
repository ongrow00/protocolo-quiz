<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let fillEl: HTMLDivElement | undefined = $state();

	function getScrollParent(el: HTMLElement): HTMLElement | null {
		const marked = el.closest('[data-scroll-viewport]');
		if (marked instanceof HTMLElement) return marked;

		let node: HTMLElement | null = el.parentElement;
		while (node) {
			const { overflowY } = getComputedStyle(node);
			if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
				return node;
			}
			node = node.parentElement;
		}
		return null;
	}

	$effect(() => {
		if (!browser || !fillEl) return;

		const scrollParent = getScrollParent(fillEl);
		if (!scrollParent) return;

		function applyMinHeight() {
			if (!fillEl) return;
			const h = scrollParent.clientHeight;
			fillEl.style.minHeight = h > 0 ? `${Math.floor(h)}px` : '';
		}

		applyMinHeight();

		const ro = new ResizeObserver(applyMinHeight);
		ro.observe(scrollParent);
		if (fillEl.nextElementSibling instanceof HTMLElement) {
			ro.observe(fillEl.nextElementSibling);
		}
		window.addEventListener('resize', applyMinHeight);
		window.addEventListener('orientationchange', applyMinHeight);
		const vv = window.visualViewport;
		vv?.addEventListener('resize', applyMinHeight);

		return () => {
			ro.disconnect();
			window.removeEventListener('resize', applyMinHeight);
			window.removeEventListener('orientationchange', applyMinHeight);
			vv?.removeEventListener('resize', applyMinHeight);
			if (fillEl) fillEl.style.minHeight = '';
		};
	});
</script>

<div bind:this={fillEl} class="flex flex-col">
	{@render children()}
</div>
