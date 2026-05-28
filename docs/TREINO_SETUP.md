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

## 4. Imagens dos exercícios

Mapa nome → URL: `src/lib/data/treino-exercise-images.ts`  
Arquivos: `static/images/treino/exercises/{slug}.png` (fundo branco, 1:1).

Copiar PNGs exportados (nomes com prefixo do exercício):

```bash
node scripts/copy-treino-exercise-images.mjs /caminho/para/pasta/com/pngs
```

O gerador (`treino-plan-generator.ts`) preenche `imageUrl`; `TreinoExerciseMedia` resolve por nome se o plano salvo no Supabase não tiver URL.

Placeholder quando o PNG ainda não existir em `static/`.

## 5. Testar fluxo

1. Login → `/treino`
2. Criar treino agora → quiz → plano gerado
3. Dias com bolinha accent = treino; cinza = descanso
4. Ver preparação → Iniciar treino guiado (requer `has_treino`)
5. Concluir sessão → progresso em `/progresso`

## 6. Opcional

- Sons no player (`playerPrefs.soundEnabled`)
- `supabase db reset` em dev se precisar recriar schema
