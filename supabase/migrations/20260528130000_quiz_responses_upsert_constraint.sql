-- Fix production: replace partial unique index with constraint for PostgREST upsert

alter table public.quiz_responses
  add column if not exists scores jsonb not null default '{}'::jsonb,
  add column if not exists current_question_id text,
  add column if not exists last_activity_at timestamptz,
  add column if not exists profile_id text,
  add column if not exists clicked_comecar_agora boolean not null default false;

drop index if exists public.quiz_responses_funnel_session_unique;

alter table public.quiz_responses
  drop constraint if exists quiz_responses_funnel_session_id_key;

alter table public.quiz_responses
  add constraint quiz_responses_funnel_session_id_key unique (funnel_session_id);
