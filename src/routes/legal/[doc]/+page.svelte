<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="max-w-lg mx-auto w-full px-4 py-10 pb-20">
	<!-- Header -->
	<div class="mb-8">
		<a href="/" class="inline-flex items-center gap-1.5 text-xs text-muted hover:text-body transition-colors mb-6">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
			</svg>
			Voltar
		</a>
		<h1 class="text-2xl font-bold text-heading">{data.title}</h1>
		<p class="text-xs text-muted mt-1">Última atualização: {data.updatedAt}</p>
	</div>

	<!-- Content -->
	<div class="legal-body">
		{@html data.html}
	</div>
</main>
