-- /results: oferta revelada pelo gate de reprodução do VTurb (ou restore/bónus no funil).
alter table public.quiz_responses
  add column if not exists offer_revealed boolean not null default false,
  add column if not exists offer_revealed_at timestamptz;

comment on column public.quiz_responses.offer_revealed is
  'True quando a oferta em /results foi liberada (VTurb, restore local ou bónus).';
comment on column public.quiz_responses.offer_revealed_at is
  'Timestamp da primeira revelação da oferta em /results.';
