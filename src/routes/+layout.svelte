<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import '../app.css';
	import { sessionStore } from '$lib/stores/session.store';
	import { PUBLIC_GA4_ID } from '$env/static/public';

	let { children } = $props();

	/** UTMs first-touch; `offer` atualiza em cada rota com query na URL. */
	$effect(() => {
		if (!browser) return;
		sessionStore.hydrateFromUrl(page.url.searchParams);
	});
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
	<link rel="icon" href="/favicon.png" type="image/png" />
	<link rel="apple-touch-icon" href="/favicon.png" />
	<meta name="description" content="Protocolo Desbloqueio — seu plano personalizado." />

	{#if PUBLIC_GA4_ID}
		<!-- Google tag (gtag.js) -->
		<script async src="https://www.googletagmanager.com/gtag/js?id={PUBLIC_GA4_ID}"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', '{PUBLIC_GA4_ID}', { send_page_view: false });
		</script>
	{/if}
</svelte:head>

<div class="app-inner-scroll flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg">
	<div class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</div>
</div>
