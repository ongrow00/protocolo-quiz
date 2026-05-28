<script lang="ts">
	import { getTreinoExerciseImageUrl } from '$lib/data/treino-exercise-images';

	interface Props {
		name: string;
		imageUrl?: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let { name, imageUrl, size = 'md' }: Props = $props();

	const resolvedUrl = $derived(imageUrl ?? getTreinoExerciseImageUrl(name));

	const sizeClass = $derived(
		size === 'sm'
			? 'h-14 w-14'
			: size === 'lg'
				? 'aspect-square w-full max-h-[min(52vw,280px)] mx-auto'
				: 'h-24 w-24'
	);
</script>

<div
	class="flex shrink-0 items-center justify-center overflow-hidden rounded-challenge bg-white {sizeClass}"
	role="img"
	aria-label="Demonstração de {name}"
>
	{#if resolvedUrl}
		<img
			src={resolvedUrl}
			alt={name}
			class="h-full w-full object-contain"
			loading="lazy"
			decoding="async"
		/>
	{:else}
		<svg
			class="{size === 'lg' ? 'h-12 w-12' : 'h-8 w-8'} text-accent/25"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<polyline points="21 15 16 10 5 21" />
		</svg>
	{/if}
</div>
