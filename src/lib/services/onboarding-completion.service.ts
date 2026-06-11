import { supabase } from '$lib/supabase';

export type OnboardingCompletionResult =
	| { ok: true; completedAt: string }
	| { ok: false; error: string };

export async function loadOnboardingStatus(
	userId: string
): Promise<{ complete: boolean; error: string | null }> {
	const { data, error } = await supabase
		.from('profiles')
		.select('onboarding_completed_at, has_consultoria')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		return { complete: false, error: error.message };
	}

	const complete =
		data?.onboarding_completed_at != null || data?.has_consultoria === true;

	return { complete, error: null };
}

export async function markOnboardingCompletedInDb(): Promise<OnboardingCompletionResult> {
	const {
		data: { session },
		error: sessionError
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return { ok: false, error: 'Sessão expirada. Faça login novamente.' };
	}

	const completedAt = new Date().toISOString();
	const { error } = await supabase
		.from('profiles')
		.update({ onboarding_completed_at: completedAt, updated_at: completedAt })
		.eq('id', session.user.id);

	if (error) {
		console.error('markOnboardingCompletedInDb:', error.message);
		return { ok: false, error: 'Não foi possível salvar seu progresso. Tente novamente.' };
	}

	return { ok: true, completedAt };
}
