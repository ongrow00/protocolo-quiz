import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	const day = params.day ?? '1';
	throw redirect(302, `/inicio/dia/${day}`);
}
