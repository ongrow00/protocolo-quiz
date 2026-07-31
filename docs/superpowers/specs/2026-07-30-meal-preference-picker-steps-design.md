# Picker de preferências alimentares em steps

**Data:** 2026-07-30
**Componente:** `src/lib/components/post-quiz/MealFoodPreferencePicker.svelte`

## Problema

Hoje o picker mostra as 5 refeições como um acordeão numa página só. A pessoa
abre um bloco, marca 4 carboidratos e 4 proteínas, e o bloco fecha e abre o
próximo sozinho. São 40 seleções numa tela longa, sem um ponto de parada claro
nem noção de quanto falta.

## Objetivo

Uma refeição por step, com botão fixo no rodapé que só ativa quando as seleções
daquele step estiverem completas.

## Escopo

Alterar **apenas** `MealFoodPreferencePicker.svelte`.

Ficam intactos:

- `src/lib/data/meal-preferences.ts` — dados e tipos
- O contrato `onComplete(selections: MealSelections)`
- `ResultsOfferPage.svelte` — o call site na linha 721 não muda

## Estado

Substituir `expanded: Record<MealBlockId, boolean>` por `stepIndex: number`
(0 a 4).

`selections` continua um `$state<MealSelections>` com a mesma forma, então
voltar um step preserva o que já foi marcado.

Some com a mudança (só existiam para o acordeão):

- `isBlockAccessible()`
- `openBlock()`
- `openNextBlockAfter()`
- `toggleExpanded()`
- `selectedLabels()`
- o bloco de auto-collapse dentro de `toggleItem()` (linhas 93-96)
- o `$effect` de auto-notificação (linhas 68-78)

`toggleItem()` mantém a lógica de marcar/desmarcar e o teto de 4, mas perde o
guard `if (!expanded[blockId]) return` — no modelo de step só existe um bloco
renderizado por vez.

## Layout de cada step

```
←   ▬▬ ▬▬ ── ── ──          voltar + barra de 5 segmentos

Café da Manhã          4/8
Escolha 4 opções de cada categoria

CARBOIDRATO            4/4
[🥖][🌮][🌽] ...

PROTEÍNA               0/4
[🍳][🍗][🥩] ...
       (scroll)
════════════════════════════
[      Continuar      ]      fixo
```

A seta de voltar fica dentro do picker, não no header do `ResultsOfferPage`,
para não precisar elevar estado. No step 0 ela não é renderizada.

A barra de progresso são 5 segmentos: os já concluídos e o atual em `bg-accent`,
os futuros em `bg-line`.

O grid de itens, os contadores por categoria e os estilos de container query
(`.meal-food-btn`, `.meal-food-emoji`, `.meal-food-label`) ficam como estão.

## Rodapé fixo

Reusa o padrão de `QuizShell.svelte:407-489`:

```
fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none
  └ max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto
      └ button w-full h-[60px] rounded-2xl bg-accent text-bg disabled:opacity-30
```

- **Label:** "Continuar" nos steps 0-3, "Finalizar" no step 4
- **Habilitado quando:** `isBlockComplete(stepIndex)` — 4 carboidratos E 4 proteínas
- O conteúdo do step troca o atual `pb-[50px]` (linha 149) pela classe
  `pb-fixed-cta-reserve`, já definida em `src/app.css:108` como
  `calc(5rem + 3.75rem + max(2rem, env(safe-area-inset-bottom)))` — é o token
  que o projeto usa para reservar espaço sob CTAs fixos

### Sem colisão com o footer existente

`ResultsOfferPage` já renderiza um sticky footer na linha 1357, mas ele é gated
por `showResultsStickyFooter = !isAtivacaoVariant && ativacaoHeroUnlocked`
(linha 623). O picker só renderiza quando `isAtivacaoVariant` é `true`
(linha 715). São mutuamente exclusivos — nunca aparecem juntos.

## Transição

`{#key stepIndex}` com `fly` de entrada `{ x: 30, duration: 260, delay: 40 }` e
saída `{ x: -30, duration: 180 }` — os mesmos valores de
`MealFollowUpQuestions.svelte:24-25`, que roda logo depois no fluxo.

Ao trocar de step o scroll volta ao topo.

## Fluxo

1. Step 0 (Café da Manhã) — botão desabilitado em 0/8
2. Pessoa marca 4 carboidratos; ao chegar em 4, as outras 4 opções da categoria
   ficam `disabled` (comportamento atual mantido)
3. Marca 4 proteínas → botão ativa
4. Clica "Continuar" → `stepIndex++`, transição fly, scroll ao topo
5. Repete para Almoço, Lanche da Tarde, Janta, Lanche da Noite
6. No step 4 o botão diz "Finalizar"; ao clicar, dispara
   `onComplete({ ...selections })` com a mesma estrutura de hoje

**Voltar:** `stepIndex--`. As seleções do step anterior aparecem marcadas e o
botão já vem ativo.

## Casos de borda

| Caso | Comportamento |
|---|---|
| Step 0 | Seta de voltar não renderiza |
| Clique numa 5ª opção da categoria | Botão `disabled`, sem efeito (igual hoje) |
| Desmarcar item num step completo | Botão do rodapé desativa na hora |
| Voltar e desmarcar um item | Botão desativa; steps à frente mantêm suas seleções |
| Duplo clique em "Finalizar" | Botão desabilita ao avançar; `onComplete` dispara uma vez |

## Verificação

`tests/e2e` e `tests/unit` estão vazios e o `package.json` não tem runner de
teste, então não há suíte para estender.

- `npm run check` (svelte-check) sem erros novos
- Manual no navegador, na variante ativação:
  - percorrer os 5 steps até o `onComplete`
  - confirmar que o botão só ativa em 8/8
  - voltar um step e verificar que a seleção foi preservada
  - conferir que o rodapé não cobre a última linha de itens no viewport mobile
