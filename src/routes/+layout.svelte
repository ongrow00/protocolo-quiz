<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import '../app.css';
	import { sessionStore } from '$lib/stores/session.store';
	import { PUBLIC_GA4_ID } from '$env/static/public';
	import { PUBLIC_META_PIXEL_ID } from '$env/static/public';
	import { trackMetaViewContent } from '$lib/services/analytics.service';

	let { children } = $props();

	/** UTMs first-touch; `offer` atualiza em cada rota com query na URL. */
	$effect(() => {
		if (!browser) return;
		sessionStore.hydrateFromUrl(page.url.searchParams);
	});

	$effect(() => {
		if (!browser) return;
		// "Start" do app: 1x por sessão
		trackMetaViewContent();
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

	{#if PUBLIC_META_PIXEL_ID}
		<!-- Meta Pixel Code -->
		<script>
			!function(f,b,e,v,n,t,s)
			{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
			n.callMethod.apply(n,arguments):n.queue.push(arguments)};
			if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
			n.queue=[];t=b.createElement(e);t.async=!0;
			t.src=v;s=b.getElementsByTagName(e)[0];
			s.parentNode.insertBefore(t,s)}(window, document,'script',
			'https://connect.facebook.net/en_US/fbevents.js');
			fbq('init', '{PUBLIC_META_PIXEL_ID}');
			fbq('track', 'PageView');
		</script>
		<noscript><img height="1" width="1" style="display:none"
			src="https://www.facebook.com/tr?id={PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1"
		/></noscript>
		<!-- End Meta Pixel Code -->
	{/if}
</svelte:head>

<div class="app-inner-scroll flex h-dvh min-h-dvh flex-col overflow-hidden bg-bg">
	<div class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</div>
</div>
