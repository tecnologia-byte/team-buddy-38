REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.es_gestor(UUID) FROM anon, authenticated;