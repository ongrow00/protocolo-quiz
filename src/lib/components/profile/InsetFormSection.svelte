<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<section class="flex flex-col gap-2">
	<p class="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
	<div class="overflow-hidden rounded-2xl bg-surface">
		{@render children()}
	</div>
</section>
