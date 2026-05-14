<script lang="ts">
	/**
	 * Pilha de avatares sobrepostos: opcionalmente um círculo com iniciais primeiro, depois as fotos em ordem aleatória.
	 */
	const AVATAR_SOURCES = [
		{ src: '/avatars/protocolo-social-1.png', alt: 'Pessoa que iniciou o protocolo' },
		{ src: '/avatars/protocolo-social-2.png', alt: 'Pessoa que iniciou o protocolo' },
		{ src: '/avatars/protocolo-social-3.png', alt: 'Pessoa que iniciou o protocolo' },
		{ src: '/avatars/protocolo-social-4.png', alt: 'Pessoa que iniciou o protocolo' },
		{ src: '/avatars/protocolo-social-5.png', alt: 'Pessoa que iniciou o protocolo' }
	] as const;

	/** Shuffle determinístico (mesma ordem no servidor e no cliente) para evitar hydration mismatch. */
	function shuffleArrayDeterministic<T>(arr: T[], seed = 0x4d794c6f): T[] {
		const out = [...arr];
		let s = seed;
		const next = () => {
			s = (s * 1664525 + 1013904223) >>> 0;
			return s / 0xffff_ffff;
		};
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(next() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	}

	interface Props {
		/** Iniciais exibidas no primeiro círculo (ex: "V" para Você, "MS" para Maria Silva). Sem valor = não mostra círculo de iniciais. */
		initials?: string;
		/** Tamanho dos círculos (padrão w-8 h-8) */
		size?: 'sm' | 'md';
		/** default = tamanho/espaçamento original; large = +20% (usado na página de resultados) */
		variant?: 'default' | 'large';
	}

	let { initials = undefined, size = 'md', variant = 'large' }: Props = $props();

	// Ordem das fotos fixa (shuffle determinístico) para SSR e cliente baterem na hidratação
	const shuffledAvatars = $derived(shuffleArrayDeterministic([...AVATAR_SOURCES]));

	const sizeClass = $derived.by(() => {
		if (variant === 'default') {
			return size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
		}
		// large: +20% sm 24→28.8px, md 32→38.4px
		return size === 'sm' ? 'w-[28.8px] h-[28.8px] text-[12px]' : 'w-[38.4px] h-[38.4px] text-sm';
	});
	const overlap = $derived.by(() => {
		if (variant === 'default') {
			return size === 'sm' ? '-10px' : '-14px';
		}
		return size === 'sm' ? '-6px' : '-10px';
	});
	const total = $derived(shuffledAvatars.length + (initials ? 1 : 0));
</script>

<div class="flex items-center shrink-0">
	{#if initials}
		<div
			class="rounded-full border border-line overflow-hidden flex-shrink-0 bg-accent/90 flex items-center justify-center font-bold text-bg {sizeClass}"
			style="margin-left: 0; z-index: {total};"
			aria-hidden="true"
		>
			{initials.slice(0, 2).toUpperCase()}
		</div>
	{/if}
	{#each shuffledAvatars as avatar, i (avatar.src)}
		<div
			class="rounded-full border border-line overflow-hidden flex-shrink-0 bg-surface {sizeClass}"
			style="margin-left: {i === 0 && !initials ? '0' : overlap}; z-index: {total - 1 - i}"
		>
			<img src={avatar.src} alt={avatar.alt} class="w-full h-full object-cover" />
		</div>
	{/each}
</div>
