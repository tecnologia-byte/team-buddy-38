CREATE OR REPLACE FUNCTION public.es_gestor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
         AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()
                         AND role IN ('Administrador','Recursos Humanos','Contabilidad'))
      THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
                 AND role IN ('Administrador','Recursos Humanos','Contabilidad'))
  END
$$;

CREATE OR REPLACE FUNCTION public.es_contable(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
         AND NOT public.es_gestor(auth.uid()) THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
                 AND role::text IN ('Administrador','Contabilidad'))
  END
$$;

CREATE OR REPLACE FUNCTION public.es_nomina(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
         AND NOT public.es_gestor(auth.uid()) THEN false
    ELSE EXISTS (SELECT 1 FROM public.perfiles WHERE id = _user_id AND acceso_nomina)
  END
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid()
         AND NOT public.es_gestor(auth.uid()) THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END
$$;