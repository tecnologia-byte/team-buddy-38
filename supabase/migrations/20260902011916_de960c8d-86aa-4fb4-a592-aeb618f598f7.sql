CREATE TABLE public.solicitudes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  motivo text NOT NULL DEFAULT '',
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  dias integer NOT NULL DEFAULT 1,
  con_salario boolean NOT NULL DEFAULT true,
  base_legal text NOT NULL DEFAULT '',
  soporte text,
  estado text NOT NULL DEFAULT 'Pendiente',
  respuesta text,
  respondido_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  respondido_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes TO authenticated;
GRANT ALL ON public.solicitudes TO service_role;

ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solicitudes_select" ON public.solicitudes FOR SELECT TO authenticated
  USING (colaborador_id = auth.uid() OR public.es_gestor(auth.uid()));

CREATE POLICY "solicitudes_insert_own" ON public.solicitudes FOR INSERT TO authenticated
  WITH CHECK (colaborador_id = auth.uid());

CREATE POLICY "solicitudes_update_own_pendiente" ON public.solicitudes FOR UPDATE TO authenticated
  USING (colaborador_id = auth.uid() AND estado = 'Pendiente')
  WITH CHECK (colaborador_id = auth.uid());

CREATE POLICY "solicitudes_gestor_all" ON public.solicitudes FOR ALL TO authenticated
  USING (public.es_gestor(auth.uid()))
  WITH CHECK (public.es_gestor(auth.uid()));

CREATE INDEX solicitudes_colaborador_idx ON public.solicitudes (colaborador_id, created_at DESC);

CREATE TRIGGER update_solicitudes_updated_at BEFORE UPDATE ON public.solicitudes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();