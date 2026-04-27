import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

/** Server-only client (bypasses RLS). Never import from client components. */
export function createSupabaseAdmin() {
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const key = privateEnv.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
	}
	return createClient(url, key, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}
