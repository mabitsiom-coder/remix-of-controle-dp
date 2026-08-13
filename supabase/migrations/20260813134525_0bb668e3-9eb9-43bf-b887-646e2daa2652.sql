-- Perfis de acesso
CREATE TYPE public.app_perfil AS ENUM ('Administrador', 'Coordenador', 'Supervisor', 'Analista');

CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text NOT NULL,
  perfil public.app_perfil NOT NULL DEFAULT 'Analista',
  departamento text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = _user_id AND perfil = 'Administrador' AND status = 'ativo'
  )
$$;

CREATE POLICY "usuarios_select_autenticados" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "usuarios_insert_proprio" ON public.usuarios
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "usuarios_update_proprio_ou_admin" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "usuarios_delete_admin" ON public.usuarios
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Bloqueia escalonamento de privilégio: trocar perfil exige administrador
CREATE OR REPLACE FUNCTION public.protege_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.perfil IS DISTINCT FROM OLD.perfil AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente administradores podem alterar o perfil de acesso.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_protege_perfil
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.protege_perfil();

-- Dados operacionais compartilhados
CREATE TABLE public.app_state (
  chave text PRIMARY KEY,
  dados jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_state TO authenticated;
GRANT ALL ON public.app_state TO service_role;

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_state_select" ON public.app_state
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "app_state_insert" ON public.app_state
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "app_state_update" ON public.app_state
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app_state_delete" ON public.app_state
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER app_state_updated_at BEFORE UPDATE ON public.app_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();