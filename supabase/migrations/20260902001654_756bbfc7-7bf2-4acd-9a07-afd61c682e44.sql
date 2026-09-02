ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS firma_pagos_restantes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS firma_limite_pagos integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS firma_permanente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS firma_consentimiento_at timestamp with time zone;