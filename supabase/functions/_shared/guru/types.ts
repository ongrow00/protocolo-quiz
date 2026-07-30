/** Payload do webhook de transações do Digital Manager Guru (snake_case). */

export type GuruContact = {
	id?: string;
	name?: string;
	email?: string;
	doc?: string;
	phone_number?: string;
	phone_local_code?: string;
	address?: string;
	address_number?: string;
	address_comp?: string;
	address_district?: string;
	address_city?: string;
	address_state?: string;
	address_zip_code?: string;
};

export type GuruOffer = {
	id?: string;
	name?: string;
};

export type GuruProducer = {
	name?: string;
	marketplace_id?: string;
	contact_email?: string;
};

export type GuruProduct = {
	id?: string;
	internal_id?: string;
	marketplace_id?: string;
	marketplace_name?: string;
	name?: string;
	offer?: GuruOffer;
	producer?: GuruProducer;
	qty?: number;
	total_value?: number;
	unit_value?: number;
	type?: string;
};

export type GuruDates = {
	canceled_at?: string | null;
	confirmed_at?: string | null;
	created_at?: string | null;
	expires_at?: string | null;
	ordered_at?: string | null;
	updated_at?: string | null;
	warranty_until?: string | null;
};

export type GuruPayment = {
	marketplace_id?: string;
	marketplace_name?: string;
	method?: string | null;
	currency?: string;
	gross?: number;
	net?: number;
	total?: number;
	discount_value?: number;
	installments?: {
		qty?: number;
		value?: number;
		interest?: number;
	};
	refuse_reason?: string;
	refund_reason?: string;
};

export type GuruInvoice = {
	id?: string;
	cycle?: number;
	period_start?: string;
	period_end?: string;
	status?: string;
	type?: string;
	value?: number;
};

export type GuruSubscription = {
	id?: string;
	internal_id?: string;
	subscription_code?: string;
	last_status?: string;
	charged_times?: number;
	charged_every_days?: number;
};

export type GuruSource = {
	source?: string;
	checkout_source?: string;
	utm_source?: string;
	utm_campaign?: string;
	utm_medium?: string;
	utm_content?: string;
	utm_term?: string;
};

export type GuruInfrastructure = {
	ip?: string;
	user_agent?: string;
	country?: string;
	region?: string;
	city?: string;
	host?: string;
};

export type GuruWebhookPayload = {
	id: string;
	status: string;
	webhook_type?: string;
	api_token?: string;
	type?: string;
	checkout_url?: string;
	contact?: GuruContact;
	product?: GuruProduct;
	items?: GuruProduct[];
	dates?: GuruDates;
	payment?: GuruPayment;
	invoice?: GuruInvoice;
	subscription?: GuruSubscription;
	source?: GuruSource;
	infrastructure?: GuruInfrastructure;
	affiliations?: unknown[];
};
