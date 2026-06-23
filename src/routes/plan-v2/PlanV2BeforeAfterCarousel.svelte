<script lang="ts">
	/**
	 * Carrossel antes/depois — exclusivo da rota `/plan-v2`.
	 * Não reutilizar em outras rotas; alterações aqui não afetam o funil principal.
	 */

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

	const loopSlides = [...slides, ...slides] as const;

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

<div class="flex w-full min-w-0 max-w-full flex-col gap-2">
	<p class="text-center text-sm font-normal uppercase text-[#6E7C72]">Transformações reais</p>
	<p class="sr-only">
		Faixa de fotos em movimento contínuo; ao clicar ou tocar e arrastar na horizontal, o deslize automático
		pausa e retoma depois de soltar ou quando o scroll parar.
	</p>
	<div
		role="region"
		aria-label="Fotos de resultados em sequência"
		bind:this={maskEl}
		class="plan-v2-marquee-mask plan-v2-marquee-scroll rounded-2xl bg-surface-2/20 select-none
			{isDragging && dragAxis === 'x' ? 'cursor-grabbing' : 'cursor-grab'}"
		onscroll={normalizeScrollLoop}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={(e) => endDrag(e)}
		onpointercancel={(e) => endDrag(e)}
		onpointerleave={(e) => endDrag(e)}
		onscrollend={onScrollEndResume}
	>
		<div class="plan-v2-marquee-track flex w-max gap-2 py-1">
			{#each loopSlides as src, i (`${i}-${src}`)}
				{@const idx = i % slides.length}
				<figure
					class="plan-v2-slide shrink-0 overflow-hidden rounded-xl border border-line/80 bg-surface shadow-sm"
				>
					<img
						src={src}
						alt={i < slides.length
							? `Comparativo antes e depois, imagem ${idx + 1} de ${slides.length}`
							: ''}
						class="block h-full w-full object-cover"
						loading={i < 4 ? 'eager' : 'lazy'}
						decoding="async"
						draggable="false"
					/>
				</figure>
			{/each}
		</div>
	</div>
</div>

<style>
	.plan-v2-marquee-mask {
		-webkit-mask-image: linear-gradient(
			90deg,
			transparent 0%,
			black 4%,
			black 96%,
			transparent 100%
		);
		mask-image: linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%);
	}

	.plan-v2-marquee-scroll {
		container-type: inline-size;
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior-x: contain;
		touch-action: pan-x;
		scrollbar-width: thin;
	}

	.plan-v2-marquee-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.plan-v2-marquee-scroll::-webkit-scrollbar-thumb {
		border-radius: 9999px;
		background: color-mix(in srgb, var(--color-line) 45%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.plan-v2-marquee-mask {
			-webkit-mask-image: none;
			mask-image: none;
		}
	}

	/* 3 slides visíveis: 2 gaps de 0.5rem (gap-2) */
	.plan-v2-slide {
		width: calc((100cqw - 1rem) / 3);
		aspect-ratio: 10 / 13;
	}
</style>
