import type { WebhookAdapter } from '../payments/types.ts';
import {
	collectGuruProductNames,
	extractGuruBuyer,
	extractGuruUtm,
	mapGuruTransactionRow
} from './map-transaction-row.ts';
import { parseGuruPayload } from './parse-payload.ts';
import type { GuruWebhookPayload } from './types.ts';
import { authenticateGuruRequest } from './validate-token.ts';

export const guruAdapter: WebhookAdapter<GuruWebhookPayload> = {
	gateway: 'guru',
	allowedHeaders: 'content-type',
	authenticate: authenticateGuruRequest,
	parse: parseGuruPayload,
	mapTransaction: mapGuruTransactionRow,
	extractBuyer: extractGuruBuyer,
	extractUtm: extractGuruUtm,
	productNames: collectGuruProductNames
};
