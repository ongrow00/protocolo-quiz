export function passwordFromPhone(phone: string): string | null {
	const digits = phone.replace(/\D/g, '');
	if (digits.length < 4) return null;
	return digits.slice(-4);
}
