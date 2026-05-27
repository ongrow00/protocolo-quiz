import { supabase } from '$lib/supabase';
import type { TreinoQuizAnswers, WorkoutPlan } from '$lib/data/treino-types';

export async function saveWorkoutPlan(
	userId: string,
	answers: TreinoQuizAnswers,
	plan: WorkoutPlan
): Promise<{ error: string | null }> {
	await supabase
		.from('workout_plans')
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq('user_id', userId)
		.eq('is_active', true);

	const { error } = await supabase.from('workout_plans').insert({
		user_id: userId,
		quiz_answers: answers,
		generated_plan: plan,
		plan_version: plan.version,
		is_active: true
	});

	if (error) return { error: error.message };
	return { error: null };
}

export async function updateActiveWorkoutPlan(
	userId: string,
	plan: WorkoutPlan
): Promise<{ error: string | null }> {
	const { error } = await supabase
		.from('workout_plans')
		.update({
			generated_plan: plan,
			updated_at: new Date().toISOString()
		})
		.eq('user_id', userId)
		.eq('is_active', true);

	if (error) return { error: error.message };
	return { error: null };
}

export async function loadActiveWorkoutPlan(userId: string): Promise<{
	plan: WorkoutPlan | null;
	answers: TreinoQuizAnswers | null;
	error: string | null;
}> {
	const { data, error } = await supabase
		.from('workout_plans')
		.select('quiz_answers, generated_plan')
		.eq('user_id', userId)
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) return { plan: null, answers: null, error: error.message };
	if (!data?.generated_plan) return { plan: null, answers: null, error: null };

	const answers = (data.quiz_answers as TreinoQuizAnswers) ?? null;
	const raw = data.generated_plan as WorkoutPlan;

	return {
		plan: raw,
		answers,
		error: null
	};
}
