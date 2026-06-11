<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy, onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import animationData from '$lib/assets/plan-bonus-gift.json';
	import { postQuizStore } from '$lib/stores/post-quiz.store';

	const HEADLINE_DELAY_MS = 3000;
	const COUPON_STAGGER_MS = 180;

	let giftEl: HTMLDivElement | null = $state(null);
	let anim: { destroy: () => void } | null = null;
	let showHeadline = $state(false);
	let showCoupon = $state(false);

	function firstThreeNameLetters(name: string): string {
		const letters = name
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.replace(/[^a-zA-Z]/g, '')
			.toUpperCase();
		return (letters + 'XXX').slice(0, 3);
	}

	function firstThreeWaDigits(whatsapp: string): string {
		const raw = whatsapp.replace(/\D/g, '');
		const national = raw.startsWith('55') && raw.length > 2 ? raw.slice(2) : raw;
		const digits = national.replace(/\D/g, '');
		return (digits + '000').slice(0, 3);
	}

	const couponCode = $derived.by(() => {
		const name = ($postQuizStore.name || '').trim();
		const wa = $postQuizStore.whatsapp || '';
		return `${firstThreeNameLetters(name)}${firstThreeWaDigits(wa)}`;
	});

	onMount(() => {
		const headlineTimer = setTimeout(() => {
			showHeadline = true;
		}, HEADLINE_DELAY_MS);
		const couponTimer = setTimeout(() => {
			showCoupon = true;
		}, HEADLINE_DELAY_MS + COUPON_STAGGER_MS);

		if (browser && giftEl) {
			const data = JSON.parse(JSON.stringify(animationData)) as object;
			void (async () => {
				const mod = await import('lottie-web');
				const lottie = mod.default ?? mod;
				anim = lottie.loadAnimation({
					container: giftEl,
					renderer: 'svg',
					loop: true,
					autoplay: true,
					animationData: data
				});
			})().catch(() => {});
		}

		return () => {
			clearTimeout(headlineTimer);
			clearTimeout(couponTimer);
		};
	});

	onDestroy(() => {
		anim?.destroy();
		anim = null;
	});
</script>

<div
	class="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-start gap-6 text-center min-h-0"
>
	<div
		class="mx-auto size-44 shrink-0 sm:size-52"
		bind:this={giftEl}
		in:fade={{ duration: 400, easing: cubicOut }}
		aria-hidden="true"
	></div>

	{#if showHeadline}
		<h2
			class="max-w-md px-1 text-2xl font-medium text-heading leading-[24px] text-balance [&_strong]:font-extrabold"
			in:fly={{ y: 14, duration: 500, easing: cubicOut }}
		>
			Você recebeu mais <strong>20% de desconto</strong> para acessar o seu protocolo agora.
		</h2>
	{/if}

	{#if showCoupon}
	<div
		class="w-full max-w-sm mx-auto flex flex-col gap-2 text-left"
		in:fly={{ y: 14, duration: 500, easing: cubicOut }}
	>
		<label class="text-xs font-semibold uppercase tracking-wide text-muted" for="bonus-coupon-display">
			Cupom de desconto
		</label>
		<div
			id="bonus-coupon-display"
			class="relative flex h-[60px] items-center rounded-xl border-2 border-dashed border-accent bg-surface px-4 py-3 shadow-sm"
			role="status"
			aria-live="polite"
			aria-label={`Cupom de desconto ${couponCode}`}
		>
			<span
				class="font-mono text-xl font-bold tracking-[0.18em] text-heading tabular-nums sm:text-2xl"
				aria-hidden="true"
			>
				{couponCode}
			</span>
			<span
				class="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm"
				role="img"
				aria-label="Cupom válido"
			>
				<svg class="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.003L3.29 9.257a1 1 0 1 1 1.415-1.414l4.04 4.04 6.543-6.594a1 1 0 0 1 1.416 0Z"
						clip-rule="evenodd"
					/>
				</svg>
			</span>
		</div>
	</div>
	{/if}
</div>
