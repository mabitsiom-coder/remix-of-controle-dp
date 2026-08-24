CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = _user_id
      AND status = 'ativo'
      AND perfil::text IN ('Administrador', 'Administração', 'Coordenador', 'Coordenação', 'CKO')
  )
$function$;

CREATE OR REPLACE FUNCTION public.is_gestao(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = _user_id
      AND status = 'ativo'
      AND perfil::text IN ('Administrador', 'Administração', 'Gerente', 'Coordenador', 'Coordenação', 'Supervisor', 'CKO', 'Auditoria')
  )
$function$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_gestao(uuid) FROM anon;