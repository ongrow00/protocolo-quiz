<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';

	const CHART_HEIGHT = 136;
</script>

<div class="flex flex-col items-center gap-2 w-full max-w-sm mx-auto">
	<!-- Área do gráfico: 4 linhas tracejadas de nível + linha sólida na base -->
	<div class="relative w-full" style="min-height: {CHART_HEIGHT}px;">
		<!-- Quatro linhas tracejadas de nível (atrás das barras) -->
		<div
			class="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none"
			aria-hidden="true"
		>
			{#each [1, 2, 3, 4] as _}
				<div class="w-full border-b border-dashed border-line" style="height: 0;"></div>
			{/each}
		</div>

		<!-- Linha sólida na base (baseline) -->
		<div
			class="absolute left-0 right-0 h-px bg-line"
			style="bottom: 0;"
			aria-hidden="true"
		></div>

		<!-- Barras alinhadas à linha da base (bottom) -->
		<div
			class="relative flex items-end justify-center gap-10 w-full"
			style="height: {CHART_HEIGHT}px;"
		>
			<!-- Planos genéricos: barra cinza com texto bem pequeno numa linha -->
			<div class="flex flex-col items-center gap-0 flex-1 max-w-[100px]">
				<div
					class="w-full rounded-t bg-line flex items-center justify-center min-h-[32px]"
					style="height: 32px;"
					aria-hidden="true"
				>
					<span class="text-[10px] font-medium text-body/90 px-0.5 text-center leading-tight whitespace-nowrap">Planos genéricos</span>
				</div>
			</div>

			<!-- LOTZ: 2.3X acima da barra, barra verde com logo alinhada ao rodapé -->
			<div class="flex flex-col items-center gap-0 flex-1 max-w-[100px]">
				<span
					class="text-xl font-bold text-heading mb-0.5 block"
					aria-hidden="true"
				>2.3X</span>
				<div
					class="w-full rounded-t bg-accent flex items-end justify-center pb-2"
					style="height: 96px; min-height: 96px;"
					aria-hidden="true"
				>
					<Logo class="w-10 h-auto shrink-0" />
				</div>
			</div>
		</div>
	</div>
</div>
