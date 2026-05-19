<script lang="ts">
	import { onMount, tick } from 'svelte';

	const SMARTPLAYER_WC_SRC =
		'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js';

	export type RevealHiddenAfterPlayback = {
		seconds: number;
		selectors: string[];
		/** Se false, o lead precisa assistir de novo em cada visita (recomendado em páginas dedicadas). */
		persist?: boolean;
	};

	interface Props {
		playerId: string;
		scriptSrc: string;
		/** Elementos com `display:none` (ex.: `.results-vturb-delay`) só aparecem após N s de reprodução. */
		revealHiddenAfterPlayback?: RevealHiddenAfterPlayback;
		/** Disparado quando o VTurb revela os seletores configurados. */
		onReveal?: () => void;
	}

	let { playerId, scriptSrc, revealHiddenAfterPlayback, onReveal }: Props = $props();

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
		addEventListener: (type: string, fn: () => void) => void;
		removeEventListener: (type: string, fn: () => void) => void;
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
		return getComputedStyle(target).display !== 'none';
	}

	function watchReveal(selectors: string[], callback?: () => void): (() => void) | undefined {
		if (!callback || !selectors.length) return undefined;

		const tryNotify = () => {
			if (selectors.some((sel) => isSelectorRevealed(sel))) callback();
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
		const el = playerEl;
		const cfg = revealHiddenAfterPlayback;
		if (!el || !playerMounted || !cfg?.selectors?.length) return;

		const p = el as SmartPlayerEl;
		let stopWatch: (() => void) | undefined;

		const onReady = () => {
			playerReady = true;
			p.displayHiddenElements?.(cfg.seconds, cfg.selectors, {
				persist: cfg.persist ?? true
			});
			stopWatch?.();
			stopWatch = watchReveal(cfg.selectors, onReveal);
		};

		p.addEventListener('player:ready', onReady);

		return () => {
			p.removeEventListener('player:ready', onReady);
			stopWatch?.();
		};
	});

	onMount(() => {
		let cancelled = false;
		const fallback = setTimeout(() => {
			if (!cancelled) playerReady = true;
		}, 12000);

		(async () => {
			await new Promise<void>((r) => setTimeout(r, 320));
			await tick();
			if (cancelled || !hostEl) return;

			document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`)?.remove();

			if (!customElements?.get('vturb-smartplayer')) {
				await loadScriptTag(SMARTPLAYER_WC_SRC);
			}
			if (cancelled || !hostEl) return;

			// Nó no DOM antes do player.js — e listener no $effect antes do script executar
			mountPlayerInHost();
			await tick();
			await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
			if (cancelled) return;

			await loadScriptTag(scriptSrc);
		})();

		return () => {
			cancelled = true;
			clearTimeout(fallback);
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
