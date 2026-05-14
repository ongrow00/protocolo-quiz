-- Permite rascunho do funil (sync por step) antes de nome/e-mail; identifica linha por sessão do browser
alter table public.lotz_quiz_leads
	alter column name drop not null,
	alter column email drop not null,
	alter column profile_id drop not null;

alter table public.lotz_quiz_leads
	add column if not exists funnel_session_id uuid;

create unique index if not exists lotz_quiz_leads_funnel_session_id_uidx
	on public.lotz_quiz_leads (funnel_session_id);

comment on column public.lotz_quiz_leads.funnel_session_id is 'ID estável no sessionStorage para upsert incremental do quiz até o submit final.';
