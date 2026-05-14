/** Duração do traçado da linha / clip (s); alinhar a `--wlc-anim` no `WeightLossLineChart`. */
export const CHART_LINE_ANIM_SEC = 3;

/** Fade-in de cada marcador de fase (s). */
export const PROTOCOL_MARKER_FADE_SEC = 0.38;

/** Folga após o fade do último bullet antes do CTA (s). */
const PROTOCOL_CTA_SETTLE_SEC = 0.15;

/** Atraso (s) para o nó aparecer junto ao progresso horizontal ~clip/linha. */
export function protocolNodeRevealDelaySec(cx: number, xs: number, gw: number): number {
	const t = gw > 1e-6 ? Math.min(1, Math.max(0, (cx - xs) / gw)) : 0;
	return t * Math.max(0, CHART_LINE_ANIM_SEC - PROTOCOL_MARKER_FADE_SEC - 0.08);
}

/**
 * Delay do botão Continuar (ms) após o último bullet (Finalização, t = 1)
 * terminar o fade-in — manter alinhado a `WeightLossLineChart` (protocolo 14 dias).
 */
export function protocolChartCtaDelayMs(): number {
	const maxRevealSec = Math.max(0, CHART_LINE_ANIM_SEC - PROTOCOL_MARKER_FADE_SEC - 0.08);
	return Math.ceil((maxRevealSec + PROTOCOL_MARKER_FADE_SEC + PROTOCOL_CTA_SETTLE_SEC) * 1000);
}
