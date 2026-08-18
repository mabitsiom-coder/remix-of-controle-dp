ALTER TABLE public.folha_competencia ADD COLUMN codigo_dominio text NOT NULL DEFAULT '';
ALTER TABLE public.folha_etapas ADD COLUMN codigo_dominio text NOT NULL DEFAULT '';
ALTER TABLE public.folha_etapas_historico ADD COLUMN codigo_dominio text NOT NULL DEFAULT '';