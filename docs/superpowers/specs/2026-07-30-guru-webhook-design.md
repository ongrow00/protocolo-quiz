# Integração Digital Manager Guru — webhook de transações

**Data:** 2026-07-30
**Estado:** aprovado, aguardando plano de implementação

## Objetivo

Processar pagamentos do Digital Manager Guru reusando integralmente a estrutura que
hoje atende a Lastlink: mesma tabela `transactions`, mesmo provisionamento de conta,
mesmas flags de acesso (`has_protocolo`, `has_consultoria`, `has_treino`) e mesma
revogação em reembolso/chargeback.

Só o webhook de **Transações** entra no escopo
(`https://docs.digitalmanager.guru/developers/webhook-para-transacoes`).

## Decisões

| Decisão | Escolha |
|---|---|
| Convivência | Lastlink e Guru rodam **em paralelo**, por tempo indeterminado |
| Identificação de produto | Pelo **nome**, mesma regra da Lastlink |
| Tipo de venda | **Pagamento único** nos três produtos |
| Organização do código | Núcleo compartilhado + adapter por gateway |
| Entrega | **Duas fases** — Lastlink não é redeployada na Fase 1 |

### Requisito inegociável

**A integração da Lastlink não pode parar em momento algum.** Três camadas cobrem isso:

1. `guru-webhook` é uma função **nova**. Deploy de Edge Function é por função, então
   enquanto `lastlink-webhook` não for redeployada ela segue servindo o binário atual.
2. O schema novo é **retrocompatível** com o código atual da Lastlink (ver
   "Compatibilidade" abaixo).
3. A migração é **sub-segundo** na escala atual (5.638 linhas, medido em 2026-07-30).

## Arquitetura

Alternativas consideradas:

- **Adapter sobre núcleo compartilhado** — escolhida. É a única que garante ao longo
  do tempo o requisito "tudo igualzinho ao Lastlink", porque as duas fontes executam
  literalmente o mesmo código de acesso.
- **`_shared/guru/` independente, clonando o handler** — entrega mais rápido, mas
  duplica ~400 linhas de lógica de acesso. Com os dois gateways ativos em paralelo,
  a divergência é questão de tempo.
- **Função única roteando pelo formato do payload** — uma URL só, mas mistura os
  segredos dos dois gateways e degrada rotação de token e leitura de logs.

### Estrutura de arquivos

```
supabase/functions/
  _shared/payments/          núcleo agnóstico de gateway
    handler.ts                 orquestra: dedupe → persiste → libera/revoga → responde
    provision-user.ts          movido de lastlink/, recebe NormalizedBuyer
    revoke-user-access.ts      movido de lastlink/
    product-access.ts          resolveProductAccess(names: string[])
    password-from-phone.ts     movido de lastlink/
    supabase-admin.ts          movido de lastlink/
    types.ts                   NormalizedBuyer, NormalizedUtm, TransactionInsertRow
  _shared/lastlink/          adapter Lastlink
    adapter.ts, parse-payload.ts, map-transaction-row.ts, validate-token.ts, types.ts
  _shared/guru/              adapter Guru
    adapter.ts, parse-payload.ts, map-transaction-row.ts, validate-token.ts, types.ts
  lastlink-webhook/index.ts
  guru-webhook/index.ts
```

### Interface do adapter

```ts
export type WebhookAdapter<P> = {
  source: 'lastlink' | 'guru';
  /** Autentica a requisição. Guru usa o corpo (api_token); Lastlink usa header. */
  validate(request: Request, raw: unknown): boolean;
  parse(raw: unknown): P | null;
  mapTransaction(payload: P): TransactionInsertRow | null;
  extractBuyer(payload: P): NormalizedBuyer | null;
  extractUtm(payload: P): NormalizedUtm | undefined;
  /** Nomes de produto da compra, para resolveProductAccess. */
  productNames(payload: P): string[];
};
```

`handleWebhook(request, adapter)` concentra toda a orquestração. Cada
`index.ts` fica com três linhas, como o da Lastlink hoje.

`validate` recebe `raw` além de `request` justamente porque o Guru autentica pelo
corpo — a assinatura precisa comportar os dois modelos.

### Tipos normalizados

```ts
export type TransactionAddress = {
  ZipCode?: string; Street?: string; StreetNumber?: string;
  District?: string; City?: string; State?: string;
};

export type NormalizedBuyer = {
  email: string; name?: string; phone?: string;
  document?: string; address?: TransactionAddress;
};

export type NormalizedUtm = {
  source?: string; medium?: string; campaign?: string; term?: string; content?: string;
};
```

