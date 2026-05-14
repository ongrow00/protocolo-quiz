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

function parseUuid(v: unknown): string | null {
	if (typeof v !== 'string') return null;
	const s = v.trim().toLowerCase();
	if (
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)
	)
		return null;
	return s;
}

function parseVisitedQuestions(b: Record<string, unknown>): string[] {
	let visited_questions: string[] = [];
	if (Array.isArray(b.visitedQuestions)) {
		visited_questions = b.visitedQuestions
			.filter((x): x is string => typeof x === 'string' && x.length > 0 && x.length < 200)
			.slice(0, 500);
	}
	return visited_questions;
}

function utmFields(utmRaw: Record<string, unknown>) {
	return {
		utm_source: pickUtm(utmRaw.utm_source),
		utm_medium: pickUtm(utmRaw.utm_medium),
		utm_campaign: pickUtm(utmRaw.utm_campaign),
		utm_term: pickUtm(utmRaw.utm_term),
		utm_content: pickUtm(utmRaw.utm_content)
	};
}

async function handleProgress(
	supabase: ReturnType<typeof createSupabaseAdmin>,
	b: Record<string, unknown>
) {
	const funnelSessionId = parseUuid(b.funnelSessionId);
	if (!funnelSessionId) throw error(400, 'Sessão inválida');

	if (!b.scores || typeof b.scores !== 'object' || Array.isArray(b.scores))
		throw error(400, 'Scores inválidos');
	if (!b.answers || typeof b.answers !== 'object' || Array.isArray(b.answers))
		throw error(400, 'Respostas inválidas');

	const visited_questions = parseVisitedQuestions(b);
	const utmRaw = b.utm && typeof b.utm === 'object' && !Array.isArray(b.utm) ? b.utm : {};
	const offerRaw = b.offer;
	const offer =
		typeof offerRaw === 'string' && offerRaw.trim() ? offerRaw.trim().slice(0, 200) : null;

	const postQuizName =
		typeof b.postQuizName === 'string' && b.postQuizName.trim()
			? b.postQuizName.trim().slice(0, 200)
			: null;
	const postQuizWaRaw = b.postQuizWhatsapp;
	const postQuizWhatsapp =
		typeof postQuizWaRaw === 'string' && postQuizWaRaw.trim()
			? postQuizWaRaw.replace(/\s/g, '').slice(0, 32)
			: null;

	const postQuizEmailRaw = b.postQuizEmail;
	const postQuizEmail =
		typeof postQuizEmailRaw === 'string' && postQuizEmailRaw.trim()
			? postQuizEmailRaw.trim().toLowerCase().slice(0, 320)
			: null;
	const emailOk =
		postQuizEmail != null &&
		postQuizEmail.includes('@') &&
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(postQuizEmail);

	const patch: Record<string, unknown> = {
		scores: b.scores,
		answers: b.answers,
		visited_questions,
		quiz_started_at: msToIso(b.startedAt),
		quiz_completed_at: msToIso(b.completedAt),
		...utmFields(utmRaw as Record<string, unknown>),
		offer
	};
	if (postQuizName) patch.name = postQuizName;
	if (postQuizWhatsapp) patch.whatsapp = postQuizWhatsapp;
	if (emailOk) patch.email = postQuizEmail;

	const { data: existing, error: selErr } = await supabase
		.from('lotz_quiz_leads')
		.select('id')
		.eq('funnel_session_id', funnelSessionId)
		.maybeSingle();

	if (selErr) {
		console.error('[api/leads]', selErr);
		throw error(500, 'Não foi possível salvar o progresso.');
	}

	if (existing) {
		const { error: upErr } = await supabase
			.from('lotz_quiz_leads')
			.update(patch)
			.eq('funnel_session_id', funnelSessionId);
		if (upErr) {
			console.error('[api/leads]', upErr);
			throw error(500, 'Não foi possível salvar o progresso.');
		}
	} else {
		const { error: insErr } = await supabase.from('lotz_quiz_leads').insert({
			funnel_session_id: funnelSessionId,
			name: null,
			email: null,
			profile_id: null,
			...patch,
			clicked_comecar_agora: false
		});
		if (insErr) {
			console.error('[api/leads]', insErr);
			throw error(500, 'Não foi possível salvar o progresso.');
		}
	}

	return json({ ok: true });
}

