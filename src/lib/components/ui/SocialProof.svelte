<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';

	interface Props {
		bordered?: boolean;
	}

	let { bordered = true }: Props = $props();

	const START = 2500;
	const TARGET = 3000;
	// +2 a cada ~3s com variação aleatória de ±0.5s
	const DELAY_MIN = 2500;
	const DELAY_MAX = 3500;

	let count = $state(START);
	let timeout: ReturnType<typeof setTimeout>;

	function tick() {
		if (count >= TARGET) return;
		count = Math.min(TARGET, count + 2);
		timeout = setTimeout(tick, DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
	}

	onMount(() => {
		timeout = setTimeout(tick, DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN));
	});

	onDestroy(() => clearTimeout(timeout));
</script>

<div
	class="inline-flex items-center gap-3 px-4 py-3 rounded-full bg-transparent {bordered ? 'border border-white/15' : 'border-0'}"
>
	<!-- Apenas avatares sobrepostos, ordem randomizada a cada carregamento -->
	<AvatarStack variant="default" />

	<!-- Texto alinhado à esquerda -->
	<p class="text-xs text-body leading-snug text-left">
		Mais de <strong class="text-heading font-bold">{count.toLocaleString('pt-BR')} pessoas</strong><br />já iniciaram seu protocolo.
	</p>
</div>
