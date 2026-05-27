-- ============================================================================
-- Protocolo Desbloqueio — app tables
-- ============================================================================

-- Drop legacy tables from previous migrations
drop table if exists public.shopping_lists cascade;
drop table if exists public.challenge_progress cascade;
drop table if exists public.meal_plans cascade;
drop table if exists public.quiz_responses cascade;
drop table if exists public.transactions cascade;
drop table if exists public.daily_goals cascade;
drop table if exists public.streaks cascade;
drop table if exists public.lotz_quiz_leads cascade;
drop table if exists public.profiles cascade;

-- 1. profiles (extends auth.users)
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  anonymous_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  document_type text default 'CPF',
  document text,
  street text,
  number text,
  neighborhood text,
  city text,
  state text,
  zip text,
  country text default 'Brasil',
  photo_url text,
  plan_status text default 'active',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_anonymous_id_idx
  on public.profiles(anonymous_id) where anonymous_id is not null;

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

comment on table public.profiles is 'User profile data, extends auth.users. Created by webhook on purchase.';

-- 2. transactions (Lastlink webhook events)
-- ============================================================================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid,

  webhook_event_id uuid not null unique,
  event text not null,
  is_test boolean not null default false,

  buyer_lastlink_id uuid,
  buyer_email text not null,
  buyer_name text,
  buyer_phone text,
  buyer_document text,
  buyer_address jsonb,

  product_lastlink_id uuid,
  product_name text,
  product_price numeric(10,2),
  offer_lastlink_id uuid,
  offer_name text,

  payment_id uuid,
  payment_method text,
  payment_date timestamptz,
  original_price numeric(10,2),
  total_price numeric(10,2),
  installments integer,
  interest_amount numeric(10,2),
  recurrency integer,
  next_billing_at timestamptz,

  subscription_lastlink_id uuid,
  commissions jsonb,
  seller_lastlink_id uuid,
  seller_email text,

  utm_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,

  device_user_agent text,
  device_ip inet,

  raw_payload jsonb not null,

  lastlink_created_at timestamptz,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists transactions_buyer_email_idx on public.transactions(buyer_email);
create index if not exists transactions_anonymous_id_idx on public.transactions(anonymous_id) where anonymous_id is not null;
create index if not exists transactions_user_id_idx on public.transactions(user_id) where user_id is not null;
create index if not exists transactions_event_idx on public.transactions(event);
create index if not exists transactions_payment_date_idx on public.transactions(payment_date desc);
create index if not exists transactions_subscription_idx on public.transactions(subscription_lastlink_id) where subscription_lastlink_id is not null;

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

comment on table public.transactions is 'Payment events from Lastlink webhooks. Inserts via service role only.';

-- 3. quiz_responses
-- ============================================================================

create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid not null,
  funnel_session_id uuid,

  answers jsonb not null default '{}'::jsonb,
  visited_questions jsonb default '[]'::jsonb,
  objective text,

  name text,
  email text,
  whatsapp text,

  quiz_started_at timestamptz,
  quiz_completed_at timestamptz,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  offer text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quiz_responses_anonymous_id_idx on public.quiz_responses(anonymous_id);
create index if not exists quiz_responses_user_id_idx on public.quiz_responses(user_id) where user_id is not null;
create index if not exists quiz_responses_funnel_session_idx on public.quiz_responses(funnel_session_id) where funnel_session_id is not null;

alter table public.quiz_responses enable row level security;

create policy "Users can view own quiz responses"
  on public.quiz_responses for select
  using (auth.uid() = user_id);

comment on table public.quiz_responses is 'Quiz answers and funnel data. Inserts/updates via service role (anonymous sync).';

-- 4. meal_plans
-- ============================================================================

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid not null,

  selections jsonb not null,
  generated_plan jsonb not null,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_plans_anonymous_id_idx on public.meal_plans(anonymous_id);
create index if not exists meal_plans_user_id_idx on public.meal_plans(user_id) where user_id is not null;

alter table public.meal_plans enable row level security;

create policy "Users can view own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

comment on table public.meal_plans is 'Generated 14-day meal plans based on user food preferences.';

-- 5. challenge_progress
-- ============================================================================

create table if not exists public.challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid not null,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,

  current_day integer not null default 1,
  started_at timestamptz,
  streak integer not null default 0,
  last_completed_day_at timestamptz,
  days_status jsonb not null default '{}'::jsonb,
  meals_status jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists challenge_progress_user_id_idx on public.challenge_progress(user_id) where user_id is not null;
create index if not exists challenge_progress_anonymous_id_idx on public.challenge_progress(anonymous_id);

alter table public.challenge_progress enable row level security;

create policy "Users can view own challenge progress"
  on public.challenge_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own challenge progress"
  on public.challenge_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own challenge progress"
  on public.challenge_progress for update
  using (auth.uid() = user_id);

comment on table public.challenge_progress is 'Daily protocol progress tracking (meals completed/skipped, streak).';

-- 6. shopping_lists
-- ============================================================================

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id uuid not null,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,

  checked_items jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shopping_lists_user_id_idx on public.shopping_lists(user_id) where user_id is not null;
create index if not exists shopping_lists_anonymous_id_idx on public.shopping_lists(anonymous_id);

alter table public.shopping_lists enable row level security;

create policy "Users can view own shopping list"
  on public.shopping_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert own shopping list"
  on public.shopping_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own shopping list"
  on public.shopping_lists for update
  using (auth.uid() = user_id);

comment on table public.shopping_lists is 'Shopping list check-off state per meal plan.';
