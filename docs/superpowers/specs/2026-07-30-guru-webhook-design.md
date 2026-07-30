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
  gateway: 'lastlink' | 'guru';
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
  add column if not exists gateway text not null default 'lastlink';

alter table public.transactions
  alter column webhook_event_id         type text using webhook_event_id::text,
  alter column buyer_lastlink_id        type text using buyer_lastlink_id::text,
  alter column product_lastlink_id      type text using product_lastlink_id::text,
  alter column offer_lastlink_id        type text using offer_lastlink_id::text,
  alter column payment_id               type text using payment_id::text,
  alter column subscription_lastlink_id type text using subscription_lastlink_id::text,
  alter column seller_lastlink_id       type text using seller_lastlink_id::text;

create index if not exists transactions_gateway_idx on public.transactions(gateway);

comment on column public.transactions.gateway is
  'Gateway de pagamento (lastlink|guru). Não confundir com utm_source, que é origem de tráfego.';
```

Os sete `alter column` vão num **único** `alter table`: uma reescrita, um lock. O
`lock_timeout` faz a migração abortar em vez de enfileirar webhooks caso não consiga o
lock rápido.

**Por que `text`:** os identificadores do Guru não são UUID — `payment.marketplace_id`
vem como `ch_1ke4QoCQOs7VE6VY`, `subscription.id` como `sub_BOAEj2WTKoclmg4X`,
`product.id` como `1587151083`.

Nenhuma coluna é renomeada, nenhuma linha existente é alterada, nenhuma policy é
tocada. As vendas históricas permanecem com `gateway = 'lastlink'` pelo default.

**Por que `gateway` e não `source`:** a tabela já tem `utm_source` (origem de tráfego,
ex. `Meta|216102221917389`) e o payload do Guru tem um objeto `source` que contém as
UTMs. Uma coluna chamada `source` significando gateway de pagamento colidiria com os
dois e convidaria a erro de leitura em relatórios.

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
| `gateway` | `'guru'` |
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
| `utm_id` | `null` (ver Rastreamento) |
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

## Rastreamento (UTMs)

O modelo gravado tem de ser **byte a byte o mesmo** das linhas da Lastlink, sob pena de
quebrar o rastreamento de campanha. Restrições, verificadas contra dados reais em
2026-07-30:

**Colunas idênticas.** `transactions` mantém `utm_id`, `utm_source`, `utm_medium`,
`utm_campaign`, `utm_term`, `utm_content`, todas `text`. A migração de schema não toca
em nenhuma delas. Em `profiles` são as mesmas cinco (sem `utm_id`), gravadas pelo mesmo
`mapUtm`. `profile-utm.service.ts` permanece indiferente à fonte.

**`utm_id` fica `null` no Guru.** Nas transações históricas da Lastlink a coluna é
sempre nula. Preenchê-la apenas no Guru faria seu significado variar conforme o
gateway. O `source.source` do Guru (equivalente ao `sck`) permanece só no
`raw_payload`, que é onde o `sck` da Lastlink também já fica hoje.

**`source.pptc.utm_*` é ignorado.** O Guru expõe um segundo conjunto de UTMs vindo do
rastreamento interno dele. Usamos exclusivamente `source.utm_*`; misturar as duas
origens criaria justamente a divergência que se quer evitar.

**Formato dos valores.** Os UTMs seguem o padrão de dynamic params do Meta Ads,
`Nome|ID`. Em uma amostra de 1.000 transações, 97–99% dos valores contêm `|`:

```
utm_source    Meta|216102221917389
utm_campaign  [PROTOCOLO-D]-[VENDA]-[QUIZ]-[COSTCAP]-2307|52568213630963
utm_content   H3_B1_C1-V1-[ORGANICO 19].mp4|52568213633363
```

**Comprimento.** A documentação do Guru declara `String(191)` para esses campos,
enquanto o mapper atual aceita até 500 (2000 em `utm_content`). Na mesma amostra, o
maior valor observado tem 88 caracteres (`utm_campaign`) e nenhum passa de 191. Folga
de mais de duas vezes; não é risco. Os limites do mapper permanecem como estão.

### Critério de aceite bloqueante

O gateway não gera esses valores — captura o query param do checkout e repassa. O
funil já os envia via `appendCheckoutParams`. Portanto, **antes de direcionar tráfego
para o Guru**, uma venda de teste com UTMs contendo `|` deve ser comparada valor a
valor com o que a Lastlink grava.

Falha esperada a procurar: o Guru escapar o pipe como `%7C` ou truncar o valor no
primeiro `|`. Qualquer divergência bloqueia a migração de tráfego até ser resolvida na
configuração do checkout.

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

### Onde obter o token

O token **não** é gerado na tela de webhook — é o *Account Token*, da conta inteira,
e o mesmo valor chega em todos os webhooks. Caminho no painel:

> menu superior direito → **Minha Conta** → aba **API** → **Token API**

Atenção ao token errado: em *Meu Perfil → Tokens API* fica o *User Token*, usado para
chamar a API do Guru via `Authorization: Bearer`. Ele **não** é o que vem no
`api_token` do webhook. Usá-lo faria todos os webhooks retornarem 401 com a função no
ar respondendo normalmente — falha que não se parece com falha.

Consequência operacional: por ser um token de conta, não há como rotacioná-lo por
webhook, e ele não distingue ambientes. `GURU_WEBHOOK_TEST_TOKENS` só é útil se o Guru
oferecer uma conta ou ambiente de testes separado.

Variáveis a definir antes do deploy:

```
supabase secrets set GURU_WEBHOOK_TOKENS=<Token API de Minha Conta → API>
supabase secrets set GURU_WEBHOOK_TEST_TOKENS=<opcional>
```

### Reenvios

O Guru reenvia o webhook **até 10 vezes** enquanto não receber HTTP 200. Isso torna a
idempotência obrigatória, não opcional: a chave `guru:<id>:<status>` garante que do
segundo reenvio em diante a resposta seja `{ ok: true, duplicate: true }` sem
reprocessar acesso.

Cada requisição traz um header `X-Request-ID` único. **Não usar como chave de
idempotência** — ele muda a cada reenvio, então dez reenvios do mesmo evento gerariam
dez linhas e dez tentativas de provisionamento.

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

## Garantias de não-regressão da Lastlink

Análise adversarial dos modos de falha que derrubariam a integração existente, com a
mitigação de cada um. As regras marcadas como **duras** não admitem exceção na Fase 1.

### Regras duras

**Nunca rodar `supabase functions deploy` sem nomear a função.** Sem argumento, o
comando deploya *todas* as funções, incluindo a `lastlink-webhook`. Sempre
`supabase functions deploy guru-webhook`.

**Nunca usar `supabase secrets set --env-file`.** O `.env` local contém
`LASTLINK_WEBHOOK_TOKEN`; se estiver defasado em relação ao secret de produção, esse
comando passa a rejeitar todos os webhooks da Lastlink com 401 — e a função continua
no ar respondendo, então a falha não se parece com uma falha. Definir cada secret
individualmente, por nome.

**Zero alterações em `_shared/lastlink/` e `lastlink-webhook/` durante a Fase 1.** Só
criação de arquivos novos. Verificável antes de cada commit:

```sh
git diff --stat -- supabase/functions/_shared/lastlink supabase/functions/lastlink-webhook
# tem de sair vazio
```

Consequência aceita: o núcleo compartilhado nasce como cópia, e a Lastlink só passa a
usá-lo na Fase 2. A duplicação temporária é o preço de manter a Lastlink fora do
caminho crítico.

### Riscos avaliados

| Risco | Avaliação |
|---|---|
| Migração falha no meio e corrompe a tabela | **Impossível.** DDL no Postgres é transacional; falha faz rollback completo. |
| `db push` aplica migrations pendentes indesejadas | **Descartado por verificação** (2026-07-30): as 8 migrations do repositório já estão aplicadas em produção; só a nova seria enviada. |
| Lock da migração enfileira webhooks | 5.638 linhas reescrevem em milissegundos; `lock_timeout = 3s` aborta em vez de enfileirar. |
| Código atual da Lastlink incompatível com `text` | Verificado item a item (ver Compatibilidade). |
| Cache de schema do PostgREST após o DDL | Janela de segundos até o reload automático. Requisição que caia nela recebe 500, e a Lastlink reenvia. Impacto baixo, sem perda de dados. |
| Deploy do `guru-webhook` afeta a Lastlink | Funções são isoladas; o bundle da `lastlink-webhook` não é reconstruído. |

### Reversibilidade

A migração **não precisa ser revertida**: ela é retrocompatível, e o código atual da
Lastlink opera normalmente sobre as colunas `text`.

Registrando ainda assim, com honestidade: reverter para `uuid` só é possível **antes**
do primeiro webhook do Guru ser gravado, porque `guru:<id>:<status>` não converte para
`uuid`. Depois disso, o caminho de volta é remover as linhas do Guru antes de reverter.
Isso não é limitação prática — é apenas a razão pela qual a compatibilidade retroativa
foi verificada com cuidado em vez de se contar com rollback.

Já o deploy é plenamente reversível: redeploy da versão anterior da função.

### Teste de fumaça

Antes e depois da migração, confirmar que a Lastlink segue gravando:

```sql
select count(*), max(created_at)
from transactions
where gateway = 'lastlink' and created_at > now() - interval '24 hours';
```

Complementar com um reenvio de webhook pelo painel da Lastlink, confirmando resposta
200 e a linha correspondente na tabela. Nas 24 horas seguintes, acompanhar os logs da
`lastlink-webhook` em busca de erro novo.

## Rollout

### Fase 1 — Guru no ar, Lastlink intocada

1. Consultando o banco diretamente, reconfirmar o volume de `transactions` (5.638 em
   2026-07-30) e a ausência de views, triggers ou FKs sobre as sete colunas.
2. Teste de fumaça da Lastlink **antes** da migração (ver Garantias).
3. Aplicar a migração via `npx supabase db push` (o CLI já está linkado ao projeto
   `czvlwhfkcwhaqjgbatji`).
4. Teste de fumaça da Lastlink **depois** — venda real ou reenvio pelo painel.
5. Criar `_shared/payments/` e `_shared/guru/`, e `functions/guru-webhook/`. Conferir
   que `git diff` sobre `_shared/lastlink/` e `lastlink-webhook/` sai vazio.
6. Definir os secrets do Guru **um a um**, nunca com `--env-file`.
7. `supabase functions deploy guru-webhook` — sempre nomeando a função.
8. Cadastrar a URL no painel do Guru e disparar um teste.
9. **Comparar os UTMs gravados com os da Lastlink, valor a valor** (ver Rastreamento).
   Divergência aqui bloqueia a migração de tráfego.
10. Validar com venda real de cada um dos três produtos.
11. Acompanhar os logs da `lastlink-webhook` por 24h em busca de erro novo.

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
