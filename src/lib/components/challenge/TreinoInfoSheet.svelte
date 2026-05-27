<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	const phases = [
		{
			num: 1,
			name: 'Desbloqueio',
			days: 'Dias 1–3',
			description:
				'Adaptação aos movimentos com volume leve. Você aprende a executar cada exercício com segurança antes de aumentar a intensidade.'
		},
		{
			num: 2,
			name: 'Aceleração',
			days: 'Dias 4–6',
			description:
				'O ritmo sobe com mais tempo sob tensão e uma volta extra. Seu corpo começa a responder com mais queima e condicionamento.'
		},
		{
			num: 3,
			name: 'Consolidação',
			days: 'Dias 7–10',
			description:
				'Volume e resistência aumentam de forma consistente. O metabolismo se mantém elevado por mais tempo após cada sessão.'
		},
		{
			num: 4,
			name: 'Finalização',
			days: 'Dias 11–14',
			description:
				'Máximo estímulo metabólico com maior tempo e volume. Os resultados acumulados das fases anteriores se consolidam aqui.'
		}
	];
</script>

<BottomSheet {open} {onClose} title="Como funciona o Protocolo de Treino">
	<div class="flex flex-col gap-5">
		<div class="aspect-video w-full overflow-hidden rounded-challenge bg-black/10">
			<div class="flex h-full w-full items-center justify-center">
				<svg class="h-12 w-12 text-muted/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M8 5v14l11-7z"/>
				</svg>
			</div>
		</div>

		<div class="flex flex-col gap-4">
			{#each phases as phase (phase.num)}
				<div class="flex gap-3">
					<div class="flex flex-col items-center">
						<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg">
							{phase.num}
						</div>
						{#if phase.num < 4}
							<div class="mt-1 w-px flex-1 bg-line"></div>
						{/if}
					</div>
					<div class="flex flex-col gap-1 pb-4">
						<p class="text-sm font-bold leading-snug text-heading">{phase.name}</p>
						<p class="text-[10px] font-semibold uppercase tracking-wide text-accent">{phase.days}</p>
						<p class="mt-0.5 text-xs leading-relaxed text-body">{phase.description}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</BottomSheet>
