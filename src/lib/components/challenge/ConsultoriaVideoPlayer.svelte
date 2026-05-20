<script lang="ts">
	import VturbPlayer from '$lib/components/ui/VturbPlayer.svelte';

	const playerId = import.meta.env.PUBLIC_CONSULTORIA_VTURB_PLAYER_ID ?? '';
	const scriptSrc = import.meta.env.PUBLIC_CONSULTORIA_VTURB_SCRIPT_SRC ?? '';
	const hasVturb = $derived(Boolean(playerId && scriptSrc));
</script>

<div
	class="relative w-full overflow-hidden rounded-challenge bg-[#1c1c1c] shadow-[0_8px_28px_rgba(0,0,0,0.14)] aspect-video"
>
	{#if hasVturb}
		<div class="absolute inset-0 flex items-center justify-center">
			<VturbPlayer {playerId} {scriptSrc} />
		</div>
	{:else}
		<div
			class="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] to-[#141414]"
			aria-hidden="true"
		></div>
		<button
			type="button"
			class="absolute inset-0 flex items-center justify-center transition-opacity hover:opacity-95 active:scale-[0.99]"
			aria-label="Reproduzir vídeo"
		>
			<span
				class="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-accent shadow-lg"
			>
				<svg
					class="ml-1 h-7 w-7"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path d="M8 5v14l11-7z" />
				</svg>
			</span>
		</button>
	{/if}
</div>
