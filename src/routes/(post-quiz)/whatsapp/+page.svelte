<script lang="ts">
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	const name = $derived($postQuizStore.name);
	const whatsapp = $derived($postQuizStore.whatsapp);

	const whatsappTitle = $derived(
		name.trim()
			? `${name.trim()}, qual o seu WhatsApp para receber o seu protocolo?`
			: 'Qual o seu WhatsApp para receber o seu protocolo?'
	);

	function formatBrazilPhone(raw: string): string {
		const digits = raw.replace(/\D/g, '').slice(0, 11);
		if (digits.length <= 2) return digits ? `(${digits}` : '';
		if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	}

	function getLocalDigits(stored: string): string {
		const full = stored.replace(/\D/g, '');
		if (full.startsWith('55') && full.length > 2) return full.slice(2);
		return full.slice(0, 11);
	}

	const displayValue = $derived(
		whatsapp ? formatBrazilPhone(getLocalDigits(whatsapp)) : ''
	);

	function handlePhoneInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const digits = target.value.replace(/\D/g, '').slice(0, 11);
		const formatted = formatBrazilPhone(digits);
		target.value = formatted;
		if (digits.length > 0) {
			postQuizStore.setWhatsapp('55' + digits);
		} else {
			postQuizStore.setWhatsapp('');
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-extrabold text-heading leading-none">{whatsappTitle}</h1>
		<p class="text-sm text-body leading-relaxed">
			Garanta que o número esteja correto, você receberá seu protocolo no WhatsApp.
		</p>
	</div>

	<div class="flex flex-col gap-3">
		<input
			id="whatsapp-phone"
			aria-label="Número do WhatsApp"
			type="tel"
			inputmode="numeric"
			placeholder="(00) 00000-0000"
			value={displayValue}
			oninput={handlePhoneInput}
			class="w-full px-4 py-4 rounded-2xl border-2 border-line bg-surface text-body placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-colors"
			autocomplete="tel"
		/>
		<p class="flex items-center justify-center gap-2 text-sm text-muted">
			<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
			</svg>
			Seu número está seguro. Não enviamos propaganda.
		</p>
	</div>
</div>
