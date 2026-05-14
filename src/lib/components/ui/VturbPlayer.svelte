<script lang="ts">
	import { onMount, tick } from 'svelte';

	const SMARTPLAYER_WC_SRC =
		'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js';

	interface Props {
		playerId: string;
		scriptSrc: string;
		/** Mesma API do mr-3: elementos com `display:none` (ex.: `.results-vturb-delay`) só aparecem após N s de reprodução. */
		revealHiddenAfterPlayback?: { seconds: number; selectors: string[] };
	}

	let { playerId, scriptSrc, revealHiddenAfterPlayback }: Props = $props();

	let hostEl: HTMLDivElement | undefined = $state();
	let playerReady = $state(false);

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
				if (alreadyOk) { finish(); return; }
				existing.addEventListener('load', finish, { once: true });
				existing.addEventListener('error', () => reject(new Error(`Script failed: ${src}`)), { once: true });
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

	onMount(() => {
		let cancelled = false;
		let playerEl: HTMLElement | undefined;
		let onPlayerReady: (() => void) | undefined;

		const fallback = setTimeout(() => {
			if (!cancelled) playerReady = true;
		}, 12000);

		(async () => {
			// Wait for fly-in transition to complete and DOM to stabilize
			await new Promise<void>((r) => setTimeout(r, 320));
			await tick();
			if (cancelled || !hostEl) return;

			// Remove stale player script so it always re-executes fresh
			document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`)?.remove();

			// 1) Web component
			if (!customElements?.get('vturb-smartplayer')) {
				await loadScriptTag(SMARTPLAYER_WC_SRC);
			}
			if (cancelled || !hostEl) return;

			// 2) Mount element before player.js (script scans DOM at execution time)
			hostEl.replaceChildren();
			const el = document.createElement('vturb-smartplayer');
			el.id = playerId;
			el.setAttribute('style', 'display:block;margin:0 auto;width:100%;');
			hostEl.appendChild(el);
			await tick();
			await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
			if (cancelled) return;

			// 3) Load player config
			await loadScriptTag(scriptSrc);

			// Listen for player:ready
			const p = el as HTMLElement & {
				displayHiddenElements?: (seconds: number, selectors: string[], opts: { persist: boolean }) => void;
				addEventListener: (type: string, fn: () => void) => void;
				removeEventListener: (type: string, fn: () => void) => void;
			};
			const onReady = () => {
				playerReady = true;
				const cfg = revealHiddenAfterPlayback;
				if (cfg?.selectors?.length) {
					p.displayHiddenElements?.(cfg.seconds, cfg.selectors, { persist: true });
				}
			};
			onPlayerReady = onReady;
			playerEl = el;
			p.addEventListener('player:ready', onReady);
		})();

		return () => {
			cancelled = true;
			clearTimeout(fallback);
			if (playerEl && onPlayerReady) {
				playerEl.removeEventListener('player:ready', onPlayerReady);
			}
			playerEl = undefined;
			onPlayerReady = undefined;
			hostEl?.replaceChildren();
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
