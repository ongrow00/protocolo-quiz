<script lang="ts">
	import { BODY_FAT_IMAGES } from '$lib/assets/body-fat-images';
	import { BODY_FAT_STAGES, BODY_FAT_LABELS } from '$lib/assets/body-fat-config';
	import arrowsBetweenUrl from '$lib/assets/body-fat/arrows-between.png';

	const GENDER_PREFIX: Record<string, string> = {
		'gender-m': 'H',
		'gender-f': 'M'
	};

	const MAX_STAGE = BODY_FAT_STAGES - 1;

	interface Props {
		bodyFatLevel: number | null; // 0..5 "agora"
		bodyFatGoal: number | null;   // 0..5 "depois"
		genderAnswer: string | undefined;
		weightCurrentKg?: number | null;
		weightGoalKg?: number | null;
		/** Accent color for arrows and bars: 'accent' (green) or 'coral' */
		accentVariant?: 'accent' | 'coral';
	}

	let {
		bodyFatLevel,
		bodyFatGoal,
		genderAnswer,
		weightCurrentKg = null,
		weightGoalKg = null,
		accentVariant = 'accent'
	}: Props = $props();

	const prefix = $derived(GENDER_PREFIX[genderAnswer ?? ''] ?? 'H');

	const beforeStage = $derived(Math.min(MAX_STAGE, Math.max(0, bodyFatLevel ?? 2)));
	const afterStage = $derived(Math.min(MAX_STAGE, Math.max(0, bodyFatGoal ?? 1)));

	function getImageSrc(key: number) {
		return BODY_FAT_IMAGES[`${prefix}_${key}`] ?? '';
	}

	const beforeImageSrc = $derived(getImageSrc(beforeStage + 1));
	const afterImageSrc = $derived(getImageSrc(afterStage + 1));

	const bodyFatBeforePercent = $derived(BODY_FAT_LABELS[beforeStage] ?? '');
	const bodyFatAfterPercent = $derived(BODY_FAT_LABELS[afterStage] ?? '');

	/** 5 segments: "before" filled = 5 - stage (more fat = fewer filled); "after" = 5 - stage */
	// Nunca mostrar 0 segmentos (percepção: todo mundo tem alguma massa muscular).
	const muscleSegmentsBefore = $derived(Math.min(5, Math.max(1, 5 - beforeStage)));
	const muscleSegmentsAfter = $derived(Math.min(5, Math.max(1, 5 - afterStage)));
</script>

<div class="oferta-before-after w-full rounded-2xl overflow-hidden border border-line bg-surface">
	<!-- Topo: mesmo tamanho de imagem e altura do step antes/depois do quiz (162×110, pt-4 pb-4) -->
	<div class="relative pt-4 pb-4 min-h-[180px]">
		<!-- Setas como background (mix-blend para remover o preto da imagem) -->
		<div
			class="absolute inset-0 bg-cover bg-no-repeat opacity-35 pointer-events-none z-0 mix-blend-screen"
			style="background-image: url('{arrowsBetweenUrl}'); background-size: 26vh auto; background-position: center 85px;"
			aria-hidden="true"
		></div>
		<div class="relative z-10 grid grid-cols-2 gap-0">
			<!-- Esquerda: Você agora = imagem e estado atual (before) -->
			<div class="flex flex-col items-center py-4 px-4">
				<h3 class="text-heading text-base font-medium mb-[50px]">Você agora</h3>
				<div class="relative flex items-center justify-center w-full shrink-0">
					{#if beforeImageSrc}
						<div class="w-[162px] h-[110px] flex items-center justify-center shrink-0">
							<img
								src={beforeImageSrc}
								alt="Seu corpo agora"
								class="w-full h-full object-contain object-center grayscale"
							/>
						</div>
					{/if}
				</div>
			</div>
			<!-- Direita: Depois do protocolo = imagem e estado após (after) -->
			<div class="flex flex-col items-center py-4 px-4">
				<h3 class="text-heading text-base font-medium mb-[50px]">Depois do protocolo</h3>
				<div class="relative flex items-center justify-center w-full shrink-0">
					{#if afterImageSrc}
						<div class="w-[162px] h-[110px] flex items-center justify-center shrink-0">
							<img
								src={afterImageSrc}
								alt="Seu corpo após o protocolo"
								class="w-full h-full object-contain object-center"
							/>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Linha horizontal entre imagens e dados -->
	<div class="h-px w-full bg-line shrink-0" aria-hidden="true"></div>

	<!-- Dados: esquerda = Você agora (before), direita = Depois do protocolo (after) -->
	<div class="grid grid-cols-[1fr_1px_1fr] gap-0">
		<div class="flex flex-col items-start justify-center py-4 px-4">
			<p class="text-heading text-sm font-medium">Gordura corporal</p>
			<p class="text-heading text-lg font-bold mt-0.5">{bodyFatBeforePercent}</p>
			<div class="h-px w-full bg-line my-2" aria-hidden="true"></div>
			<p class="text-heading text-sm font-medium mt-3">Massa Muscular</p>
			<div class="flex w-full gap-1 mt-1.5" aria-hidden="true">
				{#each Array(5) as _, i}
					<span
						class="h-2.5 flex-1 min-w-0 rounded-sm {i < muscleSegmentsBefore
							? 'bg-accent'
							: 'bg-line'}"
					></span>
				{/each}
			</div>
			<div class="h-px w-full bg-line my-3" aria-hidden="true"></div>
			<p class="text-heading text-sm font-medium">Peso atual</p>
			<p class="text-heading text-lg font-bold mt-0.5">
				{#if weightCurrentKg != null}
					{weightCurrentKg} kg
				{:else}
					—
				{/if}
			</p>
		</div>
		<div class="bg-line self-stretch min-h-[80px]" aria-hidden="true"></div>
		<div class="flex flex-col items-start justify-center py-4 px-4">
			<p class="text-heading text-sm font-medium">Gordura corporal</p>
			<p class="text-heading text-lg font-bold mt-0.5">{bodyFatAfterPercent}</p>
			<div class="h-px w-full bg-line my-2" aria-hidden="true"></div>
			<p class="text-heading text-sm font-medium mt-3">Massa Muscular</p>
			<div class="flex w-full gap-1 mt-1.5" aria-hidden="true">
				{#each Array(5) as _, i}
					<span
						class="h-2.5 flex-1 min-w-0 rounded-sm {i < muscleSegmentsAfter
							? 'bg-accent'
							: 'bg-line'}"
					></span>
				{/each}
			</div>
			<div class="h-px w-full bg-line my-3" aria-hidden="true"></div>
			<p class="text-heading text-sm font-medium">Peso objetivo</p>
			<p class="text-heading text-lg font-bold mt-0.5">
				{#if weightGoalKg != null}
					{weightGoalKg} kg
				{:else}
					—
				{/if}
			</p>
		</div>
	</div>

	<!-- Linha horizontal para fechar o bloco -->
	<div class="h-px w-full bg-line shrink-0" aria-hidden="true"></div>
</div>
