<script lang="ts">
	import type { Question } from '$lib/data/types';

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
		/** Override title (e.g. "Maria, qual é o seu WhatsApp?") */
		titleOverride?: string;
	}

	let { question, value, onSelect, titleOverride }: Props = $props();

	const textValue = $derived(value ?? '');
	const displayTitle = $derived(titleOverride ?? question.text);
	const isWhatsApp = $derived(question.id === 'whatsapp');

	function formatBrazilPhone(raw: string): string {
		const digits = raw.replace(/\D/g, '').slice(0, 11);
		if (digits.length <= 2) return digits ? `(${digits}` : '';
		if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
	}

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		if (isWhatsApp) {
			const formatted = formatBrazilPhone(target.value);
			target.value = formatted;
			onSelect(question.id, formatted.replace(/\D/g, ''));
		} else {
			onSelect(question.id, target.value);
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{displayTitle}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>
	<input
		type="text"
		inputmode={isWhatsApp ? 'numeric' : 'text'}
		placeholder={isWhatsApp ? '(00) 00000-0000' : question.placeholder}
		value={textValue ? (isWhatsApp ? formatBrazilPhone(textValue.replace(/\D/g, '') || '') : textValue) : ''}
		oninput={handleInput}
		maxlength={isWhatsApp ? 16 : undefined}
		class="w-full px-4 py-4 rounded-2xl border-2 border-line bg-surface text-body focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
	/>
</div>
