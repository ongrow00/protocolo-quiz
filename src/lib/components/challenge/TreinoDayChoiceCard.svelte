<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { profileStore } from '$lib/stores/profile.store';

	interface Props {
		onTrain: () => void;
		onRest: () => void;
	}

	let { onTrain, onRest }: Props = $props();

	const defaultLabel = 'Usuário';

	const firstName = $derived.by(() => {
		const profileName = $profileStore.firstName?.trim();
		if (profileName) return profileName.split(/\s+/)[0] ?? defaultLabel;

		const quizName = $postQuizStore.name?.trim();
		if (quizName) return quizName.split(/\s+/)[0] ?? defaultLabel;

		const email = $authStore.user?.email;
		if (email) return email.split('@')[0] ?? defaultLabel;

		return defaultLabel;
	});
</script>

<div class="mx-auto flex w-full max-w-xs flex-col items-center px-4 text-center">
	<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-line/20">
		<svg
			class="h-6 w-6 text-accent"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M6.5 6.5h2v11h-2zM15.5 6.5h2v11h-2z" />
			<path d="M8.5 12h7" />
		</svg>
	</div>
	<h2 class="text-base font-bold leading-snug text-heading">
		O que você deseja fazer hoje, {firstName}?
	</h2>
	<p class="mt-2 text-sm leading-relaxed text-body">
		Escolha se vai treinar hoje ou seguir com um dia de descanso do protocolo.
	</p>

	<div
		class="mt-6 flex h-11 w-full overflow-hidden rounded-challenge border-2 border-line bg-surface"
		role="group"
		aria-label="Escolha treinar ou descansar"
	>
		<button
			type="button"
			onclick={onRest}
			class="flex min-w-0 flex-1 items-center justify-center px-3 text-sm font-semibold text-heading transition-all active:scale-[0.98] hover:bg-surface-2/80"
		>
			Descansar
		</button>
		<div class="w-px shrink-0 self-stretch bg-line" aria-hidden="true"></div>
		<button
			type="button"
			onclick={onTrain}
			class="flex min-w-0 flex-1 items-center justify-center bg-accent px-3 text-sm font-bold text-bg transition-all active:scale-[0.98] hover:bg-accent-dark"
		>
			Treinar
		</button>
	</div>
</div>
