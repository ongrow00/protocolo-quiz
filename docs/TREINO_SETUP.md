# Treino — setup Supabase e próximos passos

## 1. Aplicar migration no Supabase

Arquivo: `supabase/migrations/20260527120000_workout_plans.sql`

**Local (CLI):**
```bash
supabase db push
# ou
supabase migration up
```

**Dashboard:** SQL Editor → colar o conteúdo da migration → Run.

Cria:
- Tabela `workout_plans` (quiz + plano JSON)
- Coluna `workout_status` em `challenge_progress`

## 2. Verificar RLS

As policies espelham `meal_plans` (usuário autenticado lê/escreve o próprio registro).

## 3. Liberar produto treino

Coluna `profiles.has_treino` (migration `20260526120000_add_product_access_columns.sql`):

```sql
UPDATE profiles SET has_treino = true WHERE email = 'seu-email@teste.com';
```

Ou via webhook Lastlink quando o produto treino for vendido.

## 4. Vídeos / imagens (depois)

No catálogo (`src/lib/data/treino-catalog.ts`), adicionar por exercício:

```ts
imageUrl: '/images/treino/leg-press.jpg'
// ou videoUrl para link futuro
```

O componente `TreinoExerciseMedia` já mostra placeholder quando não há URL.

## 5. Testar fluxo

1. Login → `/treino`
2. Criar treino agora → quiz → plano gerado
3. Dias com bolinha accent = treino; cinza = descanso
4. Ver preparação → Iniciar treino guiado (requer `has_treino`)
5. Concluir sessão → progresso em `/progresso`

## 6. Opcional

- Sons no player (`playerPrefs.soundEnabled`)
- `supabase db reset` em dev se precisar recriar schema
