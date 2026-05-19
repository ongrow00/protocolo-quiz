<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { sessionStore } from '$lib/stores/session.store';

	let { children } = $props();

	onMount(() => {
		sessionStore.hydrateFromUrl(new URLSearchParams(window.location.search));
	});
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
	<meta name="description" content="Protocolo Desbloqueio — seu plano personalizado." />
</svelte:head>

<div class="flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg">
	<div class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</div>
</div>
