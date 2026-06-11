import { supabase } from '$lib/supabase';

export type OnboardingCompletionResult =
	| { ok: true; completedAt: string }
	| { ok: false; error: string };

export async function loadOnboardingStatus(
	userId: string
): Promise<{ complete: boolean; completedAt: string | null; error: string | null }> {
	const { data, error } = await supabase
		.from('profiles')
		.select('onboarding_completed_at, has_consultoria')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		return { complete: false, completedAt: null, error: error.message };
	}

	const complete =
		data?.onboarding_completed_at != null || data?.has_consultoria === true;

	return {
		complete,
		completedAt: data?.onboarding_completed_at ?? null,
		error: null
	};
}

const CONSULTORIA_OFFER_DEADLINE_MS = 3 * 24 * 60 * 60 * 1000;

export function getConsultoriaOfferDeadlineMs(completedAt: string): number {
	return new Date(completedAt).getTime() + CONSULTORIA_OFFER_DEADLINE_MS;
}

export function formatDeadlineCountdown(msRemaining: number): string {
	const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const seconds = totalSeconds % 60;

	const d = days.toString().padStart(2, '0');
	const h = hours.toString().padStart(2, '0');
	const m = minutes.toString().padStart(2, '0');
	const s = seconds.toString().padStart(2, '0');

	return `${d}d : ${h}h : ${m}m : ${s}s`;
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
