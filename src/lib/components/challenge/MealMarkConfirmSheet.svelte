<script lang="ts">
	interface Props {
		open: boolean;
		message: string;
		onClose: () => void;
		onConfirm: () => void;
	}

	let { open, message, onClose, onConfirm }: Props = $props();

	const titleId = 'meal-confirm-dialog-title';

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

	function handleNo() {
		dismiss(true);
	}

	function handleYes() {
		onConfirm();
		dismiss(true);
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
		class="meal-confirm-backdrop fixed inset-0 z-[60] flex flex-col justify-end bg-black/40 backdrop-blur-sm"
		class:meal-confirm-backdrop--closing={closing}
		role="presentation"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	>
		<div
			role="alertdialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="-1"
			class="meal-confirm-panel mx-2 mb-2 w-[calc(100%-1rem)] max-w-sm self-center rounded-2xl bg-surface/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:mx-auto"
			class:meal-confirm-panel--closing={closing}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<p id={titleId} class="px-2 pb-4 text-center text-[15px] font-medium leading-snug text-body">
				{message}
			</p>
			<div class="overflow-hidden rounded-xl bg-surface-2/80">
				<button
					type="button"
					onclick={handleYes}
					class="flex h-12 w-full items-center justify-center border-b border-line/80 text-base font-semibold text-accent transition-colors hover:bg-surface active:bg-line/30"
				>
					Sim
				</button>
				<button
					type="button"
					onclick={handleNo}
					class="flex h-12 w-full items-center justify-center text-base font-medium text-heading transition-colors hover:bg-surface active:bg-line/30"
				>
					Não
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.meal-confirm-panel {
		animation: meal-confirm-up 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
	}

	.meal-confirm-panel--closing {
		animation: meal-confirm-down 0.28s cubic-bezier(0.32, 0.72, 0, 1) forwards;
	}

	.meal-confirm-backdrop {
		animation: meal-confirm-backdrop-in 0.28s ease forwards;
	}

	.meal-confirm-backdrop--closing {
		animation: meal-confirm-backdrop-out 0.28s ease forwards;
	}

	@keyframes meal-confirm-up {
		from {
			transform: translateY(100%);
			opacity: 0.6;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes meal-confirm-down {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(100%);
			opacity: 0.6;
		}
	}

	@keyframes meal-confirm-backdrop-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes meal-confirm-backdrop-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
</style>
