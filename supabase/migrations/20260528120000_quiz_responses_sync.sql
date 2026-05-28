-- Quiz funnel sync: columns for incremental progress + upsert by session

alter table public.quiz_responses
  add column if not exists scores jsonb not null default '{}'::jsonb,
  add column if not exists current_question_id text,
  add column if not exists last_activity_at timestamptz,
  add column if not exists profile_id text,
  add column if not exists clicked_comecar_agora boolean not null default false;

create unique index if not exists quiz_responses_funnel_session_unique
  on public.quiz_responses (funnel_session_id)
  where funnel_session_id is not null;

comment on column public.quiz_responses.scores is 'Category scores computed from quiz answers';
comment on column public.quiz_responses.current_question_id is 'Last question id the user was on';
comment on column public.quiz_responses.last_activity_at is 'Client timestamp of last sync payload';
