CREATE TABLE public.volantes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  comprobante text NOT NULL DEFAULT '',
  fecha_emision text NOT NULL DEFAULT '',
  periodo_desde text NOT NULL DEFAULT '',
  periodo_hasta text NOT NULL DEFAULT '',
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  neto numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'Borrador',
  error text,
  creado_por uuid REFERENCES public.perfiles(id),
  enviado_por uuid REFERENCES public.perfiles(id),
  enviado_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.volantes TO authenticated;
GRANT ALL ON public.volantes TO service_role;

ALTER TABLE public.volantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "volantes_nomina_all" ON public.volantes FOR ALL TO authenticated
  USING (public.es_nomina(auth.uid())) WITH CHECK (public.es_nomina(auth.uid()));

CREATE POLICY "volantes_select_own_enviado" ON public.volantes FOR SELECT TO authenticated
  USING (colaborador_id = auth.uid() AND estado = 'Enviado');

CREATE TRIGGER update_volantes_updated_at BEFORE UPDATE ON public.volantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX volantes_colaborador_idx ON public.volantes (colaborador_id);
CREATE INDEX volantes_estado_idx ON public.volantes (estado);