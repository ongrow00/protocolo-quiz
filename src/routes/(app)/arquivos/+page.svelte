<script lang="ts">
	import { onMount } from 'svelte';
	import ArquivosCards from '$lib/components/challenge/ArquivosCards.svelte';
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';

	let ready = $state(false);

	onMount(() => {
		requestAnimationFrame(() => {
			ready = true;
		});
	});
</script>

<ChallengePageShell>
	<div class="mx-auto flex w-full max-w-sm flex-col gap-5">
		{#if !ready}
			<div class="flex flex-col gap-3 animate-pulse">
				<div class="h-[147px] rounded-challenge bg-surface"></div>
				<div class="h-[147px] rounded-challenge bg-surface"></div>
			</div>
		{:else}
			<ArquivosCards />
		{/if}
	</div>
</ChallengePageShell>
