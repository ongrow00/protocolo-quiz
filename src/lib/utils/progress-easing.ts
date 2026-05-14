/**
 * Ease-out cúbico em [0, 1]: avanço mais rápido no início do segmento e mais lento perto do marco (MR),
 * para alinhar percepção de velocidade com a barra sem alterar os extremos 0 e 1.
 */
export function easeOutProgress01(t: number): number {
	const x = Math.min(1, Math.max(0, t));
	return 1 - (1 - x) ** 3;
}
