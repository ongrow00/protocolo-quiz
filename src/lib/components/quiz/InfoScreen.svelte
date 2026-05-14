<script lang="ts">
	import { browser } from '$app/environment';
	import type { Question } from '$lib/data/types';
	import { quizStore } from '$lib/stores/quiz.store';
	import ProtocoloEtapas from './ProtocoloEtapas.svelte';

	interface Props {
		question: Question;
		/** Optional tag/badge above the title */
		tag?: string;
		/** Centraliza título e texto (ex.: tela info medicamento) */
		center?: boolean;
		/** Título e parágrafo centralizados (ex.: protocolo em 4 etapas) */
		textCenter?: boolean;
	}

	let { question, tag, center = false, textCenter = false }: Props = $props();

	const quiz = $derived($quizStore);

	const title = $derived(question.copyTitle ?? question.text);
	const body = $derived(question.copyBody ?? question.subtext ?? '');
	const ctaText = $derived(question.ctaText ?? 'Continuar');

	const isMedInfo = $derived(question.id === 'info_medication');
	/** Valores `yes` / `no` em answers[info_medication] (pergunta real; não polui o funil). */
	const adaptedProtocolOn = $derived(isMedInfo ? quiz.answers['info_medication'] !== 'no' : true);

	$effect(() => {
		if (!browser || !isMedInfo) return;
		if (quiz.answers['info_medication'] === undefined) {
			quizStore.answer('info_medication', 'yes');
		}
	});

	function toggleAdaptedProtocol() {
		quizStore.answer('info_medication', adaptedProtocolOn ? 'no' : 'yes');
	}
</script>

<div
	class="flex flex-col {center
		? 'items-start text-left max-w-md w-full gap-[15px]'
		: textCenter
			? 'items-center gap-6'
			: 'gap-6'}"
>
	<div
		class="{center ? 'space-y-2 text-left w-full' : textCenter ? 'space-y-3 w-full text-center' : 'space-y-3'}"
	>
		{#if tag}
			<span class="inline-block px-3 py-1.5 text-xs font-medium rounded-full bg-accent/15 text-accent">
				{tag}
			</span>
		{/if}
		{#if center}
			<h2 class="text-2xl font-bold text-heading leading-[24px] text-left">{title}</h2>
		{:else if textCenter}
			<h2 class="text-2xl font-extrabold text-heading leading-[24px] text-balance text-center">{title}</h2>
		{:else}
			<h2 class="text-2xl font-extrabold text-heading leading-[24px]">{title}</h2>
		{/if}
		{#if body}
			<p
				class="text-sm text-body leading-relaxed whitespace-pre-line {center
					? 'text-left'
					: textCenter
						? 'text-center max-w-md mx-auto'
						: ''}"
			>{body}</p>
		{/if}
	</div>
	{#if center}
		<!-- Box estilo Apple: toggle "ligado" + Protocolo Adaptado (abaixo do texto) -->
		<div
			class="relative w-full rounded-2xl bg-white border border-line p-4 flex items-center gap-4 text-left overflow-hidden"
			role="presentation"
		>
			<span
				class="shimmer-overlay pointer-events-none absolute inset-0 z-0 rounded-2xl bg-gradient-to-r from-transparent via-black/[0.04] to-transparent"
				aria-hidden="true"
			></span>
			<button
				type="button"
				role="switch"
				aria-checked={adaptedProtocolOn}
				aria-label="Protocolo adaptado ao uso de medicamento para emagrecimento"
				class="relative z-10 shrink-0 w-11 h-7 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white {adaptedProtocolOn
					? 'bg-accent'
					: 'bg-line/60'}"
				onclick={toggleAdaptedProtocol}
			>
				<span
					class="pointer-events-none absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out will-change-transform {adaptedProtocolOn
						? 'translate-x-4'
						: 'translate-x-0'}"
					aria-hidden="true"
				></span>
			</button>
			<div class="relative z-10 flex flex-col gap-0.5 min-w-0">
				<span class="text-sm font-semibold text-heading">Protocolo Adaptado</span>
				<span class="text-xs text-body leading-snug"
					>Ajustar para respeitar o uso de medicamento para emagrecimento.</span
				>
			</div>
		</div>
	{/if}
	{#if question.id === 'protocolo_4_etapas'}
		<ProtocoloEtapas />
	{/if}
	<!-- CTA is rendered by QuizShell (fixed button with ctaText) -->
</div>
