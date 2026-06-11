-- Usuário só conclui o onboarding in-app após recusar explicitamente a oferta em /ativacao.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'Preenchido quando o usuário recusa a oferta de upsell em /ativacao e entra no app.';
