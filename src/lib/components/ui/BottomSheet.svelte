<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		onClose: () => void;
		children?: Snippet;
	}

	let { open, title, onClose, children }: Props = $props();

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
			class="bottom-sheet-panel flex h-[80dvh] max-h-[80dvh] w-full max-w-none flex-col overflow-hidden rounded-t-[28px] bg-surface px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
			class:bottom-sheet-panel--closing={closing}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-line" aria-hidden="true"></div>

			{#if title}
				<h2 id="bottom-sheet-title" class="shrink-0 text-lg font-extrabold text-heading">{title}</h2>
			{/if}

			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
	.bottom-sheet-panel {
		animation: bottom-sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
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
