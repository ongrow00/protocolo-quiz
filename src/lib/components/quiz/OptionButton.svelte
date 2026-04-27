<script lang="ts">
	import type { QuizOption } from '$lib/data/types';

	interface Props {
		option: QuizOption;
		selected: boolean;
		type?: 'single' | 'multiple';
		disabled?: boolean;
		/** No card/tábua: simple list style */
		minimal?: boolean;
		/** Horizontal row item (e.g. 1-5 scale), use flex-1 */
		horizontal?: boolean;
		/** Checkbox on top, text below (e.g. grid de dias) */
		stacked?: boolean;
		/** Reserve a 1:1 image slot above the content (even without imageUrl) */
		reserveImageTop?: boolean;
		onclick: (optionId: string) => void;
	}

	let {
		option,
		selected,
		type = 'single',
		disabled = false,
		minimal = false,
		horizontal = false,
		stacked = false,
		reserveImageTop = false,
		onclick
	}: Props = $props();

	// Single = radio (circle only). Multiple = checkbox (square with check).
	const isCheckbox = $derived(type === 'multiple');

	// Title + description: use option.description or split on " — " or " - "
	const splitPoint = $derived(option.text.includes(' — ') ? ' — ' : option.text.includes(' - ') ? ' - ' : null);
	const title = $derived(
		option.description ? option.text : splitPoint ? option.text.split(splitPoint)[0]?.trim() ?? option.text : option.text
	);
	const description = $derived(
		option.description ?? (splitPoint ? option.text.split(splitPoint).slice(1).join(splitPoint).trim() : '')
	);
	const hasDescription = $derived(description.length > 0);
	/** Imagem acima do texto, 100% da largura (ex.: gênero em horizontal) */
	const imageOnTop = $derived(horizontal && !!option.imageUrl);
</script>

<button
	type="button"
	role={isCheckbox ? 'checkbox' : 'radio'}
	aria-checked={selected}
	aria-disabled={disabled}
	disabled={disabled}
	onclick={() => !disabled && onclick(option.id)}
	class="{reserveImageTop ? 'text-center' : 'text-left'} transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
		{horizontal ? 'flex-1 min-w-0 flex flex-col overflow-hidden py-0 rounded-xl' : 'w-full px-5 py-4 rounded-2xl'}
		{horizontal && !imageOnTop ? 'items-center justify-center py-4' : ''}
		{minimal ? 'border-0 rounded-xl bg-surface-2/50 py-3' : 'border-2'}
		{selected
		? minimal ? 'bg-accent text-bg' : 'border-accent bg-accent text-bg'
		: minimal ? 'bg-surface-2/50 text-body hover:bg-surface-2' : 'border-line bg-surface text-body hover:border-accent/50 hover:bg-surface-2'}
		{disabled ? ' opacity-50 pointer-events-none' : ''}"
>
	{#if reserveImageTop && !imageOnTop}
		{#if option.imageUrl}
			<div class="w-full aspect-square rounded-xl overflow-hidden bg-transparent">
				<img src={option.imageUrl} alt="" class="w-full h-full object-cover" loading="lazy" />
			</div>
		{:else}
			<div class="w-full aspect-square rounded-xl bg-transparent"></div>
		{/if}
	{/if}

	{#if imageOnTop}
		<!-- Imagem 100% da largura, altura proporcional -->
		<img src={option.imageUrl} alt="" class="w-full h-auto object-cover shrink-0" loading="lazy" />
		<div class="flex items-center justify-center gap-3 px-3 py-3 min-h-[48px]">
			<span class="font-medium leading-snug text-center">{title}</span>
		</div>
	{:else if stacked && isCheckbox}
		<div class="flex flex-col items-center justify-center gap-2">
			<span
				class="shrink-0 flex items-center justify-center w-5 h-5 border-2 rounded-md transition-colors
					{selected ? 'border-bg' : 'border-line'}"
			>
				{#if selected}
					<svg class="w-3 h-3 text-bg" viewBox="0 0 12 12" fill="none">
						<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				{/if}
			</span>
			<span class="font-medium leading-snug text-center text-sm">{title}</span>
		</div>
	{:else}
		<div class="{reserveImageTop ? 'flex flex-col items-center gap-2 pt-3' : 'flex items-center gap-3'}">
			{#if isCheckbox}
				<span
					class="shrink-0 flex items-center justify-center w-5 h-5 border-2 rounded-md transition-colors
						{selected ? 'border-bg' : 'border-line'}"
				>
					{#if selected}
						<svg class="w-3 h-3 text-bg" viewBox="0 0 12 12" fill="none">
							<path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					{/if}
				</span>
			{/if}
			<div class="{reserveImageTop ? 'flex flex-col items-center gap-0.5 min-w-0' : 'flex flex-col gap-0.5 min-w-0'}">
				<span class="font-medium leading-snug {reserveImageTop ? 'text-sm' : ''}">{title}</span>
				{#if hasDescription}
					<span class="text-sm opacity-90 leading-snug {selected ? 'text-bg/90' : 'text-muted'}">{description}</span>
				{/if}
			</div>
		</div>
		{#if option.imageUrl && !reserveImageTop}
			<img src={option.imageUrl} alt="" class="mt-3 rounded-xl w-full object-cover max-h-32" loading="lazy" />
		{/if}
	{/if}
</button>
