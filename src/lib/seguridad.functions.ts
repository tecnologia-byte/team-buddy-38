import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROPOSITOS = ["clave", "correo", "dispositivo"] as const;
type Proposito = (typeof PROPOSITOS)[number];

const SINTETICO = "@personal.ivadsrl.com";

const etiquetas: Record<Proposito, { titulo: string; etiqueta: string }> = {
  clave: { titulo: "Código para cambiar tu contraseña", etiqueta: "Seguridad" },
  correo: { titulo: "Verifica tu correo personal", etiqueta: "Verificación" },
  dispositivo: { titulo: "Código para un dispositivo nuevo", etiqueta: "Seguridad" },
};

function codigoNuevo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Dirección real a la que se puede escribir al colaborador. */
function destinoDe(perfil: { email: string; correo_alterno: string | null }, alterno?: string) {
  if (alterno) return alterno;
  if (perfil.email && !perfil.email.endsWith(SINTETICO)) return perfil.email;
  return perfil.correo_alterno ?? "";
}

/** Envía un código de 6 dígitos al correo del colaborador para confirmar una acción sensible. */
export const solicitarCodigoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        proposito: z.enum(PROPOSITOS),
        destino: z.string().email().max(160).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: perfil } = await context.supabase
      .from("perfiles")
      .select("nombre, email, correo_alterno")
      .eq("id", context.userId)
      .maybeSingle();

    if (!perfil) return { ok: false as const, error: "No encontramos tu perfil." };

    const para = destinoDe(perfil, data.proposito === "correo" ? data.destino : undefined);
    if (!para) {
      return {
        ok: false as const,
        error: "No tienes un correo registrado. Agrega tu correo personal primero.",
      };
    }

    const codigo = codigoNuevo();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin
      .from("codigos_verificacion")
      .update({ usado: true })
      .eq("user_id", context.userId)
      .eq("proposito", data.proposito)
      .eq("usado", false);

    const { error } = await supabaseAdmin.from("codigos_verificacion").insert({
      user_id: context.userId,
      proposito: data.proposito,
      codigo,
      destino: data.proposito === "correo" ? (data.destino ?? null) : null,
      expira_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (error) return { ok: false as const, error: "No se pudo generar el código." };

    const { enviarCorreoInstitucional } = await import("./correo.server");
    const info = etiquetas[data.proposito];
    const envio = await enviarCorreoInstitucional({
      para,
      nombre: perfil.nombre,
      titulo: info.titulo,
      etiqueta: info.etiqueta,
      detalle: `Tu código de verificación es <b style="font-size:22px;letter-spacing:4px">${codigo}</b><br><br>Vence en 10 minutos. Si no fuiste tú quien lo solicitó, no lo compartas con nadie y avisa a Administración.`,
    });

    if (!envio.ok) return { ok: false as const, error: "No se pudo enviar el correo con el código." };
    return { ok: true as const, correo: para.replace(/^(.).*(@.*)$/, "$1•••$2") };
  });

