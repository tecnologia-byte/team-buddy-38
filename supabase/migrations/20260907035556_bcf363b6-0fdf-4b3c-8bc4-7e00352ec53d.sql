-- 1) Firma permanente por defecto
ALTER TABLE public.perfiles ALTER COLUMN firma_permanente SET DEFAULT true;
UPDATE public.perfiles SET firma_permanente = true WHERE firma IS NOT NULL;

-- 2) Aviso automático de políticas de firmas para nuevos colaboradores
CREATE OR REPLACE FUNCTION public.aviso_politicas_firmas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.avisos (para_id, titulo, detalle, nuevo)
  VALUES (
    NEW.id,
    'Políticas de firmas digitales',
    'Tu firma digital se usa solo en tus documentos personales (volantes de pago, recibos y constancias). No se clona ni se divulga. Es permanente: si alguna vez hay que renovarla te avisaremos por aquí. Tu compromiso: no compartir tus documentos firmados y reportar de inmediato cualquier incidente de seguridad. Lee las políticas completas en Más → Política de firmas.',
    true
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS perfiles_aviso_politicas ON public.perfiles;
CREATE TRIGGER perfiles_aviso_politicas
AFTER INSERT ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.aviso_politicas_firmas();

-- 3) Aviso de políticas para todo el personal ya registrado
INSERT INTO public.avisos (para_id, titulo, detalle, nuevo)
SELECT p.id,
  'Políticas de firmas digitales',
  'Tu firma digital se usa solo en tus documentos personales (volantes de pago, recibos y constancias). No se clona ni se divulga. Es permanente: si alguna vez hay que renovarla te avisaremos por aquí. Tu compromiso: no compartir tus documentos firmados y reportar de inmediato cualquier incidente de seguridad. Lee las políticas completas en Más → Política de firmas.',
  true
FROM public.perfiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.avisos a
  WHERE a.para_id = p.id AND a.titulo = 'Políticas de firmas digitales'
);

-- 4) Seguridad: restringir lectura de roles
DROP POLICY IF EXISTS roles_select ON public.user_roles;
CREATE POLICY roles_select ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR es_gestor(auth.uid()));