/**
 * Segundos de reprodução (VTurb `displayHiddenElements`) antes de revelar elementos.
 * Deve coincidir com o pitch no vídeo (min×60 + seg) e com o delay no painel VTurb.
 * @see https://help.vturb.com/pt-br/article/codigo-de-delay-para-sincronizar-elementos-da-pagina-com-o-seu-video-1loyzpq/
 */
export const MR3_VTURB_DELAY_SEC = 10;

/** mr-3 (quiz): sem cache — o lead assiste o pitch em cada visita à pergunta. */
export const MR3_VTURB_PERSIST = false;

/** /results e /ativacao: conteúdo após o vídeo do protocolo. */
export const RESULTS_VTURB_DELAY_SEC = 10;

/** /results: cache VTurb (lead que já viu o pitch não espera de novo). */
export const RESULTS_VTURB_PERSIST = true;

/** Disparado somente quando o VTurb altera o DOM e o CTA fica visível. */
export const MR3_CTA_REVEAL_EVENT = 'quiz-mr3-cta-reveal';

/** Disparado quando `displayHiddenElements` foi registrado no player (mr-3). */
export const MR3_CTA_REGISTERED_EVENT = 'quiz-mr3-cta-registered';
