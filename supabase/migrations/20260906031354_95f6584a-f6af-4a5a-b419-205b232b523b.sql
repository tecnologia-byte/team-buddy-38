ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS clave_provisional_texto text;

CREATE OR REPLACE FUNCTION public.es_gestor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('Administrador','Recursos Humanos','Contabilidad')
  )
$$;

CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
       OR NEW.clave_provisional_texto IS DISTINCT FROM OLD.clave_provisional_texto
       OR NEW.verificado IS DISTINCT FROM OLD.verificado THEN
      RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
    END IF;
  END IF;
  RETURN NEW;
END; $$;