-- Add INSERT policies for meal_plans, challenge_progress, shopping_lists
-- These were missing from the initial migration.

create policy "Users can insert own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can insert own challenge progress"
  on public.challenge_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can insert own shopping list"
  on public.shopping_lists for insert
  with check (auth.uid() = user_id);
