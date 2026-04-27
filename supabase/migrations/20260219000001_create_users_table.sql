-- Tabela users: dados completos do usuário e assinatura (um por auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,

  full_name text,
  first_name text,
  last_name text,
  display_name text,
  email text,
  phone text,

  document_type text,
  document_number text,

  address_zipcode text,
  address_country text,
  address_country_iso text,
  address_state text,
  address_city text,
  address_neighborhood text,
  address_street text,
  address_number text,
  address_complement text,

  subscriptions_id text,
  plan_id text,
  plan_name text,
  subscription_id text,
  transaction_id text,
  payment_type text,
  installments_number text,
  price numeric,
  status boolean,
  created_time timestamptz,

  activate_date date,
  status_sub text,
  active_plan text,

  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users can read own row"
  on public.users for select
  using (auth.uid() = id);
create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id);
create policy "Users can insert own row"
  on public.users for insert
  with check (auth.uid() = id);
-- Trigger: criar linha em users quando um novo auth.users for inserido
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
comment on table public.users is 'Dados extendidos do usuário e assinatura; id = auth.users.id';
