import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { ProductAccessFlags } from './product-access.ts';
import { passwordFromPhone } from './password-from-phone.ts';
import type { LastlinkBuyer, LastlinkBuyerAddress, LastlinkUtm, ProvisionUserResult } from './types.ts';

function splitName(fullName: string): { first_name: string | null; last_name: string | null } {
	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return { first_name: null, last_name: null };
	return {
		first_name: parts[0] ?? null,
		last_name: parts.slice(1).join(' ') || null
	};
}

function mapAddress(address: LastlinkBuyerAddress | undefined) {
	if (!address) return {};
	return {
		street: address.Street?.trim() || null,
		number: address.StreetNumber?.trim() || null,
		neighborhood: address.District?.trim() || null,
		city: address.City?.trim() || null,
		state: address.State?.trim() || null,
		zip: address.ZipCode?.trim() || null,
		country: 'Brasil'
	};
}

function mapUtm(utm: LastlinkUtm | undefined) {
	if (!utm) return {};
	return {
		utm_source: utm.UtmSource?.trim() || null,
		utm_medium: utm.UtmMedium?.trim() || null,
		utm_campaign: utm.UtmCampaign?.trim() || null,
		utm_term: utm.UtmTerm?.trim() || null,
		utm_content: utm.UtmContent?.trim() || null
	};
}

function mergeAccessFlags(
	purchased: ProductAccessFlags,
	existing?: ProductAccessFlags | null
): ProductAccessFlags {
	return {
		has_protocolo: (existing?.has_protocolo ?? false) || purchased.has_protocolo,
		has_consultoria: (existing?.has_consultoria ?? false) || purchased.has_consultoria,
		has_treino: (existing?.has_treino ?? false) || purchased.has_treino
	};
}

async function findAuthUserByEmail(
	supabase: SupabaseClient,
	email: string
): Promise<{ id: string } | null> {
	const normalized = email.toLowerCase();
	let page = 1;

	while (page <= 20) {
		const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
		if (error) {
			console.error('[lastlink] listUsers failed:', error.message);
			return null;
		}

		const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
		if (match) return { id: match.id };

		if (data.users.length < 200) break;
		page++;
	}

	return null;
}

async function linkQuizResponse(
	supabase: SupabaseClient,
	userId: string,
	email: string
): Promise<string | null> {
	const { data: quiz, error } = await supabase
		.from('quiz_responses')
		.select('id, anonymous_id')
		.eq('email', email.toLowerCase())
		.order('updated_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) {
		console.warn('[lastlink] quiz_responses lookup:', error.message);
		return null;
	}

	if (!quiz) return null;

	if (quiz.anonymous_id) {
		await supabase.from('profiles').update({ anonymous_id: quiz.anonymous_id }).eq('id', userId);
	}

	await supabase.from('quiz_responses').update({ user_id: userId }).eq('id', quiz.id);

	return quiz.anonymous_id ?? null;
}

function buildProfileRow(
	userId: string,
	buyer: LastlinkBuyer,
	utm: LastlinkUtm | undefined,
	access: ProductAccessFlags
) {
	const email = buyer.Email!.trim().toLowerCase();
	const { first_name, last_name } = splitName(buyer.Name ?? '');

	return {
		id: userId,
		email,
		phone: buyer.PhoneNumber?.trim() || null,
		first_name,
		last_name,
		document: buyer.Document?.trim() || null,
		document_type: 'CPF',
		has_protocolo: access.has_protocolo,
		has_consultoria: access.has_consultoria,
		has_treino: access.has_treino,
		plan_status: 'active',
		updated_at: new Date().toISOString(),
		...mapAddress(buyer.Address),
		...mapUtm(utm)
	};
}

export async function provisionPurchasedUser(
	supabase: SupabaseClient,
	buyer: LastlinkBuyer,
	utm: LastlinkUtm | undefined,
	purchasedAccess: ProductAccessFlags
): Promise<ProvisionUserResult> {
	const email = buyer.Email?.trim().toLowerCase();
	const phone = buyer.PhoneNumber?.trim();

	if (!email) return { ok: false, error: 'Buyer email missing' };
	if (!phone) return { ok: false, error: 'Buyer phone missing' };

	const password = passwordFromPhone(phone);
	if (!password) return { ok: false, error: 'Invalid phone for password' };

	const { data: created, error: createError } = await supabase.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
		user_metadata: {
			full_name: buyer.Name?.trim() || undefined
		}
	});

	if (!createError && created.user) {
		const userId = created.user.id;
		const { error: profileError } = await supabase.from('profiles').insert({
			...buildProfileRow(userId, buyer, utm, purchasedAccess)
		});

		if (profileError) {
			console.error('[lastlink] profile insert failed:', profileError.message);
			return { ok: false, error: profileError.message };
		}

		await linkQuizResponse(supabase, userId, email);
		return { ok: true, userId, created: true };
	}

	const alreadyExists =
		createError?.message?.toLowerCase().includes('already') ||
		createError?.code === 'email_exists';

	if (!alreadyExists) {
		console.error('[lastlink] createUser failed:', createError?.message);
		return { ok: false, error: createError?.message ?? 'Failed to create user' };
	}

	const existing = await findAuthUserByEmail(supabase, email);
	if (!existing) {
		return { ok: false, error: 'User exists but could not be found' };
	}

	const { error: updateAuthError } = await supabase.auth.admin.updateUserById(existing.id, {
		password,
		user_metadata: {
			full_name: buyer.Name?.trim() || undefined
		}
	});

	if (updateAuthError) {
		console.error('[lastlink] updateUser failed:', updateAuthError.message);
		return { ok: false, error: updateAuthError.message };
	}

	const { data: existingProfile } = await supabase
		.from('profiles')
		.select('id, has_protocolo, has_consultoria, has_treino')
		.eq('id', existing.id)
		.maybeSingle();

	const mergedAccess = mergeAccessFlags(purchasedAccess, existingProfile);
	const row = buildProfileRow(existing.id, buyer, utm, mergedAccess);

	if (existingProfile) {
		const { error: updateProfileError } = await supabase
			.from('profiles')
			.update(row)
			.eq('id', existing.id);

		if (updateProfileError) {
			console.error('[lastlink] profile update failed:', updateProfileError.message);
			return { ok: false, error: updateProfileError.message };
		}
	} else {
		const { error: insertProfileError } = await supabase.from('profiles').insert(row);
		if (insertProfileError) {
			console.error('[lastlink] profile insert failed:', insertProfileError.message);
			return { ok: false, error: insertProfileError.message };
		}
	}

	await linkQuizResponse(supabase, existing.id, email);
	return { ok: true, userId: existing.id, created: false };
}

