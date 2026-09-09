REVOKE EXECUTE ON FUNCTION public.es_nomina(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.es_gestor(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.es_contable(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.directorio() FROM anon;