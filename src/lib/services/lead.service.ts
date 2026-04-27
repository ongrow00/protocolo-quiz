import type { LeadData } from '$lib/data/types';

/** Persists lead + full quiz payload via server (Supabase service role). */
export async function submitLead(data: LeadData): Promise<void> {
	const res = await fetch('/api/leads', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		let message = 'Falha ao enviar';
		try {
			const err = (await res.json()) as { message?: string };
			if (typeof err.message === 'string') message = err.message;
		} catch {
			// ignore
		}
		throw new Error(message);
	}
}