const UPSERT_RETRY_DELAY_MS = 15_000;
const MAX_LOOKUP_ATTEMPTS = 3;

type ExistingUserLookup = {
	userId: string;
	profile: {
		id: string;
		has_protocolo: boolean;
		has_consultoria: boolean;
		has_treino: boolean;
	} | null;
};

async function findExistingUser(
	supabase: SupabaseClient,
	email: string
): Promise<ExistingUserLookup | null> {
	const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('id, has_protocolo, has_consultoria, has_treino')
		.eq('email', email)
		.maybeSingle();

	if (profileError) {
		console.error('[lastlink] profile lookup failed:', profileError.message);
		throw new Error(profileError.message);
	}

	if (profile?.id) {
		return { userId: profile.id, profile };
	}

	const authUser = await findAuthUserByEmail(supabase, email);
	if (!authUser) return null;

	return { userId: authUser.id, profile: null };
}

/** Treino / Consultoria: apenas liga flags em usuário que já existe (não cria conta). */
export async function grantAccessToExistingUser(
	supabase: SupabaseClient,
	buyer: LastlinkBuyer,
	purchasedAccess: ProductAccessFlags
): Promise<ProvisionUserResult> {
	const email = buyer.Email?.trim().toLowerCase();
	if (!email) return { ok: false, error: 'Buyer email missing' };

	let existing: ExistingUserLookup | null = null;

	for (let attempt = 1; attempt <= MAX_LOOKUP_ATTEMPTS; attempt++) {
		existing = await findExistingUser(supabase, email);
		if (existing) break;

		if (attempt < MAX_LOOKUP_ATTEMPTS) {
			console.info(
				`[lastlink] user not found for ${email} (attempt ${attempt}/${MAX_LOOKUP_ATTEMPTS}), retrying in ${UPSERT_RETRY_DELAY_MS / 1000}s`
			);
			await new Promise((resolve) => setTimeout(resolve, UPSERT_RETRY_DELAY_MS));
		}
	}

	if (!existing) {
		return {
			ok: false,
			error: `User not found after ${MAX_LOOKUP_ATTEMPTS} attempts — Protocolo Desbloqueio may still be processing`
		};
	}

	const { userId, profile } = existing;

	const mergedAccess = mergeAccessFlags(purchasedAccess, profile ?? undefined);
	const updates: Record<string, unknown> = {
		updated_at: new Date().toISOString()
	};

	if (purchasedAccess.has_treino) updates.has_treino = mergedAccess.has_treino;
	if (purchasedAccess.has_consultoria) {
		updates.has_consultoria = mergedAccess.has_consultoria;
		updates.onboarding_completed_at = new Date().toISOString();
	}

	if (profile) {
		const { error: updateError } = await supabase
			.from('profiles')
			.update(updates)
			.eq('id', userId);

		if (updateError) {
			console.error('[lastlink] profile access update failed:', updateError.message);
			return { ok: false, error: updateError.message };
		}
	} else {
		const { first_name, last_name } = splitName(buyer.Name ?? '');
		const now = new Date().toISOString();
		const { error: insertError } = await supabase.from('profiles').insert({
			id: userId,
			email,
			first_name,
			last_name,
			phone: buyer.PhoneNumber?.trim() || null,
			has_protocolo: false,
			has_consultoria: mergedAccess.has_consultoria,
			has_treino: mergedAccess.has_treino,
			onboarding_completed_at: mergedAccess.has_consultoria ? now : null,
			plan_status: 'active',
			updated_at: now
		});

		if (insertError) {
			console.error('[lastlink] profile insert failed:', insertError.message);
			return { ok: false, error: insertError.message };
		}
	}

	return { ok: true, userId, created: false };
}
