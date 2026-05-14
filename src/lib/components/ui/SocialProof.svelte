<script lang="ts">
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	import { PROTOCOL_SOCIAL_COUNT_DISPLAY } from '$lib/data/social-proof';

	interface Props {
		bordered?: boolean;
	}

	let { bordered = true }: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center text-center max-w-sm mx-auto {bordered
		? 'rounded-2xl border border-line px-4 py-4'
		: ''}"
	style="gap: 3px"
>
	<AvatarStack variant="default" />

	<p class="text-sm text-muted font-normal leading-snug px-1">
		<span class="tabular-nums font-bold">{PROTOCOL_SOCIAL_COUNT_DISPLAY}</span>
		{' '}pessoas já iniciaram o protocolo.
	</p>
</div>