`TransactionAddress` mantém deliberadamente as chaves PascalCase que a coluna
`buyer_address jsonb` já usa. O adapter do Guru monta esse mesmo formato a partir dos
campos soltos de `contact.address*`, para que linhas novas e históricas tenham o mesmo
shape e nada precise mudar na Lastlink.

## Migração de schema

```sql
set local lock_timeout = '3s';

alter table public.transactions
  add column if not exists source text not null default 'lastlink';

alter table public.transactions
  alter column webhook_event_id         type text using webhook_event_id::text,
  alter column buyer_lastlink_id        type text using buyer_lastlink_id::text,
  alter column product_lastlink_id      type text using product_lastlink_id::text,
  alter column offer_lastlink_id        type text using offer_lastlink_id::text,
  alter column payment_id               type text using payment_id::text,
  alter column subscription_lastlink_id type text using subscription_lastlink_id::text,
  alter column seller_lastlink_id       type text using seller_lastlink_id::text;

create index if not exists transactions_source_idx on public.transactions(source);
```

Os sete `alter column` vão num **único** `alter table`: uma reescrita, um lock. O
`lock_timeout` faz a migração abortar em vez de enfileirar webhooks caso não consiga o
lock rápido.

**Por que `text`:** os identificadores do Guru não são UUID — `payment.marketplace_id`
vem como `ch_1ke4QoCQOs7VE6VY`, `subscription.id` como `sub_BOAEj2WTKoclmg4X`,
`product.id` como `1587151083`.

Nenhuma coluna é renomeada, nenhuma linha existente é alterada, nenhuma policy é
tocada. As vendas históricas permanecem com `source = 'lastlink'` pelo default.

### Compatibilidade com o código atual da Lastlink

Verificado item a item — o código atual roda sem uma linha de alteração após a migração:

| Ponto | Situação |
|---|---|
| `parseUuid()` já devolve string em lowercase | entra em `text` idêntico |
| `.eq('webhook_event_id', eventId)` | comparação text/text |
| Linhas históricas | já normalizadas pelo tipo `uuid` anterior |
| `device_ip inet`, PK `id uuid`, RLS policies | não são tocados |
| `payment-history.service.ts` | não lê nenhuma coluna alterada |

### Dependências verificadas (2026-07-30)

Nenhuma view, trigger ou foreign key depende das sete colunas alteradas. Os únicos
objetos dependentes são as RLS policies, que usam `user_id`.

Ressalva: essa verificação foi feita sobre as migrations do repositório, não
consultando o banco. Objetos criados manualmente pelo dashboard não apareceriam.
Daí a reconfirmação no passo 1 do rollout.

## De-para de campos

| Coluna `transactions` | Origem no payload do Guru |
|---|---|
| `source` | `'guru'` |
| `webhook_event_id` | `guru:<id>:<status>` (ver Idempotência) |
| `event` | `status` normalizado (ver Eventos) |
| `is_test` | token de teste (ver Autenticação) |
| `buyer_email` | `contact.email` |
| `buyer_name` | `contact.name` |
| `buyer_phone` | `+{contact.phone_local_code}{contact.phone_number}`, ou só `phone_number` |
| `buyer_document` | `contact.doc` |
| `buyer_address` | montado de `contact.address*` no shape `TransactionAddress` |
| `buyer_lastlink_id` | `contact.id` |
| `product_lastlink_id` | `product.internal_id` |
| `product_name` | `items[].name` unidos por `, ` (fallback `product.name`) |
| `product_price` | `product.unit_value` |
| `offer_lastlink_id` | `product.offer.id` |
| `offer_name` | `product.offer.name` |
| `payment_id` | `payment.marketplace_id` |
| `payment_method` | `payment.method` |
| `payment_date` | `dates.confirmed_at` (fallback `dates.ordered_at`) |
| `original_price` | `payment.gross` |
| `total_price` | `payment.total` |
| `installments` | `payment.installments.qty` |
| `interest_amount` | `payment.installments.interest` |
| `recurrency` | `invoice.cycle` |
| `next_billing_at` | `invoice.period_end` |
| `subscription_lastlink_id` | `subscription.internal_id` |
| `commissions` | `affiliations[]` |
| `seller_lastlink_id` | `product.producer.marketplace_id` |
| `seller_email` | `product.producer.contact_email` |
| `utm_source` … `utm_content` | `source.utm_source` … `source.utm_content` |
| `utm_id` | `source.source` |
| `device_user_agent` | `infrastructure.user_agent` |
| `device_ip` | `infrastructure.ip` |
| `raw_payload` | payload **sem** `api_token` |
| `lastlink_created_at` | `dates.created_at` |

