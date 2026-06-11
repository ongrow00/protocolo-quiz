import { supabase } from '$lib/supabase';
import {
	formatPaymentAmount,
	formatPaymentDate,
	formatPaymentEvent,
	formatPaymentMethod,
	isRefundEvent
} from '$lib/utils/payment-history';

const PAYMENT_EVENTS = ['Purchase_Order_Confirmed', 'Payment_Refund', 'Payment_Chargeback'] as const;

type TransactionRow = {
	id: string;
	event: string;
	product_name: string | null;
	total_price: number | null;
	product_price: number | null;
	payment_method: string | null;
	payment_date: string | null;
	created_at: string;
	installments: number | null;
};

export type PaymentHistoryItem = {
	id: string;
	event: string;
	productName: string;
	amountLabel: string;
	dateLabel: string;
	occurredAt: string;
	methodLabel: string | null;
	eventLabel: string;
	isRefund: boolean;
	installments: number | null;
};

export type PaymentHistoryResult = {
	items: PaymentHistoryItem[];
	error: string | null;
};

function mapRow(row: TransactionRow): PaymentHistoryItem {
	const amount = row.total_price ?? row.product_price;
	const dateLabel =
		formatPaymentDate(row.payment_date) ?? formatPaymentDate(row.created_at) ?? '—';

	return {
		id: row.id,
		event: row.event,
		productName: row.product_name?.trim() || 'Produto',
		amountLabel: formatPaymentAmount(amount) ?? '—',
		dateLabel,
		occurredAt: row.payment_date ?? row.created_at,
		methodLabel: formatPaymentMethod(row.payment_method),
		eventLabel: formatPaymentEvent(row.event),
		isRefund: isRefundEvent(row.event),
		installments: row.installments
	};
}

export async function loadPaymentHistory(): Promise<PaymentHistoryResult> {
	try {
		const {
			data: { user }
		} = await supabase.auth.getUser();

		if (!user) {
			return { items: [], error: null };
		}

		const { data, error } = await supabase
			.from('transactions')
			.select(
				'id, event, product_name, total_price, product_price, payment_method, payment_date, created_at, installments'
			)
			.eq('user_id', user.id)
			.eq('is_test', false)
			.in('event', [...PAYMENT_EVENTS])
			.order('payment_date', { ascending: false, nullsFirst: false })
			.order('created_at', { ascending: false });

		if (error) {
			console.warn('loadPaymentHistory:', error.message);
			return { items: [], error: 'Não foi possível carregar o histórico.' };
		}

		return {
			items: (data ?? []).map((row) => mapRow(row as TransactionRow)),
			error: null
		};
	} catch (e) {
		console.warn('loadPaymentHistory unexpected:', e);
		return { items: [], error: 'Não foi possível carregar o histórico.' };
	}
}
