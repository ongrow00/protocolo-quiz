<script lang="ts">
	import { browser } from '$app/environment';
	import type { Question } from '$lib/data/types';

	interface Props {
		question: Question;
		value: string | undefined;
		onSelect: (questionId: string, value: string) => void;
		/** Override title (e.g. "Qual é a data do casamento?" when event type is known) */
		titleOverride?: string;
	}

	let { question, value, onSelect, titleOverride }: Props = $props();

	const displayTitle = $derived(titleOverride ?? question.text);

	const today = browser ? new Date().toISOString().slice(0, 10) : '';
	// min = amanhã (picker nativo já bloqueia datas anteriores)
	const minDate = browser
		? (() => {
				const d = new Date();
				d.setDate(d.getDate() + 1);
				return d.toISOString().slice(0, 10);
			})()
		: '';

	let inputValue = $state(value ?? '');
	let errorMsg = $state('');

	function handleInput(raw: string) {
		inputValue = raw;
		if (!raw) {
			errorMsg = '';
			onSelect(question.id, '');
			return;
		}
		if (raw <= today) {
			errorMsg =
				raw === today
					? 'A data precisa ser após hoje, não no mesmo dia.'
					: 'Escolha uma data no futuro.';
			// Invalida a resposta para bloquear o botão "Próxima"
			onSelect(question.id, '');
		} else {
			errorMsg = '';
			onSelect(question.id, raw);
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
	<!-- Wrapper evita overflow no iOS (barra/ícone nativo estourando) -->
	<div class="date-input-wrapper w-full min-w-0 max-w-full overflow-hidden rounded-2xl">
		<input
			type="date"
			min={minDate}
			value={inputValue}
			oninput={(e) => handleInput(e.currentTarget.value)}
			placeholder="Escolha a data"
			class="date-input-white-icon w-full min-w-0 max-w-full px-4 py-4 pr-12 rounded-2xl border-2 bg-surface text-body focus:outline-none focus:ring-2 transition-colors
				{!inputValue ? 'is-empty' : ''}
				{errorMsg
				? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
				: 'border-line focus:border-accent focus:ring-accent/20'}"
		/>
		<!-- Ícone de calendário visível (no iOS o nativo some ou estoura) -->
		<span class="date-input-icon" aria-hidden="true">
			<svg class="text-heading" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
				<line x1="16" y1="2" x2="16" y2="6"/>
				<line x1="8" y1="2" x2="8" y2="6"/>
				<line x1="3" y1="10" x2="21" y2="10"/>
			</svg>
		</span>
		{#if !inputValue}
			<span class="date-input-placeholder">Escolha a data</span>
		{/if}
	</div>
	{#if errorMsg}
		<p class="text-sm text-red-400">{errorMsg}</p>
	{/if}
</div>

<style>
	.date-input-wrapper {
		position: relative;
		display: block;
	}
	.date-input-white-icon {
		display: block;
		box-sizing: border-box;
	}
	/* Placeholder customizado (input date no iOS não mostra placeholder nativo) */
	.date-input-placeholder {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-muted);
		font-size: 1rem;
		line-height: 1.5;
	}
	.date-input-icon {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		color: var(--color-body);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	/* Esconde o indicador nativo no iOS (evita overflow); mantém área clicável; nosso ícone SVG fica visível */
	:global(.date-input-white-icon::-webkit-calendar-picker-indicator) {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 100%;
		min-width: 2.5rem;
		margin: 0;
		padding: 0;
		opacity: 0;
		cursor: pointer;
	}
	/* Vazio e sem foco: texto invisível para o placeholder absoluto aparecer */
	:global(.date-input-white-icon.is-empty:not(:focus)) {
		color: transparent;
	}
	/* Com foco (digitando no desktop): sempre cor visível — senão teclas ficam invisíveis enquanto value ainda é "" */
	:global(.date-input-white-icon.is-empty:focus) {
		color: var(--color-body);
	}
	.date-input-wrapper:focus-within .date-input-placeholder {
		opacity: 0;
	}
</style>