Campos ausentes no payload do Guru gravam `null`. As validações existentes
(`pickStr`, `pickNum`, `pickIp`, `toIso`) são reusadas.

`recurrency`, `next_billing_at` e `subscription_lastlink_id` só vêm preenchidos em
produto do tipo `plan`. Como os três produtos são de pagamento único, ficam `null` na
prática — mapeamos mesmo assim para não precisar mexer no schema se algo virar
recorrente.

## Idempotência

`webhook_event_id = guru:<id>:<status>`.

A Lastlink dá um `Id` distinto a cada evento. O Guru reutiliza o mesmo `id` — que é o
da **transação** — a cada mudança de status. Sem o sufixo de status, o `refunded` de
uma compra já aprovada seria lido como duplicata e **o acesso nunca seria revogado**.

Com o sufixo, cada status vira uma linha própria, exatamente como já acontece do lado
da Lastlink. O `unique` em `webhook_event_id` continua servindo às duas fontes sem
colisão: a Lastlink grava o UUID puro, o Guru grava com prefixo. Não é preciso índice
composto.

Reenvio do mesmo status é absorvido pela lógica atual: linha com `processed_at`
preenchido responde `{ ok: true, duplicate: true }` sem reprocessar.

## Eventos

| `status` do Guru | `event` gravado | Efeito |
|---|---|---|
| `approved` | `Purchase_Order_Confirmed` | libera acesso |
| `refunded` | `Payment_Refund` | revoga acesso |
| `chargeback` | `Payment_Chargeback` | revoga acesso |
| qualquer outro | o `status` cru | só grava a transação |

Normalizar os três canônicos mantém `payment-history.service.ts` funcionando sem
alteração — ele filtra exatamente por esses nomes. Os demais status conhecidos
(`waiting_payment`, `billet_printed`, `pix_created`, `canceled`, `expired`, `refused`,
`abandoned`, `trial`, `started`) ficam registrados para auditoria sem tocar em acesso.

Status desconhecido não é erro: grava a transação e não mexe em acesso.

Requisição com `webhook_type` diferente de `transaction` é rejeitada com 400.

## Acesso a produto

`resolveProductAccess` passa a receber `string[]` em vez de `LastlinkWebhookData`,
tornando-se agnóstica de gateway. As regras não mudam:

| Nome do produto | Efeito |
|---|---|
| `Protocolo Desbloqueio` | cria conta + `has_protocolo` |
| `Consultoria Liberdade` | só atualiza conta existente + `has_consultoria` + `onboarding_completed_at` |
| `Protocolo Treino` | só atualiza conta existente + `has_treino` |

O adapter do Guru devolve os nomes de `items[].name` mais `product.name`, sem
duplicatas — assim uma transação com mais de um item libera todos.

Comparação normalizada (trim, lowercase, espaços colapsados), como hoje.

**Encontro das duas fontes:** o único ponto onde Lastlink e Guru se cruzam é
`profiles`. `mergeAccessFlags` faz OR e nunca desliga uma flag existente, então compra
na Lastlink com upsell no Guru (ou o inverso) funciona sem conflito.

A senha inicial continua sendo os últimos 4 dígitos do telefone. Prefixar o DDI não
altera os últimos 4 dígitos, então o formato composto do Guru é seguro.

`grantAccessToExistingUser` mantém o retry atual (3 tentativas, 15s de intervalo) para
o caso do upsell chegar antes do produto principal ter provisionado a conta.

## Autenticação

O Guru envia `api_token` **no corpo** do JSON, não em header. `_shared/guru/validate-token.ts`
compara com `GURU_WEBHOOK_TOKENS` (lista separada por vírgula), em tempo constante,
seguindo o padrão de `LASTLINK_WEBHOOK_TOKENS`.

**O `api_token` é removido do payload antes de gravar em `raw_payload`.** Hoje o
`raw_payload` guarda o JSON inteiro; persistir um segredo em coluna legível é evitável
sem custo.

**Flag de teste:** o payload do Guru não tem equivalente ao `IsTest` da Lastlink.
`GURU_WEBHOOK_TEST_TOKENS` (opcional) resolve: requisição autenticada por um token
dessa lista grava `is_test = true` e não provisiona, mesma regra do `IsTest`. A exceção
de ambiente local (`isLocalDev()`) permanece.

Variáveis a definir antes do deploy:

```
supabase secrets set GURU_WEBHOOK_TOKENS=<token do painel do Guru>
supabase secrets set GURU_WEBHOOK_TEST_TOKENS=<opcional>
```

