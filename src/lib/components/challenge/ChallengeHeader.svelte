<script lang="ts">
	interface Props {
		title?: string;
		subtitle: string;
		class?: string;
	}

	let { title = 'Desafio 14 Dias', subtitle, class: className = '' }: Props = $props();
</script>

<header class="flex flex-col gap-1 {className}">
	<h1 class="text-2xl font-extrabold text-heading leading-tight">{title}</h1>
	<p class="text-sm text-muted">{subtitle}</p>
</header>
