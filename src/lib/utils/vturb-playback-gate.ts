import type {
	VturbSmartPlayerElement,
	VturbSmartPlayerInstance
} from '$lib/types/vturb-smartplayer';

const RESOLVE_INTERVAL_MS = 200;
const TIME_POLL_INTERVAL_MS = 250;
/** Tempo entre tentativas de registar o reveal nativo (`displayHiddenElements`). */
const NATIVE_BIND_INTERVAL_MS = 250;
/** Máximo de tentativas de bind do reveal nativo (≈ 250ms * 80 = 20s). */
const NATIVE_BIND_MAX_ATTEMPTS = 80;

/** O `<video>` do VTurb costuma viver no shadow DOM do `vturb-smartplayer`. */
function videoBelongsToHost(video: Element, host: HTMLElement): boolean {
	if (host.contains(video)) return true;
	const root = video.getRootNode();
	return root instanceof ShadowRoot && root.host === host;
}

/** Vídeo dentro do host (light DOM ou shadow). */
export function findVideoInHost(host: HTMLElement): HTMLVideoElement | null {
	const direct = host.querySelector('video');
	if (direct instanceof HTMLVideoElement) return direct;

	if (host.shadowRoot) {
		const shadow = host.shadowRoot.querySelector('video');
		if (shadow instanceof HTMLVideoElement) return shadow;
	}

	return null;
}

/** VTurb ligou ao host (vídeo, instância ou shadow) — não exige `<video>` visível ainda. */
export function isVturbPlayerInitialized(playerId: string): boolean {
	const host = document.getElementById(playerId);
	if (!host) return false;
	if (findVideoInHost(host)) return true;
	if (resolveVturbInstance(playerId)) return true;
	if (host.shadowRoot && host.shadowRoot.childNodes.length > 0) return true;
	if (host.hasAttribute('original-id')) return true;
	return false;
}

/** Resolve a instância do player ligada ao `vturb-smartplayer` com este id. */
export function resolveVturbInstance(playerId: string): VturbSmartPlayerInstance | undefined {
	const host = document.getElementById(playerId);
	if (!host) return undefined;

	const instances = typeof window !== 'undefined' ? window.smartplayer?.instances : undefined;
	if (!instances?.length) return undefined;

	for (const inst of instances) {
		const video = inst.video;
		if (video instanceof HTMLVideoElement && videoBelongsToHost(video, host)) return inst;
	}

	return undefined;
}

export type AttachPlaybackGateOptions = {
	playerId: string;
	seconds: number;
	/** Disparado quando o vídeo atinge `seconds` (sincronizado com a reprodução). */
	onReached: () => void;
	/** Chamado quando a instância foi encontrada e os listeners estão ativos. */
	onAttached?: () => void;
	/**
	 * Usa o cache nativo do VTurb: quem já chegou no pitch revela na hora ao voltar.
	 * Padrão: true.
	 */
	persist?: boolean;
	/**
	 * Rede de segurança em tempo real (relógio da página): só dispara se NADA do player
	 * resolver (player falhou totalmente). Padrão: 45s — alto para não revelar cedo demais.
	 */
	resolveTimeoutMs?: number;
};

/**
 * Revela conteúdo no tempo exato do vídeo, sincronizado com a reprodução.
 *
 * Estratégia primária: função NATIVA do VTurb `displayHiddenElements` sobre um elemento
 * sentinela `.esconder` — fica em sincronia mesmo com pausa e tem cache nativo (`persist`).
 * @see https://help.vturb.com/pt-br/article/codigo-de-delay-para-sincronizar-elementos-da-pagina-com-o-seu-video-1loyzpq/
 *
 * Fallback: polling de `video.currentTime` (caso a API nativa não exista na versão do player).
 */
