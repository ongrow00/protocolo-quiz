<script lang="ts">
	import type { Question } from '$lib/data/types';
	import HandTapIcon from '$lib/components/ui/HandTapIcon.svelte';
	import OptionButton from './OptionButton.svelte';

	interface Props {
		question: Question;
		selectedValue: string | string[] | undefined;
		onSelect: (questionId: string, value: string | string[]) => void;
		/** Override title */
		titleOverride?: string;
		/** Override subtext (e.g. dynamic "seu plano de emagrecimento") */
		subtextOverride?: string;
		/** Oculta título/subtítulo (ex.: cópia customizada na página) */
		hideHeader?: boolean;
	}

	let {
		question,
		selectedValue,
		onSelect,
		titleOverride,
		subtextOverride,
		hideHeader = false
	}: Props = $props();

	const displayTitle = $derived(titleOverride ?? question.text);
	const displaySubtext = $derived(subtextOverride ?? question.subtext ?? '');

	const isMultiple = $derived(question.type === 'multiple');

	const displayOptions = $derived(question.options ?? []);

	const selected = $derived.by((): string[] => {
		if (selectedValue === undefined) return [];
		if (question.type === 'single') {
			if (Array.isArray(selectedValue)) {
				const last = [...selectedValue].reverse().find((id) => id != null && String(id).trim() !== '');
				return last != null ? [String(last)] : [];
			}
			const s = String(selectedValue).trim();
			return s !== '' ? [s] : [];
		}
		return Array.isArray(selectedValue) ? selectedValue.map(String) : [String(selectedValue)];
	});

	const noneOptionIds = $derived(
		question.id === 'injuries'
			? ['inj-nenhuma']
			: question.id === 'health_conditions'
				? ['hc-nenhuma']
				: []
	);
	const hasNoneSelected = $derived(noneOptionIds.length > 0 && noneOptionIds.some((id) => selected.includes(id)));

	function handleOptionClick(optionId: string) {
		if (isMultiple) {
			const max = question.maxSelections ?? Infinity;
			let next: string[];
			const isNoneOption = noneOptionIds.includes(optionId);
			if (isNoneOption) {
				next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [optionId];
			} else if (hasNoneSelected) {
				next = [optionId];
			} else if (selected.includes(optionId)) {
				next = selected.filter((id) => id !== optionId);
			} else if (selected.length < max) {
				next = [...selected.filter((id) => !noneOptionIds.includes(id)), optionId];
			} else {
				next = [...selected.slice(1).filter((id) => !noneOptionIds.includes(id)), optionId];
			}
			onSelect(question.id, next);
		} else {
			onSelect(question.id, optionId);
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !hideHeader}
	<div class="space-y-2">
		{#if displaySubtext && question.id === 'goal_type'}
			<div class="flex justify-center">
				<HandTapIcon size={35} />
			</div>
			<h2 class="text-2xl font-medium text-heading leading-[24px] text-center">{displayTitle}</h2>
			{#if subtextOverride}
				<p class="text-sm text-body leading-relaxed text-center px-[50px]">{displaySubtext}</p>
			{:else}
				<p class="text-sm text-body leading-relaxed text-center px-[50px]">
					Para iniciar, <strong class="font-semibold">selecione um objetivo</strong> para gerarmos um
					<strong class="font-semibold">plano feito para você</strong>.
				</p>
			{/if}
		{:else}
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{displayTitle}</h2>
			{#if displaySubtext}
				<p class="text-sm text-body leading-relaxed">{displaySubtext}</p>
			{/if}
		{/if}
	</div>
	{/if}

	<div
		class="flex flex-col gap-1 {question.optionsLayout === 'horizontal' || question.optionsLayout === 'grid' ? 'w-full' : ''}"
	>
		<div
			class="{question.id === 'goal_type'
				? 'grid grid-cols-2 gap-3'
				: question.optionsLayout === 'horizontal'
					? 'flex flex-row w-full gap-2'
					: question.optionsLayout === 'grid'
						? 'grid grid-cols-4 gap-2'
						: 'flex flex-col gap-3'}"
		>
			{#each displayOptions as option (option.id)}
				<OptionButton
					{option}
					selected={selected.includes(option.id)}
					type={isMultiple ? 'multiple' : 'single'}
					disabled={hasNoneSelected && !noneOptionIds.includes(option.id)}
					minimal={question.optionsLayout === 'minimal'}
					horizontal={question.optionsLayout === 'horizontal'}
					stacked={question.optionsLayout === 'grid'}
					reserveImageTop={question.id === 'goal_type'}
					onclick={handleOptionClick}
				/>
			{/each}
		</div>
		{#if question.optionsLayout === 'horizontal' && question.type === 'scale'}
			<div class="flex justify-between w-full text-xs text-muted px-0.5">
				<span>pouco</span>
				<span>muito</span>
			</div>
		{/if}
	</div>

	{#if question.id === 'goal_type'}
		<div class="flex flex-col items-center justify-center mt-2 gap-1.5">
			<p class="inline-flex items-center gap-1.5 text-[12px] text-accent bg-accent/10 px-3 py-1.5 rounded-full">
				<svg class="w-3.5 h-3.5 shrink-0 text-heading" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
				</svg>
				Limitado a 1 por pessoa
			</p>
			<p class="flex items-center justify-center gap-1.5 text-[10px] text-muted">
				<svg class="w-3 h-3 shrink-0 text-heading" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
				</svg>
				100% seguro
			</p>
		</div>
	{/if}
</div>
