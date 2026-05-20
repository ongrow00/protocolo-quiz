<script lang="ts">
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import ConsultoriaVideoPlayer from '$lib/components/challenge/ConsultoriaVideoPlayer.svelte';
</script>

<ChallengePageShell>
	<div
		class="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-sm flex-col items-center justify-center gap-6 px-2 py-8 text-center"
	>
		<div class="flex w-full flex-col gap-3">
			<h2 class="text-xl font-medium leading-none text-heading text-balance">
				Tenha um <strong class="font-extrabold">acompanhamento</strong> de um
				<strong class="font-extrabold">time inteiro</strong> junto com você por
				<strong class="font-extrabold">12 meses</strong>.
			</h2>
		</div>

		<ConsultoriaVideoPlayer />

		<button
			type="button"
			class="flex h-[52px] w-full items-center justify-center rounded-challenge bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
		>
			Testar por 14 dias
		</button>
	</div>
</ChallengePageShell>
