<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		isLast?: boolean;
		showChevron?: boolean;
		value?: Snippet;
		input?: Snippet;
	}

	let { label, isLast = false, showChevron = false, value, input }: Props = $props();
</script>

<div
	class="flex min-h-[44px] items-center gap-3 px-4 py-2 {!isLast ? 'border-b border-line/40' : ''}"
>
	<span class="w-[108px] shrink-0 text-[14px] text-muted">{label}</span>
	<div class="flex min-w-0 flex-1 items-center justify-end gap-1.5">
		{#if input}
			{@render input()}
		{:else if value}
			{@render value()}
		{/if}
		{#if showChevron}
			<svg
				class="h-4 w-4 shrink-0 text-muted/40"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="m9 18 6-6-6-6" />
			</svg>
		{/if}
	</div>
</div>
