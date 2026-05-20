<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();
</script>

<section>
	<p class="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
	<div class="overflow-hidden rounded-2xl bg-surface">
		{@render children()}
	</div>
</section>
