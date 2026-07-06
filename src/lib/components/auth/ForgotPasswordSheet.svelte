<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import OtpInput from '$lib/components/auth/OtpInput.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { mapAuthError } from '$lib/utils/auth-errors';

	type Step = 'email' | 'code' | 'password';

	interface Props {
		open: boolean;
		initialEmail?: string;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { open, initialEmail = '', onClose, onSuccess }: Props = $props();

	let step = $state<Step>('email');
	let resetEmail = $state('');
	let code = $state('');
	let novaSenha = $state('');
	let confirmarSenha = $state('');
	let senhaVisible = $state(false);
	let confirmarVisible = $state(false);
	let error = $state('');
	let loading = $state(false);
	let recoverySessionActive = $state(false);
	let recoveryComplete = $state(false);

	const inputClass =
		'w-full border-0 border-b border-line bg-transparent py-2.5 text-base text-heading outline-none transition-colors placeholder:text-muted/60 focus:border-accent';

	const sheetTitle = $derived(
		step === 'email'
			? 'Recuperar senha'
			: step === 'code'
				? 'Verificar código'
				: 'Nova senha'
	);

	function resetState() {
		step = 'email';
		resetEmail = '';
		code = '';
		novaSenha = '';
		confirmarSenha = '';
		senhaVisible = false;
		confirmarVisible = false;
		error = '';
		loading = false;
		recoverySessionActive = false;
		recoveryComplete = false;
	}

	async function close() {
		if (recoverySessionActive && !recoveryComplete) {
			await authStore.signOut().catch(() => {});
		}
		onClose();
	}

	$effect(() => {
		if (!open) {
			resetState();
			return;
		}
		if (initialEmail.trim()) resetEmail = initialEmail.trim();
	});

	function handleBack() {
		error = '';
		if (step === 'code') step = 'email';
		else if (step === 'password') step = 'code';
	}

	async function handleEmailSubmit(e: Event) {
		e.preventDefault();
		error = '';
		const trimmed = resetEmail.trim();
		if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			error = 'Informe um e-mail válido.';
			return;
		}
		resetEmail = trimmed;
		loading = true;
		try {
			await authStore.requestPasswordReset(resetEmail);
			step = 'code';
		} catch (err) {
			error = mapAuthError(err);
		} finally {
			loading = false;
		}
	}

	async function handleCodeSubmit(e: Event) {
		e.preventDefault();
		error = '';
		if (code.length !== 6) {
			error = 'Digite o código de 6 dígitos.';
			return;
		}
		loading = true;
		try {
			await authStore.verifyRecoveryOtp(resetEmail, code);
			recoverySessionActive = true;
			step = 'password';
		} catch (err) {
			error = mapAuthError(err);
		} finally {
			loading = false;
		}
	}

	async function handlePasswordSubmit(e: Event) {
		e.preventDefault();
		error = '';
		if (novaSenha.length < 6) {
			error = 'A senha deve ter pelo menos 6 caracteres.';
			return;
		}
		if (novaSenha !== confirmarSenha) {
			error = 'As senhas não coincidem.';
			return;
		}
		loading = true;
		try {
			await authStore.updatePassword(novaSenha);
			recoveryComplete = true;
			await close();
			onSuccess?.();
		} catch (err) {
			error = mapAuthError(err);
		} finally {
			loading = false;
		}
	}

	async function resendCode() {
		error = '';
		loading = true;
		try {
			await authStore.requestPasswordReset(resetEmail);
			code = '';
		} catch (err) {
			error = mapAuthError(err);
		} finally {
			loading = false;
		}
	}
</script>

<BottomSheet open={open} title={sheetTitle} onClose={close}>
	{#if step !== 'email'}
		<button
			type="button"
			onclick={handleBack}
			class="mb-3 flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-heading"
		>
			<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
				<path
					d="M10 3 L5 8 L10 13"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Voltar
		</button>
	{/if}

	{#if step === 'email'}
		<p class="text-sm leading-relaxed text-muted">
			Digite o e-mail da sua compra. Enviaremos um código de 6 dígitos para você criar uma nova
			senha.
		</p>

		<form class="mt-6 flex flex-col gap-[15px]" onsubmit={handleEmailSubmit}>
			<div class="flex flex-col gap-1">
				<label for="reset-email" class="text-xs font-medium text-muted">E-mail</label>
				<input
					id="reset-email"
					type="email"
					name="email"
					autocomplete="email"
					bind:value={resetEmail}
					class={inputClass}
					disabled={loading}
				/>
			</div>

			{#if error}
				<p class="text-sm text-red-600" role="alert">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="mt-1 flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
			>
				{loading ? 'Enviando…' : 'Enviar código'}
			</button>
		</form>
	{:else if step === 'code'}
		<p class="text-sm leading-relaxed text-muted">
			Digite o código de 6 dígitos que enviamos para
			<span class="font-semibold text-heading">{resetEmail}</span>.
		</p>

		<form class="mt-6 flex flex-col gap-6" onsubmit={handleCodeSubmit}>
			<div class="flex flex-col gap-3">
				{#key resetEmail}
					<OtpInput id="reset-otp" value={code} oninput={(v) => (code = v)} />
				{/key}
				<p class="rounded-xl bg-accent-soft px-3 py-2.5 text-center text-xs leading-relaxed text-muted">
					Confira no lixo eletrônico.
				</p>
			</div>

			{#if error}
				<p class="text-center text-sm text-red-600" role="alert">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading || code.length !== 6}
				class="flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
			>
				{loading ? 'Verificando…' : 'Continuar'}
			</button>

			<button
				type="button"
				disabled={loading}
				onclick={resendCode}
				class="text-center text-sm text-muted underline underline-offset-2 transition-colors hover:text-heading disabled:opacity-60"
			>
				Reenviar código
			</button>
		</form>
	{:else}
		<p class="text-sm leading-relaxed text-muted">
			Crie uma nova senha para a sua conta.
		</p>

		<form class="mt-6 flex flex-col gap-[15px]" onsubmit={handlePasswordSubmit}>
			<div class="flex flex-col gap-1">
				<label for="reset-nova-senha" class="text-xs font-medium text-muted">Nova senha</label>
				<div class="relative">
					<input
						id="reset-nova-senha"
						type={senhaVisible ? 'text' : 'password'}
						name="password"
						autocomplete="new-password"
						bind:value={novaSenha}
						class="{inputClass} pr-10"
						disabled={loading}
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

			<div class="flex flex-col gap-1">
				<label for="reset-confirmar-senha" class="text-xs font-medium text-muted"
					>Confirmar senha</label
				>
				<div class="relative">
					<input
						id="reset-confirmar-senha"
						type={confirmarVisible ? 'text' : 'password'}
						name="password-confirm"
						autocomplete="new-password"
						bind:value={confirmarSenha}
						class="{inputClass} pr-10"
						disabled={loading}
					/>
					<button
						type="button"
						onclick={() => {
							confirmarVisible = !confirmarVisible;
						}}
						class="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted/50 transition-colors hover:text-muted"
						aria-label={confirmarVisible ? 'Ocultar senha' : 'Mostrar senha'}
					>
						{#if confirmarVisible}
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

			{#if error}
				<p class="text-sm text-red-600" role="alert">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="mt-1 flex h-[52px] w-full items-center justify-center rounded-2xl bg-accent text-base font-bold text-bg transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
			>
				{loading ? 'Salvando…' : 'Redefinir senha'}
			</button>
		</form>
	{/if}
</BottomSheet>
