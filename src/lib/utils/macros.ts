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

/** Calcula calorias e proteína para a Etapa 1 do protocolo a partir das respostas do quiz. */
export function computePhase1Macros(answers: Answers): Phase1Macros | null {
	const weight = parseNum(answers['weight_current_kg']);
	const height = parseNum(answers['height_cm']);
	const age = parseNum(answers['age_years']);
	const gender = typeof answers['gender'] === 'string' ? answers['gender'] : null;

	if (weight == null || height == null || age == null || !gender) return null;

	// Mifflin-St Jeor BMR
	const base = 10 * weight + 6.25 * height - 5 * age;
	const bmr = gender === 'gender-m' ? base + 5 : base - 161;

	const activityKey = typeof answers['activity_level'] === 'string' ? answers['activity_level'] : '';
	const multiplier = ACTIVITY_MULTIPLIER[activityKey] ?? 1.375;

	const tdee = bmr * multiplier;

	// Etapa 1 (Desbloqueio): déficit de ~500 kcal, mínimo 1200 (F) / 1400 (M)
	const floor = gender === 'gender-m' ? 1400 : 1200;
	const kcalRaw = Math.max(floor, tdee - 500);
	const kcal = Math.round(kcalRaw / 10) * 10;

	// Proteína: 1,8 g/kg para perda de peso
	const proteinG = Math.round((1.8 * weight) / 5) * 5;

	return { kcal, proteinG };
}
