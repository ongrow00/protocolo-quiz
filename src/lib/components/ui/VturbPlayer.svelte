<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { attachVturbPlaybackGate } from '$lib/utils/vturb-playback-gate';

	const SMARTPLAYER_WC_SRC =
		'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js';

	export type RevealHiddenAfterPlayback = {
		seconds: number;
		selectors: string[];
		/** Se false, o lead precisa assistir de novo em cada visita (recomendado em páginas dedicadas). */
		persist?: boolean;
	};

	/** Revela via `smartplayer.instances` + `timeupdate` (recomendado em SPA). */
	export type PlaybackGate = {
		seconds: number;
		onReached: () => void;
	};

	interface Props {
		playerId: string;
		scriptSrc: string;
		/** Legado: `displayHiddenElements` + observer (ex.: mr-3). Preferir `playbackGate` em páginas SPA. */
		revealHiddenAfterPlayback?: RevealHiddenAfterPlayback;
		/** Sincroniza com `video.currentTime` após o play — sem cache/localStorage. */
		playbackGate?: PlaybackGate;
		/** Disparado quando o VTurb revela os seletores no DOM (modo legado). */
		onReveal?: () => void;
		/** Disparado quando `displayHiddenElements` foi registrado (modo legado). */
		onDelayRegistered?: () => void;
	}

	let {
		playerId,
		scriptSrc,
		revealHiddenAfterPlayback,
		playbackGate,
		onReveal,
		onDelayRegistered
	}: Props = $props();

	let hostEl: HTMLDivElement | undefined = $state();
	let playerEl: HTMLElement | undefined = $state();
	let playerMounted = $state(false);
	let playerReady = $state(false);

	type SmartPlayerEl = HTMLElement & {
		displayHiddenElements?: (
			seconds: number,
			selectors: string[],
			opts: { persist: boolean }
		) => void;
		addEventListener: (type: string, fn: EventListenerOrEventListenerObject) => void;
		removeEventListener: (type: string, fn: EventListenerOrEventListenerObject) => void;
	};

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
				const alreadyOk =
					src === SMARTPLAYER_WC_SRC &&
					typeof customElements !== 'undefined' &&
					!!customElements.get('vturb-smartplayer');
				if (alreadyOk) {
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

	function isSelectorRevealed(selector: string): boolean {
		const target = document.querySelector(selector);
		if (!target) return false;
		if (target.classList.contains('esconder')) return false;
		const st = getComputedStyle(target);
		if (st.display === 'none' || st.visibility === 'hidden') return false;
		if (st.opacity === '0') return false;
		return true;
	}

	function anySelectorRevealed(selectors: string[]): boolean {
		return selectors.some((sel) => isSelectorRevealed(sel));
	}

	function watchReveal(selectors: string[], callback?: () => void): (() => void) | undefined {
		if (!callback || !selectors.length) return undefined;

		let notified = false;
		const tryNotify = () => {
			if (notified) return;
			if (!anySelectorRevealed(selectors)) return;
			notified = true;
			callback();
		};

		const observers: MutationObserver[] = [];
		for (const sel of selectors) {
			const target = document.querySelector(sel);
			if (!target) continue;
			tryNotify();
			const mo = new MutationObserver(tryNotify);
			mo.observe(target, { attributes: true, attributeFilter: ['style', 'class'] });
			observers.push(mo);
		}

		return () => observers.forEach((mo) => mo.disconnect());
	}

	$effect(() => {
		const gate = playbackGate;
		const mounted = playerMounted;
		if (!gate || !mounted) return;

		const stopGate = attachVturbPlaybackGate({
			playerId,
			seconds: gate.seconds,
			onReached: gate.onReached,
			onAttached: () => {
				playerReady = true;
			}
		});

		return stopGate;
	});

	$effect(() => {
		const el = playerEl;
		const cfg = revealHiddenAfterPlayback;
		if (!el || !playerMounted || !cfg?.selectors?.length || playbackGate) return;

		const p = el as SmartPlayerEl;
		let stopWatch: (() => void) | undefined;
		let revealRegistered = false;
		let bindAttempts = 0;
		const MAX_BIND_ATTEMPTS = 60;

		const notifyReveal = () => {
			onReveal?.();
		};

		const allSelectorsInDom = (): boolean =>
			cfg.selectors.every((sel) => document.querySelector(sel));

		const registerVturbReveal = (): boolean => {
			if (revealRegistered) return true;
			if (typeof p.displayHiddenElements !== 'function') return false;
			if (!allSelectorsInDom()) return false;
			revealRegistered = true;
			p.displayHiddenElements(cfg.seconds, cfg.selectors, {
				persist: cfg.persist ?? true
			});
			onDelayRegistered?.();
			return true;
		};

		const armRevealWatch = () => {
			stopWatch?.();
			stopWatch = watchReveal(cfg.selectors, notifyReveal);
		};

		const onPlayerReady: EventListener = () => {
			playerReady = true;
			if (registerVturbReveal()) armRevealWatch();
		};

		p.addEventListener('player:ready', onPlayerReady);

		const bindIv = window.setInterval(() => {
			bindAttempts++;
			if (registerVturbReveal()) {
				playerReady = true;
				window.clearInterval(bindIv);
				armRevealWatch();
			} else if (bindAttempts >= MAX_BIND_ATTEMPTS) {
				window.clearInterval(bindIv);
			}
		}, 250);

		return () => {
			window.clearInterval(bindIv);
			p.removeEventListener('player:ready', onPlayerReady);
			stopWatch?.();
		};
	});

	$effect(() => {
		const el = playerEl;
		if (!el || !playerMounted) return;

		const onPlayerReady: EventListener = () => {
			playerReady = true;
		};

		el.addEventListener('player:ready', onPlayerReady);
		return () => el.removeEventListener('player:ready', onPlayerReady);
	});

	onMount(() => {
		let cancelled = false;
		const overlayFallback = setTimeout(() => {
			if (!cancelled) playerReady = true;
		}, 15000);

		(async () => {
			await new Promise<void>((r) => setTimeout(r, 320));
			await tick();
			if (cancelled || !hostEl) return;

			if (!customElements?.get('vturb-smartplayer')) {
				await loadScriptTag(SMARTPLAYER_WC_SRC);
			}
			if (cancelled || !hostEl) return;

			mountPlayerInHost();
			await tick();
			await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
			if (cancelled) return;

			await loadScriptTag(scriptSrc);
		})();

		return () => {
			cancelled = true;
			clearTimeout(overlayFallback);
			hostEl?.replaceChildren();
			playerEl = undefined;
			playerMounted = false;
			playerReady = false;
		};
	});
</script>

<div class="relative w-full min-h-[12rem] min-w-0">
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
