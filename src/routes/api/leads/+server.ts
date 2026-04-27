import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSupabaseAdmin } from '$lib/server/supabase-admin';

function pickUtm(v: unknown): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	return v.trim().slice(0, 500);
}

function msToIso(v: unknown): string | null {
	if (typeof v !== 'number' || !Number.isFinite(v)) return null;
	return new Date(v).toISOString();
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'JSON inválido');
	}

	if (!body || typeof body !== 'object') throw error(400, 'Corpo inválido');

	const b = body as Record<string, unknown>;

	const name = typeof b.name === 'string' ? b.name.trim() : '';
	const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
	const profileId = typeof b.profileId === 'string' ? b.profileId.trim() : '';

	if (!name || name.length > 200) throw error(400, 'Nome inválido');
	if (!email || email.length > 320 || !email.includes('@')) throw error(400, 'E-mail inválido');
	if (!profileId || profileId.length > 120) throw error(400, 'Perfil inválido');

	if (!b.scores || typeof b.scores !== 'object' || Array.isArray(b.scores))
		throw error(400, 'Scores inválidos');
	if (!b.answers || typeof b.answers !== 'object' || Array.isArray(b.answers))
		throw error(400, 'Respostas inválidas');

	let visited_questions: string[] = [];
	if (Array.isArray(b.visitedQuestions)) {
		visited_questions = b.visitedQuestions
			.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 200)
			.slice(0, 500);
	}

	const utmRaw = b.utm && typeof b.utm === 'object' && !Array.isArray(b.utm) ? b.utm : {};
	const utm = utmRaw as Record<string, unknown>;

	const offerRaw = b.offer;
	const offer =
		typeof offerRaw === 'string' && offerRaw.trim() ? offerRaw.trim().slice(0, 200) : null;

	const whatsappRaw = b.whatsapp;
	const whatsapp =
		typeof whatsappRaw === 'string' && whatsappRaw.trim()
			? whatsappRaw.replace(/\s/g, '').slice(0, 32)
			: null;

	const objectiveRaw = b.objective;
	const objective =
		typeof objectiveRaw === 'string' && objectiveRaw.trim()
			? objectiveRaw.trim().slice(0, 200)
			: null;

	const clicked_comecar_agora = b.clickedComecarAgora === true;

	const row = {
		name,
		email,
		profile_id: profileId,
		scores: b.scores,
		answers: b.answers,
		visited_questions,
		quiz_started_at: msToIso(b.startedAt),
		quiz_completed_at: msToIso(b.completedAt),
		utm_source: pickUtm(utm.utm_source),
		utm_medium: pickUtm(utm.utm_medium),
		utm_campaign: pickUtm(utm.utm_campaign),
		utm_term: pickUtm(utm.utm_term),
		utm_content: pickUtm(utm.utm_content),
		offer,
		whatsapp,
		objective,
		clicked_comecar_agora
	};

	const supabase = createSupabaseAdmin();
	const { error: dbError } = await supabase.from('lotz_quiz_leads').insert(row);

	if (dbError) {
		console.error('[api/leads]', dbError);
		throw error(500, 'Não foi possível salvar. Tente novamente.');
	}

	return json({ ok: true });
};
