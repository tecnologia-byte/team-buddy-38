ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'sistema',
  ADD COLUMN IF NOT EXISTS alerta_acceso BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verificar_dispositivo BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS correo_alterno_verificado BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.codigos_verificacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposito TEXT NOT NULL,
  codigo TEXT NOT NULL,
  destino TEXT,
  expira_at TIMESTAMP WITH TIME ZONE NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.codigos_verificacion TO service_role;
ALTER TABLE public.codigos_verificacion ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dispositivos_confiables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  huella TEXT NOT NULL,
  nombre TEXT NOT NULL DEFAULT '',
  ultimo_acceso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, huella)
);
GRANT SELECT, DELETE ON public.dispositivos_confiables TO authenticated;
GRANT ALL ON public.dispositivos_confiables TO service_role;
ALTER TABLE public.dispositivos_confiables ENABLE ROW LEVEL SECURITY;
CREATE POLICY dispositivos_select_own ON public.dispositivos_confiables FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY dispositivos_delete_own ON public.dispositivos_confiables FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.capacitaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  certificado TEXT,
  emitido TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capacitaciones TO authenticated;
GRANT ALL ON public.capacitaciones TO service_role;
ALTER TABLE public.capacitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY capacitaciones_select ON public.capacitaciones FOR SELECT TO authenticated USING (colaborador_id = auth.uid() OR public.es_gestor(auth.uid()));
CREATE POLICY capacitaciones_gestor_all ON public.capacitaciones FOR ALL TO authenticated USING (public.es_gestor(auth.uid())) WITH CHECK (public.es_gestor(auth.uid()));
CREATE TRIGGER capacitaciones_updated_at BEFORE UPDATE ON public.capacitaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();