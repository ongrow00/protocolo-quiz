# Picker de preferências alimentares em steps — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o picker de preferências alimentares de um acordeão de 5 refeições numa única página em um fluxo de 5 steps, com botão fixo no rodapé que só ativa quando as 4+4 seleções do step estiverem completas.

**Architecture:** Um só componente Svelte 5 (`MealFoodPreferencePicker.svelte`) troca o estado de acordeão (`expanded: Record<MealBlockId, boolean>`) por um `stepIndex: number`. O rodapé fixo copia o padrão já usado em `QuizShell.svelte`, e a transição entre steps copia o `.content-transition-root` de `MealFollowUpQuestions.svelte`. Nenhum arquivo de dados ou call site muda.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes: `$state`, `$derived`, `$props`), Tailwind CSS 4, TypeScript.

**Spec:** `docs/superpowers/specs/2026-07-30-meal-preference-picker-steps-design.md`

## Global Constraints

- **Não alterar** `src/lib/data/meal-preferences.ts` — dados e tipos ficam como estão.
- **Não alterar** `src/lib/components/post-quiz/ResultsOfferPage.svelte` — o call site na linha 721 (`<MealFoodPreferencePicker hideLogo onComplete={handleMealPreferencesComplete} />`) continua idêntico.
- **Não alterar** a assinatura das props: `{ hideLogo?: boolean; onComplete?: (selections: MealSelections) => void }`.
- `MEAL_SELECTION_LIMIT` continua `4`. O teto por categoria continua valendo: ao atingir 4 seleções, as opções restantes daquela categoria ficam `disabled`.
- `onComplete` recebe um objeto novo com as 5 chaves espalhadas (`{ ...selections.cafe }` etc.), como hoje.
- Runes de Svelte 5 (`$state` / `$derived` / `$props`). Sem `export let`, sem stores.
- Textos em português, seguindo os já existentes no componente.
- Classes de tema do projeto: `text-heading`, `text-muted`, `text-body`, `bg-surface`, `bg-surface-2`, `bg-accent`, `text-bg`, `border-line`, `bg-line`.
- Não existe runner de teste no `package.json`. A verificação de cada task é `npm run check` mais um roteiro manual no navegador.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `src/lib/components/post-quiz/MealFoodPreferencePicker.svelte` | Todo o fluxo de steps: estado, seleção, navegação, rodapé | Modificar (única mudança do plano) |

O componente hoje tem 297 linhas. Removendo a lógica de acordeão e adicionando steps, ele fica menor e com uma responsabilidade só — não há motivo para dividir em arquivos novos.

## Pré-requisito para todas as tasks

O picker só renderiza na **variante ativação**. Para ver a tela no navegador é preciso chegar nela pelo fluxo do quiz ou abrir a rota de results com o parâmetro da variante de ativação. Confirme o caminho com `grep -n "isAtivacaoVariant" src/lib/components/post-quiz/ResultsOfferPage.svelte` antes de começar a Task 1 e anote a URL — as três tasks usam a mesma.

O dev server sobe com `npm run dev` em `http://localhost:5173`.

---

### Task 1: Estado de step e rodapé fixo

Substitui o acordeão por um step por refeição e adiciona o CTA fixo. Ao fim desta task o fluxo já funciona de ponta a ponta (sem barra de progresso e sem voltar, que vêm na Task 2).

**Files:**
- Modify: `src/lib/components/post-quiz/MealFoodPreferencePicker.svelte` (reescrita do `<script>` e do markup; o bloco `<style>` das linhas 268-297 fica intacto)

**Interfaces:**
- Consumes: `MEAL_BLOCKS`, `MEAL_SELECTION_LIMIT`, `MealBlockId`, `MealBlock`, `MealSelections` de `$lib/data/meal-preferences`
- Produces (usado pelas Tasks 2 e 3):
  - `let stepIndex = $state(0)` — índice 0..4 do step atual
  - `const currentBlock = $derived(MEAL_BLOCKS[stepIndex])` — tipo `MealBlock`
  - `const canAdvance = $derived(...)` — `boolean`, true quando 4 carbs E 4 proteínas
  - `function goNext(): void` — avança ou dispara `onComplete` no último step
  - `type Category = 'carbs' | 'proteins'`