async function handleSubmit(
	supabase: ReturnType<typeof createSupabaseAdmin>,
	b: Record<string, unknown>
) {
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

	const visited_questions = parseVisitedQuestions(b);

	const utmRaw = b.utm && typeof b.utm === 'object' && !Array.isArray(b.utm) ? b.utm : {};
	const utm = utmRaw as Record<string, unknown>;

	const offerRaw = b.offer;
	const offer =
		typeof offerRaw === 'string' && offerRaw.trim() ? offerRaw.trim().slice(0, 200) : null;

	const clicked_comecar_agora = b.clickedComecarAgora === true;

	const funnelSessionId = parseUuid(b.funnelSessionId);

	const row: Record<string, unknown> = {
		name,
		email,
		profile_id: profileId,
		scores: b.scores,
		answers: b.answers,
		visited_questions,
		quiz_started_at: msToIso(b.startedAt),
		quiz_completed_at: msToIso(b.completedAt),
		...utmFields(utm),
		offer,
		clicked_comecar_agora
	};

	/** Só atualiza se o cliente mandou a chave (evita apagar WhatsApp/objetivo já gravados no sync). */
	if ('whatsapp' in b) {
		const whatsappRaw = b.whatsapp;
		row.whatsapp =
			typeof whatsappRaw === 'string' && whatsappRaw.trim()
				? whatsappRaw.replace(/\s/g, '').slice(0, 32)
				: null;
	}

	if ('objective' in b) {
		const objectiveRaw = b.objective;
		row.objective =
			typeof objectiveRaw === 'string' && objectiveRaw.trim()
				? objectiveRaw.trim().slice(0, 200)
				: null;
	}

	if (funnelSessionId) {
		row.funnel_session_id = funnelSessionId;
	}

	if (funnelSessionId) {
		const { data: existing, error: selErr } = await supabase
			.from('lotz_quiz_leads')
			.select('id')
			.eq('funnel_session_id', funnelSessionId)
			.maybeSingle();

		if (selErr) {
			console.error('[api/leads]', selErr);
			throw error(500, 'Não foi possível salvar. Tente novamente.');
		}

		if (existing) {
			const { error: upErr } = await supabase
				.from('lotz_quiz_leads')
				.update(row)
				.eq('funnel_session_id', funnelSessionId);
			if (upErr) {
				console.error('[api/leads]', upErr);
				throw error(500, 'Não foi possível salvar. Tente novamente.');
			}
		} else {
			const { error: insErr } = await supabase.from('lotz_quiz_leads').insert(row);
			if (insErr) {
				console.error('[api/leads]', insErr);
				throw error(500, 'Não foi possível salvar. Tente novamente.');
			}
		}
	} else {
		const { error: dbError } = await supabase.from('lotz_quiz_leads').insert(row);
		if (dbError) {
			console.error('[api/leads]', dbError);
			throw error(500, 'Não foi possível salvar. Tente novamente.');
		}
	}

	return json({ ok: true });
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
	const intent = b.intent === 'progress' ? 'progress' : 'submit';

	let supabase: ReturnType<typeof createSupabaseAdmin>;
	try {
		supabase = createSupabaseAdmin();
	} catch (e) {
		const msg = e instanceof Error ? e.message : '';
		if (msg.includes('PUBLIC_SUPABASE_URL') || msg.includes('SUPABASE_SERVICE_ROLE_KEY')) {
			console.error('[api/leads]', msg);
			throw error(
				503,
				'Supabase não configurado no servidor. Crie um .env na raiz com PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (veja .env.example) e reinicie o npm run dev.'
			);
		}
		throw e;
	}

	if (intent === 'progress') {
		return handleProgress(supabase, b);
	}
	return handleSubmit(supabase, b);
};
