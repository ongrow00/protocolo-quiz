import type { VturbSmartPlayerInstance } from '$lib/types/vturb-smartplayer';

const MAX_RESOLVE_ATTEMPTS = 120;
const RESOLVE_INTERVAL_MS = 250;

/** Resolve a instância do player ligada ao `vturb-smartplayer` com este id. */
export function resolveVturbInstance(playerId: string): VturbSmartPlayerInstance | undefined {
	const instances = typeof window !== 'undefined' ? window.smartplayer?.instances : undefined;
	if (!instances?.length) return undefined;

	const host = document.getElementById(playerId);
	if (host) {
		for (const inst of instances) {
			const video = inst.video;
			if (video instanceof HTMLVideoElement && host.contains(video)) return inst;
		}
	}

	return instances[instances.length - 1];
}

export type AttachPlaybackGateOptions = {
	playerId: string;
	seconds: number;
	onReached: () => void;
	/** Chamado quando a instância foi encontrada e o listener `timeupdate` está ativo. */
	onAttached?: () => void;
};

/**
 * Revela conteúdo quando `video.currentTime` atinge `seconds` (sincronizado com play/pause).
 * @returns função de cleanup
 */
export function attachVturbPlaybackGate(opts: AttachPlaybackGateOptions): () => void {
	let reached = false;
	let attempts = 0;
	let pollId: number | undefined;
	let attachedInstance: VturbSmartPlayerInstance | undefined;
	let onTimeupdate: (() => void) | undefined;

	const cleanup = () => {
		if (pollId != null) window.clearInterval(pollId);
		pollId = undefined;
		if (attachedInstance && onTimeupdate) {
			attachedInstance.off?.('timeupdate', onTimeupdate);
		}
		attachedInstance = undefined;
		onTimeupdate = undefined;
	};

	const tryAttach = (): boolean => {
		const inst = resolveVturbInstance(opts.playerId);
		if (!inst?.video || typeof inst.on !== 'function') return false;

		attachedInstance = inst;
		onTimeupdate = () => {
			if (reached) return;
			if (inst.video.currentTime < opts.seconds) return;
			reached = true;
			opts.onReached();
			cleanup();
		};

		inst.on('timeupdate', onTimeupdate);
		opts.onAttached?.();

		if (inst.video.currentTime >= opts.seconds) {
			onTimeupdate();
		}

		return true;
	};

	pollId = window.setInterval(() => {
		attempts += 1;
		if (tryAttach() || attempts >= MAX_RESOLVE_ATTEMPTS) {
			if (pollId != null) window.clearInterval(pollId);
			pollId = undefined;
		}
	}, RESOLVE_INTERVAL_MS);

	return cleanup;
}
