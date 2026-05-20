import type { Answers } from '$lib/data/types';

const ACTIVITY_MULTIPLIER: Record<string, number> = {
	'al-sedentaria': 1.2,
	'al-leve': 1.375,
	'al-moderada': 1.55,
	'al-muito': 1.725
};

function parseNum(v: unknown): number | null {
	const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
	return Number.isFinite(n) ? n : null;
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

	// Mifflin-St Jeor BMR (mulheres)
	const base = 10 * weight + 6.25 * height - 5 * age;
	const bmr = base - 161;

	const activityKey = typeof answers['activity_level'] === 'string' ? answers['activity_level'] : '';
	const multiplier = ACTIVITY_MULTIPLIER[activityKey] ?? 1.375;

	const tdee = bmr * multiplier;

	// Etapa 1 (Desbloqueio): déficit de ~500 kcal, mínimo 1200 kcal
	const floor = 1200;
	const kcalRaw = Math.max(floor, tdee - 500);
	const kcal = Math.round(kcalRaw / 10) * 10;

	// Proteína: 1,8 g/kg para perda de peso
	const proteinG = Math.round((1.8 * weight) / 5) * 5;

	return { kcal, proteinG };
}

/** Frações de kcal (proteína / carboidrato / gordura) para o donut da tela MR proteína. */
export function macroSplitFromPhase1(macros: Phase1Macros): MacroSplit {
	const { kcal, proteinG } = macros;
	const proteinKcal = proteinG * 4;
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
	const split = macroSplitFromPhase1(phase1);
	const proteinKcal = phase1.proteinG * 4;
	const remaining = Math.max(0, phase1.kcal - proteinKcal);
	return {
		kcal: phase1.kcal,
		proteinG: phase1.proteinG,
		carbsG: Math.round((remaining * split.carbsPct) / 4),
		fatG: Math.round((remaining * split.fatPct) / 9)
	};
}

/** Fallback quando o quiz não está disponível (demo / login direto). */
export const DEFAULT_DAILY_MACRO_GOALS: DailyMacroGoals = {
	kcal: 2139,
	proteinG: 60,
	carbsG: 20,
	fatG: 142
};
