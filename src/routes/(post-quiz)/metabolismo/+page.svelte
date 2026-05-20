<script lang="ts">
	import MetabolismoGauge from '$lib/components/post-quiz/MetabolismoGauge.svelte';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { quizStore } from '$lib/stores/quiz.store';

	const quiz = $derived($quizStore);
	const name = $derived($postQuizStore.name);

	const firstName = $derived.by(() => {
		const trimmed = name.trim();
		if (!trimmed) return '';
		return trimmed.split(/\s+/)[0] ?? trimmed;
	});

	const goalKgLabel = $derived.by(() => {
		const raw = quiz.answers['weight_goal_kg'];
		if (raw == null) return null;
		const n =
			typeof raw === 'string' ? parseFloat(raw) : Array.isArray(raw) ? parseFloat(String(raw[0])) : NaN;
		return Number.isFinite(n) ? Math.round(n) : null;
	});

	const BLOQUEIO_SESSION_KEY = 'pd-metabolismo-bloqueio-pct';

	function getOrCreateBloqueioPct(): number {
		const raw = sessionStorage.getItem(BLOQUEIO_SESSION_KEY);
		if (raw != null) {
			const n = Number.parseInt(raw, 10);
			if (n >= 83 && n <= 89) return n;
		}
		const n = 83 + Math.floor(Math.random() * 7);
		sessionStorage.setItem(BLOQUEIO_SESSION_KEY, String(n));
		return n;
	}

	let bloqueioPct = $state(getOrCreateBloqueioPct());
</script>

<div class="flex w-full flex-col gap-6">
	<div class="w-full space-y-3 text-center">
		<h2 class="text-2xl font-medium text-heading leading-[24px] [&_strong]:font-extrabold">
			{#if firstName}
				<strong>{firstName}</strong>, seu metabolismo está
				<strong class="whitespace-nowrap">{bloqueioPct}% bloqueado</strong>.
			{:else}
				Seu metabolismo está <strong class="whitespace-nowrap">{bloqueioPct}% bloqueado</strong>.
			{/if}
		</h2>
		<p class="text-body text-sm leading-[14px] mt-[10px] mb-[25px] [&_strong]:font-extrabold">
			{#if goalKgLabel != null}
				Seu protocolo irá <strong>desbloquear</strong> o seu <strong>metabolismo</strong> para que você alcance
				seu objetivo de <span class="text-accent font-extrabold">{goalKgLabel}kg</span> até o dia
				<strong>14</strong> no seu <strong>protocolo</strong>.
			{:else}
				Seu protocolo irá <strong>desbloquear</strong> o seu <strong>metabolismo</strong> para que você alcance
				<strong>sua meta de peso</strong> até o dia <strong>14</strong> no seu <strong>protocolo</strong>.
			{/if}
		</p>
	</div>

	<MetabolismoGauge percent={bloqueioPct} />
</div>
