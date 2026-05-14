import type { Answers } from '$lib/data/types';

function parseAge(answers: Answers): number | null {
	const rawAge = answers['age_years'];
	const idade =
		rawAge != null
			? typeof rawAge === 'string'
				? parseInt(rawAge, 10)
				: Array.isArray(rawAge)
					? parseInt(String(rawAge[0]), 10)
					: Number(rawAge)
			: NaN;
	return typeof idade === 'number' && Number.isFinite(idade) ? idade : null;
}

function parseKg(answers: Answers, key: string): number {
	const v = answers[key];
	const n = typeof v === 'string' ? parseFloat(v) : NaN;
	return Number.isFinite(n) ? n : NaN;
}

/** Média de resultado exibida na prova social (valor conservador derivado da meta em kg). */
function socialProofAvgKg(kgDelta: number): number {
	if (!Number.isFinite(kgDelta) || kgDelta <= 0) return 2.5;
	const est = Math.round(kgDelta * 0.18 * 10) / 10;
	return Math.min(6, Math.max(1.5, est));
}

export interface NexoCentralizadaMr3 {
	variant: 'mr-3';
	currentKg: number;
	goalKg: number;
	kgToReach: number;
	/** Curva do gráfico (semanas no eixo) */
	weeksEstimate: number;
	isWeightLoss: boolean;
	sexo: string;
	idade: number | null;
	/** Quando true: copy e eixo focados em até 14 dias (Protocolo de Desbloqueio). */
	projection14Days: boolean;
}

export type NexoCentralizada = NexoCentralizadaMr3;

/** Objeto `nexo` com layout de gráfico (mr-2); rejeita shape incompleto para evitar crash no template. */
export function nexoMr3ChartFromData(nexo: MicroResultData['nexo']): NexoCentralizadaMr3 | null {
	if (!nexo || nexo.variant !== 'mr-3') return null;
	const n = nexo as Partial<NexoCentralizadaMr3>;
	if (typeof n.projection14Days !== 'boolean') return null;
	if (typeof n.currentKg !== 'number' || typeof n.goalKg !== 'number') return null;
	if (typeof n.weeksEstimate !== 'number' || !Number.isFinite(n.weeksEstimate)) return null;
	if (typeof n.isWeightLoss !== 'boolean') return null;
	if (typeof n.kgToReach !== 'number') return null;
	return n as NexoCentralizadaMr3;
}

export interface MicroResultData {
	title: string;
	bullets: string[];
	insight?: string;
	ctaText: string;
	nexo?: NexoCentralizada;
}

export function getMicroResultData(stepId: string, answers: Answers): MicroResultData {
	const genderId = answers['gender'] as string | undefined;
	const isFemale = genderId === 'gender-f';
	const isMale = genderId === 'gender-m';
	const pessoaTerm =
		isFemale ? 'Mulheres' : isMale ? 'Homens' : 'Pessoas na mesma faixa etária';

	switch (stepId) {
		case 'mr-1': {
			const idade = parseAge(answers);
			const currentNum = parseKg(answers, 'weight_current_kg');
			const goalNum = parseKg(answers, 'weight_goal_kg');
			const delta =
				Number.isFinite(currentNum) && Number.isFinite(goalNum)
					? Math.max(0, currentNum - goalNum)
					: 0;
			/** Perda declarada na pergunta de meta (ex.: régua 1–7 kg em 14 dias); prioriza esse valor na prova social. */
			const declaredLossKg =
				Number.isFinite(currentNum) && Number.isFinite(goalNum) && goalNum < currentNum
					? Math.round(currentNum - goalNum)
					: 0;
			const headlineKgNum = declaredLossKg > 0 ? declaredLossKg : socialProofAvgKg(delta);
			const headlineKgStr = `${headlineKgNum}`;
			const idadeStr = idade != null ? `${idade}` : 'a sua idade';
			const currentRounded = Number.isFinite(currentNum) ? Math.round(currentNum) : null;
			const goalRounded = Number.isFinite(goalNum) ? Math.round(goalNum) : null;
			const currentLabel = currentRounded != null ? `${currentRounded}` : '—';
			const goalLabel = goalRounded != null ? `${goalRounded}` : '—';
			return {
				title: '',
				bullets: [
					`${pessoaTerm} com **${idadeStr}** **anos** conseguem perder em média **${headlineKgStr} kg** em **14 dias**.`,
					`Todo o protocolo para os próximos 14 dias vai ser pensado para você sair de **${currentLabel} kg** e chegar em **${goalLabel} kg**, destravando seu metabolismo.`
				],
				ctaText: 'Continuar →'
			};
		}
		case 'mr-2': {
			const sexo =
				genderId === 'gender-m' ? 'homens' : genderId === 'gender-f' ? 'mulheres' : 'pessoas';
			const idadeValida = parseAge(answers);

			const currentNum = parseKg(answers, 'weight_current_kg');
			const goalNum = parseKg(answers, 'weight_goal_kg');
			const kgToReach = !isNaN(currentNum) && !isNaN(goalNum) ? Math.abs(goalNum - currentNum) : 0;
			const isWeightLoss = !isNaN(currentNum) && !isNaN(goalNum) && goalNum < currentNum;
			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →',
				nexo: {
					variant: 'mr-3',
					currentKg: isNaN(currentNum) ? 0 : currentNum,
					goalKg: isNaN(goalNum) ? 0 : goalNum,
					kgToReach,
					weeksEstimate: 2,
					isWeightLoss,
					sexo,
					idade: idadeValida,
					projection14Days: true
				}
			};
		}
		case 'mr-3': {
			return {
				title: '',
				bullets: [
					'**Veja o vídeo abaixo** para ver tudo o que faz parte do **seu protocolo**.'
				],
				ctaText: 'Continuar →'
			};
		}
		case 'mr-4': {
			return {
				title: '',
				bullets: [
					'Estamos calculando suas **calorias** e **proteínas** para seu **protocolo de desbloqueio** de **14 dias**.'
				],
				ctaText: 'Continuar →'
			};
		}
		default:
			return {
				title: '',
				bullets: [],
				ctaText: 'Continuar →'
			};
	}
}
