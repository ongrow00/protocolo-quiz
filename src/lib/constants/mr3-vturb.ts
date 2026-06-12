import { browser } from '$app/environment';
import { MR3_PITCH_REVEALED_KEY } from '$lib/constants/storage-keys';

/**
 * mr-3 (quiz): segundos de reprodução do vídeo antes de revelar o CTA.
 * O reveal é guiado por `video.currentTime` (gate de reprodução), não pelo relógio da página.
 * Mantenha alinhado ao momento do pitch no vídeo.
 */
export const MR3_VTURB_DELAY_SEC = 193;

/**
 * /results: segundos de reprodução do vídeo antes de revelar a oferta.
 * Guiado por `video.currentTime` (gate de reprodução).
 */
export const RESULTS_VTURB_DELAY_SEC = 155;

/**
 * /ativacao: segundos de reprodução do vídeo antes de revelar a oferta.
 * Guiado por `video.currentTime` (gate de reprodução).
 */
export const ATIVACAO_VTURB_DELAY_SEC = 630;

/** Disparado quando o gate de reprodução do mr-3 atinge o tempo alvo (sync com o vídeo). */
export const MR3_CTA_REVEAL_EVENT = 'quiz-mr3-cta-reveal';

export function isMr3PitchRevealed(): boolean {
	if (!browser) return false;
	try {
		return localStorage.getItem(MR3_PITCH_REVEALED_KEY) === '1';
	} catch {
		return false;
	}
}

export function setMr3PitchRevealed(): void {
	if (!browser) return;
	try {
		localStorage.setItem(MR3_PITCH_REVEALED_KEY, '1');
	} catch {
		// Storage quota exceeded — silently ignore
	}
}

export function clearMr3PitchRevealed(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(MR3_PITCH_REVEALED_KEY);
	} catch {
		// ignore
	}
}
