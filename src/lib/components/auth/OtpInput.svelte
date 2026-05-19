<script lang="ts">
	const LENGTH = 6;

	interface Props {
		value: string;
		id?: string;
		oninput: (value: string) => void;
	}

	let { value, id = 'otp-input', oninput }: Props = $props();

	let inputs = $state<HTMLInputElement[]>([]);

	const digits = $derived(
		Array.from({ length: LENGTH }, (_, i) => value[i] ?? '')
	);

	function focusAt(index: number) {
		const el = inputs[index];
		if (el) el.focus();
	}

	function emit(next: string) {
		oninput(next.slice(0, LENGTH));
	}

	function handleInput(index: number, raw: string) {
		const digit = raw.replace(/\D/g, '').slice(-1);
		const chars = digits.slice();
		chars[index] = digit;
		const next = chars.join('').replace(/\s/g, '');
		emit(next);
		if (digit && index < LENGTH - 1) focusAt(index + 1);
	}

	function handleKeydown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			e.preventDefault();
			const chars = digits.slice();
			chars[index - 1] = '';
			emit(chars.join(''));
			focusAt(index - 1);
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, LENGTH);
		if (!pasted) return;
		emit(pasted);
		focusAt(Math.min(pasted.length, LENGTH - 1));
	}
</script>

<div
	class="flex justify-center gap-2"
	role="group"
	aria-label="Código de verificação"
>
	{#each digits as digit, i (i)}
		<input
			bind:this={inputs[i]}
			id={i === 0 ? id : undefined}
			type="text"
			inputmode="numeric"
			autocomplete={i === 0 ? 'one-time-code' : 'off'}
			maxlength="1"
			value={digit}
			aria-label={`Dígito ${i + 1} de ${LENGTH}`}
			class="h-12 w-10 rounded-xl border-2 border-line bg-surface-2 text-center text-lg font-bold text-heading outline-none transition-colors focus:border-accent"
			oninput={(e) => handleInput(i, (e.target as HTMLInputElement).value)}
			onkeydown={(e) => handleKeydown(i, e)}
			onpaste={handlePaste}
			onfocus={(e) => (e.target as HTMLInputElement).select()}
		/>
	{/each}
</div>
