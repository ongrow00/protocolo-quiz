<script lang="ts">
	interface Props {
		percent: number;
		steps?: number;
		class?: string;
	}

	let { percent, steps = 4, class: className = '' }: Props = $props();

	const clamped = $derived(Math.min(100, Math.max(0, percent)));

	// Checkpoints em 1/steps … 1 (4 marcos: mr-1, mr-2, mr-4, fim do quiz — alinhado a progressPercent)
	// Fill reaches them progressively — no snapping
	const positions = $derived(
		Array.from({ length: steps }, (_, i) => ((i + 1) / steps) * 100)
	);

	// A checkpoint "lights up" when the continuous fill reaches its position
	const reached = $derived((pos: number) => clamped >= pos);
</script>

<div
	class="relative w-full flex items-center {className}"
	style="height: 28px;"
	role="progressbar"
	aria-valuenow={Math.round(clamped)}
	aria-valuemin={0}
	aria-valuemax={100}
>
	<!-- Track (2px) -->
	<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-line rounded-full"></div>

	<!-- Fill (accent, 2px, continuous) -->
	<div
		class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-accent rounded-full transition-[width] duration-300 ease-out"
		style="width: {clamped}%"
	></div>

	<!-- Checkpoint ícones (check) -->
	{#each positions as pos, i (i)}
		{@const isLast = i === positions.length - 1}
		<div
			class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center border-2 border-bg transition-colors duration-300
				{isLast && !reached(pos)
				? 'step-icon-shimmer bg-accent ring-1 ring-white/30'
				: reached(pos)
					? 'bg-accent ring-1 ring-white/30'
					: 'bg-line ring-0'}"
			style="left: {pos}%"
		>
			<svg
				class="w-2.5 h-2.5 transition-colors duration-300 shrink-0 {reached(pos) || (isLast && !reached(pos))
					? 'text-white'
					: 'text-muted'}"
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path
					fill-rule="evenodd"
					d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.003L3.29 9.257a1 1 0 1 1 1.415-1.414l4.04 4.04 6.543-6.594a1 1 0 0 1 1.416 0Z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	{/each}
</div>

<style>
	.step-icon-shimmer {
		animation: step-shimmer 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}
	@keyframes step-shimmer {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.2), 0 0 10px 2px rgba(0, 0, 0, 0.08);
			opacity: 1;
		}
		50% {
			box-shadow: 0 0 0 6px rgba(0, 0, 0, 0), 0 0 18px 4px rgba(0, 0, 0, 0.06);
			opacity: 0.95;
		}
	}
</style>
