CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE gestor boolean; contable boolean;
BEGIN
  -- Operaciones del servidor (service role, sin sesión) no se restringen
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  gestor := public.es_gestor(auth.uid());
  contable := public.es_contable(auth.uid());

  IF gestor OR contable THEN
    RETURN NEW;
  END IF;

  IF NEW.salario IS DISTINCT FROM OLD.salario THEN
    RAISE EXCEPTION 'Solo Administración o Contabilidad puede modificar el salario';
  END IF;

  IF NEW.nombre IS DISTINCT FROM OLD.nombre
     OR NEW.cargo IS DISTINCT FROM OLD.cargo
     OR NEW.area IS DISTINCT FROM OLD.area
     OR NEW.estado IS DISTINCT FROM OLD.estado
     OR NEW.ingreso IS DISTINCT FROM OLD.ingreso
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.verificado IS DISTINCT FROM OLD.verificado THEN
    RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.avisos_guardia_columnas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.es_gestor(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.titulo IS DISTINCT FROM OLD.titulo
     OR NEW.detalle IS DISTINCT FROM OLD.detalle
     OR NEW.para_id IS DISTINCT FROM OLD.para_id THEN
    RAISE EXCEPTION 'Solo puedes marcar el aviso como leído';
  END IF;
  RETURN NEW;
END; $function$;