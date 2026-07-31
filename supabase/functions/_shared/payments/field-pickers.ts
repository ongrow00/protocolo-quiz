/** Saneamento de campos vindos de webhook, compartilhado entre gateways. */

export function pickStr(v: unknown, max = 500): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	return v.trim().slice(0, max);
}

export function pickEmail(v: unknown): string | null {
	const s = pickStr(v, 320);
	return s ? s.toLowerCase() : null;
}

export function pickNum(v: unknown): number | null {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim()) {
		const n = Number(v.replace(',', '.'));
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

export function pickInt(v: unknown): number | null {
	const n = pickNum(v);
	if (n === null) return null;
	return Math.trunc(n);
}

export function toIso(v: unknown): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	const d = new Date(v);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isValidIpv4(value: string): boolean {
	const parts = value.split('.');
	if (parts.length !== 4) return false;
	return parts.every((part) => {
		if (!/^\d{1,3}$/.test(part)) return false;
		const n = Number(part);
		return n >= 0 && n <= 255;
	});
}

/** Postgres `inet` rejeita strings arbitrárias — só persiste IPv4/IPv6 válido. */
export function pickIp(v: unknown): string | null {
	if (typeof v !== 'string' || !v.trim()) return null;
	const s = v.trim();
	if (isValidIpv4(s)) return s;
	// IPv6 apenas (precisa conter ":" e só hex/dois-pontos — não URLs como "https://...")
	if (/^[0-9a-fA-F:]+$/.test(s) && s.includes(':')) return s;
	return null;
}
