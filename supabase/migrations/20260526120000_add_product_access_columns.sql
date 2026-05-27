-- Add product access flags to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_protocolo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_consultoria boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_treino boolean NOT NULL DEFAULT false;
