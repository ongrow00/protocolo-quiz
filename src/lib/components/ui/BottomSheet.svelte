<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		/** Texto pequeno acima do título (ex.: "Opção 1") */
		subtitle?: string;
		title?: string;
		/** Texto logo abaixo do título */
		titleDetail?: string;
		onClose: () => void;
		onSave?: () => void;
		/** Toolbar estilo iOS: X à esquerda, check à direita (sem título central) */
		toolbar?: boolean;
		/** Altura conforme o conteúdo (ex.: paywall) em vez de altura fixa */
		autoHeight?: boolean;
		/** Altura do painel em % da viewport (padrão 80) */
		heightPercent?: number;
		/** Acima de outro bottom sheet (z-index maior) */
		elevated?: boolean;
		/** Empilhado sobre outro sheet: sobe por cima, altura ~10% menor (largura 100%) para indicar camadas */
		stacked?: boolean;
		/** Bloqueia scroll do body (desligado automaticamente em sheets empilhados) */
		lockBodyScroll?: boolean;
		/** Permite rolagem vertical do conteúdo (desligado quando o layout preenche o painel) */
		scrollable?: boolean;
		/** Conteúdo edge-to-edge na horizontal (sem px-6 no painel) */
		contentFlush?: boolean;
		/** Remove padding inferior do painel (ex.: player de vídeo edge-to-edge) */
		flushBottom?: boolean;
		/** Remove a sombra do painel */
		noShadow?: boolean;
		children?: Snippet;
		headerTrailing?: Snippet;
		footer?: Snippet;
	}

	let {
		open,
		subtitle,
		title,
		titleDetail,
		onClose,
		onSave,
		toolbar = false,
		autoHeight = false,
		heightPercent = 80,
		elevated = false,
		stacked = false,
		lockBodyScroll = !stacked,
		scrollable = true,
		contentFlush = false,
		flushBottom = false,
		noShadow = false,
		children,
		headerTrailing,
		footer
	}: Props = $props();

	const CLOSE_MS = 280;

	const panelHeightPercent = $derived(
		stacked && !autoHeight ? heightPercent * 0.9 : heightPercent
	);

	let mounted = $state(false);
	let closing = $state(false);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	function clearCloseTimer() {
		if (closeTimer !== undefined) {
			clearTimeout(closeTimer);
			closeTimer = undefined;
		}
	}

	function dismiss(notifyParent: boolean) {
		if (!mounted || closing) return;
		closing = true;
		clearCloseTimer();
		closeTimer = setTimeout(() => {
			mounted = false;
			closing = false;
			closeTimer = undefined;
			if (notifyParent) onClose();
		}, CLOSE_MS);
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) dismiss(true);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') dismiss(true);
	}

	$effect(() => {
		if (open) {
			if (!closing) {
				clearCloseTimer();
				mounted = true;
			}
			return;
		}
		if (mounted && !closing) dismiss(false);
	});

	$effect(() => {
		if (!mounted || !lockBodyScroll) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	$effect(() => () => clearCloseTimer());
</script>

{#if mounted}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="bottom-sheet-backdrop fixed inset-0 flex h-dvh flex-col justify-end backdrop-blur-sm {stacked
			? 'bg-black/25'
			: 'bg-black/40'} {elevated || stacked ? 'z-[60]' : 'z-50'}"
		class:bottom-sheet-backdrop--closing={closing}
		role="presentation"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			aria-labelledby={title ? 'bottom-sheet-title' : undefined}
			class="bottom-sheet-panel flex w-full max-w-none flex-col overflow-x-hidden overflow-hidden rounded-t-[28px] {flushBottom
				? 'pb-0'
				: 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]'} pt-3 {noShadow
				? ''
				: 'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]'} {contentFlush
				? 'px-0'
				: 'px-6'} {autoHeight
				? 'h-auto max-h-[min(90dvh,100%)]'
				: 'min-h-0'} {!toolbar ? 'bg-surface' : ''}"
			style={autoHeight
				? undefined
				: `height: ${panelHeightPercent}%; max-height: ${panelHeightPercent}%`}
			class:bottom-sheet-panel--toolbar={toolbar}
			class:bottom-sheet-panel--closing={closing}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line" aria-hidden="true"></div>

			{#if toolbar}
				<div class="mb-3 flex shrink-0 items-center justify-between">
					<button
						type="button"
						onclick={() => dismiss(true)}
						class="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-heading shadow-sm transition-colors active:bg-surface-2"
						aria-label="Fechar"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
							<path d="M6 6l12 12M18 6 6 18" />
						</svg>
					</button>
					<button
						type="button"
						onclick={() => onSave?.()}
						class="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-heading shadow-sm transition-colors active:bg-surface-2"
						aria-label="Salvar"
					>
						<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</button>
				</div>
			{:else if subtitle || title || titleDetail || headerTrailing}
				<div
					class="mb-[25px] flex shrink-0 items-start justify-between gap-3 {contentFlush
						? 'pl-[25px]'
						: ''}"
				>
					<div class="min-w-0 flex flex-col gap-0.5">
						{#if subtitle}
							<p class="text-[10px] font-medium uppercase tracking-wide text-muted">{subtitle}</p>
						{/if}
						{#if title}
							<h2 id="bottom-sheet-title" class="text-lg font-extrabold text-heading leading-tight">
								{title}
							</h2>
						{/if}
						{#if titleDetail}
							<p class="mt-1 text-xs font-medium text-muted">{titleDetail}</p>
						{/if}
					</div>
					{#if headerTrailing}
						<div class="shrink-0 pt-0.5">
							{@render headerTrailing()}
						</div>
					{/if}
				</div>
			{/if}

			<div
				class="min-h-0 overscroll-contain {autoHeight ? '' : 'flex-1'} {scrollable
					? 'overflow-y-auto'
					: 'flex flex-col overflow-hidden'}"
			>
				{@render children?.()}
			</div>

			{#if footer}
				<div class="shrink-0 overflow-x-hidden pt-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.bottom-sheet-panel {
		animation: bottom-sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
	}

	.bottom-sheet-panel--toolbar {
		background-color: var(--color-sheet-panel);
	}

	.bottom-sheet-panel--closing {
		animation: bottom-sheet-down 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
	}

	.bottom-sheet-backdrop {
		animation: bottom-sheet-backdrop-in 0.28s ease forwards;
	}

	.bottom-sheet-backdrop--closing {
		animation: bottom-sheet-backdrop-out 0.28s ease forwards;
	}

	@keyframes bottom-sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes bottom-sheet-down {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(100%);
		}
	}

	@keyframes bottom-sheet-backdrop-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes bottom-sheet-backdrop-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
</style>
