GRANT EXECUTE ON FUNCTION public.es_gestor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "perfiles_select" ON public.perfiles;
CREATE POLICY "perfiles_select_own_or_gestor" ON public.perfiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.es_gestor(auth.uid()));

CREATE OR REPLACE VIEW public.directorio
WITH (security_invoker = false) AS
SELECT id, nombre, cargo, area, iniciales, foto, estado, cumple
FROM public.perfiles;

GRANT SELECT ON public.directorio TO authenticated;