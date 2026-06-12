export interface ValidationResult {
	valid: boolean;
	errors: Record<string, string>;
}

/** Formato básico de e-mail (uso em formulários e pós-quiz). */
export function isValidEmailFormat(email: string): boolean {
	const trimmed = email.trim().toLowerCase();
	if (!trimmed) return false;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/** Nome com ao menos 2 caracteres (pós-quiz /nome e lead form). */
export function isValidName(name: string): boolean {
	return name.trim().length >= 2;
}

export function validateLeadForm(name: string, email: string): ValidationResult {
	const errors: Record<string, string> = {};

	const trimmedName = name.trim();
	if (!trimmedName) {
		errors.name = 'Nome é obrigatório';
	} else if (!isValidName(trimmedName)) {
		errors.name = 'Nome deve ter ao menos 2 caracteres';
	}

	const trimmedEmail = email.trim().toLowerCase();
	if (!trimmedEmail) {
		errors.email = 'E-mail é obrigatório';
	} else if (!isValidEmailFormat(trimmedEmail)) {
		errors.email = 'E-mail inválido';
	}

	return {
		valid: Object.keys(errors).length === 0,
		errors
	};
}
