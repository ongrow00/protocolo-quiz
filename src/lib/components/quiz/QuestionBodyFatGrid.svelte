<script lang="ts">
	import { onMount } from 'svelte';
	import type { Question } from '$lib/data/types';
	import { BODY_FAT_IMAGES } from '$lib/assets/body-fat-images';
	import { BODY_FAT_STAGES, BODY_FAT_LABELS } from '$lib/assets/body-fat-config';
	import arrowsBetweenUrl from '$lib/assets/body-fat/arrow.svg?url';
	import SwipeRightIcon from '$lib/components/ui/SwipeRightIcon.svelte';

	/** 6 estágios: índice 0..5 → imagem 1..6. Padrão: estágio do meio (índice 2). */
	const STAGES = BODY_FAT_STAGES;
	const DEFAULT_STAGE = 2;

	interface Props {
		question: Question;
		selectedValue: string | undefined;
		/** Estágio "antes" (esquerda). Se não informado, usa o mesmo do slider (ambos iguais). */
		beforeStage?: number;
		onSelect: (questionId: string, value: string) => void;
	}

	let { question, selectedValue, beforeStage, onSelect }: Props = $props();

	const prefix = 'M';

	/** No step objetivo (body_fat_goal): default = um nível abaixo do anterior. Senão: DEFAULT_STAGE. */
	const defaultStageForStep = $derived.by(() => {
		if (question.id === 'body_fat_goal' && beforeStage !== undefined) {
			return Math.max(0, beforeStage - 1);
		}
		return DEFAULT_STAGE;
	});

	/** Stage index 0..5 from stored value; fallback = defaultStageForStep. */
	const stageIndex = $derived.by(() => {
		if (selectedValue === undefined || selectedValue === '') return defaultStageForStep;
		const n = parseInt(selectedValue, 10);
		if (Number.isNaN(n)) return defaultStageForStep;
		return Math.min(STAGES - 1, Math.max(0, n));
	});

	/** Step "agora": preencher default só no mount. Step "objetivo": usar $effect porque o mesmo componente é reutilizado ao trocar de pergunta, então onMount não roda de novo. */
	onMount(() => {
		if (question.id !== 'body_fat_goal' && (selectedValue === undefined || selectedValue === '')) {
			onSelect(question.id, String(DEFAULT_STAGE));
		}
	});

	$effect(() => {
		if (question.id !== 'body_fat_goal' || beforeStage === undefined) return;
		const empty = selectedValue === undefined || selectedValue === '';
		if (!empty) return;
		const oneBelow = Math.max(0, beforeStage - 1);
		onSelect(question.id, String(oneBelow));
	});

	/** Map stage 0..5 to image key 1..6 (one stage per image). */
	const imageKey = $derived(stageIndex + 1);
	/** Estágio "antes" (esquerda): antes informado ou igual ao atual. */
	const beforeStageClamped = $derived(
		beforeStage !== undefined ? Math.min(STAGES - 1, Math.max(0, beforeStage)) : stageIndex
	);
	const beforeImageKey = $derived(beforeStageClamped + 1);
	const afterImageKey = $derived(stageIndex + 1);
	/** Label do estágio atual (ex: "11-12%") para o box abaixo do slider. */
	const currentLabel = $derived(BODY_FAT_LABELS[stageIndex] ?? '');
	/** Posição do balão (10% a 90%) alinhada ao step selecionado */
	const bubblePct = $derived.by(() => (STAGES <= 1 ? 50 : 10 + (80 * stageIndex) / (STAGES - 1)));

	function getImageSrc(key: number) {
		return BODY_FAT_IMAGES[`${prefix}_${key}`] ?? '';
	}

	const beforeImageSrc = $derived(getImageSrc(beforeImageKey));
	const afterImageSrc = $derived(getImageSrc(afterImageKey));
	/** Step 2 (objetivo) = duas imagens (antes | setas | depois). Step 1 (agora) = uma imagem centralizada. */
	const isGoalStep = $derived(question.id === 'body_fat_goal');
	const currentImageSrc = $derived(getImageSrc(imageKey));

	function handleSliderInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		onSelect(question.id, target.value);
	}

	function handleSliderChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		onSelect(question.id, target.value);
	}
</script>

