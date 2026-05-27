-- Workout plans (treino personalizado) + progress on challenge_progress

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid,

  quiz_answers jsonb not null default '{}'::jsonb,
  generated_plan jsonb not null,
  plan_version int not null default 1,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workout_plans_user_id_idx on public.workout_plans(user_id) where user_id is not null;
create index if not exists workout_plans_anonymous_id_idx on public.workout_plans(anonymous_id) where anonymous_id is not null;
create index if not exists workout_plans_active_idx on public.workout_plans(user_id, is_active) where is_active = true;

alter table public.workout_plans enable row level security;

create policy "Users can view own workout plans"
  on public.workout_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout plans"
  on public.workout_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own workout plans"
  on public.workout_plans for update
  using (auth.uid() = user_id);

comment on table public.workout_plans is 'Generated 14-day circuit workout plans from treino quiz.';

alter table public.challenge_progress
  add column if not exists workout_status jsonb not null default '{"completedSessions":[],"playerPrefs":{"autoAdvance":true,"soundEnabled":true}}'::jsonb;
