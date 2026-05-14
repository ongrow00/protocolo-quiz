<script lang="ts">
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';

	let { compactTop = false }: { compactTop?: boolean } = $props();

	/** Exibição visual das estrelas (0–1 por estrela). */
	const RATING = 4.87;
	const starFills = [0, 1, 2, 3, 4].map((i) => Math.min(1, Math.max(0, RATING - i)));

	const slides = [
		'/testimonials-mr1/slide-01.png',
		'/testimonials-mr1/slide-02.png',
		'/testimonials-mr1/slide-03.png',
		'/testimonials-mr1/slide-04.png',
		'/testimonials-mr1/slide-05.png',
		'/testimonials-mr1/slide-06.png',
		'/testimonials-mr1/slide-07.png',
		'/testimonials-mr1/slide-08.png'
	] as const;

	/** Duplicado para loop contínuo sem salto (translate -50%). */
	const loopSlides = [...slides, ...slides] as const;
</script>

<div class="{compactTop ? 'mt-0' : 'mt-6'} w-full min-w-0 max-w-full">
	<div role="region" aria-label="Fotos de resultados em sequência">
		<p class="sr-only">
			Faixa animada com fotos de antes e depois; o movimento é apenas visual.
		</p>
		<div class="marquee-mask overflow-hidden rounded-2xl bg-surface-2/20">
			<div class="marquee-track flex w-max gap-3 py-1">
				{#each loopSlides as src, i (`${i}-${src}`)}
					{@const idx = i % slides.length}
					<figure
						class="marquee-item shrink-0 overflow-hidden rounded-xl border border-line/80 bg-surface shadow-sm"
					>
						<img
							src={src}
							alt={i < slides.length
								? `Comparativo antes e depois, imagem ${idx + 1} de ${slides.length}`
								: ''}
							class="block h-[260px] w-[clamp(200px,72vw,260px)] object-cover sm:h-[286px] sm:w-[260px]"
							loading={i < 4 ? 'eager' : 'lazy'}
							decoding="async"
							draggable="false"
						/>
					</figure>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-4 mb-[50px] flex w-full flex-col items-center px-1">
		<p class="sr-only">
			Fotos de pessoas que iniciaram o protocolo. Nota média 4,87 de 5 estrelas. Mais de 85 mil já
			iniciaram o protocolo.
		</p>
		<div
			class="flex max-w-md flex-wrap items-center justify-center gap-x-3 gap-y-2 text-left sm:gap-x-4"
			aria-hidden="true"
		>
			<div class="shrink-0">
				<AvatarStack variant="default" />
			</div>
			<div class="flex min-w-0 flex-col items-start gap-0 text-left">
				<div class="flex flex-wrap items-center justify-start gap-x-1.5 gap-y-0.5">
					<div class="flex items-center gap-0.5">
						{#each starFills as fill, i (i)}
							<div class="relative h-5 w-5 shrink-0">
								<svg
									class="absolute inset-0 text-line/90"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.25"
									stroke-linejoin="round"
								>
									<path
										d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
									/>
								</svg>
								{#if fill > 0}
									<div
										class="absolute inset-0 overflow-hidden text-amber-500"
										style="width: {fill * 100}%"
									>
										<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
											<path
												d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
											/>
										</svg>
									</div>
								{/if}
							</div>
						{/each}
					</div>
					<span class="text-sm font-semibold tabular-nums text-heading">4,87</span>
				</div>
				<p class="w-full text-left text-sm leading-snug text-muted">
					<strong class="font-bold text-body">+85Mil</strong> já iniciaram o protocolo.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.marquee-mask {
		-webkit-mask-image: linear-gradient(
			90deg,
			transparent 0%,
			black 4%,
			black 96%,
			transparent 100%
		);
		mask-image: linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%);
	}

	.marquee-track {
		animation: mr1-marquee 55s linear infinite;
		will-change: transform;
	}

	.marquee-mask:hover .marquee-track {
		animation-play-state: paused;
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee-mask {
			-webkit-mask-image: none;
			mask-image: none;
			overflow-x: auto;
			scrollbar-width: thin;
		}
		.marquee-track {
			animation: none;
		}
	}

	@keyframes mr1-marquee {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
</style>
