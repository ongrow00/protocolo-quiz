-- Integração Digital Manager Guru — prepara transactions para um segundo gateway.
-- Spec: docs/superpowers/specs/2026-07-30-guru-webhook-design.md
--
-- Retrocompatível: o código atual da Lastlink continua operando sem alteração.
-- parseUuid() já devolve string normalizada em lowercase, que entra em `text`
-- de forma idêntica, e as linhas históricas já estão normalizadas pelo tipo uuid.

set local lock_timeout = '3s';

-- 1. Gateway de origem
-- ============================================================================
-- Não se chama `source` porque a tabela já tem utm_source (origem de tráfego)
-- e o payload do Guru traz um objeto `source` que contém as UTMs.

alter table public.transactions
  add column if not exists gateway text not null default 'lastlink';

create index if not exists transactions_gateway_idx on public.transactions(gateway);

comment on column public.transactions.gateway is
  'Gateway de pagamento (lastlink|guru). Não confundir com utm_source, que é origem de tráfego.';

-- 2. Identificadores externos passam de uuid para text
-- ============================================================================
-- Os IDs do Guru não são UUID: payment.marketplace_id vem como `ch_1ke4QoCQOs7VE6VY`,
-- subscription.id como `sub_BOAEj2WTKoclmg4X` e product.id como `1587151083`.
-- Um único alter table = uma reescrita, um lock.

alter table public.transactions
  alter column webhook_event_id         type text using webhook_event_id::text,
  alter column buyer_lastlink_id        type text using buyer_lastlink_id::text,
  alter column product_lastlink_id      type text using product_lastlink_id::text,
  alter column offer_lastlink_id        type text using offer_lastlink_id::text,
  alter column payment_id               type text using payment_id::text,
  alter column subscription_lastlink_id type text using subscription_lastlink_id::text,
  alter column seller_lastlink_id       type text using seller_lastlink_id::text;

comment on column public.transactions.webhook_event_id is
  'Chave de idempotência. Lastlink: UUID do evento. Guru: guru:<id da transação>:<status>, porque o Guru reutiliza o mesmo id a cada mudança de status.';

comment on table public.transactions is
  'Eventos de pagamento dos webhooks (Lastlink e Guru). Inserts via service role apenas.';
