<script lang="ts">
	interface Props {
		open: boolean;
		message: string;
		submessage?: string;
		onClose: () => void;
	}

	let { open, message, submessage, onClose }: Props = $props();

	$effect(() => {
		if (!open) return;
		const t = setTimeout(onClose, 4000);
		return () => clearTimeout(t);
	});
</script>

{#if open}
	<div
		class="day-complete-toast fixed left-4 right-4 z-[60] mx-auto max-w-sm rounded-challenge border border-challenge-border bg-surface px-4 py-4"
		style="bottom: calc(5rem + env(safe-area-inset-bottom))"
		role="status"
		aria-live="polite"
	>
		<div class="flex items-start gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"
				aria-hidden="true"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-extrabold text-heading">{message}</p>
				{#if submessage}
					<p class="mt-0.5 text-xs text-muted">{submessage}</p>
				{/if}
			</div>
			<button
				type="button"
				onclick={onClose}
				class="shrink-0 text-muted hover:text-heading"
				aria-label="Fechar"
			>
				<svg class="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M4 4 L12 12 M12 4 L4 12" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.day-complete-toast {
		animation: toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
