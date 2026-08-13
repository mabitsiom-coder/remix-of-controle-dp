CREATE OR REPLACE FUNCTION public.is_usuario_ativo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = _user_id AND status = 'ativo'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_gestao(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = _user_id
      AND status = 'ativo'
      AND perfil::text IN ('Administrador', 'Gerente', 'Coordenador', 'Supervisor')
  )
$$;

DROP POLICY IF EXISTS "app_state_update" ON public.app_state;
DROP POLICY IF EXISTS "app_state_insert" ON public.app_state;

CREATE POLICY "app_state_update" ON public.app_state
FOR UPDATE TO authenticated
USING (public.is_usuario_ativo(auth.uid()))
WITH CHECK (public.is_usuario_ativo(auth.uid()) AND updated_by = auth.uid());

CREATE POLICY "app_state_insert" ON public.app_state
FOR INSERT TO authenticated
WITH CHECK (public.is_usuario_ativo(auth.uid()) AND updated_by = auth.uid());

DROP POLICY IF EXISTS "usuarios_select_autenticados" ON public.usuarios;

CREATE POLICY "usuarios_select_proprio_ou_gestao" ON public.usuarios
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_gestao(auth.uid()));