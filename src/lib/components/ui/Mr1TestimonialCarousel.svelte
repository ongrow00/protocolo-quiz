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

	/** Duplicado para loop sem salto (metade do scroll = mesma vista). */
	const loopSlides = [...slides, ...slides] as const;

	/** Velocidade do auto-scroll (~55s por ciclo com faixa ~3,2k px). */
	const AUTO_PX_PER_SEC = 58;
	const DRAG_THRESHOLD_PX = 5;

	let maskEl = $state<HTMLDivElement | null>(null);
	let edgeJump = false;
	let isDragging = $state(false);
	let didDrag = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let scrollStart = 0;
	let activePointerId: number | null = null;
	let dragAxis = $state<'x' | 'y' | null>(null);
	/** Pausa o avanço automático enquanto o utilizador interage ou há inércia do scroll. */
	let userPaused = false;
	let awaitingInertia = false;
	let resumeTimer: ReturnType<typeof setTimeout> | null = null;
	let rafId = 0;
	let lastFrameTime = 0;
	let reduceMotion = false;

	function clearResumeTimer() {
		if (resumeTimer) {
			clearTimeout(resumeTimer);
			resumeTimer = null;
		}
	}

	function resumeAutoSoon() {
		awaitingInertia = true;
		clearResumeTimer();
		resumeTimer = setTimeout(() => {
			userPaused = false;
			awaitingInertia = false;
			resumeTimer = null;
		}, 1800);
	}

	function onScrollEndResume() {
		if (!awaitingInertia) return;
		clearResumeTimer();
		userPaused = false;
		awaitingInertia = false;
	}

	function halfWidth(): number {
		if (!maskEl || maskEl.scrollWidth === 0) return 0;
		return maskEl.scrollWidth / 2;
	}

	function normalizeScrollLoop() {
		if (!maskEl || edgeJump) return;
		const W = halfWidth();
		if (W <= 0) return;
		const { scrollLeft } = maskEl;
		const tol = 1.5;
		if (scrollLeft >= W - tol) {
			edgeJump = true;
			queueMicrotask(() => {
				if (!maskEl) {
					edgeJump = false;
					return;
				}
				while (maskEl.scrollLeft >= W - tol) {
					maskEl.scrollLeft -= W;
				}
				edgeJump = false;
			});
		} else if (scrollLeft <= tol) {
			edgeJump = true;
			queueMicrotask(() => {
				if (!maskEl) {
					edgeJump = false;
					return;
				}
				while (maskEl.scrollLeft <= tol) {
					maskEl.scrollLeft += W;
				}
				edgeJump = false;
			});
		}
	}

	function onPointerDown(e: PointerEvent) {
		if (!maskEl || e.button !== 0) return;
		e.stopPropagation();
		isDragging = true;
		didDrag = false;
		dragAxis = null;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		scrollStart = maskEl.scrollLeft;
		activePointerId = e.pointerId;
		userPaused = true;
		awaitingInertia = false;
		clearResumeTimer();
	}

	function onPointerMove(e: PointerEvent) {
		e.stopPropagation();
		if (!isDragging || !maskEl) return;

		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;

		if (dragAxis === null) {
			if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
			dragAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
			if (dragAxis === 'y') {
				endDrag(e, { immediate: true });
				return;
			}
		}

		if (dragAxis !== 'x') return;

		if (Math.abs(dx) > DRAG_THRESHOLD_PX) {
			didDrag = true;
			if (activePointerId !== null && !maskEl.hasPointerCapture(activePointerId)) {
				try {
					maskEl.setPointerCapture(activePointerId);
				} catch {
					/* ignore */
				}
			}
		}

		if (didDrag) {
			maskEl.scrollLeft = scrollStart - dx;
			normalizeScrollLoop();
		}
	}

	function endDrag(e: PointerEvent, opts?: { immediate?: boolean }) {
		e.stopPropagation();
		if (!maskEl) return;

		const wasDragging = isDragging;
		isDragging = false;
		dragAxis = null;
		activePointerId = null;

		if (maskEl.hasPointerCapture(e.pointerId)) {
			try {
				maskEl.releasePointerCapture(e.pointerId);
			} catch {
				/* ignore */
			}
		}

		if (!wasDragging) return;

		if (opts?.immediate) {
			userPaused = false;
			awaitingInertia = false;
			clearResumeTimer();
		} else {
			resumeAutoSoon();
		}

		didDrag = false;
	}

	$effect(() => {
		if (!maskEl || typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = mq.matches;
		const mqHandler = () => {
			reduceMotion = mq.matches;
		};
		mq.addEventListener('change', mqHandler);

		lastFrameTime = performance.now();
		function frame(now: number) {
			const el = maskEl;
			if (el && !userPaused && !reduceMotion) {
				const dt = Math.min(0.064, Math.max(0, (now - lastFrameTime) / 1000));
				lastFrameTime = now;
				el.scrollLeft += AUTO_PX_PER_SEC * dt;
				const W = el.scrollWidth / 2;
				if (W > 0 && el.scrollLeft >= W - 2) {
					el.scrollLeft -= W;
				}
			} else {
				lastFrameTime = now;
			}
			rafId = requestAnimationFrame(frame);
		}
		rafId = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(rafId);
			mq.removeEventListener('change', mqHandler);
			clearResumeTimer();
		};
	});
</script>

<div class="{compactTop ? 'mt-0' : 'mt-6'} w-full min-w-0 max-w-full">
	<p class="sr-only">
		Faixa de fotos em movimento contínuo; ao clicar ou tocar e arrastar na horizontal, o deslize automático
		pausa e retoma depois de soltar ou quando o scroll parar.
	</p>
	<div
		role="region"
		aria-label="Fotos de resultados em sequência"
		bind:this={maskEl}
		class="marquee-mask marquee-scroll rounded-2xl bg-surface-2/20 select-none
			{isDragging && dragAxis === 'x' ? 'cursor-grabbing' : 'cursor-grab'}"
		onscroll={normalizeScrollLoop}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={(e) => endDrag(e)}
		onpointercancel={(e) => endDrag(e)}
		onpointerleave={(e) => endDrag(e)}
		onscrollend={onScrollEndResume}
	>
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

	.marquee-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior-x: contain;
		touch-action: pan-x;
		scrollbar-width: thin;
	}

	.marquee-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.marquee-scroll::-webkit-scrollbar-thumb {
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-line) 45%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.marquee-mask {
			-webkit-mask-image: none;
			mask-image: none;
		}
	}
</style>