<div class="flex flex-col gap-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-extrabold text-heading leading-[24px]">
			{#if question.id === 'body_fat_level'}
				Qual dessas imagens mais se <span class="text-accent">parece com você agora</span>?
			{:else if question.id === 'body_fat_goal'}
				Você gostaria de se enxergar quando alcançar seu <span class="text-accent">objetivo final</span>?
			{:else}
				{question.text}
			{/if}
		</h2>
		{#if question.subtext}
			<p class="text-sm text-body leading-relaxed">{question.subtext}</p>
		{/if}
	</div>

	{#if isGoalStep}
		<!-- Step 2 (objetivo): setas em camada atrás (z-0); silhuetas por cima (z-10). <img> para o SVG evita falha de background-image no WebKit. -->
		<div
			class="relative isolate flex flex-1 min-h-0 w-full items-center justify-between gap-0 overflow-hidden rounded-lg px-[10%] pt-4 pb-4"
		>
			<img
				src={arrowsBetweenUrl}
				alt=""
				class="pointer-events-none absolute left-[calc(50%-0.75rem)] top-1/2 z-0 max-h-[min(7.5rem,28vh)] w-auto max-w-[min(24rem,88vw)] -translate-x-1/2 -translate-y-1/2 select-none object-contain object-center opacity-50"
				loading="eager"
				decoding="async"
				draggable="false"
				aria-hidden="true"
			/>
			<div class="relative z-10 flex min-h-0 flex-1 shrink-0 items-center justify-start">
				{#if beforeImageSrc}
					<div class="flex h-[110px] w-[162px] shrink-0 items-center justify-center">
						<img
							src={beforeImageSrc}
							alt="Silhueta antes"
							class="h-full w-full object-contain object-center transition-opacity duration-200 grayscale"
							loading="eager"
							draggable="false"
						/>
					</div>
				{/if}
			</div>
			<div class="relative z-10 w-4 shrink-0" aria-hidden="true"></div>
			<div class="relative z-10 flex min-h-0 flex-1 shrink-0 items-center justify-end">
				{#if afterImageSrc}
					<div class="flex h-[110px] w-[162px] shrink-0 items-center justify-center">
						<img
							src={afterImageSrc}
							alt="Silhueta depois"
							class="h-full w-full object-contain object-center transition-opacity duration-200"
							loading="eager"
							draggable="false"
						/>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<!-- Step 1 (agora): uma imagem centralizada, tamanho fixo para todas -->
		<div class="flex flex-1 min-h-0 items-center justify-center pt-4 pb-4">
			{#if currentImageSrc}
				<div class="w-[162px] h-[110px] flex items-center justify-center shrink-0">
					<img
						src={currentImageSrc}
						alt="Silhueta de referência"
						class="w-full h-full object-contain object-center transition-opacity duration-200"
						loading="eager"
						onerror={(e) => {
							const target = e.currentTarget;
							target.style.display = 'none';
							target.nextElementSibling?.classList.remove('hidden');
						}}
					/>
					<div class="hidden w-full h-full flex items-center justify-center text-center text-sm text-muted px-2" data-fallback>
						Estágio {imageKey}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Slider: 6 estágios — abaixo da imagem, sem sobrepor -->
	<div class="relative flex flex-col gap-3 w-full mt-0">
		<div class="relative w-full h-8 flex items-center">
			<!-- Balão do step selecionado -->
			<div
				class="absolute -top-9 z-20 -translate-x-1/2 left-0 pointer-events-none"
				style="left: {bubblePct}%"
				aria-hidden="true"
			>
				<div class="px-3 py-1 rounded-full bg-surface text-heading text-xs font-semibold shadow-md ring-1 ring-line backdrop-blur-sm whitespace-nowrap">
					{currentLabel}
				</div>
			</div>
			<input
				type="range"
				min={0}
				max={STAGES - 1}
				step={1}
				value={stageIndex}
				oninput={handleSliderInput}
				onchange={handleSliderChange}
				aria-valuemin={0}
				aria-valuemax={STAGES - 1}
				aria-valuenow={stageIndex}
				aria-label="Selecione o estágio que mais se parece com você"
				class="body-fat-range relative z-0 w-full h-3 rounded-full appearance-none bg-line accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg px-[10%]"
			/>
			<!-- Pontinhos: 6 posições (10% a 90%); selecionado = branco no centro -->
			<div class="absolute inset-0 flex items-center pointer-events-none z-10" aria-hidden="true">
				{#each Array.from({ length: STAGES }, (_, i) => i) as i}
					{@const pct = STAGES <= 1 ? 50 : 10 + (80 * i) / (STAGES - 1)}
					<span
						class="absolute rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 transition-colors {i === stageIndex ? 'bg-heading w-[25px] h-[25px] ring-2 ring-line' : 'bg-muted w-[6px] h-[6px]'}"
						style="left: {pct}%"
					></span>
				{/each}
			</div>
		</div>
		<!-- Legenda: menor % | Arraste para ajustar | maior % -->
		<div class="flex flex-col items-center justify-center gap-1">
			<p class="text-xs text-muted text-center">← Arraste para ajustar →</p>
			<SwipeRightIcon />
		</div>
	</div>
</div>
