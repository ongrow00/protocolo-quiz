import { setChallengePlanDirect, type DayPlan } from '$lib/data/challenge-plan';
import { generateChallengePlan } from '$lib/data/meal-plan-generator';
import type { MealSelections } from '$lib/data/meal-preferences';
import { normalizeMealSelections } from '$lib/data/meal-preferences';
import { DEFAULT_SELECTIONS } from '$lib/data/meal-plan-generator';
import { getAnonymousId } from '$lib/stores/identity.store';
import { supabase } from '$lib/supabase';

export type PersistActivationMealPlanResult =
	| { ok: true; mealPlanId: string; created: boolean }
	| { ok: false; error: string };

/**
 * Gera e persiste o plano alimentar de 14 dias (meal_plans + progresso + lista).
 * Idempotente: se já existir plano ativo com generated_plan, reutiliza.
 */
export async function persistActivationMealPlan(
	selections: MealSelections
): Promise<PersistActivationMealPlanResult> {
	const {
		data: { session },
		error: sessionError
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return { ok: false, error: 'Sessão expirada. Faça login novamente.' };
	}

	const user = session.user;

	const { data: existing, error: existingError } = await supabase
		.from('meal_plans')
		.select('id, generated_plan')
		.eq('user_id', user.id)
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (existingError) {
		console.warn('persistActivationMealPlan lookup:', existingError.message);
	}

	if (
		existing?.generated_plan &&
		Array.isArray(existing.generated_plan) &&
		existing.generated_plan.length > 0
	) {
		setChallengePlanDirect(existing.generated_plan as DayPlan[]);
		return { ok: true, mealPlanId: existing.id, created: false };
	}

	try {
		const normalized = normalizeMealSelections(selections, DEFAULT_SELECTIONS);
		const plan = generateChallengePlan(normalized);
		setChallengePlanDirect(plan);
		const anonymousId = getAnonymousId();

		const { data: mealPlan, error: mpError } = await supabase
			.from('meal_plans')
			.insert({
				user_id: user.id,
				anonymous_id: anonymousId,
				selections: normalized,
				generated_plan: plan,
				is_active: true
			})
			.select('id')
			.single();

		if (mpError) {
			console.error('meal_plans insert failed:', mpError.message, mpError.code);
			return { ok: false, error: `Erro ao salvar plano: ${mpError.message}` };
		}

		const { data: progressExists } = await supabase
			.from('challenge_progress')
			.select('id')
			.eq('user_id', user.id)
			.limit(1)
			.maybeSingle();

		if (!progressExists) {
			const { error: cpError } = await supabase.from('challenge_progress').insert({
				user_id: user.id,
				anonymous_id: anonymousId,
				meal_plan_id: mealPlan.id,
				current_day: 1,
				started_at: new Date().toISOString(),
				streak: 0,
				days_status: { 1: 'current' },
				meals_status: {}
			});
			if (cpError) console.warn('challenge_progress insert failed:', cpError.message);
		}

		const { data: listExists } = await supabase
			.from('shopping_lists')
			.select('id')
			.eq('user_id', user.id)
			.limit(1)
			.maybeSingle();

		if (!listExists) {
			const { error: slError } = await supabase.from('shopping_lists').insert({
				user_id: user.id,
				anonymous_id: anonymousId,
				meal_plan_id: mealPlan.id,
				checked_items: []
			});
			if (slError) console.warn('shopping_lists insert failed:', slError.message);
		}

		return { ok: true, mealPlanId: mealPlan.id, created: true };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Erro de conexão';
		console.error('persistActivationMealPlan:', message);
		return { ok: false, error: 'Erro de conexão. Tente novamente.' };
	}
}
