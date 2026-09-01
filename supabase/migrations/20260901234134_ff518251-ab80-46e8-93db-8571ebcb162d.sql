ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS firma text,
  ADD COLUMN IF NOT EXISTS firma_actualizada timestamp with time zone;

CREATE TABLE public.soporte_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creador_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT 'General',
  asunto text NOT NULL,
  mensaje text NOT NULL,
  estado text NOT NULL DEFAULT 'Abierto',
  respuesta text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soporte_tickets TO authenticated;
GRANT ALL ON public.soporte_tickets TO service_role;

ALTER TABLE public.soporte_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soporte_select" ON public.soporte_tickets
  FOR SELECT TO authenticated
  USING (creador_id = auth.uid() OR public.es_gestor(auth.uid()));

CREATE POLICY "soporte_insert_own" ON public.soporte_tickets
  FOR INSERT TO authenticated
  WITH CHECK (creador_id = auth.uid());

CREATE POLICY "soporte_gestor_all" ON public.soporte_tickets
  FOR ALL TO authenticated
  USING (public.es_gestor(auth.uid()))
  WITH CHECK (public.es_gestor(auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_soporte_tickets_updated_at
  BEFORE UPDATE ON public.soporte_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();