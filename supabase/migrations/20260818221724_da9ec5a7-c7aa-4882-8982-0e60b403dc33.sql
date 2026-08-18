CREATE TABLE public.folha_competencia (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_codigo text NOT NULL,
  empresa_nome text NOT NULL DEFAULT '',
  competencia text NOT NULL,
  carteira text NOT NULL DEFAULT '',
  responsavel text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'nao_iniciada',
  tipo_ponto text NOT NULL DEFAULT '—',
  aprendizes integer NOT NULL DEFAULT 0,
  empregados integer NOT NULL DEFAULT 0,
  data_publicacao text NOT NULL DEFAULT '',
  observacoes text NOT NULL DEFAULT '',
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT folha_competencia_unica UNIQUE (empresa_codigo, competencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.folha_competencia TO authenticated;
GRANT ALL ON public.folha_competencia TO service_role;
ALTER TABLE public.folha_competencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY folha_competencia_select ON public.folha_competencia FOR SELECT TO authenticated USING (public.is_usuario_ativo(auth.uid()));
CREATE POLICY folha_competencia_insert ON public.folha_competencia FOR INSERT TO authenticated WITH CHECK (public.is_usuario_ativo(auth.uid()) AND atualizado_por = auth.uid());
CREATE POLICY folha_competencia_update ON public.folha_competencia FOR UPDATE TO authenticated USING (public.is_usuario_ativo(auth.uid())) WITH CHECK (public.is_usuario_ativo(auth.uid()) AND atualizado_por = auth.uid());
CREATE POLICY folha_competencia_delete ON public.folha_competencia FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE INDEX folha_competencia_comp_idx ON public.folha_competencia (competencia);
CREATE INDEX folha_competencia_carteira_idx ON public.folha_competencia (carteira);
CREATE INDEX folha_competencia_status_idx ON public.folha_competencia (status);

CREATE TRIGGER folha_competencia_updated_at BEFORE UPDATE ON public.folha_competencia FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.folha_etapas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_codigo text NOT NULL,
  empresa_nome text NOT NULL DEFAULT '',
  competencia text NOT NULL,
  etapa text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  concluida boolean NOT NULL DEFAULT false,
  data_conclusao timestamptz,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT folha_etapas_unica UNIQUE (empresa_codigo, competencia, etapa),
  CONSTRAINT folha_etapas_status_valido CHECK (status IN ('pendente', 'andamento', 'concluido', 'na'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.folha_etapas TO authenticated;
GRANT ALL ON public.folha_etapas TO service_role;
ALTER TABLE public.folha_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY folha_etapas_select ON public.folha_etapas FOR SELECT TO authenticated USING (public.is_usuario_ativo(auth.uid()));
CREATE POLICY folha_etapas_insert ON public.folha_etapas FOR INSERT TO authenticated WITH CHECK (public.is_usuario_ativo(auth.uid()) AND atualizado_por = auth.uid());
CREATE POLICY folha_etapas_update ON public.folha_etapas FOR UPDATE TO authenticated USING (public.is_usuario_ativo(auth.uid())) WITH CHECK (public.is_usuario_ativo(auth.uid()) AND atualizado_por = auth.uid());
CREATE POLICY folha_etapas_delete ON public.folha_etapas FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE INDEX folha_etapas_comp_idx ON public.folha_etapas (competencia);
CREATE INDEX folha_etapas_empresa_idx ON public.folha_etapas (empresa_codigo, competencia);
CREATE INDEX folha_etapas_status_idx ON public.folha_etapas (status);

CREATE TRIGGER folha_etapas_updated_at BEFORE UPDATE ON public.folha_etapas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.folha_etapas_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_codigo text NOT NULL,
  empresa_nome text NOT NULL DEFAULT '',
  competencia text NOT NULL,
  etapa text NOT NULL,
  status_anterior text,
  status_novo text NOT NULL,
  alterado_por uuid,
  alterado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.folha_etapas_historico TO authenticated;
GRANT ALL ON public.folha_etapas_historico TO service_role;
ALTER TABLE public.folha_etapas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY folha_historico_select ON public.folha_etapas_historico FOR SELECT TO authenticated USING (public.is_gestao(auth.uid()));

CREATE INDEX folha_historico_empresa_idx ON public.folha_etapas_historico (empresa_codigo, competencia);

CREATE OR REPLACE FUNCTION public.registra_historico_folha_etapa()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  NEW.concluida := (NEW.status = 'concluido');
  IF NEW.status = 'concluido' AND NEW.data_conclusao IS NULL THEN
    NEW.data_conclusao := now();
  ELSIF NEW.status <> 'concluido' THEN
    NEW.data_conclusao := NULL;
  END IF;

  INSERT INTO public.folha_etapas_historico
    (empresa_codigo, empresa_nome, competencia, etapa, status_anterior, status_novo, alterado_por)
  VALUES
    (NEW.empresa_codigo, NEW.empresa_nome, NEW.competencia, NEW.etapa,
     CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
     NEW.status, NEW.atualizado_por);

  RETURN NEW;
END;
$$;

CREATE TRIGGER folha_etapas_historico_trg BEFORE INSERT OR UPDATE ON public.folha_etapas FOR EACH ROW EXECUTE FUNCTION public.registra_historico_folha_etapa();