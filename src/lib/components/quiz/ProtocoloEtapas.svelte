<script lang="ts">
	import { onMount } from 'svelte';
	import { quizStore } from '$lib/stores/quiz.store';
	import { formatKcal, formatProteinG, resolvePhase1Macros } from '$lib/utils/macros';

	const ETAPAS = [
		{ num: 1, name: 'Desbloqueio', days: 'Dia 1 – 4', locked: false },
		{ num: 2, name: 'Aceleração',  days: 'Dia 5 – 8', locked: true  },
		{ num: 3, name: 'Consolidação', days: 'Dia 9 – 11', locked: true },
		{ num: 4, name: 'Finalização', days: 'Dia 12 – 14', locked: true }
	] as const;

	const macros = $derived(resolvePhase1Macros($quizStore.answers));

	let visible = $state(false);

	onMount(() => {
		requestAnimationFrame(() => requestAnimationFrame(() => { visible = true; }));
	});
</script>

<div class="grid grid-cols-2 gap-3 w-full" aria-label="As 4 etapas do Protocolo de Desbloqueio">
	{#each ETAPAS as etapa, i}
		<div
			class="etapa-card flex flex-col rounded-2xl border p-4 gap-2.5
				{etapa.locked ? 'bg-surface border-line' : 'bg-surface border-accent/35'}"
			style="--delay: {i * 150}ms"
			class:etapa-visible={visible}
			aria-label="Etapa {etapa.num}: {etapa.name}, {etapa.days}{etapa.locked
				? `, bloqueada; metas liberadas após a etapa ${etapa.num - 1}`
				: ', disponível'}"
		>
			<!-- Badge row -->
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold tracking-[0.12em] uppercase {etapa.locked ? 'text-muted/50' : 'text-accent'}">
					Etapa {etapa.num}
				</span>
				{#if etapa.locked}
					<svg class="w-3 h-3 text-muted/35 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5" />
						<path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
					</svg>
				{/if}
			</div>

			<!-- Phase name + days -->
			<div class="flex flex-col gap-0.5 flex-1">
				<p class="font-semibold leading-tight {etapa.locked ? 'text-body/50' : 'text-heading'}" style="font-size: 0.9375rem;">
					{etapa.name}
				</p>
				<p class="text-[11px] {etapa.locked ? 'text-muted/40' : 'text-muted'}">{etapa.days}</p>
			</div>

			<!-- Macro section — bloqueadas: blur nas linhas + texto centralizado por cima -->
			<div class="pt-2 border-t {etapa.locked ? 'border-line/30' : 'border-line/60'}">
				{#if etapa.locked}
					<div class="relative isolate w-full min-h-[52px] rounded-lg overflow-hidden py-0.5">
						<div
							class="flex flex-col gap-1.5 blur-[2px] opacity-[0.58] pointer-events-none select-none"
							aria-hidden="true"
						>
							<div class="flex items-baseline justify-between gap-1">
								<span class="text-[10px] uppercase tracking-wide font-medium text-muted/30">Calorias</span>
								<span class="text-sm font-semibold text-muted/25 tabular-nums select-none">— kcal</span>
							</div>
							<div class="flex items-baseline justify-between gap-1">
								<span class="text-[10px] uppercase tracking-wide font-medium text-muted/30">Proteína</span>
								<span class="text-sm font-semibold text-muted/25 tabular-nums select-none">— g</span>
							</div>
						</div>
						<p
							class="absolute inset-0 z-[1] flex items-center justify-center text-center text-[10px] font-semibold text-heading leading-tight text-balance px-2 pointer-events-none [text-shadow:0_0_10px_var(--color-bg),0_0_18px_var(--color-bg),0_1px_2px_rgba(0,0,0,0.06)]"
						>
							Liberada após a Etapa {etapa.num - 1}
						</p>
					</div>
				{:else}
					<div class="flex flex-col gap-1.5">
						<div class="flex items-baseline justify-between gap-1">
							<span class="text-[10px] uppercase tracking-wide font-medium text-muted">Calorias</span>
							<span class="text-sm font-semibold text-heading tabular-nums">{formatKcal(macros.kcal)}</span>
						</div>
						<div class="flex items-baseline justify-between gap-1">
							<span class="text-[10px] uppercase tracking-wide font-medium text-muted">Proteína</span>
							<span class="text-sm font-semibold text-heading tabular-nums">{formatProteinG(macros.proteinG)}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.etapa-card {
		opacity: 0;
		transform: translateY(20px) scale(0.97);
		transition:
			opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1);
		transition-delay: var(--delay, 0ms);
	}
	.etapa-card.etapa-visible {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
</style>
