CREATE OR REPLACE FUNCTION public.existe_usuario()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.usuarios) $$;

GRANT EXECUTE ON FUNCTION public.existe_usuario() TO anon, authenticated;