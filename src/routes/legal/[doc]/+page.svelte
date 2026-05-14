<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.title} — Protocolo Desbloqueio</title>
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

<style>
	.legal-body :global(h2) {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--color-heading);
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}

	.legal-body :global(h3) {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-heading);
		margin-top: 1.25rem;
		margin-bottom: 0.375rem;
	}

	.legal-body :global(p) {
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--color-body);
		margin-top: 0.5rem;
	}

	.legal-body :global(ul),
	.legal-body :global(ol) {
		margin-top: 0.5rem;
		margin-left: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.legal-body :global(ul) {
		list-style-type: disc;
	}

	.legal-body :global(ol) {
		list-style-type: decimal;
	}

	.legal-body :global(li) {
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-body);
	}

	.legal-body :global(strong) {
		font-weight: 600;
		color: var(--color-heading);
	}

	.legal-body :global(a) {
		color: var(--color-accent);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.legal-body :global(h2:first-child) {
		margin-top: 0;
	}
</style>
