<script lang="ts">
	const TITLES: Record<string, string> = {
		'termos-de-uso': 'Termos de Uso',
		'politica-de-privacidade': 'Política de Privacidade',
		'politica-de-assinatura': 'Política de Assinatura',
		'garantia-de-reembolso': 'Garantia de Reembolso'
	};

	let { data } = $props();
	const title = $derived(TITLES[data.doc] ?? 'Documento');
</script>

<svelte:head>
	<title>Protocolo Desbloqueio</title>
</svelte:head>

<main class="max-w-lg mx-auto w-full px-4 py-10">
	<h1 class="text-xl font-bold text-heading">{title}</h1>
	<p class="text-sm text-muted leading-relaxed mt-4">
		O texto completo deste documento está em atualização. Em caso de dúvidas, utilize o canal oficial
		de suporte do Protocolo Desbloqueio.
	</p>
	<p class="mt-8">
		<a href="/" class="text-sm text-accent underline underline-offset-2">Voltar ao início</a>
	</p>
</main>
