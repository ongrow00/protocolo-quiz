import type { GuruWebhookPayload } from './types.ts';

/**
 * Payload de exemplo da documentação do Guru, ajustado para refletir o cenário
 * real deste projeto: produto de pagamento único e UTMs no formato `Nome|ID`
 * dos dynamic params do Meta Ads.
 */
export function guruApprovedPayload(
	overrides: Partial<GuruWebhookPayload> = {}
): GuruWebhookPayload {
	return {
		id: '9081534a-7512-4dab-9172-218c1dc1f263',
		status: 'approved',
		webhook_type: 'transaction',
		api_token: 'segredo-do-painel',
		type: 'producer',
		contact: {
			id: '906d1e37-de6a-4f4d-8271-91ecd0d65ec6',
			name: 'Maria Silva',
			email: 'Maria.Silva@Email.com',
			doc: '01234567890',
			phone_number: '41999998888',
			phone_local_code: '55',
			address: 'Rua Terra Rica',
			address_number: '123',
			address_district: 'Centro',
			address_city: 'Pinhais',
			address_state: 'PR',
			address_zip_code: '83324090'
		},
		product: {
			id: '1587151083',
			internal_id: '906d1e37-de6a-4f4d-8271-91ecd0d65e32',
			marketplace_id: '1587151083',
			name: 'Protocolo Desbloqueio',
			offer: { id: 'of_9Kd82', name: 'Oferta R$47' },
			producer: { name: 'Produtor', marketplace_id: '01234567890', contact_email: '' },
			qty: 1,
			total_value: 47,
			unit_value: 47,
			type: 'product'
		},
		items: [
			{
				id: '1587151083',
				internal_id: '906d1e37-de6a-4f4d-8271-91ecd0d65e32',
				name: 'Protocolo Desbloqueio',
				qty: 1,
				total_value: 47,
				unit_value: 47,
				type: 'product'
			}
		],
		dates: {
			created_at: '2026-07-30T09:19:04Z',
			ordered_at: '2026-07-30T11:33:45Z',
			confirmed_at: '2026-07-30T11:35:57Z',
			canceled_at: null
		},
		payment: {
			marketplace_id: 'ch_1ke4QoCQOs7VE6VY',
			marketplace_name: 'mundipagg',
			method: 'credit_card',
			currency: 'BRL',
			gross: 47,
			net: 44.5,
			total: 47,
			installments: { qty: 1, value: 47, interest: 0 }
		},
		source: {
			source: 'funnel-session-abc',
			utm_source: 'Meta|216102221917389',
			utm_medium: '20 A 40 MULHERES MIX 17 MILHOES|52567257701163',
			utm_campaign: '[PROTOCOLO-D]-[VENDA]-[QUIZ]-[COSTCAP]-2307|52568213630963',
			utm_term: 'Instagram_Reels',
			utm_content: 'H3_B1_C1-V1-[ORGANICO 19].mp4|52568213633363'
		},
		infrastructure: {
			ip: '187.55.10.2',
			user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
			host: 'https://clkdmg.site'
		},
		affiliations: [],
		...overrides
	};
}
