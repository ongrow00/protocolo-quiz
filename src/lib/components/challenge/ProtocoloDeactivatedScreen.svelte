<script lang="ts">
	import { RESULTS_OFFER } from '$lib/data/results-offer';
	import { loadAppCheckoutState } from '$lib/services/profile-utm.service';
	import { authStore } from '$lib/stores/auth.store';
	import { sessionStore } from '$lib/stores/session.store';
	import {
		buildAppCheckoutUrl,
		EMPTY_APP_CHECKOUT_STATE,
		type AppCheckoutState
	} from '$lib/utils/checkout-url';

	let checkoutState = $state<AppCheckoutState>(EMPTY_APP_CHECKOUT_STATE);

	$effect(() => {
		const user = $authStore.user;
		if (!user?.id) {
			checkoutState = EMPTY_APP_CHECKOUT_STATE;
			return;
		}
		let cancelled = false;
		void loadAppCheckoutState(user.id, user.email).then((state) => {
			if (!cancelled) checkoutState = state;
		});
		return () => {
			cancelled = true;
		};
	});

	const checkoutUrl = $derived(
		buildAppCheckoutUrl(RESULTS_OFFER.checkoutUrl, {
			sessionUtm: $sessionStore.utm,
			checkout: checkoutState
		})
	);
</script>

<div
	class="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-sm flex-col items-center justify-center gap-6 px-2 py-10 text-center"
>
	<div
		class="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent"
		aria-hidden="true"
	>
		<svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
			<circle cx="12" cy="12" r="9" />
			<path d="M12 8v5M12 16h.01" stroke-linecap="round" />
		</svg>
	</div>

	<div class="flex flex-col gap-2">
		<h1 class="text-xl font-extrabold text-heading">Seu plano foi desativado</h1>
		<p class="text-sm leading-relaxed text-muted">
			Entre em contato com o suporte ou contrate novamente para reativar seu Protocolo Desbloqueio.
		</p>
	</div>

	<div class="flex w-full flex-col gap-3">
		<a
			href={checkoutUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="flex h-[52px] w-full items-center justify-center rounded-challenge bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
		>
			Reativar protocolo — R$47
		</a>
	</div>
</div>
