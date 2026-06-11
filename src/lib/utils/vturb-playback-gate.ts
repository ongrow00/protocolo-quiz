import type { VturbSmartPlayerInstance } from '$lib/types/vturb-smartplayer';

const RESOLVE_INTERVAL_MS = 200;
const TIME_POLL_INTERVAL_MS = 250;

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
	/** Disparado quando `video.currentTime >= seconds` (sincronizado com o vídeo). */
	onReached: () => void;
	/** Chamado quando a instância foi encontrada e os listeners estão ativos. */
	onAttached?: () => void;
	/**
	 * Se a instância do player nunca resolver dentro deste tempo (player falhou ao carregar),
	 * `onReached` é chamado mesmo assim para não prender o utilizador. Padrão: 20s.
	 */
	resolveTimeoutMs?: number;
};

/**
 * Revela conteúdo quando `video.currentTime` atinge `seconds`.
 * Fonte única de verdade = tempo real de reprodução do vídeo.
 */
export function attachVturbPlaybackGate(opts: AttachPlaybackGateOptions): () => void {
	const { playerId, seconds, onReached, onAttached, resolveTimeoutMs = 20_000 } = opts;

	let reached = false;
	let resolvePollId: number | undefined;
	let timePollId: number | undefined;
	let unresolvedId: number | undefined;
	let instance: VturbSmartPlayerInstance | undefined;
	let onTimeupdate: (() => void) | undefined;
	let pollVideo: HTMLVideoElement | null = null;

	const clearTimers = () => {
		if (resolvePollId != null) window.clearInterval(resolvePollId);
		if (timePollId != null) window.clearInterval(timePollId);
		if (unresolvedId != null) window.clearTimeout(unresolvedId);
		resolvePollId = undefined;
		timePollId = undefined;
		unresolvedId = undefined;
	};

	const cleanup = () => {
		clearTimers();
		if (instance && onTimeupdate) instance.off?.('timeupdate', onTimeupdate);
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

		if (inst && typeof inst.on === 'function') {
			onTimeupdate = () => checkTime();
			inst.on('timeupdate', onTimeupdate);
		}

		if (timePollId == null) {
			timePollId = window.setInterval(checkTime, TIME_POLL_INTERVAL_MS);
		}

		onAttached?.();
		checkTime();
		return true;
	};

	resolvePollId = window.setInterval(() => {
		if (tryAttach()) {
			window.clearInterval(resolvePollId);
			resolvePollId = undefined;
		}
	}, RESOLVE_INTERVAL_MS);

	unresolvedId = window.setTimeout(() => {
		if (!instance && !pollVideo) fire();
	}, resolveTimeoutMs);

	tryAttach();

	return cleanup;
}
