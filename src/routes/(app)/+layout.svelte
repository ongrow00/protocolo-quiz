<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import ChallengeBottomNav from '$lib/components/challenge/ChallengeBottomNav.svelte';
	import ChallengeGreetingHeader from '$lib/components/challenge/ChallengeGreetingHeader.svelte';
	import { challengeStore } from '$lib/stores/challenge.store';

	let { children } = $props();

	onMount(() => {
		challengeStore.hydrate();
		challengeStore.ensureStarted();
	});
</script>

<div class="flex min-h-0 flex-1 flex-col bg-challenge-hero">
	<main class="relative min-h-0 flex-1 overflow-hidden overscroll-contain">
		<div
			class="scrollbar-hidden h-full min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))]"
		>
			<div
				class="sticky top-0 z-10 -mx-4 mb-2 flex h-[75px] items-center bg-[#ececec]/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-[#ececec]/70"
			>
				<div class="mx-auto flex w-full max-w-sm items-center">
					<ChallengeGreetingHeader />
				</div>
			</div>

			{#key $page.url.pathname}
				<div in:fade={{ duration: 140, delay: 60 }}>
					{@render children()}
				</div>
			{/key}
		</div>
	</main>

	<ChallengeBottomNav />
</div>
