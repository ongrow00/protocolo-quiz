<script lang="ts">
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import MacroDonutChart from './MacroDonutChart.svelte';
	import { macroSplitFromPhase1, type Phase1Macros } from '$lib/utils/macros';

	interface Props {
		macros: Phase1Macros;
	}

	let { macros }: Props = $props();

	const split = $derived(macroSplitFromPhase1(macros));
</script>

<div class="flex w-full max-w-md flex-col items-center self-start text-center mx-auto gap-1 px-4 pb-8 pt-0">
	<h2
		class="text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold"
		in:fly={{ y: 10, duration: 500, easing: cubicOut }}
	>
		Sua <strong>meta de proteína</strong> foi <strong>desbloqueada</strong>
	</h2>

	<p
		class="text-body text-sm leading-[14px] mt-[10px] mb-[25px] [&_strong]:font-extrabold"
		in:fly={{ y: 10, duration: 500, delay: 60, easing: cubicOut }}
	>
		Quantidade recomendada para <strong>etapa 1</strong> do seu protocolo.
	</p>

	<div
		class="w-full -mx-4 max-w-[364px] self-center"
		in:fly={{ y: 16, duration: 550, delay: 100, easing: cubicOut }}
		aria-label="Meta de proteína diária: {macros.proteinG} gramas, etapa 1 do protocolo"
	>
		<MacroDonutChart proteinG={macros.proteinG} {split} />
	</div>
</div>
