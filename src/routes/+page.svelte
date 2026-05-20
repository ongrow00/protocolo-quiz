<script lang="ts">
	import { goto } from '$app/navigation';
	import ForgotPasswordSheet from '$lib/components/auth/ForgotPasswordSheet.svelte';
	import { challengeStore } from '$lib/stores/challenge.store';

	let email = $state('');
	let senha = $state('');
	let senhaVisible = $state(false);
	let forgotPasswordOpen = $state(false);

	function handleLogin(e: Event) {
		e.preventDefault();
		challengeStore.hydrate();
		challengeStore.ensureStarted();
		goto('/inicio');
	}
</script>

<svelte:head>
	<meta
		name="description"
		content="Acesse sua conta do Protocolo Desbloqueio com o e-mail e a senha da sua compra."
	/>
</svelte:head>

<div class="flex min-h-0 flex-1 flex-col bg-accent">
	<header class="flex h-[150px] shrink-0 items-center justify-center px-6">
		<img
			src="/pd-logo-color.svg"
			alt="Protocolo Desbloqueio"
			width="120"
			height="28"
			class="login-logo-white h-7 w-auto"
			decoding="async"
		/>
	</header>

	<section
		class="flex min-h-0 flex-1 flex-col rounded-t-[28px] bg-surface px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8"
	>
		<div class="mx-auto w-full max-w-sm">
			<h2 class="text-center text-2xl font-medium text-heading leading-[24px]">
				Bem-vinda ao seu protocolo
			</h2>
			<p class="mt-3 text-center text-sm leading-relaxed text-muted">
				Use o e-mail e a senha da sua compra para acessar sua conta e o Protocolo Desbloqueio.
			</p>

			<form class="mt-8 flex flex-col gap-[15px]" onsubmit={handleLogin}>
				<div class="flex flex-col gap-1">
					<label for="login-email" class="text-xs font-medium text-muted">E-mail</label>
					<input
						id="login-email"
						type="email"
						name="email"
						autocomplete="email"
						bind:value={email}
						class="w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-heading outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="login-senha" class="text-xs font-medium text-muted">Senha</label>
					<div class="relative">
						<input
							id="login-senha"
							type={senhaVisible ? 'text' : 'password'}
							name="password"
							autocomplete="current-password"
							bind:value={senha}
							class="w-full border-0 border-b border-line bg-transparent py-2.5 pr-10 text-base text-heading outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
						/>
						<button
							type="button"
							onclick={() => {
								senhaVisible = !senhaVisible;
							}}
							class="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted/50 transition-colors hover:text-muted"
							aria-label={senhaVisible ? 'Ocultar senha' : 'Mostrar senha'}
						>
							{#if senhaVisible}
								<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path
										d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
										stroke="currentColor"
										stroke-width="1.4"
									/>
									<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4" />
									<path
										d="M2 2 L14 14"
										stroke="currentColor"
										stroke-width="1.4"
										stroke-linecap="round"
									/>
								</svg>
							{:else}
								<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path
										d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"
										stroke="currentColor"
										stroke-width="1.4"
									/>
									<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					class="mt-2 flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
				>
					Entrar
				</button>
			</form>

			<p class="mt-4 text-center text-xs text-muted">
				Esqueceu sua senha?
				<button
					type="button"
					onclick={() => {
						forgotPasswordOpen = true;
					}}
					class="underline underline-offset-2 transition-colors hover:text-heading"
				>
					Recuperar senha
				</button>
			</p>

			<div class="mt-8 flex items-center gap-3">
				<span class="h-px flex-1 bg-line" aria-hidden="true"></span>
				<span class="shrink-0 text-xs text-muted">Ainda não tem protocolo?</span>
				<span class="h-px flex-1 bg-line" aria-hidden="true"></span>
			</div>

			<a
				href="/pan"
				class="mt-6 flex h-[52px] w-full items-center justify-center rounded-2xl border-2 border-line bg-surface text-base font-semibold text-muted transition-all duration-200 hover:border-accent/40 hover:text-heading active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
			>
				Criar meu protocolo
			</a>
		</div>
	</section>
</div>

<ForgotPasswordSheet
	open={forgotPasswordOpen}
	initialEmail={email}
	onClose={() => {
		forgotPasswordOpen = false;
	}}
/>

<style>
	.login-logo-white {
		filter: brightness(0) invert(1);
	}
</style>