- [ ] **Step 1: Substituir o bloco `<script>` inteiro (linhas 1-132)**

Note que `MealFoodItem` sai dos imports — ele só era usado por `selectedLabels()`, que está sendo removida.

```svelte
<script lang="ts">
	import Logo from '$lib/components/ui/Logo.svelte';
	import {
		MEAL_BLOCKS,
		MEAL_SELECTION_LIMIT,
		type MealBlockId,
		type MealBlock,
		type MealSelections
	} from '$lib/data/meal-preferences';

	interface Props {
		hideLogo?: boolean;
		onComplete?: (selections: MealSelections) => void;
	}

	let { hideLogo = false, onComplete }: Props = $props();

	type Category = 'carbs' | 'proteins';

	const selections = $state<MealSelections>({
		cafe: { carbs: [], proteins: [] },
		almoco: { carbs: [], proteins: [] },
		lanche: { carbs: [], proteins: [] },
		janta: { carbs: [], proteins: [] },
		lancheNoite: { carbs: [], proteins: [] }
	});

	let stepIndex = $state(0);
	let completionNotified = $state(false);

	const currentBlock = $derived(MEAL_BLOCKS[stepIndex]);
	const isLastStep = $derived(stepIndex === MEAL_BLOCKS.length - 1);

	function isCategoryComplete(blockId: MealBlockId, cat: Category): boolean {
		return selections[blockId][cat].length >= MEAL_SELECTION_LIMIT;
	}

	function isBlockComplete(blockId: MealBlockId): boolean {
		return isCategoryComplete(blockId, 'carbs') && isCategoryComplete(blockId, 'proteins');
	}

	const canAdvance = $derived(isBlockComplete(currentBlock.id));

	function toggleItem(blockId: MealBlockId, cat: Category, itemId: string) {
		const current = selections[blockId][cat];
		if (current.includes(itemId)) {
			selections[blockId][cat] = current.filter((id) => id !== itemId);
			return;
		}
		if (current.length >= MEAL_SELECTION_LIMIT) return;
		selections[blockId][cat] = [...current, itemId];
	}

	function goNext() {
		if (!canAdvance) return;

		if (!isLastStep) {
			stepIndex += 1;
			return;
		}

		if (completionNotified) return;
		completionNotified = true;
		onComplete?.({
			cafe: { ...selections.cafe },
			almoco: { ...selections.almoco },
			lanche: { ...selections.lanche },
			janta: { ...selections.janta },
			lancheNoite: { ...selections.lancheNoite }
		});
	}

	function categoryLabel(block: MealBlock, cat: Category): string {
		if (cat === 'carbs') return block.carbLabel ?? 'Carboidrato';
		return block.proteinLabel ?? 'Proteína';
	}

	function totalSelected(blockId: MealBlockId): number {
		return selections[blockId].carbs.length + selections[blockId].proteins.length;
	}

	const totalLimit = MEAL_SELECTION_LIMIT * 2;
</script>
```

- [ ] **Step 2: Substituir o markup (linhas 134-266) — tudo entre o `</script>` e o `<style>`**

O `<style>` das linhas 268-297 **não muda**.

