<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Question } from '$lib/data/types';
	import type { Answers } from '$lib/data/types';
	import { getMicroResultData, nexoMr3ChartFromData } from '$lib/utils/microresult-data';
	import WeightLossLineChart from './WeightLossLineChart.svelte';
	import Mr1TestimonialCarousel from '$lib/components/ui/Mr1TestimonialCarousel.svelte';
	import Mr3VturbPlayer from './Mr3VturbPlayer.svelte';
	import ProteinUnlockCard from './ProteinUnlockCard.svelte';
	import ProtocolCalendarIllustration from './ProtocolCalendarIllustration.svelte';
	import { computePhase1Macros } from '$lib/utils/macros';

	const DUR = 600;
	const OUT = 200;
	const Y = 12;
	const GAP = 250;

	interface Props {
		question: Question;
		answers: Answers;
	}

	let { question, answers }: Props = $props();

	const data = $derived(getMicroResultData(question.id, answers));
	const nexoChart = $derived(nexoMr3ChartFromData(data.nexo));
	const phase1Macros = $derived(computePhase1Macros(answers));

</script>

{#if question.id === 'mr-1'}
	<div class="flex flex-col gap-6 w-full min-w-0 max-w-full items-center overflow-x-clip">
		<div class="space-y-3 relative z-10 w-full min-w-0 max-w-full overflow-x-clip">
			{#if data.title.trim() || data.bullets.length >= 1}
				<h2
					class="text-2xl !font-medium text-heading leading-[24px] text-center px-1 max-w-full [&_strong]:font-extrabold"
				>
					{#if data.title.trim()}
						<span class="block leading-[24px]">{data.title}</span>
					{/if}
					{#if data.bullets.length >= 1}
						<span class="block leading-[24px] {data.title.trim() ? 'mt-3' : ''}">
							{@html data.bullets[0].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
						</span>
					{/if}
				</h2>
			{/if}
			{#if data.bullets.length >= 2}
				<p class="text-[14px] text-body leading-[14px] text-center mt-4 px-1 max-w-full">
					{@html data.bullets[1].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
				</p>
			{/if}
		</div>
		<div class="relative z-0 w-full min-w-0 max-w-full overflow-hidden">
			<Mr1TestimonialCarousel />
		</div>
	</div>
{:else if question.id === 'mr-protein' && phase1Macros != null}
	<ProteinUnlockCard macros={phase1Macros} />
{:else if question.id === 'mr-3' && data.bullets.length > 0}
	<div class="flex flex-col items-center text-center w-full max-w-md mx-auto gap-1 px-4 pb-8 pt-0">
		<div class="flex flex-col items-center text-center w-full">
			<h2 class="text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold">
				{@html data.bullets[0].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
			</h2>
			<p
				class="text-body text-sm leading-relaxed mt-3 px-1 max-w-full text-center [&_strong]:font-extrabold"
			>
				Assista esse vídeo rápido enquanto <strong>analisamos seus dados</strong>.
			</p>
		</div>
		<Mr3VturbPlayer />
		{#if data.bullets.length > 1}
			<div class="flex flex-col items-center text-center w-full mt-2">
				<ul class="list-none space-y-2 text-body text-center">
					{#each data.bullets.slice(1) as bullet (bullet)}
						<li class="leading-relaxed">
							{@html bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{:else if nexoChart != null}
		<div class="flex flex-col items-center text-center w-full max-w-md mx-auto gap-1 px-4 pb-8 pt-0">
			<div class="flex flex-col items-center text-center w-full">
				<h2
					class="text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold"
				>
					{#if nexoChart?.projection14Days === true}
						Você vai sair de <span class="text-accent font-extrabold">{nexoChart?.currentKg ?? 0}kg</span> e alcançar até
						<span class="text-accent font-extrabold">{nexoChart?.goalKg ?? 0}kg</span> em <strong>14 dias</strong>.
					{:else}
						Vamos montar um protocolo personalizado para você
						<span class="text-accent font-extrabold">
							{nexoChart?.isWeightLoss ? 'perder' : 'ganhar'} até {nexoChart?.kgToReach ?? 0}kg.
						</span>
					{/if}
				</h2>
			</div>

			<div class="flex flex-col items-center text-center w-full">
				<p class="text-body text-sm leading-[14px] mt-[10px] mb-[25px] [&_strong]:font-extrabold">
					{#if nexoChart?.projection14Days === true}
						Com base nos <strong>seus dados</strong>, seu <strong>Protocolo de Desbloqueio</strong> será ajustado
						para você <strong>{nexoChart?.isWeightLoss ? 'perder' : 'ganhar'}</strong> até
						<span class="text-accent font-extrabold">{nexoChart?.kgToReach ?? 0} kg</span> em
						<strong>14 dias</strong>. A curva abaixo ilustra a fase inicial do protocolo.
					{:else}
						Em média, <span class="text-accent font-extrabold">{nexoChart?.sexo ?? 'pessoas'}</span>
						{#if nexoChart?.idade != null}
							com aproximadamente <span class="text-accent font-extrabold">{nexoChart?.idade} anos</span>
						{:else}
							com um perfil semelhante ao seu
						{/if}
						conseguem <span class="text-accent font-extrabold">{nexoChart?.isWeightLoss ? 'emagrecer' : 'evoluir'}</span> até
						<span class="text-accent font-extrabold">{nexoChart?.kgToReach ?? 0} kg</span>
						em aproximadamente
						<span class="text-accent font-extrabold">{nexoChart?.weeksEstimate ?? 1} semanas</span>
						seguindo o protocolo.
					{/if}
				</p>
			</div>

			<!-- full-bleed na coluna: compensa o px-4 do bloco para o SVG usar 100% da largura útil -->
			<div class="mt-2 min-w-0 self-stretch -mx-4">
				{#key `${question.id}-${nexoChart?.currentKg ?? 0}-${nexoChart?.goalKg ?? 0}-${nexoChart?.projection14Days === true}`}
					<WeightLossLineChart
						currentKg={nexoChart?.currentKg ?? 0}
						goalKg={nexoChart?.goalKg ?? 0}
						weeks={nexoChart?.weeksEstimate ?? 1}
						protocolFases={nexoChart?.projection14Days === true}
						axisLabelStart={nexoChart?.projection14Days === true ? 'Hoje' : undefined}
						axisLabelEnd={nexoChart?.projection14Days === true ? '14 dias' : undefined}
					/>
				{/key}
			</div>
		</div>
{:else if question.id === 'mr-4'}
	<div class="flex flex-col gap-6 items-center text-center w-full max-w-md mx-auto">
		<div class="space-y-3 w-full">
			{#if data.bullets.length > 0}
				<div
					in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }}
					out:fade={{ duration: OUT }}
				>
					<h2
						class="text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold"
					>
						{@html data.bullets[0].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
					</h2>
				</div>
			{/if}
			<div class="mt-6 w-full px-0">
				<ProtocolCalendarIllustration />
			</div>
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-6 items-center text-center w-full max-w-md mx-auto">
		<div class="space-y-3 w-full">
			{#if data.title.trim()}
				<div in:fly={{ y: Y, duration: DUR, delay: 0, easing: cubicOut }} out:fade={{ duration: OUT }}>
					<h2 class="text-2xl font-medium text-heading leading-[24px] text-center">{data.title}</h2>
				</div>
			{/if}
			{#if data.bullets.length > 0}
				<div
					in:fly={{
						y: Y,
						duration: DUR,
						delay: data.title.trim() ? GAP : 0,
						easing: cubicOut
					}}
					out:fade={{ duration: OUT }}
				>
					<ul class="list-none space-y-2 text-body text-center">
						{#each data.bullets as bullet (bullet)}
							<li class="leading-relaxed">
								{@html bullet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.insight}
				<div in:fly={{ y: Y, duration: DUR, delay: GAP * 2, easing: cubicOut }} out:fade={{ duration: OUT }}>
					<p class="text-body leading-relaxed mt-3 italic text-center">"{@html data.insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}"</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
