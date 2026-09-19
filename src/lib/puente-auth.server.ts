/**
 * Validación estricta del token del puente de WhatsApp.
 *
 * Seguridad: nunca se acepta un token por omisión ni se permite el paso cuando
 * no hay token configurado. Se compara en tiempo constante para no filtrar
 * información por diferencias de tiempo.
 */

const TOKEN_DEBIL = "ivad-secret-token";
const LARGO_MINIMO = 16;

function igualdadSegura(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

function tokenRecibido(request: Request): string {
  const url = new URL(request.url);
  const query = url.searchParams.get("token")?.trim();
  const auth = request.headers.get("authorization")?.replace(/^bearer\s+/i, "").trim();
  const propio = request.headers.get("x-puente-token")?.trim();
  return propio || auth || query || "";
}

/** Devuelve true solo cuando el token coincide con el configurado por Administración o el del entorno. */
export async function validarTokenPuente(request: Request): Promise<boolean> {
  const recibido = tokenRecibido(request);
  if (recibido.length < LARGO_MINIMO || recibido === TOKEN_DEBIL) return false;

  const permitidos: string[] = [];

  const delEntorno = process.env["WHATSAPP_PUENTE_TOKEN"]?.trim();
  if (delEntorno && delEntorno.length >= LARGO_MINIMO && delEntorno !== TOKEN_DEBIL) {
    permitidos.push(delEntorno);
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("ajustes")
      .select("valor")
      .eq("clave", "whatsapp_puente_token")
      .maybeSingle();
    const guardado = data?.valor?.trim();
    if (guardado && guardado.length >= LARGO_MINIMO && guardado !== TOKEN_DEBIL) {
      permitidos.push(guardado);
    }
  } catch {
    // Si no se puede leer la configuración, se niega el acceso.
  }

  return permitidos.some((valido) => igualdadSegura(recibido, valido));
}
