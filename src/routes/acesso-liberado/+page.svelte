<script lang="ts">
	import { onMount } from 'svelte';
	import Logo from '$lib/components/ui/Logo.svelte';
	import OfferHeroProgress from '$lib/components/post-quiz/OfferHeroProgress.svelte';

	const ACESSO_PROGRESS = {
		/** Acima do total de passos — todos concluídos (liberado). */
		currentStep: 5,
		steps: [
			{ label: 'Anamnese' },
			{ label: 'Pagamento' },
			{ label: 'Acesso' },
			{ label: 'Liberação' }
		]
	} as const;

	let { data } = $props();

	const firstName = $derived.by(() => {
		if (!data.nome?.trim()) return '';
		return data.nome.trim().split(/\s+/)[0] ?? '';
	});

	let ready = $state(false);
	onMount(() => {
		requestAnimationFrame(() => requestAnimationFrame(() => { ready = true; }));
	});

	let emailCopied = $state(false);
	let senhaCopied = $state(false);
	let senhaVisible = $state(false);

	async function copy(text: string, flag: 'email' | 'senha') {
		await navigator.clipboard.writeText(text);
		if (flag === 'email') {
			emailCopied = true;
			setTimeout(() => { emailCopied = false; }, 2000);
		} else {
			senhaCopied = true;
			setTimeout(() => { senhaCopied = false; }, 2000);
		}
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- Fixed header -->
<header class="fixed top-0 left-0 right-0 z-10 h-14 flex items-center justify-center bg-bg/90 backdrop-blur-sm border-b border-line/40">
	<Logo />
</header>

<main class="flex-1 w-full flex flex-col items-center px-4 pb-4 bg-bg" style="padding-top: calc(3.5rem + 2.5rem)">
	<div
		class="w-full max-w-sm flex flex-1 flex-col gap-5 page-wrap"
		class:page-ready={ready}
	>

		<!-- Progresso — igual à página de ativação, todos liberados -->
		<div class="anim-item w-full" style="--i:0">
			<div class="mb-3 w-full rounded-2xl border border-line/40 bg-surface p-4">
				<OfferHeroProgress
					currentStep={ACESSO_PROGRESS.currentStep}
					steps={ACESSO_PROGRESS.steps}
				/>
			</div>
		</div>

		<!-- Headline -->
		<div class="anim-item flex flex-col items-center text-center gap-0" style="--i:1">
			<h1 class="text-2xl font-extrabold text-heading">
				{firstName ? `Bem-vindo, ${firstName}!` : 'Seu acesso está completo'}
			</h1>
			<p class="text-sm text-muted mt-1 leading-relaxed">
				Suas credenciais de acesso estão prontas. Utilize os dados abaixo para acessar o aplicativo e iniciar o seu protocolo de desbloqueio.
			</p>
		</div>

		<!-- Credentials — Apple grouped list -->
		<div class="anim-item flex flex-col gap-2" style="--i:2">
			<p class="text-[11px] font-semibold text-muted uppercase tracking-[0.1em] px-1">
				Seus dados de acesso
			</p>
			<div class="rounded-2xl bg-surface border border-line overflow-hidden">

				<!-- E-mail row -->
				<div class="flex items-center px-4 py-3.5 gap-3">
					<div class="flex flex-col flex-1 min-w-0">
						<span class="text-[11px] text-muted">E-mail</span>
						<span class="text-sm font-medium text-heading truncate mt-0.5 select-all">{data.email || '—'}</span>
					</div>
					{#if data.email}
						<button
							type="button"
							onclick={() => copy(data.email, 'email')}
							class="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-colors {emailCopied ? 'text-accent' : 'text-muted/50 hover:text-muted'}"
							aria-label="Copiar e-mail"
						>
							{#if emailCopied}
								<!-- Check icon when copied -->
								<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<path d="M3 8.5 L6.5 12 L13 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							{:else}
								<!-- Copy icon -->
								<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
									<rect x="5.5" y="1.5" width="9" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/>
									<path d="M3.5 4.5H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
								</svg>
							{/if}
						</button>
					{/if}
				</div>

				<!-- Divider -->
				<div class="h-px bg-line/60 ml-4"></div>

				<!-- Senha row -->
				<div class="flex items-center px-4 py-3.5 gap-3">
					<div class="flex flex-col flex-1 min-w-0">
						<span class="text-[11px] text-muted">Senha</span>
						<span class="text-sm font-medium text-heading mt-0.5 tracking-wider select-all">
							{senhaVisible ? (data.senha || '—') : '•'.repeat(Math.min((data.senha || '').length || 8, 10))}
						</span>
					</div>
					{#if data.senha}
						<div class="flex items-center gap-1 shrink-0">
							<!-- Show/hide toggle -->
							<button
								type="button"
								onclick={() => { senhaVisible = !senhaVisible; }}
								class="flex items-center justify-center w-8 h-8 rounded-xl text-muted/50 hover:text-muted transition-colors"
								aria-label={senhaVisible ? 'Ocultar senha' : 'Mostrar senha'}
							>
								{#if senhaVisible}
									<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
										<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.4"/>
										<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
										<path d="M2 2 L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
									</svg>
								{:else}
									<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
										<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.4"/>
										<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/>
									</svg>
								{/if}
							</button>
							<!-- Copy -->
							<button
								type="button"
								onclick={() => copy(data.senha, 'senha')}
								class="flex items-center justify-center w-8 h-8 rounded-xl transition-colors {senhaCopied ? 'text-accent' : 'text-muted/50 hover:text-muted'}"
								aria-label="Copiar senha"
							>
								{#if senhaCopied}
									<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
										<path d="M3 8.5 L6.5 12 L13 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								{:else}
									<svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
										<rect x="5.5" y="1.5" width="9" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/>
										<path d="M3.5 4.5H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
									</svg>
								{/if}
							</button>
						</div>
					{/if}
				</div>

			</div>
		</div>

		<!-- CTA -->
		<div class="anim-item w-full" style="--i:3">
			<a
				href={data.appUrl || '/inicio'}
				target={data.appUrl ? '_blank' : undefined}
				rel={data.appUrl ? 'noopener noreferrer' : undefined}
				class="flex w-full h-[60px] items-center justify-center gap-2 rounded-2xl bg-accent text-bg font-bold text-base transition-all duration-200 hover:bg-accent-dark active:scale-[0.98] shadow-md shadow-accent/15"
			>
				Acessar Aplicativo
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
				</svg>
			</a>
		</div>

		<!-- Suporte — fixo na parte inferior -->
		<div class="anim-item w-full mt-auto" style="--i:4">
			<div class="flex items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3.5">
				<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
					<svg class="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
					</svg>
				</div>
				<div class="flex flex-col min-w-0 flex-1">
					<span class="text-sm font-semibold text-heading leading-tight">Precisa de ajuda?</span>
					<span class="text-xs text-muted leading-snug mt-0.5">Fale com nosso time no WhatsApp</span>
				</div>
				<a
					href="https://wa.me/5511999999999"
					target="_blank"
					rel="noopener noreferrer"
					class="shrink-0 text-xs font-bold text-accent hover:underline underline-offset-2"
					aria-label="Falar com suporte via WhatsApp"
				>
					Falar →
				</a>
			</div>
		</div>

	</div>
</main>

<style>
	.anim-item {
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: calc(var(--i, 0) * 110ms);
	}
	.page-ready .anim-item {
		opacity: 1;
		transform: translateY(0);
	}
</style>
