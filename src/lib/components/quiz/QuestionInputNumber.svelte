<script lang="ts">
	import type { Question } from '$lib/data/types';

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
	}

	let { question, value, onSelect }: Props = $props();

	const numValue = $derived(value === undefined || value === '' ? '' : value);
	const min = $derived(question.min ?? 0);
	const max = $derived(question.max ?? 300);
	const unit = $derived(question.unit ?? '');
</script>

<div class="flex flex-col gap-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{question.text}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>
	<div class="flex items-center gap-2">
		<input
			type="number"
			inputmode="decimal"
			min={min}
			max={max}
			placeholder={question.placeholder}
			value={numValue}
			oninput={(e) => onSelect(question.id, e.currentTarget.value)}
			class="w-full px-4 py-4 rounded-2xl border-2 border-line bg-surface text-body focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
		/>
		{#if unit}
			<span class="text-muted font-medium shrink-0">{unit}</span>
		{/if}
	</div>
</div>