/** Confirma el código y aplica el cambio pedido (contraseña, correo o dispositivo). */
export const confirmarCodigoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        proposito: z.enum(PROPOSITOS),
        codigo: z.string().trim().length(6),
        clave: z.string().min(6).max(72).optional(),
        huella: z.string().trim().min(8).max(80).optional(),
        nombreDispositivo: z.string().trim().max(80).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: fila } = await supabaseAdmin
      .from("codigos_verificacion")
      .select("id, codigo, destino, expira_at, usado")
      .eq("user_id", context.userId)
      .eq("proposito", data.proposito)
      .eq("usado", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!fila) return { ok: false as const, error: "Pide un código nuevo." };
    if (new Date(fila.expira_at).getTime() < Date.now())
      return { ok: false as const, error: "El código venció. Pide uno nuevo." };
    if (fila.codigo !== data.codigo) return { ok: false as const, error: "El código no coincide." };

    if (data.proposito === "clave") {
      if (!data.clave) return { ok: false as const, error: "Escribe la nueva contraseña." };
      const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
        password: data.clave,
      });
      if (error) return { ok: false as const, error: "No se pudo cambiar la contraseña." };
      await supabaseAdmin
        .from("perfiles")
        .update({ clave_provisional: false, clave_provisional_texto: null })
        .eq("id", context.userId);
    }

    if (data.proposito === "correo") {
      if (!fila.destino) return { ok: false as const, error: "Pide el código otra vez." };
      const { error } = await supabaseAdmin
        .from("perfiles")
        .update({ correo_alterno: fila.destino, correo_alterno_verificado: true })
        .eq("id", context.userId);
      if (error) return { ok: false as const, error: "No se pudo guardar el correo." };
    }

    if (data.proposito === "dispositivo") {
      if (!data.huella) return { ok: false as const, error: "Dispositivo no identificado." };
      const { error } = await supabaseAdmin.from("dispositivos_confiables").upsert(
        {
          user_id: context.userId,
          huella: data.huella,
          nombre: data.nombreDispositivo ?? "Dispositivo",
          ultimo_acceso: new Date().toISOString(),
        },
        { onConflict: "user_id,huella" },
      );
      if (error) return { ok: false as const, error: "No se pudo registrar el dispositivo." };
    }

    await supabaseAdmin.from("codigos_verificacion").update({ usado: true }).eq("id", fila.id);
    return { ok: true as const };
  });

/** Guarda las preferencias de apariencia y seguridad del colaborador. */
export const guardarPreferenciasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        tema: z.enum(["claro", "oscuro", "sistema"]).optional(),
        alertaAcceso: z.boolean().optional(),
        verificarDispositivo: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const cambios: Record<string, unknown> = {};
    if (data.tema) cambios["tema"] = data.tema;
    if (data.alertaAcceso !== undefined) cambios["alerta_acceso"] = data.alertaAcceso;
    if (data.verificarDispositivo !== undefined)
      cambios["verificar_dispositivo"] = data.verificarDispositivo;
    if (!Object.keys(cambios).length) return { ok: true as const };

    const { error } = await context.supabase
      .from("perfiles")
      .update(cambios)
      .eq("id", context.userId);
    if (error) return { ok: false as const, error: "No se pudo guardar." };
    return { ok: true as const };
  });

/** Revisa si el dispositivo actual es de confianza y avisa por correo del acceso. */
export const revisarAccesoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        huella: z.string().trim().min(8).max(80),
        nombreDispositivo: z.string().trim().max(80).default("Dispositivo"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: perfil } = await context.supabase
      .from("perfiles")
      .select("nombre, email, correo_alterno, alerta_acceso, verificar_dispositivo")
      .eq("id", context.userId)
      .maybeSingle();
    if (!perfil) return { requiereCodigo: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dispositivo } = await supabaseAdmin
      .from("dispositivos_confiables")
      .select("id")
      .eq("user_id", context.userId)
      .eq("huella", data.huella)
      .maybeSingle();

    const conocido = Boolean(dispositivo);

    if (conocido) {
      await supabaseAdmin
        .from("dispositivos_confiables")
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq("id", dispositivo!.id);
    } else if (!perfil.verificar_dispositivo) {
      await supabaseAdmin.from("dispositivos_confiables").upsert(
        {
          user_id: context.userId,
          huella: data.huella,
          nombre: data.nombreDispositivo,
          ultimo_acceso: new Date().toISOString(),
        },
        { onConflict: "user_id,huella" },
      );
    }

    const para = destinoDe(perfil);
    if (perfil.alerta_acceso && para) {
      const { enviarCorreoInstitucional } = await import("./correo.server");
      await enviarCorreoInstitucional({
        para,
        nombre: perfil.nombre,
        titulo: conocido ? "Nuevo acceso a tu cuenta" : "Acceso desde un dispositivo nuevo",
        etiqueta: "Seguridad",
        detalle: `Se registró un acceso a tu cuenta del Portal del Colaborador el ${new Date().toLocaleString("es-DO")} desde ${data.nombreDispositivo}. Si no fuiste tú, cambia tu contraseña y avisa a Administración de inmediato.`,
      });
    }

    return { requiereCodigo: Boolean(perfil.verificar_dispositivo && !conocido) };
  });
