-- Migra nome antigo → lotz_quiz_leads (se ainda existir só quiz_leads)
do $$
begin
	if exists (
		select 1 from pg_tables
		where schemaname = 'public' and tablename = 'quiz_leads'
	) and not exists (
		select 1 from pg_tables
		where schemaname = 'public' and tablename = 'lotz_quiz_leads'
	) then
		alter table public.quiz_leads rename to lotz_quiz_leads;
	end if;
end $$;

-- WhatsApp, objetivo principal (rótulo) e clique no CTA "COMEÇAR AGORA"
alter table public.lotz_quiz_leads add column if not exists whatsapp text;
alter table public.lotz_quiz_leads add column if not exists objective text;
alter table public.lotz_quiz_leads add column if not exists clicked_comecar_agora boolean not null default false;

comment on column public.lotz_quiz_leads.whatsapp is 'E.164 / dígitos informados no pós-quiz';
comment on column public.lotz_quiz_leads.objective is 'Objetivo principal (rótulo) a partir de goal_type no quiz';
comment on column public.lotz_quiz_leads.clicked_comecar_agora is 'True se clicou no botão COMEÇAR AGORA na oferta (results)';
