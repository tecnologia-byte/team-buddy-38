ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS clave_provisional boolean NOT NULL DEFAULT false;

-- Las cuentas existentes que no son de Administración quedan con clave provisional
UPDATE public.perfiles p
SET clave_provisional = true
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r
  WHERE r.user_id = p.id AND r.role = 'Administrador'
);

CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE gestor boolean; contable boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

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
       OR NEW.clave_provisional IS DISTINCT FROM OLD.clave_provisional
       OR NEW.verificado IS DISTINCT FROM OLD.verificado THEN
      RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
    END IF;
  END IF;
  RETURN NEW;
END; $function$;