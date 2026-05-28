<script lang="ts">
	import ChallengePageShell from '$lib/components/challenge/ChallengePageShell.svelte';
	import ConsultoriaVideoPlayer from '$lib/components/challenge/ConsultoriaVideoPlayer.svelte';
	import AvatarStack from '$lib/components/ui/AvatarStack.svelte';
	import { CONSULTORIA_OFFER } from '$lib/data/consultoria-offer';
	import type { UtmParams } from '$lib/data/types';
	import { authStore } from '$lib/stores/auth.store';
	import { sessionStore } from '$lib/stores/session.store';
	import { loadProfileUtm } from '$lib/services/profile-utm.service';
	import { appendCheckoutParams, mergeUtmParams } from '$lib/utils/checkout-url';

	let profileUtm = $state<UtmParams>({});

	$effect(() => {
		const userId = $authStore.user?.id;
		if (!userId) {
			profileUtm = {};
			return;
		}
		let cancelled = false;
		void loadProfileUtm(userId).then((utm) => {
			if (!cancelled) profileUtm = utm;
		});
		return () => {
			cancelled = true;
		};
	});

	const checkoutUrl = $derived(
		appendCheckoutParams(CONSULTORIA_OFFER.checkoutUrl, {
			utm: mergeUtmParams($sessionStore.utm, profileUtm),
			extra: { src: CONSULTORIA_OFFER.checkoutSrc }
		})
	);
</script>

<ChallengePageShell>
	<div
		class="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-sm flex-col items-center justify-center gap-6 px-2 py-8"
	>
		<div class="w-full overflow-hidden rounded-[20px] border-[3px] border-white bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
			<ConsultoriaVideoPlayer />

			<div class="flex flex-col gap-3 px-5 pt-5 pb-4">
				<h2 class="text-[17px] font-bold leading-snug text-[#1a1a1a]">
					Tenha uma equipe completa ao seu lado durante os próximos 12 meses.
				</h2>
				<div class="flex flex-col gap-0.5 text-sm leading-snug text-[#4a4a4a]">
					<p><span class="text-[#999] line-through">R$3.564</span></p>
					<p>Por <strong class="text-[#1a1a1a]">12x de R$31,12</strong> <span class="text-[#6b6b6b]">ou R$297 à vista.</span></p>
				</div>
			</div>

			<div class="border-t border-black/[0.06] px-5 py-4">
				<p class="text-[13px] leading-relaxed text-[#4a4a4a]">
					Sed egestas libero urna, eget consequat elit fermentum eu. Cras non varius nibh. Nam non aliquam libero. Proin consectetur malesuada lacus et auctor.
				</p>
			</div>

			<div class="flex items-center justify-between border-t border-black/[0.06] px-5 py-3.5">
				<AvatarStack size="sm" variant="default" />
				<div class="flex items-center gap-1.5 text-[13px] font-medium text-[#6b6b6b]">
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
					</svg>
					<span>2569 pessoas</span>
				</div>
			</div>
		</div>

		<a
			href={checkoutUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="cta-shine relative flex h-[60px] w-full items-center justify-between gap-3 overflow-hidden rounded-challenge border-2 border-white bg-accent px-5 text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
		>
			<span class="relative z-[1]">Teste por 14 Dias</span>
			<svg
				class="relative z-[1] h-5 w-5 shrink-0"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M5 12h14M13 6l6 6-6 6" />
			</svg>
		</a>
	</div>
</ChallengePageShell>

<style>
	.cta-shine::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			105deg,
			transparent 0%,
			transparent 38%,
			rgba(255, 255, 255, 0.22) 50%,
			transparent 62%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: cta-shine 2.5s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes cta-shine {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cta-shine::after {
			animation: none;
		}
	}
</style>
