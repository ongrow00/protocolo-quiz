<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		attachVturbPlaybackGate,
		findVideoInHost,
		isVturbPlayerInitialized
	} from '$lib/utils/vturb-playback-gate';

	const SMARTPLAYER_WC_SRC =
		'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js';

	/** Revela conteúdo quando `video.currentTime >= seconds` — sincronizado com o vídeo. */
	export type PlaybackGate = {
		seconds: number;
		onReached: () => void;
	};

	interface Props {
		playerId: string;
		scriptSrc: string;
		/** Gate de reprodução: dispara `onReached` no segundo exato do vídeo. */
		playbackGate?: PlaybackGate;
		/** Clique no player alterna play/pause (VTurb VSL costuma não pausar por padrão). */
		clickToTogglePlayback?: boolean;
	}

	let { playerId, scriptSrc, playbackGate, clickToTogglePlayback = false }: Props = $props();

	let hostEl: HTMLDivElement | undefined = $state();
	let playerEl: HTMLElement | undefined = $state();
	let playerMounted = $state(false);
	let playerReady = $state(false);

	function removePlayerScripts(baseSrc: string): void {
		const base = baseSrc.split('?')[0];
		document.querySelectorAll('script').forEach((node) => {
			if (node instanceof HTMLScriptElement && node.src.startsWith(base)) {
				node.remove();
			}
		});
	}

	function waitForCustomElement(name: string, timeoutMs = 10_000): Promise<void> {
		return new Promise((resolve, reject) => {
			if (customElements.get(name)) {
				resolve();
				return;
			}
			const started = performance.now();
			const tick = () => {
				if (customElements.get(name)) {
					resolve();
					return;
				}
				if (performance.now() - started >= timeoutMs) {
					reject(new Error(`Custom element ${name} not registered`));
					return;
				}
				requestAnimationFrame(tick);
			};
			tick();
		});
	}

	function loadScriptTag(src: string): Promise<void> {
		return new Promise((resolve, reject) => {
			let settled = false;
			const finish = () => {
				if (settled) return;
				settled = true;
				resolve();
			};

			const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
			if (existing) {
				const smartplayerReady =
					src === SMARTPLAYER_WC_SRC &&
					typeof customElements !== 'undefined' &&
					!!customElements.get('vturb-smartplayer');
				if (smartplayerReady) {
					finish();
					return;
				}
				existing.addEventListener('load', finish, { once: true });
				existing.addEventListener('error', () => reject(new Error(`Script failed: ${src}`)), {
					once: true
				});
				queueMicrotask(() => {
					if (settled) return;
					if (src === SMARTPLAYER_WC_SRC && customElements?.get('vturb-smartplayer')) finish();
				});
				setTimeout(finish, 500);
				return;
			}

			const s = document.createElement('script');
			s.async = true;
			s.src = src;
			s.addEventListener('load', finish, { once: true });
			s.addEventListener('error', () => reject(new Error(`Script failed: ${src}`)), { once: true });
			document.head.appendChild(s);
		});
	}

	/** SPA remount: o player.js é one-shot — recria elemento + script com cache-bust. */
	async function bootstrapPlayerScript(): Promise<void> {
		removePlayerScripts(scriptSrc);
		const bustedSrc = `${scriptSrc}${scriptSrc.includes('?') ? '&' : '?'}_=${Date.now()}`;
		await loadScriptTag(bustedSrc);
	}

	function mountPlayerInHost(): void {
		const host = hostEl;
		if (!host) return;
		host.replaceChildren();
		const el = document.createElement('vturb-smartplayer');
		el.id = playerId;
		el.setAttribute('style', 'display:block;margin:0 auto;width:100%;max-width:400px;');
		host.appendChild(el);
		playerEl = el;
		playerMounted = true;
	}

	function markReadyIfVideoPresent(): boolean {
		if (isVturbPlayerInitialized(playerId)) {
			playerReady = true;
			return true;
		}
		return false;
	}

	function ensurePlayerInViewport(el: HTMLElement): void {
		const rect = el.getBoundingClientRect();
		const inView = rect.top < window.innerHeight && rect.bottom > 0;
		if (!inView) el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
	}

	// Gate de reprodução: única fonte de verdade para revelar conteúdo no tempo do vídeo.
	$effect(() => {
		const gate = playbackGate;
		const mounted = playerMounted;
		const gateSeconds = gate?.seconds;
		const onReached = gate?.onReached;
		if (!gate || !mounted || gateSeconds == null || !onReached) return;

		const stopGate = attachVturbPlaybackGate({
			playerId,
			seconds: gateSeconds,
			onReached,
			onAttached: () => {
				playerReady = true;
			}
		});

		return stopGate;
	});

	// Esconde o overlay de loading assim que o player sinaliza pronto.
	$effect(() => {
		const el = playerEl;
		if (!el || !playerMounted) return;

		const onPlayerReady: EventListener = () => {
			playerReady = true;
		};

		el.addEventListener('player:ready', onPlayerReady);
		return () => el.removeEventListener('player:ready', onPlayerReady);
	});

	$effect(() => {
		if (!clickToTogglePlayback || !playerMounted) return;

		const host = document.getElementById(playerId);
		if (!host) return;

		const onClick = (e: MouseEvent) => {
			const video = findVideoInHost(host);
			if (!video) return;
			e.preventDefault();
			e.stopPropagation();
			if (video.paused) {
				void video.play().catch(() => {});
			} else {
				video.pause();
			}
		};

		host.addEventListener('click', onClick, true);
		return () => host.removeEventListener('click', onClick, true);
	});

	onMount(() => {
		let cancelled = false;

		async function waitForPlayerReady(timeoutMs: number): Promise<boolean> {
			const el = playerEl;
			if (!el) return false;

			return new Promise((resolve) => {
				let done = false;
				const finish = (ok: boolean) => {
					if (done || cancelled) return;
					done = true;
					window.clearInterval(pollId);
					window.clearTimeout(timeoutId);
					el.removeEventListener('player:ready', onReady);
					if (ok) playerReady = true;
					resolve(ok);
				};

				const onReady: EventListener = () => finish(true);

				el.addEventListener('player:ready', onReady);

				const pollId = window.setInterval(() => {
					if (markReadyIfVideoPresent()) finish(true);
				}, 150);

				const timeoutId = window.setTimeout(() => {
					finish(markReadyIfVideoPresent());
				}, timeoutMs);
			});
		}

		const overlayFallback = setTimeout(() => {
			if (!cancelled) playerReady = true;
		}, 22_000);

		(async () => {
			try {
				// Pequena pausa pós-transição SPA antes de montar o player.
				await new Promise<void>((r) => setTimeout(r, 320));
				await tick();
				if (cancelled || !hostEl) return;

				if (!customElements?.get('vturb-smartplayer')) {
					await loadScriptTag(SMARTPLAYER_WC_SRC);
					await waitForCustomElement('vturb-smartplayer');
				}
				if (cancelled || !hostEl) return;

				mountPlayerInHost();
				const el = playerEl;
				if (!el) return;

				ensurePlayerInViewport(el);

				await tick();
				await new Promise<void>((r) =>
					requestAnimationFrame(() => requestAnimationFrame(() => r()))
				);
				if (cancelled) return;

				await bootstrapPlayerScript();
				if (cancelled) return;

				// VTurb usa intersection observer — não destruir/recriar; aguardar bind + vídeo.
				await waitForPlayerReady(18_000);
			} catch (err) {
				console.error('[VturbPlayer] init failed:', err);
				if (!cancelled) playerReady = true;
			}
		})();

		return () => {
			cancelled = true;
			clearTimeout(overlayFallback);
			removePlayerScripts(scriptSrc);
			hostEl?.replaceChildren();
			playerEl = undefined;
			playerMounted = false;
			playerReady = false;
		};
	});
</script>

<div class="relative w-full min-h-[12rem] min-w-0 {clickToTogglePlayback ? 'cursor-pointer' : ''}">
	{#if !playerReady}
		<div
			class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-surface-2/80 text-sm text-muted"
			aria-busy="true"
			aria-label="A carregar o vídeo"
		>
			Carregando vídeo…
		</div>
	{/if}
	<div bind:this={hostEl} class="relative z-0 w-full"></div>
</div>
