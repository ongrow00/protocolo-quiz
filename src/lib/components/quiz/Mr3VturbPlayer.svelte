<script lang="ts">
	import { onMount, tick } from 'svelte';

	const SMARTPLAYER_WC_SRC =
		'https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js';
	const PLAYER_SCRIPT_SRC =
		'https://scripts.converteai.net/a258539d-3567-40da-9aac-f9a431adf59f/players/6a0c79c1ec6c56d65aedf197/v4/player.js';
	const PLAYER_ID = 'vid-6a0c79c1ec6c56d65aedf197';

	/** Segundos do vídeo após os quais o VTurb revela o CTA (classe dedicada). */
	const DELAY_SECONDS = 10;

	let hostEl: HTMLDivElement | undefined = $state();
	let playerEl: HTMLElement | undefined = $state();
	let playerMounted = $state(false);
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
					if (
						src === SMARTPLAYER_WC_SRC &&
						typeof customElements !== 'undefined' &&
						customElements.get('vturb-smartplayer')
					) {
						finish();
					}
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
		el.id = PLAYER_ID;
		el.setAttribute('style', 'display:block;margin:0 auto;width:100%;max-width:400px;');
		host.appendChild(el);
		playerEl = el;
		playerMounted = true;
	}

	onMount(() => {
		let cancelled = false;
		const fallbackOverlay = setTimeout(() => {
			if (!cancelled) playerReady = true;
		}, 12000);

		(async () => {
			// Aguarda a transição fly-in completar (~300ms) e o DOM estabilizar
			// antes de inicializar o VTurb — players de vídeo verificam visibilidade
			// antes de inicializar e falham se a opacidade herdada ainda for 0.
			await new Promise<void>((r) => setTimeout(r, 320));
			await tick();
			if (cancelled || !hostEl) return;

			// Remove script anterior para garantir que player.js sempre re-execute.
			// Sem isso, navegações subsequentes apenas disparam o setTimeout(500) do
			// loadScriptTag sem re-executar o script, e o player não inicializa.
			document.querySelector<HTMLScriptElement>(`script[src="${PLAYER_SCRIPT_SRC}"]`)?.remove();

			// 1) Web component definido antes de inserir o nó
			const wcReady =
				typeof customElements !== 'undefined' && !!customElements.get('vturb-smartplayer');
			if (!wcReady) {
				await loadScriptTag(SMARTPLAYER_WC_SRC);
			}
			if (cancelled || !hostEl) return;

			// 2) Nó no DOM antes do player.js (o script costuma fazer scan à execução)
			mountPlayerInHost();
			await tick();
			await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
			if (cancelled) return;

			await loadScriptTag(PLAYER_SCRIPT_SRC);
			if (!cancelled) {
				setTimeout(() => {
					if (!cancelled) playerReady = true;
				}, 400);
			}
		})();

		return () => {
			cancelled = true;
			clearTimeout(fallbackOverlay);
			hostEl?.replaceChildren();
			playerEl = undefined;
			playerMounted = false;
			playerReady = false;
		};
	});

	$effect(() => {
		const el = playerEl;
		if (!el || !playerMounted) return;

		const p = el as HTMLElement & {
			displayHiddenElements?: (seconds: number, selectors: string[], opts: { persist: boolean }) => void;
			addEventListener: (type: string, fn: () => void) => void;
			removeEventListener: (type: string, fn: () => void) => void;
		};

		const onReady = () => {
			playerReady = true;
			p.displayHiddenElements?.(DELAY_SECONDS, ['.quiz-mr3-cta-delay'], { persist: true });
		};

		p.addEventListener('player:ready', onReady);

		return () => {
			p.removeEventListener('player:ready', onReady);
		};
	});
</script>

<div class="relative w-full mt-6 min-h-[12rem] min-w-0">
	{#if !playerReady}
		<div
			class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
			aria-busy="true"
			aria-label="A carregar o vídeo"
		>
			<p class="text-sm font-medium text-muted">Carregando vídeo…</p>
		</div>
	{/if}
	<div bind:this={hostEl} class="relative z-0 w-full"></div>
</div>
