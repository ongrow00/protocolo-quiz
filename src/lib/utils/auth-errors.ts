type AuthLikeError = {
	message?: string;
	code?: string;
	status?: number;
};

export function mapAuthError(err: unknown): string {
	const authErr = err as AuthLikeError;
	const msg = authErr?.message ?? '';
	const lower = msg.toLowerCase();

	if (import.meta.env.DEV) {
		console.error('[auth]', authErr);
	}

	if (
		lower.includes('error sending') ||
		lower.includes('recovery email') ||
		lower.includes('smtp') ||
		authErr?.code === 'unexpected_failure'
	) {
		return 'Não foi possível enviar o e-mail. Confira o SMTP do Resend no Supabase e tente de novo.';
	}

	if (
		lower.includes('rate limit') ||
		lower.includes('too many') ||
		lower.includes('429') ||
		authErr?.status === 429
	) {
		return 'Limite de envio atingido. Aguarde alguns minutos e tente novamente.';
	}

	if (lower.includes('security purposes') || lower.includes('once every')) {
		return 'Aguarde um minuto antes de solicitar um novo código.';
	}

	if (lower.includes('redirect') || lower.includes('redirect_to')) {
		return 'URL do app não autorizada no Supabase. Adicione-a em Authentication → URL Configuration.';
	}

	if (lower.includes('otp_expired') || lower.includes('expired')) {
		return 'Código expirado. Solicite um novo.';
	}

	if (lower.includes('invalid') && (lower.includes('otp') || lower.includes('token') || lower.includes('code'))) {
		return 'Código inválido. Verifique e tente novamente.';
	}

	if (lower.includes('weak') || (lower.includes('password') && lower.includes('short'))) {
		return 'Senha inválida. Use pelo menos 6 caracteres.';
	}

	if (lower.includes('captcha')) {
		return 'Verificação de segurança necessária. Tente novamente.';
	}

	// Mensagens do Supabase costumam ser seguras para exibir
	if (msg && msg.length <= 160) {
		return msg;
	}

	return 'Não foi possível concluir. Tente novamente.';
}
