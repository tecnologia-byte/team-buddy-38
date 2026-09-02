-- Nuevo rol de acceso para contabilidad
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'Contabilidad';

CREATE OR REPLACE FUNCTION public.es_contable(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('Administrador','Contabilidad')
  )
$$;
GRANT EXECUTE ON FUNCTION public.es_contable(uuid) TO authenticated;

-- Protege columnas sensibles del perfil
CREATE OR REPLACE FUNCTION public.perfiles_guardia_columnas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Solo Recursos Humanos o Administración puede modificar estos datos del expediente';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS perfiles_guardia_columnas_tr ON public.perfiles;
CREATE TRIGGER perfiles_guardia_columnas_tr
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.perfiles_guardia_columnas();

-- Los avisos propios solo se pueden marcar como leídos
CREATE OR REPLACE FUNCTION public.avisos_guardia_columnas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.es_gestor(auth.uid()) THEN
    IF NEW.titulo IS DISTINCT FROM OLD.titulo
       OR NEW.detalle IS DISTINCT FROM OLD.detalle
       OR NEW.para_id IS DISTINCT FROM OLD.para_id THEN
      RAISE EXCEPTION 'Solo puedes marcar el aviso como leído';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS avisos_guardia_columnas_tr ON public.avisos;
CREATE TRIGGER avisos_guardia_columnas_tr
BEFORE UPDATE ON public.avisos
FOR EACH ROW EXECUTE FUNCTION public.avisos_guardia_columnas();

-- Sustituye la vista SECURITY DEFINER por una función interna segura
DROP VIEW IF EXISTS public.directorio;

CREATE OR REPLACE FUNCTION public.directorio()
RETURNS TABLE (
  id uuid, nombre text, cargo text, area text, cumple text,
  estado text, iniciales text, foto text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.nombre, p.cargo, p.area, p.cumple, p.estado, p.iniciales, p.foto
  FROM public.perfiles p
  WHERE auth.uid() IS NOT NULL
  ORDER BY p.nombre
$$;
GRANT EXECUTE ON FUNCTION public.directorio() TO authenticated;