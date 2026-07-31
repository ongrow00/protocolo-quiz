alter table public.profiles
  add column if not exists deactivated_at timestamptz;

comment on column public.profiles.deactivated_at is
  'When set, the user was manually deactivated by an admin (mirror of the Supabase Auth ban). Null = active.';;
