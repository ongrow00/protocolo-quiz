<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<img
	src="/pd-logo-color.svg"
	alt="Protocolo Desbloqueio"
	class={className}
	width="120"
	height="28"
	decoding="async"
/>
