CREATE TABLE public.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  detalle text NOT NULL DEFAULT '',
  vence date,
  prioridad text NOT NULL DEFAULT 'Media',
  completada boolean NOT NULL DEFAULT false,
  completada_at timestamp with time zone,
  asignada_por uuid REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tareas TO authenticated;
GRANT ALL ON public.tareas TO service_role;

ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tareas_gestor_all" ON public.tareas FOR ALL TO authenticated
  USING (public.es_gestor(auth.uid())) WITH CHECK (public.es_gestor(auth.uid()));

CREATE POLICY "tareas_select_own" ON public.tareas FOR SELECT TO authenticated
  USING (colaborador_id = auth.uid() OR public.es_gestor(auth.uid()));

CREATE POLICY "tareas_update_own" ON public.tareas FOR UPDATE TO authenticated
  USING (colaborador_id = auth.uid()) WITH CHECK (colaborador_id = auth.uid());

CREATE OR REPLACE FUNCTION public.tareas_guardia_columnas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.es_gestor(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.titulo IS DISTINCT FROM OLD.titulo
     OR NEW.detalle IS DISTINCT FROM OLD.detalle
     OR NEW.vence IS DISTINCT FROM OLD.vence
     OR NEW.prioridad IS DISTINCT FROM OLD.prioridad
     OR NEW.colaborador_id IS DISTINCT FROM OLD.colaborador_id THEN
    RAISE EXCEPTION 'Solo puedes marcar la tarea como realizada';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER tareas_guardia_columnas_tr BEFORE UPDATE ON public.tareas
  FOR EACH ROW EXECUTE FUNCTION public.tareas_guardia_columnas();

CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON public.tareas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();