```svelte
<div class="meal-picker w-full max-w-md mx-auto min-w-0 text-left">
	{#if !hideLogo}
		<div class="flex justify-center mb-6">
			<Logo class="block h-7 w-auto" />
		</div>
	{/if}

	<div class="mb-4 flex items-start justify-between gap-3 px-1">
		<div class="min-w-0">
			<h2 class="text-xl font-extrabold text-heading leading-snug">
				{currentBlock.title}
			</h2>
			<p class="text-sm text-muted mt-1 leading-relaxed">
				Selecione {MEAL_SELECTION_LIMIT} opções de cada categoria
			</p>
			{#if currentBlock.hint}
				<p class="text-[11px] text-muted/80 mt-1 leading-relaxed">{currentBlock.hint}</p>
			{/if}
		</div>
		<span
			class="shrink-0 text-sm tabular-nums {canAdvance
				? 'font-semibold text-accent'
				: 'text-muted'}"
		>
			{totalSelected(currentBlock.id)}/{totalLimit}
		</span>
	</div>

	<div class="flex flex-col gap-5 pb-fixed-cta-reserve">
		{#each ['carbs', 'proteins'] as cat (cat)}
			{@const category = cat as Category}
			{@const items = category === 'carbs' ? currentBlock.carbs : currentBlock.proteins}
			{@const selected = selections[currentBlock.id][category]}
			{@const catComplete = selected.length >= MEAL_SELECTION_LIMIT}
			<div>
				<div class="flex items-center justify-between mb-2 px-1">
					<span
						class="text-xs font-bold uppercase tracking-wide {catComplete
							? 'text-accent'
							: 'text-muted'}"
					>
						{categoryLabel(currentBlock, category)}
					</span>
					<span
						class="text-xs tabular-nums {catComplete
							? 'font-semibold text-accent'
							: 'text-muted'}"
					>
						{selected.length}/{MEAL_SELECTION_LIMIT}
					</span>
				</div>
				<div class="grid grid-cols-3 gap-2">
					{#each items as item (item.id)}
						{@const isSelected = selected.includes(item.id)}
						{@const isDisabled = !isSelected && selected.length >= MEAL_SELECTION_LIMIT}
						<button
							type="button"
							role="checkbox"
							aria-checked={isSelected}
							aria-disabled={isDisabled}
							disabled={isDisabled}
							onclick={() => toggleItem(currentBlock.id, category, item.id)}
							class="meal-food-btn @container flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
								{isSelected
								? 'border-accent bg-accent text-bg font-medium'
								: isDisabled
									? 'border-line/40 bg-surface text-muted/50 cursor-not-allowed'
									: 'border-line bg-surface text-body hover:border-accent/40 hover:bg-surface-2'}"
						>
							<span class="meal-food-emoji shrink-0" aria-hidden="true">{item.emoji}</span>
							<span class="meal-food-label min-w-0 w-full text-balance">{item.label}</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<div
	class="fixed bottom-0 left-0 right-0 z-20 bg-gradient-bottom-fade-white pt-20 pointer-events-none"
>
	<div
		class="max-w-lg mx-auto w-full px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pointer-events-auto"
	>
		<button
			type="button"
			onclick={goNext}
			disabled={!canAdvance}
			class="w-full h-[60px] flex items-center justify-center gap-2 rounded-2xl font-bold text-base bg-accent text-bg transition-all duration-200 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
		>
			<span>{isLastStep ? 'Finalizar' : 'Continuar'}</span>
			<svg
				class="w-4 h-4 shrink-0"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
			</svg>
		</button>
	</div>
</div>
```

- [ ] **Step 3: Rodar o type-check**

Run: `npm run check`
Expected: PASS, sem erros novos em `MealFoodPreferencePicker.svelte`. Se aparecer "MealFoodItem is declared but never used", o import do Step 1 não foi aplicado corretamente — `MealFoodItem` deve ter saído da lista.

- [ ] **Step 4: Verificar no navegador**

Suba `npm run dev` e abra a tela do picker (URL anotada no pré-requisito). Confirme:

