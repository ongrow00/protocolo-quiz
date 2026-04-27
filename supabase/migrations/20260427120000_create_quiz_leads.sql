-- Quiz submissions + lead capture (run in Supabase SQL Editor or via CLI)
create table if not exists public.lotz_quiz_leads (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),

	name text not null,
	email text not null,
	profile_id text not null,

	scores jsonb not null default '{}'::jsonb,
	answers jsonb not null default '{}'::jsonb,
	visited_questions jsonb not null default '[]'::jsonb,

	quiz_started_at timestamptz,
	quiz_completed_at timestamptz,

	utm_source text,
	utm_medium text,
	utm_campaign text,
	utm_term text,
	utm_content text,
	offer text,

	whatsapp text,
	objective text,
	clicked_comecar_agora boolean not null default false
);

create index if not exists lotz_quiz_leads_created_at_idx on public.lotz_quiz_leads (created_at desc);
create index if not exists lotz_quiz_leads_email_idx on public.lotz_quiz_leads (email);

alter table public.lotz_quiz_leads enable row level security;

-- No policies: only the service role (server) inserts/reads. Anon cannot access this table.

comment on table public.lotz_quiz_leads is 'Full quiz funnel capture: answers, scores, UTMs, offer, lead contact.';
