<script lang="ts">
	const links = [
		{ href: '/legal/termos-de-uso', label: 'Termos de Uso' },
		{ href: '/legal/politica-de-privacidade', label: 'Política de Privacidade' },
		{ href: '/legal/politica-de-assinatura', label: 'Política de Assinatura' },
		{ href: '/legal/garantia-de-reembolso', label: 'Garantia de Reembolso' }
	] as const;
</script>

<footer
	class="text-center text-xs text-[#C1C1C1] leading-relaxed space-y-4 max-w-md mx-auto"
	aria-label="Informações legais"
>
	<p>© 2026 Protocolo Desbloqueio. Todos os direitos reservados.</p>
	<p>CNPJ: 38.312.105/0001-59</p>
	<p class="text-[11px] leading-snug">
		Este site não é afiliado ao Facebook™, Google™ ou qualquer plataforma de mídia. Após sair dessas
		plataformas, a responsabilidade é exclusivamente deste site.
	</p>
	<p class="text-[11px] leading-snug">
		Os resultados podem variar de pessoa para pessoa. As informações disponibilizadas possuem caráter
		educativo e não substituem orientação médica ou profissional.
	</p>
	<p class="text-[11px] leading-snug">
		Ao utilizar este site você concorda com nossos
		<a href="/legal/termos-de-uso" class="text-accent underline underline-offset-2">Termos de Uso</a>
		e
		<a href="/legal/politica-de-privacidade" class="text-accent underline underline-offset-2"
			>Política de Privacidade</a>.
	</p>
	<nav
		class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] pt-1"
		aria-label="Documentos legais"
	>
		{#each links as item, i (item.href)}
			{#if i > 0}
				<span class="text-[#C1C1C1]/50 select-none" aria-hidden="true">|</span>
			{/if}
			<a href={item.href} class="text-accent underline underline-offset-2">{item.label}</a>
		{/each}
	</nav>
</footer>
