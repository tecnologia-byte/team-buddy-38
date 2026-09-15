-- Trigger functions must not be callable directly by signed-in users
REVOKE EXECUTE ON FUNCTION public.aviso_politicas_firmas() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.avisos_guardia_columnas() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.perfiles_guardia_columnas() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.tareas_guardia_columnas() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated, anon, public;

-- Refuerzo: nadie puede cambiar por su cuenta datos sensibles del expediente
CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE gestor boolean; nomina boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  gestor := public.es_gestor(auth.uid());
  nomina := public.es_nomina(auth.uid());

  IF NEW.salario IS DISTINCT FROM OLD.salario AND NOT nomina THEN
    RAISE EXCEPTION 'Solo el personal con acceso a nómina puede modificar el salario';
  END IF;

  IF NEW.acceso_nomina IS DISTINCT FROM OLD.acceso_nomina AND NOT nomina THEN
    RAISE EXCEPTION 'Solo el personal con acceso a nómina puede otorgar o quitar ese acceso';
  END IF;

  -- La firma solo la puede cambiar su dueño (o un gestor durante la captura)
  IF (NEW.firma IS DISTINCT FROM OLD.firma
      OR NEW.firma_consentimiento_at IS DISTINCT FROM OLD.firma_consentimiento_at
      OR NEW.firma_permanente IS DISTINCT FROM OLD.firma_permanente)
     AND NEW.id <> auth.uid() AND NOT gestor THEN
    RAISE EXCEPTION 'Solo el dueño de la firma puede modificarla';
  END IF;

  IF NOT gestor THEN
    IF NEW.nombre IS DISTINCT FROM OLD.nombre
       OR NEW.cargo IS DISTINCT FROM OLD.cargo
       OR NEW.area IS DISTINCT FROM OLD.area
       OR NEW.estado IS DISTINCT FROM OLD.estado
       OR NEW.ingreso IS DISTINCT FROM OLD.ingreso
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.clave_provisional IS DISTINCT FROM OLD.clave_provisional
       OR NEW.clave_provisional_texto IS DISTINCT FROM OLD.clave_provisional_texto
       OR NEW.verificado IS DISTINCT FROM OLD.verificado
       OR NEW.verificado_at IS DISTINCT FROM OLD.verificado_at
       OR NEW.firma_limite_pagos IS DISTINCT FROM OLD.firma_limite_pagos
       OR NEW.firma_pagos_restantes IS DISTINCT FROM OLD.firma_pagos_restantes THEN
      RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

REVOKE EXECUTE ON FUNCTION public.perfiles_guardia_columnas() FROM authenticated, anon, public;

-- Volantes de pago: bloquear cualquier escritura fuera del personal de nómina
DROP POLICY IF EXISTS volantes_bloqueo_escritura ON public.volantes;
CREATE POLICY volantes_bloqueo_escritura ON public.volantes
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.es_nomina(auth.uid()) OR (colaborador_id = auth.uid() AND estado = 'Enviado'))
WITH CHECK (public.es_nomina(auth.uid()));

-- Pagos: misma restricción
DROP POLICY IF EXISTS pagos_bloqueo_escritura ON public.pagos;
CREATE POLICY pagos_bloqueo_escritura ON public.pagos
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.es_nomina(auth.uid()) OR colaborador_id = auth.uid())
WITH CHECK (public.es_nomina(auth.uid()));