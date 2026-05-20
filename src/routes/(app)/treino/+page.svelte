<script lang="ts">
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import TreinoPaywallSheet from '$lib/components/challenge/TreinoPaywallSheet.svelte';

	let paywallOpen = $state(false);
</script>

<ChallengePageShell>
	<div
		class="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-sm flex-col items-center justify-center gap-6 px-2 py-8 text-center"
	>
		<img
			src="/images/treino/dumbbells.png"
			alt="Halteres de treino"
			class="h-[180px] w-full max-w-[260px] object-contain"
			width="520"
			height="400"
			loading="lazy"
		/>

		<div class="flex flex-col gap-3">
			<h2 class="text-xl font-medium leading-none text-heading text-balance">
				Acelere até <strong class="font-extrabold">3x mais</strong> seu processo de
				<strong class="font-extrabold">emagrecimento</strong> com um
				<strong class="font-extrabold">treino feito para você</strong>
			</h2>
			<p class="text-sm leading-relaxed text-body text-balance">
				Receba um treino estratégico, adaptado ao seu nível e objetivo, para potencializar a queima de
				gordura, definir seu corpo nos próximos 14 dias.
			</p>
		</div>

		<button
			type="button"
			class="flex h-[52px] w-full max-w-sm items-center justify-center rounded-challenge bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
			onclick={() => (paywallOpen = true)}
		>
			Montar Agora
		</button>
	</div>
</ChallengePageShell>

<TreinoPaywallSheet open={paywallOpen} onClose={() => (paywallOpen = false)} />
