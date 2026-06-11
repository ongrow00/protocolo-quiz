<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { TREINO_PAYWALL } from '$lib/data/treino-paywall';
	import { loadAppCheckoutState } from '$lib/services/profile-utm.service';
	import { authStore } from '$lib/stores/auth.store';
	import { sessionStore } from '$lib/stores/session.store';
	import {
		buildAppCheckoutUrl,
		EMPTY_APP_CHECKOUT_STATE,
		type AppCheckoutState
	} from '$lib/utils/checkout-url';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let checkoutState = $state<AppCheckoutState>(EMPTY_APP_CHECKOUT_STATE);

	$effect(() => {
		if (!open) return;
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

	const checkoutBaseUrl = $derived(
		import.meta.env.PUBLIC_CHECKOUT_URL || TREINO_PAYWALL.checkoutUrl
	);

	const checkoutUrl = $derived(
		checkoutBaseUrl
			? buildAppCheckoutUrl(checkoutBaseUrl, {
					sessionUtm: $sessionStore.utm,
					checkout: checkoutState,
					extra: { src: TREINO_PAYWALL.checkoutSrc }
				})
			: ''
	);

	const ctaLabel = $derived(`${TREINO_PAYWALL.ctaLabel} - ${TREINO_PAYWALL.priceLabel}`);
</script>

<BottomSheet {open} {onClose} autoHeight>
	<div class="flex flex-col gap-5 pb-1 text-center">
		<div class="overflow-hidden rounded-challenge bg-accent px-6 pt-5 pb-4">
			<img
				src="/images/treino/dumbbells.png"
				alt="Halteres de treino"
				class="mx-auto h-[140px] w-full max-w-[220px] object-contain"
				width="520"
				height="400"
				loading="lazy"
			/>
		</div>

		<h2
			id="treino-paywall-title"
			class="text-xl font-extrabold leading-tight text-heading text-balance"
		>
			{TREINO_PAYWALL.headline}
		</h2>

		<ul class="flex flex-col gap-4 text-left">
			{#each TREINO_PAYWALL.features as feature (feature.title)}
				<li class="flex items-start gap-3">
					<span
						class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-bg"
						aria-hidden="true"
					>
						<svg
							class="h-3 w-3"
							viewBox="0 0 16 16"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M3 8.5 L6.5 12 L13 5" />
						</svg>
					</span>
					<div class="flex min-w-0 flex-col gap-0.5">
						<span class="text-sm font-bold leading-snug text-heading">{feature.title}</span>
						<span class="text-xs leading-relaxed text-muted">{feature.subtitle}</span>
					</div>
				</li>
			{/each}
		</ul>

		<a
			href={checkoutUrl || '#'}
			target={checkoutUrl ? '_blank' : undefined}
			rel={checkoutUrl ? 'noopener noreferrer' : undefined}
			class="flex h-[52px] w-full items-center justify-center rounded-challenge bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
			onclick={(e) => {
				if (!checkoutUrl) e.preventDefault();
			}}
		>
			{ctaLabel}
		</a>
	</div>
</BottomSheet>
