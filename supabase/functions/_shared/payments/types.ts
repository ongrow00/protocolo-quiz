/** Tipos agnósticos de gateway, compartilhados entre Lastlink e Guru. */

export type Gateway = 'lastlink' | 'guru';

/**
 * Endereço do comprador gravado em transactions.buyer_address.
 * Mantém deliberadamente as chaves PascalCase que a coluna já usa desde a
 * Lastlink, para que linhas novas e históricas tenham o mesmo shape.
 */
export type TransactionAddress = {
	ZipCode?: string;
	Street?: string;
	StreetNumber?: string;
	District?: string;
	City?: string;
	State?: string;
};

export type NormalizedBuyer = {
	email: string;
	name?: string;
	phone?: string;
	document?: string;
	address?: TransactionAddress;
};

export type NormalizedUtm = {
	source?: string;
	medium?: string;
	campaign?: string;
	term?: string;
	content?: string;
};

export type TransactionInsertRow = {
	gateway: Gateway;
	user_id?: string | null;
	anonymous_id?: string | null;
	webhook_event_id: string;
	event: string;
	is_test: boolean;
	buyer_lastlink_id?: string | null;
	buyer_email: string;
	buyer_name?: string | null;
	buyer_phone?: string | null;
	buyer_document?: string | null;
	buyer_address?: TransactionAddress | null;
	product_lastlink_id?: string | null;
	product_name?: string | null;
	product_price?: number | null;
	offer_lastlink_id?: string | null;
	offer_name?: string | null;
	payment_id?: string | null;
	payment_method?: string | null;
	payment_date?: string | null;
	original_price?: number | null;
	total_price?: number | null;
	installments?: number | null;
	interest_amount?: number | null;
	recurrency?: number | null;
	next_billing_at?: string | null;
	subscription_lastlink_id?: string | null;
	commissions?: unknown;
	seller_lastlink_id?: string | null;
	seller_email?: string | null;
	utm_id?: string | null;
	utm_source?: string | null;
	utm_medium?: string | null;
	utm_campaign?: string | null;
	utm_term?: string | null;
	utm_content?: string | null;
	device_user_agent?: string | null;
	device_ip?: string | null;
	raw_payload: unknown;
	lastlink_created_at?: string | null;
	processed_at?: string | null;
};

export type ProvisionUserResult =
	| { ok: true; userId: string; created: boolean }
	| { ok: false; error: string };

/**
 * Resultado da autenticação. `isTest` existe porque o payload do Guru não tem
 * equivalente ao IsTest da Lastlink — a distinção vem do token usado.
 */
export type AuthResult = { ok: true; isTest: boolean } | { ok: false };

/**
 * Contrato que cada gateway implementa. Toda a orquestração (idempotência,
 * persistência, liberação e revogação de acesso) vive no handler compartilhado.
 */
export type WebhookAdapter<P> = {
	gateway: Gateway;
	/** Headers aceitos no preflight CORS. */
	allowedHeaders: string;
	/** Lastlink autentica por header; Guru pelo corpo. Daí `raw` na assinatura. */
	authenticate(request: Request, raw: unknown): AuthResult;
	parse(raw: unknown): P | null;
	mapTransaction(payload: P): TransactionInsertRow | null;
	extractBuyer(payload: P): NormalizedBuyer | null;
	extractUtm(payload: P): NormalizedUtm | undefined;
	/** Nomes dos produtos da compra, para resolveProductAccess. */
	productNames(payload: P): string[];
};