## Tratamento de erro

Herdado do handler compartilhado, idêntico ao comportamento atual:

| Situação | Resposta |
|---|---|
| Token ausente ou inválido | 401 |
| JSON inválido, payload irreconhecível, `webhook_type` errado | 400 |
| Falha de banco | 500 com `pgCode` e `pgMessage` |
| Env faltando | 503 |
| Reenvio já processado | 200 `{ ok: true, duplicate: true }` |

Falha ao liberar ou revogar acesso **não** derruba a resposta: a transação já foi
gravada e o erro volta em `provisionError`, como hoje.

## Testes

`deno test` sobre os módulos puros, sem introduzir runner novo no `package.json`:

- `map-transaction-row` do Guru: payload de exemplo da documentação → linha esperada,
  incluindo os identificadores não-UUID que o schema antigo rejeitaria.
- Normalização de status → `event`, cobrindo os três canônicos, um status não mapeado
  e um status desconhecido.
- Chave de idempotência: mesmo `id` com `approved` e depois `refunded` produz chaves
  diferentes.
- `resolveProductAccess` generalizado: continua passando com os nomes vindos da
  Lastlink e passa com os nomes vindos do Guru.
- `validate-token` do Guru: token no corpo, lista com múltiplos tokens, token de teste
  marcando `is_test`, token ausente.
- Remoção do `api_token` do `raw_payload`.

## Rollout

### Fase 1 — Guru no ar, Lastlink intocada

1. Consultando o banco diretamente, reconfirmar o volume de `transactions` (5.638 em
   2026-07-30) e a ausência de views, triggers ou FKs sobre as sete colunas.
2. Aplicar a migração via `npx supabase db push` (o CLI já está linkado ao projeto
   `czvlwhfkcwhaqjgbatji`).
3. Confirmar que a Lastlink segue gravando normalmente — uma venda real ou um reenvio.
4. Criar `_shared/payments/` e `_shared/guru/`, e `functions/guru-webhook/`.
5. Definir os secrets do Guru.
6. `supabase functions deploy guru-webhook` — **só essa função**.
7. Cadastrar a URL no painel do Guru e disparar um teste.
8. Validar com venda real de cada um dos três produtos.

Nesta fase a Lastlink mantém sua cópia da lógica em `_shared/lastlink/`. A duplicação
é temporária e intencional: é o que mantém a Lastlink fora do caminho crítico.

### Fase 2 — unificação

Só depois do Guru validado com vendas reais:

1. `lastlink-webhook` passa a chamar `handleWebhook(request, lastlinkAdapter)`.
2. Remover de `_shared/lastlink/` o que migrou para o núcleo.
3. `supabase functions deploy lastlink-webhook`.
4. Validar com um reenvio de webhook real.

Rollback: redeploy da versão anterior da função.

## Pendências de verificação

1. **Formato de `contact.phone_number`** — confirmar no primeiro webhook real se vem
   com DDD e se `phone_local_code` é mesmo o código do país. Afeta o valor gravado em
   `buyer_phone` e `profiles.phone`, não a senha.
2. **Planilha de vendas** — nenhum código do repositório escreve em Google Sheets;
   não há credencial de service account no `.env` nem script correspondente. A
   alimentação é externa. Verificar no painel da Lastlink, em Integrações, se existe um
   Google Sheets conectado; em caso positivo, configurar o equivalente no painel do
   Guru. Se for um n8n/Make, basta adicionar a URL do `guru-webhook` ao mesmo fluxo.
   Como as duas fontes gravam na mesma `transactions`, qualquer automação que leia do
   Supabase já cobre ambas sem alteração.
3. **Nomes dos produtos no Guru** — precisam ser exatamente `Protocolo Desbloqueio`,
   `Consultoria Liberdade` e `Protocolo Treino`, já que o match é por nome.
4. **MCP do Supabase** — foi registrado com escopo local apontando para
   `czvlwhfkcwhaqjgbatji`; o `~/.mcp.json` global segue apontando para outro projeto.
   A troca só vale após reiniciar a sessão do Claude Code.

## Fora de escopo

- **Webhook de Assinaturas do Guru** — os três produtos são de pagamento único.
- **Webhook de E-tickets.**
- **Escrita em planilha a partir do código** — permanece externa, como hoje.
- **Checkout do Guru no frontend** — `checkout-url.ts` monta URLs no formato da
  Lastlink (`name`, `phone`, `email`, `sck`). Adaptar aos parâmetros do Guru é trabalho
  separado, necessário apenas quando o tráfego for redirecionado para lá.
