import type { Answers } from '$lib/data/types';

const ACTIVITY_MULTIPLIER: Record<string, number> = {
	'al-sedentaria': 1.2,
	'al-leve': 1.375,
	'al-moderada': 1.55,
	'al-muito': 1.725
};

/** Meta de kcal da Etapa 1 (quiz + oferta): sempre entre 1000 e 1200. */
const PHASE1_KCAL_MIN = 1000;
const PHASE1_KCAL_MAX = 1200;
const PHASE1_KCAL_STEP = 50;

/** Mais atividade → score maior → mais kcal dentro da faixa. */
const ACTIVITY_SCORE: Record<string, number> = {
	'al-sedentaria': 0,
	'al-leve': 0.33,
	'al-moderada': 0.66,
	'al-muito': 1
};

function parseNum(v: unknown): number | null {
	const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
	return Number.isFinite(n) ? n : null;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

/** Índice 0..5 do grid de gordura: mais magra → score maior. */
function bodyFatLevelScore(answers: Answers): number | null {
	const raw = answers['body_fat_level'];
	if (typeof raw !== 'string' || raw.trim() === '') return null;
	const stage = parseInt(raw, 10);
	if (Number.isNaN(stage)) return null;
	const clamped = Math.min(5, Math.max(0, stage));
	return (5 - clamped) / 5;
}

function activityLevelScore(answers: Answers): number | null {
	const key = typeof answers['activity_level'] === 'string' ? answers['activity_level'] : '';
	if (!key || !(key in ACTIVITY_SCORE)) return null;
	return ACTIVITY_SCORE[key];
}

/** Antes de body_fat/activity no funil: posição na faixa via TDEE estimado. */
function anthropometricKcalScore(
	weight: number,
	height: number,
	age: number,
	activityKey: string
): number {
	const bmr = 10 * weight + 6.25 * height - 5 * age - 161;
	const multiplier = ACTIVITY_MULTIPLIER[activityKey] ?? 1.375;
	const tdee = bmr * multiplier;
	return clamp01((tdee - 1200) / 1000);
}

/** Combina biotipo (gordura + atividade) ou fallback antropométrico. */
function resolvePhase1KcalScore(answers: Answers, weight: number, height: number, age: number): number {
	const fatScore = bodyFatLevelScore(answers);
	const activityScore = activityLevelScore(answers);
	const activityKey = typeof answers['activity_level'] === 'string' ? answers['activity_level'] : '';

	const biotypeParts: number[] = [];
	if (fatScore != null) biotypeParts.push(fatScore);
	if (activityScore != null) biotypeParts.push(activityScore);

	if (biotypeParts.length > 0) {
		const sum = biotypeParts.reduce((acc, part) => acc + part, 0);
		return sum / biotypeParts.length;
	}

	return anthropometricKcalScore(weight, height, age, activityKey);
}

/** Proteína como fração das kcal totais (coerente com a faixa 1000–1200). */
const PROTEIN_KCAL_SHARE_MIN = 0.3;
const PROTEIN_KCAL_SHARE_MAX = 0.4;

/** g/kg dentro do orçamento calórico (mais ativa/magra → um pouco mais). */
const PROTEIN_G_PER_KG_MIN = 1.2;
const PROTEIN_G_PER_KG_MAX = 1.6;

const PROTEIN_G_ABSOLUTE_MIN = 70;
const PROTEIN_G_ROUND_STEP = 5;

function roundProteinG(value: number): number {
	return Math.round(value / PROTEIN_G_ROUND_STEP) * PROTEIN_G_ROUND_STEP;
}

/** Proteína alinhada à meta de kcal e ao biotipo (peso entra como teto prático). */
function resolvePhase1ProteinG(kcal: number, kcalScore: number, weight: number): number {
	const score = clamp01(kcalScore);
	const proteinShare =
		PROTEIN_KCAL_SHARE_MIN + score * (PROTEIN_KCAL_SHARE_MAX - PROTEIN_KCAL_SHARE_MIN);
	const budgetG = (kcal * proteinShare) / 4;
	const gPerKg = PROTEIN_G_PER_KG_MIN + score * (PROTEIN_G_PER_KG_MAX - PROTEIN_G_PER_KG_MIN);
	const weightTargetG = gPerKg * weight;

	const rawG = Math.min(weightTargetG, budgetG);
	const flooredG = Math.max(PROTEIN_G_ABSOLUTE_MIN, rawG);
	const cappedG = Math.min(flooredG, budgetG);

	return roundProteinG(cappedG);
}

function scoreToPhase1Kcal(score: number): number {
	const raw = PHASE1_KCAL_MIN + clamp01(score) * (PHASE1_KCAL_MAX - PHASE1_KCAL_MIN);
	const stepped = Math.round(raw / PHASE1_KCAL_STEP) * PHASE1_KCAL_STEP;
	return Math.min(PHASE1_KCAL_MAX, Math.max(PHASE1_KCAL_MIN, stepped));
}

export interface Phase1Macros {
	kcal: number;
	proteinG: number;
}

export interface MacroSplit {
	proteinPct: number;
	carbsPct: number;
	fatPct: number;
}

/** Calcula calorias e proteína para a Etapa 1 do protocolo a partir das respostas do quiz. */
export function computePhase1Macros(answers: Answers): Phase1Macros | null {
	const weight = parseNum(answers['weight_current_kg']);
	const height = parseNum(answers['height_cm']);
	const age = parseNum(answers['age_years']);
	if (weight == null || height == null || age == null) return null;

	const kcalScore = resolvePhase1KcalScore(answers, weight, height, age);
	const kcal = scoreToPhase1Kcal(kcalScore);
	const proteinG = resolvePhase1ProteinG(kcal, kcalScore, weight);

	return { kcal, proteinG };
}

/** Frações de kcal (proteína / carboidrato / gordura) para o donut da tela MR proteína. */
export function macroSplitFromPhase1(macros: Phase1Macros): MacroSplit {
	const { kcal, proteinG } = macros;
	if (kcal <= 0) {
		return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
	}
	const proteinKcal = Math.min(proteinG * 4, kcal);
	const remaining = Math.max(0, kcal - proteinKcal);
	const carbKcal = remaining * 0.35;
	const fatKcal = remaining * 0.65;
	return {
		proteinPct: proteinKcal / kcal,
		carbsPct: carbKcal / kcal,
		fatPct: fatKcal / kcal
	};
}

export type DailyMacroGoals = {
	kcal: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
};

/** Metas diárias de kcal e macros a partir do quiz (etapa 1). */
export function dailyMacroGoals(answers: Answers): DailyMacroGoals | null {
	const phase1 = computePhase1Macros(answers);
	if (!phase1) return null;
	const proteinKcal = Math.min(phase1.proteinG * 4, phase1.kcal);
	const remaining = Math.max(0, phase1.kcal - proteinKcal);
	return {
		kcal: phase1.kcal,
		proteinG: phase1.proteinG,
		carbsG: Math.round((remaining * 0.35) / 4),
		fatG: Math.round((remaining * 0.65) / 9)
	};
}

/** Fallback quando o quiz não está disponível (demo / login direto). */
export const DEFAULT_DAILY_MACRO_GOALS: DailyMacroGoals = {
	kcal: 1100,
	proteinG: 95,
	carbsG: 63,
	fatG: 52
};

/**
 * Mesma meta em todo o funil e app: quiz (Etapa 1) ou fallback padrão.
 * Use isto em qualquer UI que mostre calorias/proteína “do protocolo”.
 */
export function resolvePhase1Macros(answers: Answers): Phase1Macros {
	return (
		computePhase1Macros(answers) ?? {
			kcal: DEFAULT_DAILY_MACRO_GOALS.kcal,
			proteinG: DEFAULT_DAILY_MACRO_GOALS.proteinG
		}
	);
}

/** Metas diárias completas (kcal + macros) com o mesmo fallback. */
export function resolveDailyMacroGoals(answers: Answers): DailyMacroGoals {
	return dailyMacroGoals(answers) ?? DEFAULT_DAILY_MACRO_GOALS;
}

/** Formatação única de kcal (ex.: `1.150 kcal`). */
export function formatKcal(kcal: number): string {
	return `${kcal.toLocaleString('pt-BR')} kcal`;
}

/** Formatação única de gramas (ex.: `85 g`) — proteína, carbo ou gordura. */
export function formatGrams(grams: number): string {
	return `${grams.toLocaleString('pt-BR')} g`;
}

/** Alias semântico para meta de proteína. */
export function formatProteinG(proteinG: number): string {
	return formatGrams(proteinG);
}

/** Número de kcal com separador pt-BR (sem sufixo), p.ex. células de layout. */
export function formatKcalNumber(kcal: number): string {
	return kcal.toLocaleString('pt-BR');
}
