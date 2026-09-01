CREATE TYPE public.app_role AS ENUM ('Administrador','Recursos Humanos','Supervisor','Colaborador');

CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  cargo TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  ingreso TEXT NOT NULL DEFAULT '',
  cumple TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'activo',
  iniciales TEXT NOT NULL DEFAULT '',
  salario NUMERIC NOT NULL DEFAULT 0,
  foto TEXT,
  foto_pendiente TEXT,
  estado_foto TEXT NOT NULL DEFAULT 'sin_foto',
  motivo_rechazo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfiles TO authenticated;
GRANT ALL ON public.perfiles TO service_role;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.es_gestor(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('Administrador','Recursos Humanos')
  )
$$;

CREATE POLICY "perfiles_select" ON public.perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "perfiles_update_own" ON public.perfiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "perfiles_gestor_insert" ON public.perfiles FOR INSERT TO authenticated WITH CHECK (public.es_gestor(auth.uid()));
CREATE POLICY "perfiles_gestor_update" ON public.perfiles FOR UPDATE TO authenticated USING (public.es_gestor(auth.uid())) WITH CHECK (public.es_gestor(auth.uid()));
CREATE POLICY "perfiles_gestor_delete" ON public.perfiles FOR DELETE TO authenticated USING (public.es_gestor(auth.uid()));

CREATE POLICY "roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_gestor_all" ON public.user_roles FOR ALL TO authenticated USING (public.es_gestor(auth.uid())) WITH CHECK (public.es_gestor(auth.uid()));

CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  monto NUMERIC NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  recibo TEXT NOT NULL DEFAULT 'No enviado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagos TO authenticated;
GRANT ALL ON public.pagos TO service_role;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pagos_select_own" ON public.pagos FOR SELECT TO authenticated USING (colaborador_id = auth.uid() OR public.es_gestor(auth.uid()));
CREATE POLICY "pagos_gestor_all" ON public.pagos FOR ALL TO authenticated USING (public.es_gestor(auth.uid())) WITH CHECK (public.es_gestor(auth.uid()));

CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  para_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  detalle TEXT NOT NULL DEFAULT '',
  nuevo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avisos_select_own" ON public.avisos FOR SELECT TO authenticated USING (para_id = auth.uid() OR public.es_gestor(auth.uid()));
CREATE POLICY "avisos_update_own" ON public.avisos FOR UPDATE TO authenticated USING (para_id = auth.uid()) WITH CHECK (para_id = auth.uid());
CREATE POLICY "avisos_gestor_all" ON public.avisos FOR ALL TO authenticated USING (public.es_gestor(auth.uid())) WITH CHECK (public.es_gestor(auth.uid()));