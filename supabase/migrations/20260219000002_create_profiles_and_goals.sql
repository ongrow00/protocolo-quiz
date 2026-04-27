-- profiles: perfil fitness (UserProfile), um por usuário
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  height_cm numeric,
  weight_kg numeric,
  sex text check (sex in ('male', 'female', 'other')),
  birth_date date,
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text check (goal in ('lose_weight', 'maintain', 'gain_mass')),
  waist_cm numeric,
  unit_preference text check (unit_preference in ('metric', 'imperial')),
  chest_cm numeric,
  hip_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  neck_cm numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles for insert with check (auth.uid() = id);
-- goals_config: metas de calorias/macros + meta goals (uma linha por usuário)
create table public.goals_config (
  id uuid primary key references auth.users (id) on delete cascade,
  auto_calories boolean default true,
  auto_macros boolean default true,
  manual_calories numeric,
  manual_macros jsonb,
  activity_kcal_per_day numeric default 0,
  weight_target_kg numeric,
  water_ml_per_day numeric default 2000,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.goals_config enable row level security;
create policy "Goals_config select own" on public.goals_config for select using (auth.uid() = id);
create policy "Goals_config update own" on public.goals_config for update using (auth.uid() = id);
create policy "Goals_config insert own" on public.goals_config for insert with check (auth.uid() = id);
comment on table public.profiles is 'Perfil fitness do usuário (altura, peso, meta, etc.)';
comment on table public.goals_config is 'Config de metas de calorias/macros e meta goals (água, peso, atividade)';