1. Aparece **só o Café da Manhã** — Almoço, Lanche etc. não estão na página
2. Botão "Continuar" no rodapé, fixo, opacidade baixa (desabilitado), contador `0/8`
3. Marcar 4 carboidratos → as outras 4 opções de carboidrato ficam apagadas e não clicáveis; botão ainda desabilitado
4. Marcar 4 proteínas → contador `8/8`, botão ativa
5. Clicar "Continuar" → aparece o Almoço, contador volta a `0/8`, botão desabilitado
6. Rolar até o fim da lista de proteínas → a última linha de cards **não** fica escondida atrás do rodapé
7. No 5º step (Lanche da Noite) o botão diz **"Finalizar"**; ao clicar, a tela avança para as perguntas de sim/não (`MealFollowUpQuestions`)

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/post-quiz/MealFoodPreferencePicker.svelte
git commit -m "feat(preferencias): um step por refeicao com CTA fixo no rodape"
```

---

### Task 2: Barra de progresso e botão voltar

**Files:**
- Modify: `src/lib/components/post-quiz/MealFoodPreferencePicker.svelte`

**Interfaces:**
- Consumes: `stepIndex`, `MEAL_BLOCKS` (Task 1)
- Produces: `function goBack(): void`

- [ ] **Step 1: Adicionar `goBack()` ao `<script>`**

Insira logo depois da função `goNext()`:

```ts
	function goBack() {
		if (stepIndex === 0) return;
		stepIndex -= 1;
	}
