<script lang="ts">
	import type { Question } from '$lib/data/types';

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
	}

	let { question, value, onSelect }: Props = $props();

	const minVal = $derived(question.min ?? 1);
	const maxVal = $derived(question.max ?? 5);
	const numValue = $derived(
		value !== undefined && value !== '' ? Math.min(maxVal, Math.max(minVal, Number(value))) : minVal
	);
</script>

<div class="flex flex-col gap-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{question.text}</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>
	<div class="flex flex-col gap-3">
		<input
			type="range"
			min={minVal}
			max={maxVal}
			step="1"
			value={numValue}
			oninput={(e) => onSelect(question.id, e.currentTarget.value)}
			class="w-full h-3 rounded-full appearance-none bg-line accent-accent"
		/>
		<p class="text-sm text-muted text-center">{(numValue)} de {maxVal}</p>
	</div>
</div>
