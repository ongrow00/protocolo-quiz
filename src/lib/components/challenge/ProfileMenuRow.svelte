<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		onclick: () => void;
		destructive?: boolean;
		isLast?: boolean;
		icon: Snippet;
	}

	let { label, onclick, destructive = false, isLast = false, icon }: Props = $props();
</script>

<button
	type="button"
	{onclick}
	class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-surface-2/50 {!isLast
		? 'border-b border-line/40'
		: ''}"
>
	<span
		class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent text-bg"
		aria-hidden="true"
	>
		{@render icon()}
	</span>
	<span
		class="min-w-0 flex-1 text-[14px] font-medium leading-snug {destructive
			? 'text-red-500'
			: 'text-body'}"
	>
		{label}
	</span>
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
</button>
