<script lang="ts">
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { profileStore } from '$lib/stores/profile.store';
	import { authStore } from '$lib/stores/auth.store';

	interface Props {
		class?: string;
		light?: boolean;
	}

	let { class: className = '', light = false }: Props = $props();

	const defaultLabel = 'Usuário';

	const displayName = $derived.by(() => {
		const profileName = $profileStore.firstName?.trim();
		if (profileName) return profileName;

		const quizName = $postQuizStore.name?.trim();
		if (quizName) return quizName.split(/\s+/)[0] ?? defaultLabel;

		const email = $authStore.user?.email;
		if (email) return email.split('@')[0];

		return defaultLabel;
	});

	const firstName = $derived.by(() => displayName.split(/\s+/)[0] ?? defaultLabel);

	/** "Maria Silva" → MS, "Pedro" → PE */
	const initials = $derived.by(() => {
		const n = displayName;
		if (n === defaultLabel) return 'U';
		const words = n.split(/\s+/).filter(Boolean);
		if (words.length >= 2) {
			return (words[0][0] + words[words.length - 1][0]).toUpperCase();
		}
		const two = n.slice(0, 2).toUpperCase();
		return two || 'U';
	});

	const todayLabel = $derived.by(() => {
		const now = new Date();
		const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(now);
		const date = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' }).format(now);
		const label = `${weekday}, ${date}`;
		return label.charAt(0).toUpperCase() + label.slice(1);
	});
</script>

<header class="flex w-full items-center justify-between gap-3 {className}">
	<div class="min-w-0 flex-1">
		<p class="text-sm font-bold leading-tight {light ? 'text-white' : 'text-heading'}">
			Olá, <span class={light ? 'text-white/80' : 'text-accent'}>{displayName}</span>!
		</p>
		<p class="mt-0.5 text-[12px] font-light leading-tight {light ? 'text-white/70' : 'text-heading'}">{todayLabel}</p>
	</div>
	<a
		href="/perfil"
		class="flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-accent text-sm font-extrabold text-bg transition-opacity active:opacity-70"
		aria-label="Perfil de {firstName}"
	>
		{#if $profileStore.photoDataUrl}
			<img src={$profileStore.photoDataUrl} alt="" class="h-full w-full object-cover" aria-hidden="true" />
		{:else}
			<span class="flex h-full w-full items-center justify-center">{initials}</span>
		{/if}
	</a>
</header>
