CREATE OR REPLACE FUNCTION public.protege_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.perfil IS DISTINCT FROM OLD.perfil
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente administradores podem alterar o perfil de acesso.';
  END IF;
  RETURN NEW;
END;
$function$;