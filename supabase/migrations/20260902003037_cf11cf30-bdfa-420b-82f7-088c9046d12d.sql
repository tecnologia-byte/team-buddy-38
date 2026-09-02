ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS verificado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verificado_at timestamp with time zone;

DROP FUNCTION IF EXISTS public.directorio();

CREATE FUNCTION public.directorio()
 RETURNS TABLE(id uuid, nombre text, cargo text, area text, cumple text, estado text, iniciales text, foto text, verificado boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.nombre, p.cargo, p.area, p.cumple, p.estado, p.iniciales, p.foto, p.verificado
  FROM public.perfiles p
  WHERE auth.uid() IS NOT NULL
  ORDER BY p.nombre
$function$;

GRANT EXECUTE ON FUNCTION public.directorio() TO authenticated;

CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE gestor boolean; contable boolean;
BEGIN
  gestor := public.es_gestor(auth.uid());
  contable := public.es_contable(auth.uid());

  IF NEW.salario IS DISTINCT FROM OLD.salario AND NOT contable THEN
    RAISE EXCEPTION 'Solo Administración o Contabilidad puede modificar el salario';
  END IF;

  IF NOT gestor THEN
    IF NEW.nombre IS DISTINCT FROM OLD.nombre
       OR NEW.cargo IS DISTINCT FROM OLD.cargo
       OR NEW.area IS DISTINCT FROM OLD.area
       OR NEW.estado IS DISTINCT FROM OLD.estado
       OR NEW.ingreso IS DISTINCT FROM OLD.ingreso
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.verificado IS DISTINCT FROM OLD.verificado THEN
      RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
    END IF;
  END IF;
  RETURN NEW;
END; $function$;