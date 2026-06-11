<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import {
		loadPaymentHistory,
		type PaymentHistoryItem
	} from '$lib/services/payment-history.service';
	import {
		formatPaymentMonthGroup,
		paymentStatusBadge,
		productVisual
	} from '$lib/utils/payment-history';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	type MonthGroup = {
		label: string;
		items: PaymentHistoryItem[];
	};

	let { open, onClose }: Props = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let items = $state<PaymentHistoryItem[]>([]);

	const monthGroups = $derived(groupByMonth(items));

	$effect(() => {
		if (!open) return;
		void fetchHistory();
	});

	async function fetchHistory() {
		loading = true;
		error = null;
		const result = await loadPaymentHistory();
		items = result.items;
		error = result.error;
		loading = false;
	}

	function groupByMonth(history: PaymentHistoryItem[]): MonthGroup[] {
		const groups = new Map<string, PaymentHistoryItem[]>();

		for (const item of history) {
			const label = formatPaymentMonthGroup(item.occurredAt);
			const bucket = groups.get(label);
			if (bucket) bucket.push(item);
			else groups.set(label, [item]);
		}

		return [...groups.entries()].map(([label, groupItems]) => ({
			label,
			items: groupItems
		}));
	}

	function detailLine(item: PaymentHistoryItem): string {
		const parts: string[] = [];
		if (item.methodLabel) parts.push(item.methodLabel);
		if (item.installments && item.installments > 1 && !item.isRefund) {
			parts.push(`${item.installments}x`);
		}
		return parts.join(' · ');
	}

	function amountDisplay(item: PaymentHistoryItem): string {
		if (item.event === 'Payment_Refund') return `+${item.amountLabel}`;
		return item.amountLabel;
	}

	function amountClass(item: PaymentHistoryItem): string {
		if (item.event === 'Payment_Refund') return 'text-accent';
		if (item.event === 'Payment_Chargeback') return 'text-[#C62828]';
		return 'text-heading';
	}
</script>

<BottomSheet {open} title="Histórico de pagamentos" onClose={onClose}>
	<div class="flex min-h-[200px] flex-col pb-4">
		{#if loading}
			<div class="flex flex-1 items-center justify-center py-16">
				<div
					class="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent"
					aria-hidden="true"
				></div>
			</div>
		{:else if error}
			<div class="flex flex-col items-center gap-4 py-12 text-center">
				<p class="text-sm text-muted">{error}</p>
				<button
					type="button"
					onclick={() => void fetchHistory()}
					class="text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
				>
					Tentar novamente
				</button>
			</div>
		{:else if items.length === 0}
			<div class="flex flex-col items-center gap-3 py-16 text-center">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted"
					aria-hidden="true"
				>
					<svg
						class="h-7 w-7"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="6" width="18" height="14" rx="2" />
						<path d="M7 10h4M7 14h6" />
						<path d="M17 10v4" />
					</svg>
				</div>
				<p class="max-w-[240px] text-sm leading-relaxed text-muted">
					Não há histórico de pagamento disponível.
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-5">
				{#each monthGroups as group (group.label)}
					<section class="flex flex-col gap-2">
						<p class="px-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
							{group.label}
						</p>

						<ul class="overflow-hidden rounded-[18px] bg-surface shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-line/30">
							{#each group.items as item, index (item.id)}
								{@const visual = productVisual(item.productName)}
								{@const status = paymentStatusBadge(item.event)}
								<li class="flex items-center gap-3 px-3.5 py-3.5 {index < group.items.length - 1 ? 'border-b border-line/35' : ''}">
									<div
										class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] {visual.bgClass}"
										aria-hidden="true"
									>
										{#if visual.icon === 'treino'}
											<svg class="h-5 w-5 {visual.fgClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round">
												<path d="M6 9h2v6H6zM16 9h2v6h-2z" />
												<path d="M8 12h8" />
											</svg>
										{:else if visual.icon === 'consultoria'}
											<svg class="h-5 w-5 {visual.fgClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
												<circle cx="10" cy="7" r="3.5" />
												<path d="M21 8v6M18 11h6" />
											</svg>
										{:else if visual.icon === 'protocolo'}
											<svg class="h-5 w-5 {visual.fgClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
												<path d="M12 3l7 4v6c0 4-3 7-7 8-4-1-7-4-7-8V7l7-4z" />
												<path d="M9.5 12.5 11 14l3.5-3.5" />
											</svg>
										{:else}
											<svg class="h-5 w-5 {visual.fgClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
												<rect x="3" y="6" width="18" height="14" rx="2" />
												<path d="M7 10h4M7 14h6" />
											</svg>
										{/if}
									</div>

									<div class="min-w-0 flex-1">
										<div class="flex min-w-0 items-center gap-2">
											<p class="min-w-0 truncate text-[15px] font-semibold leading-tight text-heading">
												{item.productName}
											</p>
											<span
												class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none {status.bgClass} {status.textClass}"
											>
												{status.label}
											</span>
										</div>
										<p class="mt-1 text-[13px] leading-snug text-muted">
											{item.dateLabel}
										</p>
										{#if detailLine(item)}
											<p class="mt-0.5 text-[12px] leading-snug text-muted/80">
												{detailLine(item)}
											</p>
										{/if}
									</div>

									<p
										class="shrink-0 text-right text-[15px] font-semibold tabular-nums tracking-tight {amountClass(item)}"
									>
										{amountDisplay(item)}
									</p>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</BottomSheet>