```

- [ ] **Step 2: Adicionar a linha de progresso no markup**

Insira **entre** o bloco `{#if !hideLogo}...{/if}` e a `<div class="mb-4 flex items-start justify-between...">` do título:

```svelte
	<div class="mb-4 flex items-center gap-3 px-1">
		{#if stepIndex > 0}
			<button
				type="button"
				class="shrink-0 -ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-heading transition-colors hover:bg-surface-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
				aria-label="Voltar"
				onclick={goBack}
			>
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
		{/if}
		<div
			class="flex flex-1 items-center gap-1.5"
			role="progressbar"
			aria-valuemin={1}
			aria-valuemax={MEAL_BLOCKS.length}
			aria-valuenow={stepIndex + 1}
			aria-label="Progresso das preferências"
		>
			{#each MEAL_BLOCKS as block, i (block.id)}
				<span
					class="h-1 flex-1 rounded-full transition-colors duration-200 {i <= stepIndex
						? 'bg-accent'
						: 'bg-line'}"
				></span>
			{/each}
		</div>
	</div>
```

- [ ] **Step 3: Rodar o type-check**

Run: `npm run check`
Expected: PASS, sem erros novos.

- [ ] **Step 4: Verificar no navegador**

1. No step 1 a barra mostra **1 de 5 segmentos** em destaque e **não** há seta de voltar
2. Completar o step 1 e avançar → 2 segmentos em destaque e a seta de voltar aparece
3. Clicar na seta → volta ao Café da Manhã com **os 8 itens ainda marcados** e o botão "Continuar" já ativo
4. Desmarcar um carboidrato → botão desativa na hora e o contador vira `7/8`
5. Remarcar, avançar de novo → o Almoço mantém as seleções que já tinham sido feitas nele

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/post-quiz/MealFoodPreferencePicker.svelte
git commit -m "feat(preferencias): barra de progresso e navegacao para tras"
```

---

### Task 3: Transição entre steps e reset de scroll

**Files:**
- Modify: `src/lib/components/post-quiz/MealFoodPreferencePicker.svelte`

**Interfaces:**
- Consumes: `stepIndex`, `goNext()`, `goBack()` (Tasks 1 e 2)
- Produces: nada — última task

- [ ] **Step 1: Importar `fly` e `tick`, e declarar as constantes de transição**

No topo do `<script>`, antes do import do `Logo`:

```ts
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
```

E logo depois da declaração de `totalLimit`, no fim do `<script>`:

```ts
	const stepFlyIn = { x: 30, duration: 260, delay: 40 };
	const stepFlyOut = { x: -30, duration: 180 };

	let stepRoot = $state<HTMLElement | null>(null);

	async function resetScroll() {
		await tick();
		stepRoot?.closest('main')?.scrollTo({ top: 0, behavior: 'auto' });
	}
```

`closest('main')` acha o container que realmente rola — o `<main class="overflow-y-auto">` do layout de post-quiz (`src/routes/(post-quiz)/+layout.svelte:310`). Usar `closest` em vez de um `querySelector` global mantém o componente independente do seletor do layout.

- [ ] **Step 2: Chamar `resetScroll()` nas duas navegações**

Em `goNext()`, dentro do ramo que avança:

```ts
		if (!isLastStep) {
			stepIndex += 1;
			void resetScroll();
			return;
		}
```

Em `goBack()`:

```ts
	function goBack() {
		if (stepIndex === 0) return;
		stepIndex -= 1;
		void resetScroll();
	}
```

- [ ] **Step 3: Envolver o conteúdo do step no `{#key}` com as transições**

O título e o bloco de categorias (tudo da `<div class="mb-4 flex items-start justify-between gap-3 px-1">` até o fechamento da `<div class="flex flex-col gap-5 pb-fixed-cta-reserve">`) passa a ficar dentro deste wrapper. A linha de progresso da Task 2 fica **fora**, para não animar junto.

```svelte
	<div class="content-transition-root" bind:this={stepRoot}>
		{#key stepIndex}
			<div in:fly={stepFlyIn} out:fly={stepFlyOut}>
				<!-- MOVER PARA CÁ, sem alterar o conteúdo: -->
				<!-- 1. <div class="mb-4 flex items-start justify-between gap-3 px-1"> -->
				<!--    ...título do bloco, subtítulo, hint e contador X/8...          -->
				<!--    </div>                                                          -->
				<!-- 2. <div class="flex flex-col gap-5 pb-fixed-cta-reserve">          -->
				<!--    ...{#each ['carbs', 'proteins']} com os grids de itens...       -->
				<!--    </div>                                                          -->
			</div>
		{/key}
	</div>
```

Nenhuma linha dessas duas divs muda — elas só passam a ficar aninhadas dentro do
`{#key}`. Confira ao final que a `<div class="meal-picker ...">` externa e a
linha de progresso continuam **fora** do `.content-transition-root`, e que o
rodapé fixo continua fora da `.meal-picker`.

- [ ] **Step 4: Adicionar o CSS do grid-stack ao `<style>`**

O `.content-transition-root` empilha o step que sai e o que entra na mesma célula de grid, para que não pulem um abaixo do outro durante a transição. É o mesmo padrão de `MealFollowUpQuestions.svelte:102-113`.

Adicione no **início** do bloco `<style>` existente, antes de `.meal-picker`:

```css
	.content-transition-root {
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 1fr;
		width: 100%;
	}

	.content-transition-root > * {
		grid-row: 1;
		grid-column: 1;
		min-width: 0;
	}
```

- [ ] **Step 5: Rodar o type-check**

Run: `npm run check`
Expected: PASS, sem erros novos.

- [ ] **Step 6: Verificar no navegador**

1. Avançar um step → o conteúdo sai para a esquerda e o novo entra da direita, **sem** um salto vertical no meio da animação
2. Voltar um step → mesma animação
3. Rolar até o fim das proteínas, avançar → o novo step começa **no topo**, não no meio da lista
4. A barra de progresso e o rodapé **não** animam junto — só o miolo
5. Percorrer os 5 steps até "Finalizar" e confirmar que a transição para `MealFollowUpQuestions` continua funcionando

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/post-quiz/MealFoodPreferencePicker.svelte
git commit -m "feat(preferencias): transicao fly entre steps e reset de scroll"
```

---

## Verificação final

Depois das três tasks, um passe completo:

- [ ] `npm run check` sem erros novos
- [ ] Percorrer os 5 steps do zero até `onComplete`, confirmando que o plano alimentar é gerado depois (o `handleMealPreferencesComplete` em `ResultsOfferPage.svelte:547` chama `postQuizStore.setMealSelections`)
- [ ] Testar num viewport estreito (iPhone SE, 375px) que o rodapé não cobre conteúdo
- [ ] Confirmar que na variante **não**-ativação nada quebrou — o picker não renderiza lá, e o sticky footer da oferta (`ResultsOfferPage.svelte:1357`) continua aparecendo normalmente