export function attachVturbPlaybackGate(opts: AttachPlaybackGateOptions): () => void {
	const { playerId, seconds, onReached, onAttached, persist = true, resolveTimeoutMs = 45_000 } =
		opts;

	let reached = false;
	let resolvePollId: number | undefined;
	let timePollId: number | undefined;
	let unresolvedId: number | undefined;
	let nativeBindId: number | undefined;
	let nativeBindAttempts = 0;
	let nativeRegistered = false;
	let attached = false;
	let instance: VturbSmartPlayerInstance | undefined;
	let onTimeupdate: (() => void) | undefined;
	let pollVideo: HTMLVideoElement | null = null;
	let sentinel: HTMLElement | null = null;
	let sentinelObserver: MutationObserver | undefined;
	let readyListenerEl: HTMLElement | null = null;
	let onPlayerReady: (() => void) | undefined;

	const sentinelId = `${playerId}-vturb-gate-sentinel`;

	const clearTimers = () => {
		if (resolvePollId != null) window.clearInterval(resolvePollId);
		if (timePollId != null) window.clearInterval(timePollId);
		if (unresolvedId != null) window.clearTimeout(unresolvedId);
		if (nativeBindId != null) window.clearInterval(nativeBindId);
		resolvePollId = undefined;
		timePollId = undefined;
		unresolvedId = undefined;
		nativeBindId = undefined;
	};

	const cleanup = () => {
		clearTimers();
		if (instance && onTimeupdate) instance.off?.('timeupdate', onTimeupdate);
		if (readyListenerEl && onPlayerReady) {
			readyListenerEl.removeEventListener('player:ready', onPlayerReady);
		}
		readyListenerEl = null;
		onPlayerReady = undefined;
		sentinelObserver?.disconnect();
		sentinelObserver = undefined;
		sentinel?.remove();
		sentinel = null;
		instance = undefined;
		onTimeupdate = undefined;
		pollVideo = null;
	};

	const fire = () => {
		if (reached) return;
		reached = true;
		cleanup();
		onReached();
	};

	// --- Estratégia primária: reveal nativo do VTurb (sincronizado com o vídeo) ---

	// Regra `.esconder` (documentada pelo VTurb): esconde via display até o tempo do vídeo.
	const ensureEsconderStyle = () => {
		if (document.getElementById('vturb-esconder-style')) return;
		const style = document.createElement('style');
		style.id = 'vturb-esconder-style';
		// Sem !important: VTurb pode revelar removendo a classe OU setando display inline.
		style.textContent = '.esconder{display:none;}';
		document.head.appendChild(style);
	};

	const ensureSentinel = (): HTMLElement | null => {
		if (sentinel) return sentinel;
		const playerEl = document.getElementById(playerId);
		if (!playerEl) return null;

		ensureEsconderStyle();

		const existing = document.getElementById(sentinelId);
		if (existing) {
			sentinel = existing;
			return sentinel;
		}

		const el = document.createElement('div');
		el.id = sentinelId;
		el.className = 'esconder';
		el.setAttribute('aria-hidden', 'true');
		// Escondido pela classe `.esconder`; size 0 mantém invisível mesmo após o reveal.
		el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
		(playerEl.parentElement ?? playerEl).appendChild(el);
		sentinel = el;
		return sentinel;
	};

	/** VTurb revelou o sentinela: removeu `.esconder` (display deixa de ser none). */
	const isSentinelRevealed = (): boolean => {
		if (!sentinel) return false;
		if (!sentinel.classList.contains('esconder')) return true;
		return getComputedStyle(sentinel).display !== 'none';
	};

	const watchSentinel = () => {
		if (!sentinel || sentinelObserver) return;
		sentinelObserver = new MutationObserver(() => {
			if (isSentinelRevealed()) fire();
		});
		sentinelObserver.observe(sentinel, { attributes: true, attributeFilter: ['style', 'class'] });
	};

	const tryRegisterNative = (): boolean => {
		if (nativeRegistered) return true;
		const playerEl = document.getElementById(playerId) as VturbSmartPlayerElement | null;
		if (!playerEl || typeof playerEl.displayHiddenElements !== 'function') return false;
		const node = ensureSentinel();
		if (!node) return false;

		// `displayHiddenElements` só funciona após o player:ready (depende do `store` interno).
		// Antes disso lança "Cannot read properties of undefined (reading 'store')".
		try {
			playerEl.displayHiddenElements(seconds, [`#${sentinelId}`], { persist });
		} catch {
			return false; // ainda não pronto — tenta de novo no próximo tick / no player:ready
		}

		nativeRegistered = true;
		watchSentinel();
		// Caso o cache nativo já tenha revelado de imediato.
		if (isSentinelRevealed()) fire();
		return true;
	};

	// --- Fallback: polling de currentTime ---

	const getCurrentTime = (): number | null => {
		const fromInst = instance?.video?.currentTime;
		if (typeof fromInst === 'number' && Number.isFinite(fromInst)) return fromInst;
		const fromDom = pollVideo?.currentTime;
		if (typeof fromDom === 'number' && Number.isFinite(fromDom)) return fromDom;
		return null;
	};

	const checkTime = () => {
		const t = getCurrentTime();
		if (t != null && t >= seconds) fire();
	};

	const tryAttach = (): boolean => {
		const inst = resolveVturbInstance(playerId);
		const host = document.getElementById(playerId);
		const domVideo = host ? findVideoInHost(host) : null;

		if (!inst?.video && !domVideo) return false;

		instance = inst;
		pollVideo = domVideo;

		if (unresolvedId != null) {
			window.clearTimeout(unresolvedId);
			unresolvedId = undefined;
		}

		if (!attached) {
			attached = true;
			onAttached?.();
		}

		if (inst && typeof inst.on === 'function') {
			onTimeupdate = () => checkTime();
			inst.on('timeupdate', onTimeupdate);
		}

		if (timePollId == null) {
			timePollId = window.setInterval(checkTime, TIME_POLL_INTERVAL_MS);
		}

		checkTime();
		return true;
	};

	// Registo no momento canónico recomendado pelo VTurb: dentro do `player:ready`.
	const playerEl = document.getElementById(playerId);
	if (playerEl) {
		onPlayerReady = () => {
			tryRegisterNative();
		};
		readyListenerEl = playerEl;
		playerEl.addEventListener('player:ready', onPlayerReady);
	}

	// Tenta registar o reveal nativo enquanto o player inicializa (retry guardado por try/catch).
	nativeBindId = window.setInterval(() => {
		nativeBindAttempts++;
		if (tryRegisterNative() || nativeBindAttempts >= NATIVE_BIND_MAX_ATTEMPTS) {
			window.clearInterval(nativeBindId);
			nativeBindId = undefined;
		}
	}, NATIVE_BIND_INTERVAL_MS);

	// Fallback de currentTime corre em paralelo (o que disparar primeiro vence).
	resolvePollId = window.setInterval(() => {
		if (tryAttach()) {
			window.clearInterval(resolvePollId);
			resolvePollId = undefined;
		}
	}, RESOLVE_INTERVAL_MS);

	// Rede de segurança só se o player nunca resolver de forma alguma.
	unresolvedId = window.setTimeout(() => {
		if (!instance && !pollVideo && !nativeRegistered) fire();
	}, resolveTimeoutMs);

	tryRegisterNative();
	tryAttach();

	return cleanup;
}
