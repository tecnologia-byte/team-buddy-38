ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS correo_alterno text,
  ADD COLUMN IF NOT EXISTS whatsapp text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS canal_avisos text NOT NULL DEFAULT 'correo';

ALTER TABLE public.perfiles
  DROP CONSTRAINT IF EXISTS perfiles_canal_avisos_check;
ALTER TABLE public.perfiles
  ADD CONSTRAINT perfiles_canal_avisos_check CHECK (canal_avisos IN ('correo','whatsapp','ambos','ninguno'));

CREATE TABLE IF NOT EXISTS public.ajustes (
  clave text PRIMARY KEY,
  valor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ajustes TO authenticated;
GRANT ALL ON public.ajustes TO service_role;

ALTER TABLE public.ajustes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ajustes_lectura" ON public.ajustes;
CREATE POLICY "ajustes_lectura" ON public.ajustes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ajustes_admin_insert" ON public.ajustes;
CREATE POLICY "ajustes_admin_insert" ON public.ajustes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'Administrador') OR public.has_role(auth.uid(), 'Contabilidad'));

DROP POLICY IF EXISTS "ajustes_admin_update" ON public.ajustes;
CREATE POLICY "ajustes_admin_update" ON public.ajustes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'Administrador') OR public.has_role(auth.uid(), 'Contabilidad'))
  WITH CHECK (public.has_role(auth.uid(), 'Administrador') OR public.has_role(auth.uid(), 'Contabilidad'));

CREATE TRIGGER ajustes_updated_at BEFORE UPDATE ON public.ajustes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ajustes (clave, valor) VALUES
  ('whatsapp_numero', ''),
  ('whatsapp_mensaje', 'REGISTRAR mi WhatsApp en el Portal IVAD')
ON CONFLICT (clave) DO NOTHING;