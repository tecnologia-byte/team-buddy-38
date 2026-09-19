DROP POLICY IF EXISTS ajustes_lectura ON public.ajustes;

CREATE POLICY ajustes_lectura ON public.ajustes
FOR SELECT TO authenticated
USING (
  clave NOT IN ('whatsapp_puente_token', 'whatsapp_puente_url')
  OR public.es_gestor(auth.uid())
  OR public.es_nomina(auth.uid())
);

REVOKE EXECUTE ON FUNCTION public.aviso_politicas_firmas() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.avisos_guardia_columnas() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.perfiles_guardia_columnas() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tareas_guardia_columnas() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;