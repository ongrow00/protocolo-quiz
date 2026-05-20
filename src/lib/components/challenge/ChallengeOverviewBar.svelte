<script lang="ts">
	interface Props {
		percent: number;
		label?: string;
		class?: string;
	}

	let { percent, label = 'Progresso do protocolo', class: className = '' }: Props = $props();

	const clamped = $derived(Math.min(100, Math.max(0, percent)));
</script>

<div class={className}>
	<div class="mb-2 flex items-center justify-between text-xs">
		<span class="font-medium text-muted">{label}</span>
		<span class="font-bold text-accent">{clamped}%</span>
	</div>
	<div
		class="h-2 w-full overflow-hidden rounded-full bg-challenge-progress-track"
		role="progressbar"
		aria-valuenow={clamped}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label={label}
	>
		<div
			class="h-full rounded-full bg-accent transition-all duration-500 ease-out"
			style="width: {clamped}%"
		></div>
	</div>
</div>
