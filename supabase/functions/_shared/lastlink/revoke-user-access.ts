import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { ProductAccessFlags } from './product-access.ts';
import type { LastlinkBuyer, ProvisionUserResult } from './types.ts';

type ProfileAccess = {
	id: string;
	has_protocolo: boolean;
	has_consultoria: boolean;
	has_treino: boolean;
};

async function findProfileByEmail(
	supabase: SupabaseClient,
	email: string
): Promise<ProfileAccess | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, has_protocolo, has_consultoria, has_treino')
		.eq('email', email.toLowerCase())
		.maybeSingle();

	if (error) {
		console.error('[lastlink] profile lookup failed:', error.message);
		throw new Error(error.message);
	}

	return data;
}

/** Reembolso/estorno: desliga flags do produto reembolsado (não apaga conta). */
export async function revokeProductAccess(
	supabase: SupabaseClient,
	buyer: LastlinkBuyer,
	revokedAccess: ProductAccessFlags
): Promise<ProvisionUserResult> {
	const email = buyer.Email?.trim().toLowerCase();
	if (!email) return { ok: false, error: 'Buyer email missing' };

	const profile = await findProfileByEmail(supabase, email);
	if (!profile) {
		return { ok: false, error: 'User not found for refund' };
	}

	const updates: Record<string, unknown> = {
		updated_at: new Date().toISOString()
	};

	if (revokedAccess.has_protocolo) updates.has_protocolo = false;
	if (revokedAccess.has_consultoria) updates.has_consultoria = false;
	if (revokedAccess.has_treino) updates.has_treino = false;

	const nextProtocolo = revokedAccess.has_protocolo ? false : profile.has_protocolo;
	const nextConsultoria = revokedAccess.has_consultoria ? false : profile.has_consultoria;
	const nextTreino = revokedAccess.has_treino ? false : profile.has_treino;

	if (!nextProtocolo && !nextConsultoria && !nextTreino) {
		updates.plan_status = 'refunded';
	}

	const { error: updateError } = await supabase
		.from('profiles')
		.update(updates)
		.eq('id', profile.id);

	if (updateError) {
		console.error('[lastlink] profile revoke failed:', updateError.message);
		return { ok: false, error: updateError.message };
	}

	return { ok: true, userId: profile.id, created: false };
}
