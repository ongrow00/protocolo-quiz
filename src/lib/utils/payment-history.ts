export type PaymentHistoryEvent = 'Purchase_Order_Confirmed' | 'Payment_Refund' | 'Payment_Chargeback';

const EVENT_LABELS: Record<PaymentHistoryEvent, string> = {
	Purchase_Order_Confirmed: 'Compra confirmada',
	Payment_Refund: 'Reembolso',
	Payment_Chargeback: 'Estorno'
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	credit_card: 'Cartão',
	pix: 'Pix',
	bankslip: 'Boleto'
};

export function formatPaymentEvent(event: string): string {
	return EVENT_LABELS[event as PaymentHistoryEvent] ?? event;
}

export function formatPaymentMethod(method: string | null | undefined): string | null {
	if (!method) return null;
	return PAYMENT_METHOD_LABELS[method] ?? method;
}

export function formatPaymentAmount(value: number | null | undefined): string | null {
	if (value == null || Number.isNaN(value)) return null;
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL'
	}).format(value);
}

export function formatPaymentDate(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(date);
}

export function isRefundEvent(event: string): boolean {
	return event === 'Payment_Refund' || event === 'Payment_Chargeback';
}

export function formatPaymentMonthGroup(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return 'Outros';
	const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
	return label.charAt(0).toUpperCase() + label.slice(1);
}

export type ProductVisual = {
	icon: 'protocolo' | 'treino' | 'consultoria' | 'default';
	bgClass: string;
	fgClass: string;
};

const STATUS_LABELS: Record<PaymentHistoryEvent, string> = {
	Purchase_Order_Confirmed: 'Aprovado',
	Payment_Refund: 'Reembolsado',
	Payment_Chargeback: 'Cancelado'
};

export type PaymentStatusBadge = {
	label: string;
	bgClass: string;
	textClass: string;
};

export function paymentStatusBadge(event: string): PaymentStatusBadge {
	const label = STATUS_LABELS[event as PaymentHistoryEvent] ?? event;

	switch (event) {
		case 'Purchase_Order_Confirmed':
			return {
				label,
				bgClass: 'bg-accent-soft',
				textClass: 'text-accent'
			};
		case 'Payment_Refund':
			return {
				label,
				bgClass: 'bg-[#FFF4E5]',
				textClass: 'text-[#B45309]'
			};
		case 'Payment_Chargeback':
			return {
				label,
				bgClass: 'bg-[#FEECEC]',
				textClass: 'text-[#C62828]'
			};
		default:
			return {
				label,
				bgClass: 'bg-surface-2',
				textClass: 'text-muted'
			};
	}
}

export function productVisual(productName: string): ProductVisual {
	const name = productName.trim().toLowerCase();
	const accentIcon = { bgClass: 'bg-accent', fgClass: 'text-white' } as const;

	if (name.includes('treino')) {
		return { icon: 'treino', ...accentIcon };
	}
	if (name.includes('consultoria')) {
		return { icon: 'consultoria', ...accentIcon };
	}
	if (name.includes('desbloqueio') || name.includes('protocolo')) {
		return { icon: 'protocolo', ...accentIcon };
	}
	return { icon: 'default', ...accentIcon };
}
