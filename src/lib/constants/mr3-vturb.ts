/**
 * mr-3 (quiz): segundos de reprodução do vídeo antes de revelar o CTA.
 * O reveal é guiado por `video.currentTime` (gate de reprodução), não pelo relógio da página.
 * Mantenha alinhado ao momento do pitch no vídeo.
 */
export const MR3_VTURB_DELAY_SEC = 10;

/**
 * /results e /ativacao: segundos de reprodução do vídeo antes de revelar a oferta.
 * Guiado por `video.currentTime` (gate de reprodução).
 */
export const RESULTS_VTURB_DELAY_SEC = 10;

/** Disparado quando o gate de reprodução do mr-3 atinge o tempo alvo (sync com o vídeo). */
export const MR3_CTA_REVEAL_EVENT = 'quiz-mr3-cta-reveal';
