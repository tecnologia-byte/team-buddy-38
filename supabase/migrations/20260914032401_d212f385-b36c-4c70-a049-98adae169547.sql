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