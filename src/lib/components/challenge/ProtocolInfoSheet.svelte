<script lang="ts">
	import { onMount } from 'svelte';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const VIMEO_EMBED_SRC =
		'https://player.vimeo.com/video/1200553431?badge=0&autopause=0&player_id=0&app_id=58479';

	onMount(() => {
		if (document.querySelector('script[data-vimeo-player]')) return;

		const script = document.createElement('script');
		script.src = 'https://player.vimeo.com/api/player.js';
		script.async = true;
		script.dataset.vimeoPlayer = 'true';
		document.body.appendChild(script);
	});
</script>

<BottomSheet
	{open}
	{onClose}
	heightPercent={90}
	scrollable={false}
	contentFlush
	flushBottom
	title="Como funciona o Protocolo de Desbloqueio"
>
	<div class="flex min-h-0 flex-1 flex-col pb-[calc(50px+env(safe-area-inset-bottom))]">
		<div class="relative min-h-0 w-full flex-1">
			<iframe
				src={VIMEO_EMBED_SRC}
				class="absolute inset-0 h-full w-full border-0"
				allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
				referrerpolicy="strict-origin-when-cross-origin"
				title="Tutorial - Protocolo Desbloqueio"
			></iframe>
		</div>
	</div>
</BottomSheet>
