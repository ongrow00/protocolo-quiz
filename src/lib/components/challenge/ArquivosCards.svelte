<script lang="ts">
	import { browser } from '$app/environment';
	import { postQuizStore } from '$lib/stores/post-quiz.store';
	import { profileStore } from '$lib/stores/profile.store';
	import { generateProtocolPdf } from '$lib/services/protocol-pdf.service';

	const WEEKEND_GUIDE_PDF_URL = '/docs/guia-final-de-semana.pdf';

	let printing = $state(false);

	const printName = $derived(
		$profileStore.firstName?.trim() || $postQuizStore.name?.trim().split(/\s+/)[0] || undefined
	);

	async function downloadProtocolPdf() {
		if (printing) return;
		printing = true;
		try {
			await generateProtocolPdf({ userName: printName });
		} catch (err) {
			console.error('Falha ao gerar o PDF do protocolo', err);
		} finally {
			printing = false;
		}
	}

	function openWeekendGuidePdf() {
		if (!browser) return;
		window.open(WEEKEND_GUIDE_PDF_URL, '_blank', 'noopener,noreferrer');
	}
</script>

<div class="flex flex-col gap-3">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="button"
		tabindex="0"
		aria-busy={printing}
		class="flex flex-col overflow-hidden rounded-challenge border border-challenge-border bg-surface text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
		onclick={() => void downloadProtocolPdf()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				void downloadProtocolPdf();
			}
		}}
	>
		<div class="flex flex-col gap-3 p-5 pb-3">
			<span class="flex items-center gap-2 text-sm font-extrabold text-heading">
				<svg
					class="h-[1em] w-[1em] shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M6 9V2h12v7" />
					<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
					<path d="M6 14h12v8H6z" />
				</svg>
				Imprimir protocolo
			</span>
			<p class="text-xs leading-relaxed text-body">
				Geramos um PDF do seu protocolo para você baixar e imprimir em casa quando quiser.
			</p>
		</div>
		<span class="flex items-center gap-1 border-t border-line/40 px-5 py-3 text-xs font-bold text-accent">
			{#if printing}
				Gerando PDF…
				<svg
					class="h-3.5 w-3.5 animate-spin"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="M21 12a9 9 0 1 1-6.219-8.56" />
				</svg>
			{:else}
				Imprimir agora
				<svg
					class="h-3.5 w-3.5"
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
			{/if}
		</span>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="button"
		tabindex="0"
		class="flex flex-col overflow-hidden rounded-challenge border border-challenge-border bg-surface text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
		onclick={openWeekendGuidePdf}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openWeekendGuidePdf();
			}
		}}
	>
		<div class="flex flex-col gap-3 p-5 pb-3">
			<span class="flex items-center gap-2 text-sm font-extrabold text-heading">
				<svg
					class="h-[1em] w-[1em] shrink-0"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
				</svg>
				Guia de Final de Semana
			</span>
			<p class="text-xs leading-relaxed text-body">
				Acesse seu guia e entenda como aproveitar seus momentos especiais, comendo o que gosta sem
				sair do plano.
			</p>
		</div>
		<span class="flex items-center gap-1 border-t border-line/40 px-5 py-3 text-xs font-bold text-accent">
			Acessar agora
			<svg
				class="h-3.5 w-3.5"
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
		</span>
	</div>
</div>
