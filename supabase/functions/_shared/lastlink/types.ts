/** Lastlink webhook payload (PascalCase as sent by the API). */

export type LastlinkBuyerAddress = {
	ZipCode?: string;
	Street?: string;
	StreetNumber?: string;
	District?: string;
	City?: string;
	State?: string;
};

export type LastlinkBuyer = {
	Id?: string;
	Email?: string;
	Name?: string;
	PhoneNumber?: string;
	Document?: string;
	Address?: LastlinkBuyerAddress;
};

export type LastlinkProduct = {
	Id?: string;
	Name?: string;
	Price?: number;
};

export type LastlinkOffer = {
	Id?: string;
	Name?: string;
};

export type LastlinkPurchase = {
	PaymentId?: string;
	Recurrency?: number;
	PaymentDate?: string;
	NextBilling?: string;
	OriginalPrice?: { Value?: number };
	Price?: { Value?: number };
	Payment?: {
		NumberOfInstallments?: number;
		PaymentMethod?: string;
		InterestRateAmount?: number;
	};
};

export type LastlinkSubscription = {
	Id?: string;
	ProductId?: string;
};

export type LastlinkUtm = {
	UtmId?: string;
	UtmSource?: string;
	UtmMedium?: string;
	UtmCampaign?: string;
	UtmTerm?: string;
	UtmContent?: string;
};

export type LastlinkSeller = {
	Id?: string;
	Email?: string;
};

export type LastlinkCommission = {
	Value?: number;
	Source?: string;
	Details?: unknown[];
};

export type LastlinkDeviceInfo = {
	UserAgent?: string;
	ip?: string;
};

export type LastlinkWebhookData = {
	Products?: LastlinkProduct[];
	Buyer?: LastlinkBuyer;
	Seller?: LastlinkSeller;
	Commissions?: LastlinkCommission[];
	Purchase?: LastlinkPurchase;
	Subscriptions?: LastlinkSubscription[];
	Offer?: LastlinkOffer;
	Utm?: LastlinkUtm;
	DeviceInfo?: LastlinkDeviceInfo;
};

export type LastlinkWebhookPayload = {
	Id: string;
	IsTest?: boolean;
	Event: string;
	CreatedAt?: string;
	Data?: LastlinkWebhookData;
};

export type TransactionInsertRow = {
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
	buyer_address?: LastlinkBuyerAddress | null;
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
	commissions?: LastlinkCommission[] | null;
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
	raw_payload: LastlinkWebhookPayload;
	lastlink_created_at?: string | null;
	processed_at?: string | null;
};

export type ProvisionUserResult =
	| { ok: true; userId: string; created: boolean }
	| { ok: false; error: string };
