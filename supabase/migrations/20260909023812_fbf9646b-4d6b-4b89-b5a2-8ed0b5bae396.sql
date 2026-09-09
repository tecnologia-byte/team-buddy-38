ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS acceso_nomina boolean NOT NULL DEFAULT false;

UPDATE public.perfiles SET acceso_nomina = true
WHERE id IN ('f46e63b5-30fa-40f3-a751-6bf645be4e4e', '000d5070-35a8-4bb5-9587-605e81c1c966');

CREATE OR REPLACE FUNCTION public.es_nomina(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.perfiles WHERE id = _user_id AND acceso_nomina)
$$;

DROP POLICY IF EXISTS pagos_gestor_all ON public.pagos;
DROP POLICY IF EXISTS pagos_select_own ON public.pagos;

CREATE POLICY pagos_nomina_all ON public.pagos FOR ALL TO authenticated
  USING (public.es_nomina(auth.uid())) WITH CHECK (public.es_nomina(auth.uid()));

CREATE POLICY pagos_select_own ON public.pagos FOR SELECT TO authenticated
  USING (colaborador_id = auth.uid() OR public.es_nomina(auth.uid()));

CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
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
       OR NEW.verificado IS DISTINCT FROM OLD.verificado THEN
      RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
    END IF;
  END IF;
  RETURN NEW;
END; $function$;