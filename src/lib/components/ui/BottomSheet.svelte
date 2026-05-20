<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		/** Texto pequeno acima do título (ex.: "Opção 1") */
		subtitle?: string;
		title?: string;
		onClose: () => void;
		onSave?: () => void;
		/** Toolbar estilo iOS: X à esquerda, check à direita (sem título central) */
		toolbar?: boolean;
		/** Altura conforme o conteúdo (ex.: paywall) em vez de 80dvh fixo */
		autoHeight?: boolean;
		children?: Snippet;
		headerTrailing?: Snippet;
	}

	let {
		open,
		subtitle,
		title,
		onClose,
		onSave,
		toolbar = false,
		autoHeight = false,
		children,
		headerTrailing
	}: Props = $props();

	const CLOSE_MS = 280;

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
		if (!mounted) return;
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
		class="bottom-sheet-backdrop fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm"
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
			class="bottom-sheet-panel flex w-full max-w-none flex-col overflow-hidden rounded-t-[28px] px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] {autoHeight
				? 'h-auto max-h-[min(90dvh,100%)]'
				: 'h-[80dvh] max-h-[80dvh]'} {!toolbar ? 'bg-surface' : ''}"
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
			{:else if subtitle || title || headerTrailing}
				<div class="mb-2.5 flex shrink-0 items-start justify-between gap-3">
					<div class="min-w-0 flex flex-col gap-0.5">
						{#if subtitle}
							<p class="text-[10px] font-medium uppercase tracking-wide text-muted">{subtitle}</p>
						{/if}
						{#if title}
							<h2 id="bottom-sheet-title" class="text-lg font-extrabold text-heading leading-tight">
								{title}
							</h2>
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
				class="min-h-0 overflow-y-auto overscroll-contain {autoHeight ? '' : 'flex-1'}"
			>
				{@render children?.()}
			</div>
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
