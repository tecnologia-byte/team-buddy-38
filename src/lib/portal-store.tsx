import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Context,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { iniciales as inicialesDe, type Cuenta, type Empleado, type Rol } from "@/lib/data";
import { enviarCorreoFn } from "@/lib/correo.functions";
import { enviarWhatsappFn } from "@/lib/whatsapp.functions";
import {
  guardarCuentaFn,
  eliminarCuentaFn,
  crearPrimerAdminFn,
  portalVacioFn,
  cambiarCorreoFn,
  establecerClaveFn,
} from "@/lib/cuentas.functions";

export type { Cuenta, Rol };

export type EstadoFoto = "sin_foto" | "pendiente" | "aprobada" | "rechazada";

export type Colaborador = Empleado & {
  foto?: string | undefined;
  fotoPendiente?: string | undefined;
  estadoFoto: EstadoFoto;
  motivoRechazo?: string | undefined;
  salario: number;
  rol?: Rol | undefined;
  firma?: string | undefined;
  firmaActualizada?: string | undefined;
  firmaPagosRestantes: number;
  firmaLimitePagos: number;
  firmaPermanente: boolean;
  firmaConsentimiento?: string | undefined;
  verificado: boolean;
  /** Solo el personal autorizado de nómina puede ver y emitir volantes de pago. */
  accesoNomina: boolean;
  claveProvisional: boolean;
  /** Clave provisional en texto, visible solo para Administración, RR.HH. y Contabilidad. */
  claveProvisionalTexto?: string | undefined;
  /** Correo personal opcional, además del correo de acceso. */
  correoAlterno?: string | undefined;
  /** Número de WhatsApp con código de país, por ejemplo 18095551234. */
  whatsapp: string;
  /** Canal por el que quiere recibir los avisos del portal. */
  canalAvisos: CanalAvisos;
};

export type CanalAvisos = "correo" | "whatsapp" | "ambos" | "ninguno";

export type Ticket = {
  id: string;
  creadorId: string;
  nombre: string;
  email: string;
  categoria: string;
  asunto: string;
  mensaje: string;
  estado: "Abierto" | "En proceso" | "Resuelto";
  respuesta?: string | undefined;
  fecha: string;
};

export type Pago = {
  id: string;
  colaboradorId: string;
  periodo: string;
  monto: number;
  estado: "Pendiente" | "Pagado";
  recibo: "No enviado" | "Enviado";
};

export type Aviso = {
  id: string;
  para: string;
  titulo: string;
  detalle: string;
  fecha: string;
  nuevo: boolean;
};

export type EstadoSolicitud = "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada";

export type Solicitud = {
  id: string;
  colaboradorId: string;
  tipo: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  conSalario: boolean;
  baseLegal: string;
  soporte?: string | undefined;
  estado: EstadoSolicitud;
  respuesta?: string | undefined;
  respondidoPor?: string | undefined;
  fecha: string;
};

export type TareaAsignada = {
  id: string;
  colaboradorId: string;
  titulo: string;
  detalle: string;
  vence?: string | undefined;
  prioridad: "Alta" | "Media" | "Baja";
  completada: boolean;
  completadaAt?: string | undefined;
  fecha: string;
};

export type NuevaSolicitud = {
  tipo: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  conSalario: boolean;
  baseLegal: string;
  soporte?: string | undefined;
};

export type DatosColaborador = {
  [K in keyof Colaborador]?: Colaborador[K] | undefined;
};

const sesionVacia: Cuenta = {
  email: "",
  clave: "",
  nombre: "Sin sesión",
  rol: "Colaborador",
  cargo: "",
  iniciales: "—",
};

type Resultado = { ok: boolean; error?: string };

type Contexto = {
  cargando: boolean;
  sesionActiva: boolean;
  portalVacio: boolean;
  sesionEmail: string;
  sesion: Cuenta;
  cuentas: Cuenta[];
  colaboradores: Colaborador[];
  pagos: Pago[];
  avisos: Aviso[];
  colaboradorActual?: Colaborador | undefined;
  esAdmin: boolean;
  esRRHH: boolean;
  /** Acceso a la información confidencial de nómina y volantes de pago. */
  esNomina: boolean;
  esContable: boolean;
  fotosPendientes: Colaborador[];
  misAvisos: Aviso[];
  tickets: Ticket[];
  misTickets: Ticket[];
  solicitudes: Solicitud[];
  misSolicitudes: Solicitud[];
  solicitudesPendientes: Solicitud[];
  tareas: TareaAsignada[];
  misTareas: TareaAsignada[];
  crearTarea: (datos: {
    colaboradorId: string;
    titulo: string;
    detalle?: string;
    vence?: string;
    prioridad?: TareaAsignada["prioridad"];
  }) => Promise<Resultado>;
  marcarTarea: (id: string, completada: boolean) => Promise<Resultado>;
  eliminarTarea: (id: string) => Promise<Resultado>;
  crearSolicitud: (datos: NuevaSolicitud) => Promise<Resultado>;
  cancelarSolicitud: (id: string) => Promise<Resultado>;
  responderSolicitud: (
    id: string,
    estado: Extract<EstadoSolicitud, "Aprobada" | "Rechazada">,
    respuesta: string,
  ) => Promise<Resultado>;
  autenticar: (email: string, clave: string) => Promise<Resultado>;
  claveProvisional: boolean;
  establecerClave: (clave: string, confirmacion: string) => Promise<Resultado>;
  crearPrimerAdmin: (datos: {
    email: string;
    clave: string;
    nombre: string;
    cargo: string;
  }) => Promise<Resultado>;
  cerrarSesion: () => Promise<void>;
  guardarCuenta: (cuenta: Cuenta & { area?: string }, emailOriginal?: string) => Promise<Resultado>;
  eliminarCuenta: (email: string) => Promise<Resultado>;
  guardarColaborador: (datos: DatosColaborador) => Promise<Resultado>;
  eliminarColaborador: (id: string) => Promise<Resultado>;
  subirFoto: (id: string, dataUrl: string) => Promise<Resultado>;
  aprobarFoto: (id: string) => Promise<Resultado>;
  rechazarFoto: (id: string, motivo: string) => Promise<Resultado>;
  actualizarPago: (id: string, cambios: Partial<Pago>) => Promise<Resultado>;
  guardarFirma: (id: string, dataUrl: string) => Promise<Resultado>;
  borrarFirma: (id: string) => Promise<Resultado>;
  pedirRenovarFirma: (id: string) => Promise<Resultado>;
  verificar: (id: string, verificado: boolean) => Promise<Resultado>;
  consumirFirma: (id: string) => Promise<Resultado>;
  enviarAvisoManual: (datos: {
    destino: string;
    titulo: string;
    detalle: string;
  }) => Promise<Resultado & { enviados?: number }>;
  crearTicket: (datos: {
    categoria: string;
    asunto: string;
    mensaje: string;
    nombre?: string;
    email?: string;
  }) => Promise<Resultado>;
  responderTicket: (
    id: string,
    respuesta: string,
    estado?: Ticket["estado"],
  ) => Promise<Resultado>;
  marcarAvisosLeidos: () => Promise<void>;
  recargar: () => Promise<void>;
  puenteWhatsappUrl: string;
  puenteWhatsappToken: string;
  guardarPuenteWhatsappUrl: (url: string) => Promise<Resultado>;
  guardarPuenteWhatsappConfig: (url: string, token: string) => Promise<Resultado>;
  actualizarMisAvisos: (whatsapp: string, canalAvisos: CanalAvisos) => Promise<Resultado>;
};

// Se guarda en globalThis para que las recargas en caliente (HMR) no creen
// dos contextos distintos y rompan el provider.
const g = globalThis as unknown as { __ivadPortalContext?: Context<Contexto | null> };
const PortalContext =
  g.__ivadPortalContext ?? (g.__ivadPortalContext = createContext<Contexto | null>(null));

/** La firma digital registrada es permanente: no vence por cantidad de pagos.
 *  Si alguna vez hay que renovarla, se le avisa al colaborador. */
export const LIMITE_PAGOS_FIRMA = 0;

/** Indica si la firma del colaborador sigue vigente para firmar un pago. */
export const firmaVigente = (c?: Colaborador | undefined) => Boolean(c?.firma);

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });

type FilaPerfil = {
  id: string;
  nombre: string;
  cargo: string;
  area: string;
  email: string;
  telefono: string;
  ingreso: string;
  cumple: string;
  estado: string;
  iniciales: string;
  salario: number;
  foto: string | null;
  foto_pendiente: string | null;
  estado_foto: string;
  motivo_rechazo: string | null;
  firma: string | null;
  firma_actualizada: string | null;
  firma_pagos_restantes: number | null;
  firma_limite_pagos: number | null;
  firma_permanente: boolean | null;
  firma_consentimiento_at: string | null;
  verificado?: boolean | null;
  clave_provisional?: boolean | null;
  clave_provisional_texto?: string | null;
  correo_alterno?: string | null;
  whatsapp?: string | null;
  canal_avisos?: string | null;
  acceso_nomina?: boolean | null;
};

const aColaborador = (p: FilaPerfil, rol?: Rol): Colaborador => ({
  id: p.id,
  nombre: p.nombre,
  cargo: p.cargo,
  area: p.area,
  email: p.email,
  telefono: p.telefono,
  ingreso: p.ingreso,
  cumple: p.cumple,
  estado: (p.estado as Colaborador["estado"]) ?? "activo",
  iniciales: p.iniciales || inicialesDe(p.nombre),
  salario: Number(p.salario ?? 0),
  foto: p.foto ?? undefined,
  fotoPendiente: p.foto_pendiente ?? undefined,
  estadoFoto: (p.estado_foto as EstadoFoto) ?? "sin_foto",
  motivoRechazo: p.motivo_rechazo ?? undefined,
  firma: p.firma ?? undefined,
  firmaActualizada: p.firma_actualizada ? fecha(p.firma_actualizada) : undefined,
  firmaPagosRestantes: Number(p.firma_pagos_restantes ?? 0),
  firmaLimitePagos: Number(p.firma_limite_pagos ?? LIMITE_PAGOS_FIRMA),
  firmaPermanente: Boolean(p.firma_permanente),
  firmaConsentimiento: p.firma_consentimiento_at ? fecha(p.firma_consentimiento_at) : undefined,
  verificado: Boolean(p.verificado),
  claveProvisional: Boolean(p.clave_provisional),
  claveProvisionalTexto: p.clave_provisional_texto ?? undefined,
  correoAlterno: p.correo_alterno ?? undefined,
  whatsapp: p.whatsapp ?? "",
  canalAvisos: ((p.canal_avisos as CanalAvisos) ?? "correo") satisfies CanalAvisos,
  accesoNomina: Boolean(p.acceso_nomina),
  rol,
});

export function PortalProvider({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [portalVacio, setPortalVacio] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tareas, setTareas] = useState<TareaAsignada[]>([]);
  const [puenteWhatsappUrl, setPuenteWhatsappUrl] = useState<string>("https://wa.ivadsrl.com");
  const [puenteWhatsappToken, setPuenteWhatsappToken] = useState<string>("ivad-secret-token");
  // Evita dependencias circulares entre pagos y firmas.
  const consumirFirmaRef = useRef<(id: string) => Promise<Resultado>>(async () => ({ ok: true }));

  const cargar = useCallback(async () => {
    const { data: sesionData } = await supabase.auth.getSession();
    const uid = sesionData.session?.user.id ?? null;
    setUserId(uid);

    if (!uid) {
      setColaboradores([]);
      setPagos([]);
      setAvisos([]);
      setTickets([]);
      setSolicitudes([]);
      setTareas([]);
      try {
        const r = await portalVacioFn();
        setPortalVacio(r.vacio);
      } catch {
        setPortalVacio(false);
      }
      setCargando(false);
      return;
    }

    const [
      perfilesRes,
      directorioRes,
      rolesRes,
      pagosRes,
      avisosRes,
      ticketsRes,
      solicitudesRes,
      tareasRes,
      ajustesRes,
    ] =
      await Promise.all([
        supabase.from("perfiles").select("*").order("nombre"),
        supabase.rpc("directorio"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("pagos").select("*").order("created_at", { ascending: false }),
        supabase.from("avisos").select("*").order("created_at", { ascending: false }),
        supabase.from("soporte_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("solicitudes").select("*").order("created_at", { ascending: false }),
        supabase.from("tareas").select("*").order("created_at", { ascending: false }),
        supabase.from("ajustes").select("clave, valor"),
      ]);

    const mapaRoles = new Map<string, Rol>();
    for (const r of rolesRes.data ?? []) mapaRoles.set(r.user_id, r.role as Rol);

    // Los perfiles completos solo llegan para uno mismo o para gestores (RRHH / Admin).
    // El resto del personal se completa con el directorio interno (datos no sensibles).
    const completos = new Map<string, FilaPerfil>();
    for (const p of (perfilesRes.data ?? []) as unknown as FilaPerfil[]) completos.set(p.id, p);

    const filas: FilaPerfil[] = [];
    for (const d of (directorioRes.data ?? []) as Array<Record<string, unknown>>) {
      const id = String(d["id"] ?? "");
      const completo = completos.get(id);
      if (completo) {
        filas.push(completo);
        continue;
      }
      filas.push({
        id,
        nombre: String(d["nombre"] ?? ""),
        cargo: String(d["cargo"] ?? ""),
        area: String(d["area"] ?? ""),
        email: "",
        telefono: "",
        ingreso: "",
        cumple: String(d["cumple"] ?? ""),
        estado: String(d["estado"] ?? "activo"),
        iniciales: String(d["iniciales"] ?? ""),
        salario: 0,
        foto: (d["foto"] as string | null) ?? null,
        foto_pendiente: null,
        estado_foto: d["foto"] ? "aprobada" : "sin_foto",
        motivo_rechazo: null,
        firma: null,
        firma_actualizada: null,
        firma_pagos_restantes: 0,
        firma_limite_pagos: LIMITE_PAGOS_FIRMA,
        firma_permanente: false,
        firma_consentimiento_at: null,
        verificado: Boolean(d["verificado"]),
        clave_provisional: false,
      });
    }
    for (const p of completos.values()) {
      if (!filas.some((f) => f.id === p.id)) filas.push(p);
    }
    filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    const lista = filas.map((p) => aColaborador(p, mapaRoles.get(p.id)));
    setColaboradores(lista);
    setPortalVacio(lista.length === 0);

    setPagos(
      (pagosRes.data ?? []).map((p) => ({
        id: p.id,
        colaboradorId: p.colaborador_id,
        periodo: p.periodo,
        monto: Number(p.monto),
        estado: p.estado as Pago["estado"],
        recibo: p.recibo as Pago["recibo"],
      })),
    );

    const porId = new Map(lista.map((c) => [c.id, c.email]));
    setAvisos(
      (avisosRes.data ?? []).map((a) => ({
        id: a.id,
        para: porId.get(a.para_id) ?? "",
        titulo: a.titulo,
        detalle: a.detalle,
        fecha: fecha(a.created_at),
        nuevo: a.nuevo,
      })),
    );

    setTickets(
      (ticketsRes.data ?? []).map((t) => ({
        id: t.id,
        creadorId: t.creador_id,
        nombre: t.nombre,
        email: t.email,
        categoria: t.categoria,
        asunto: t.asunto,
        mensaje: t.mensaje,
        estado: t.estado as Ticket["estado"],
        respuesta: t.respuesta ?? undefined,
        fecha: fecha(t.created_at),
      })),
    );

    setSolicitudes(
      (solicitudesRes.data ?? []).map((s) => ({
        id: s.id,
        colaboradorId: s.colaborador_id,
        tipo: s.tipo,
        motivo: s.motivo,
        fechaInicio: s.fecha_inicio,
        fechaFin: s.fecha_fin,
        dias: Number(s.dias ?? 1),
        conSalario: Boolean(s.con_salario),
        baseLegal: s.base_legal,
        soporte: s.soporte ?? undefined,
        estado: s.estado as EstadoSolicitud,
        respuesta: s.respuesta ?? undefined,
        respondidoPor: s.respondido_por ?? undefined,
        fecha: fecha(s.created_at),
      })),
    );
    setTareas(
      (tareasRes.data ?? []).map((t) => ({
        id: t.id,
        colaboradorId: t.colaborador_id,
        titulo: t.titulo,
        detalle: t.detalle ?? "",
        vence: t.vence ?? undefined,
        prioridad: (t.prioridad ?? "Media") as TareaAsignada["prioridad"],
        completada: Boolean(t.completada),
        completadaAt: t.completada_at ?? undefined,
        fecha: fecha(t.created_at),
      })),
    );

    const puenteAjuste = ((ajustesRes.data ?? []) as Array<{ clave: string; valor: string }>).find(
      (a) => a.clave === "whatsapp_puente_url",
    )?.valor;
    if (puenteAjuste) setPuenteWhatsappUrl(puenteAjuste);

    const tokenAjuste = ((ajustesRes.data ?? []) as Array<{ clave: string; valor: string }>).find(
      (a) => a.clave === "whatsapp_puente_token",
    )?.valor;
    if (tokenAjuste) setPuenteWhatsappToken(tokenAjuste);

    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void cargar();
    });
    return () => data.subscription.unsubscribe();
  }, [cargar]);

  const sesion: Cuenta = useMemo(() => {
    const yo = colaboradores.find((c) => c.id === userId);
    if (!yo) return sesionVacia;
    return {
      email: yo.email,
      clave: "",
      nombre: yo.nombre,
      rol: yo.rol ?? "Colaborador",
      cargo: yo.cargo,
      iniciales: yo.iniciales,
    };
  }, [colaboradores, userId]);

  const colaboradorActual = useMemo(
    () => colaboradores.find((c) => c.id === userId),
    [colaboradores, userId],
  );

  const cuentas: Cuenta[] = useMemo(
    () =>
      colaboradores.map((c) => ({
        email: c.email,
        clave: "",
        nombre: c.nombre,
        rol: c.rol ?? "Colaborador",
        cargo: c.cargo,
        iniciales: c.iniciales,
      })),
    [colaboradores],
  );

  const autenticar = useCallback(async (email: string, clave: string): Promise<Resultado> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: clave,
    });
    if (error) return { ok: false, error: "Correo o contraseña incorrectos." };
    await cargar();
    return { ok: true };
  }, [cargar]);

  const establecerClave = useCallback(
    async (clave: string, confirmacion: string): Promise<Resultado> => {
      if (clave !== confirmacion) return { ok: false, error: "Las contraseñas no coinciden." };
      if (clave.length < 6)
        return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
      try {
        const r = await establecerClaveFn({ data: { clave, confirmacion } });
        if (r.ok) await cargar();
        return r;
      } catch {
        return { ok: false, error: "No se pudo guardar la contraseña." };
      }
    },
    [cargar],
  );

  const crearPrimerAdmin = useCallback(
    async (datos: { email: string; clave: string; nombre: string; cargo: string }) => {
      const r = await crearPrimerAdminFn({ data: datos });
      if (!r.ok) return r;
      return autenticar(datos.email, datos.clave);
    },
    [autenticar],
  );

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut();
    await cargar();
  }, [cargar]);

  const guardarCuenta = useCallback(
    async (cuenta: Cuenta & { area?: string }, emailOriginal?: string): Promise<Resultado> => {
      const r = await guardarCuentaFn({
        data: {
          email: cuenta.email,
          ...(cuenta.clave ? { clave: cuenta.clave } : {}),
          nombre: cuenta.nombre,
          cargo: cuenta.cargo,
          area: cuenta.area ?? "",
          rol: cuenta.rol,
          ...(emailOriginal ? { emailOriginal } : {}),
        },
      });
      if (r.ok) await cargar();
      return r;
    },
    [cargar],
  );

  const eliminarCuenta = useCallback(
    async (email: string): Promise<Resultado> => {
      const c = colaboradores.find((x) => x.email.toLowerCase() === email.toLowerCase());
      if (!c) return { ok: false, error: "Cuenta no encontrada" };
      const r = await eliminarCuentaFn({ data: { id: c.id } });
      if (r.ok) await cargar();
      return r;
    },
    [colaboradores, cargar],
  );

  const guardarColaborador = useCallback(
    async (datos: DatosColaborador): Promise<Resultado> => {
      if (!datos.id) {
        return {
          ok: false,
          error:
            "Para agregar un colaborador crea primero su acceso en Administradores → Usuarios.",
        };
      }
      const fila: Record<string, string | number> = {};
      const campos: Array<[keyof Colaborador, string]> = [
        ["nombre", "nombre"],
        ["cargo", "cargo"],
        ["area", "area"],
        ["telefono", "telefono"],
        ["ingreso", "ingreso"],
        ["cumple", "cumple"],
        ["estado", "estado"],
        ["salario", "salario"],
        ["whatsapp", "whatsapp"],
        ["canalAvisos", "canal_avisos"],
      ];
      for (const [clave, columna] of campos) {
        const valor = datos[clave];
        if (valor !== undefined) fila[columna] = valor as string | number;
      }
      if (datos.nombre) fila["iniciales"] = inicialesDe(datos.nombre);

      const { error } = await supabase.from("perfiles").update(fila as never).eq("id", datos.id);
      if (error) return { ok: false, error: error.message };

      // El correo de acceso se cambia en el servidor (auth + perfil) y avisa al nuevo buzón.
      const actual = colaboradores.find((c) => c.id === datos.id);
      const nuevoEmail = datos.email?.trim().toLowerCase();
      if (nuevoEmail && nuevoEmail !== actual?.email.toLowerCase()) {
        const r = await cambiarCorreoFn({ data: { id: datos.id, email: nuevoEmail } });
        if (!r.ok) {
          await cargar();
          return { ok: false, error: r.error };
        }
      }
      await cargar();
      return { ok: true };
    },
    [cargar, colaboradores],
  );

  const guardarPuenteWhatsappUrl = useCallback(
    async (url: string): Promise<Resultado> => {
      const limpia = url.trim().replace(/\/+$/, "");
      const { error } = await supabase
        .from("ajustes")
        .upsert({ clave: "whatsapp_puente_url", valor: limpia } as never);
      if (error) return { ok: false, error: error.message };
      setPuenteWhatsappUrl(limpia);
      return { ok: true };
    },
    [],
  );

  const guardarPuenteWhatsappConfig = useCallback(
    async (url: string, token: string): Promise<Resultado> => {
      const limpiaUrl = url.trim().replace(/\/+$/, "");
      const limpiaToken = token.trim();
      const [resUrl, resToken] = await Promise.all([
        supabase.from("ajustes").upsert({ clave: "whatsapp_puente_url", valor: limpiaUrl } as never),
        supabase.from("ajustes").upsert({ clave: "whatsapp_puente_token", valor: limpiaToken } as never),
      ]);
      if (resUrl.error) return { ok: false, error: resUrl.error.message };
      if (resToken.error) return { ok: false, error: resToken.error.message };
      setPuenteWhatsappUrl(limpiaUrl);
      setPuenteWhatsappToken(limpiaToken);
      return { ok: true };
    },
    [],
  );

  const actualizarMisAvisos = useCallback(
    async (whatsapp: string, canalAvisos: CanalAvisos): Promise<Resultado> => {
      if (!userId) return { ok: false, error: "Sesión no iniciada" };
      const numLimpio = whatsapp.replace(/\D/g, "");
      const { error } = await supabase
        .from("perfiles")
        .update({
          whatsapp: numLimpio,
          canal_avisos: canalAvisos,
        } as never)
        .eq("id", userId);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [userId, cargar],
  );

  const eliminarColaborador = useCallback(
    async (id: string): Promise<Resultado> => {
      const r = await eliminarCuentaFn({ data: { id } });
      if (r.ok) await cargar();
      return r;
    },
    [cargar],
  );

  const enviarCorreo = useCallback(
    async (
      paraId: string,
      titulo: string,
      detalle: string,
      opciones?: {
        etiqueta?: string;
        enlace?: string;
        enlaceTexto?: string;
        insignias?: boolean;
      },
    ) => {
      const c = colaboradores.find((x) => x.id === paraId);
      if (!c?.email) return;
      try {
        await enviarCorreoFn({
          data: {
            para: c.email,
            nombre: c.nombre,
            titulo,
            detalle,
            etiqueta: opciones?.etiqueta ?? "Notificación",
            ...(opciones?.enlace ? { enlace: opciones.enlace } : {}),
            ...(opciones?.enlaceTexto ? { enlaceTexto: opciones.enlaceTexto } : {}),
            ...(opciones?.insignias ? { insignias: true } : {}),
          },
        });
      } catch (e) {
        console.error("No se pudo enviar el correo", e);
      }
    },
    [colaboradores],
  );

  const crearAviso = useCallback(
    async (
      paraId: string,
      titulo: string,
      detalle: string,
      opciones?: {
        etiqueta?: string;
        enlace?: string;
        enlaceTexto?: string;
        insignias?: boolean;
      },
    ) => {
      await supabase.from("avisos").insert({ para_id: paraId, titulo, detalle });
      const c = colaboradores.find((x) => x.id === paraId);
      const canal = c?.canalAvisos ?? "correo";

      // 1. Enviar por correo si el canal es "correo" o "ambos"
      if (canal === "correo" || canal === "ambos") {
        await enviarCorreo(paraId, titulo, detalle, opciones);
      }

      // 2. Enviar por WhatsApp si el canal es "whatsapp" o "ambos" y tiene número y puente configurado
      if ((canal === "whatsapp" || canal === "ambos") && c?.whatsapp && puenteWhatsappUrl) {
        try {
          const texto = `*Portal IVAD - ${titulo}*\n\nHola ${c.nombre},\n${detalle}${opciones?.enlace ? `\n\nPuedes verlo aquí: ${opciones.enlace}` : ""}`;
          await enviarWhatsappFn({
            data: {
              puente: puenteWhatsappUrl,
              para: c.whatsapp,
              texto,
              token: puenteWhatsappToken,
            },
          });
        } catch (e) {
          console.error("No se pudo enviar el aviso por WhatsApp:", e);
        }
      }
    },
    [colaboradores, enviarCorreo, puenteWhatsappUrl, puenteWhatsappToken],
  );

  const subirFoto = useCallback(
    async (id: string, dataUrl: string): Promise<Resultado> => {
      const { error } = await supabase
        .from("perfiles")
        .update({ foto_pendiente: dataUrl, estado_foto: "pendiente", motivo_rechazo: null })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

  const aprobarFoto = useCallback(
    async (id: string): Promise<Resultado> => {
      const c = colaboradores.find((x) => x.id === id);
      if (!c?.fotoPendiente) return { ok: false, error: "Sin foto pendiente" };
      const { error } = await supabase
        .from("perfiles")
        .update({ foto: c.fotoPendiente, foto_pendiente: null, estado_foto: "aprobada" })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await crearAviso(
        id,
        "Tu foto de perfil fue aprobada",
        "Ya es visible para todo el equipo en el directorio.",
      );
      await cargar();
      return { ok: true };
    },
    [colaboradores, crearAviso, cargar],
  );

  const rechazarFoto = useCallback(
    async (id: string, motivo: string): Promise<Resultado> => {
      const { error } = await supabase
        .from("perfiles")
        .update({ foto_pendiente: null, estado_foto: "rechazada", motivo_rechazo: motivo })
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await crearAviso(
        id,
        "Tu foto de perfil no aplica",
        `${motivo} Sube una nueva foto desde Mi Perfil.`,
      );
      await cargar();
      return { ok: true };
    },
    [crearAviso, cargar],
  );

  const actualizarPago = useCallback(
    async (id: string, cambios: Partial<Pago>): Promise<Resultado> => {
      const pago = pagos.find((p) => p.id === id);
      const fila: Record<string, string | number> = {};
      if (cambios.estado) fila["estado"] = cambios.estado;
      if (cambios.recibo) fila["recibo"] = cambios.recibo;
      if (cambios.monto !== undefined) fila["monto"] = cambios.monto;
      if (cambios.periodo) fila["periodo"] = cambios.periodo;
      const { error } = await supabase.from("pagos").update(fila as never).eq("id", id);
      if (error) return { ok: false, error: error.message };
      if (cambios.recibo === "Enviado" && pago) {
        await consumirFirmaRef.current(pago.colaboradorId);
        await crearAviso(
          pago.colaboradorId,
          "Recibo de nómina disponible",
          `${pago.periodo}: tu recibo fue enviado por Contabilidad.`,
        );
      }
      await cargar();
      return { ok: true };
    },
    [pagos, crearAviso, cargar],
  );

  const guardarFirma = useCallback(
    async (id: string, dataUrl: string): Promise<Resultado> => {
      const { error } = await supabase
        .from("perfiles")
        .update({
          firma: dataUrl,
          firma_actualizada: new Date().toISOString(),
          firma_pagos_restantes: 0,
          firma_permanente: true,
          firma_consentimiento_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await crearAviso(
        id,
        "Tu firma digital quedó registrada",
        "Registramos tu firma digital y aceptaste el compromiso: queda vigente de forma permanente y se usará en el espacio de “Recibí conforme” de tus volantes de pago. Si en algún momento hay que renovarla, te avisaremos por aquí.",
        { etiqueta: "Firma digital", enlace: "/perfil", enlaceTexto: "Ver mi perfil" },
      );
      await cargar();
      return { ok: true };
    },
    [crearAviso, cargar],
  );

  const borrarFirma = useCallback(
    async (id: string): Promise<Resultado> => {
      const { error } = await supabase
        .from("perfiles")
        .update({
          firma: null,
          firma_actualizada: null,
          firma_pagos_restantes: 0,
          firma_permanente: false,
          firma_consentimiento_at: null,
        } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

  /** Le pide al colaborador registrar su firma de nuevo (solo cuando hace falta). */
  const pedirRenovarFirma = useCallback(
    async (id: string): Promise<Resultado> => {
      await crearAviso(
        id,
        "Necesitamos que registres tu firma otra vez",
        "Tu firma digital es permanente, pero en este caso necesitamos que la registres de nuevo. Pasa por Administración o pide ayuda desde Soporte.",
        { etiqueta: "Firma digital", enlace: "/perfil", enlaceTexto: "Ver mi perfil" },
      );
      return { ok: true };
    },
    [crearAviso],
  );

  /** Otorga o retira la insignia de verificación (solo Administración / RR.HH.). */
  const verificar = useCallback(
    async (id: string, verificado: boolean): Promise<Resultado> => {
      const { error } = await supabase
        .from("perfiles")
        .update({
          verificado,
          verificado_at: verificado ? new Date().toISOString() : null,
        } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await crearAviso(
        id,
        verificado ? "Tu perfil fue verificado" : "Se retiró la verificación de tu perfil",
        verificado
          ? "Tu insignia de verificación ya aparece junto a tu nombre en el directorio del portal, visible para todo el equipo."
          : "Administración retiró temporalmente la insignia de verificación de tu perfil. Si tienes dudas escríbenos desde Soporte.",
        {
          etiqueta: "Verificación",
          enlace: "/perfil",
          enlaceTexto: "Ver mi perfil",
          insignias: true,
        },
      );
      await cargar();
      return { ok: true };
    },
    [crearAviso, cargar],
  );

  /** La firma es permanente: no se descuenta vigencia por pago. */
  const consumirFirma = useCallback(async (_id: string): Promise<Resultado> => ({ ok: true }), []);
  consumirFirmaRef.current = consumirFirma;

  const crearTicket = useCallback(
    async (datos: {
      categoria: string;
      asunto: string;
      mensaje: string;
      nombre?: string;
      email?: string;
    }): Promise<Resultado> => {
      if (!userId) return { ok: false, error: "Inicia sesión para enviar tu solicitud." };
      const { error } = await supabase.from("soporte_tickets").insert({
        creador_id: userId,
        nombre: (datos.nombre ?? sesion.nombre).slice(0, 120),
        email: (datos.email ?? sesion.email).slice(0, 200),
        categoria: datos.categoria,
        asunto: datos.asunto.slice(0, 150),
        mensaje: datos.mensaje.slice(0, 2000),
      } as never);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [userId, sesion.nombre, sesion.email, cargar],
  );

  const responderTicket = useCallback(
    async (id: string, respuesta: string, estado?: Ticket["estado"]): Promise<Resultado> => {
      const t = tickets.find((x) => x.id === id);
      const { error } = await supabase
        .from("soporte_tickets")
        .update({ respuesta, estado: estado ?? "Resuelto" } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      if (t) {
        await crearAviso(t.creadorId, `Respuesta a tu caso: ${t.asunto}`, respuesta);
      }
      await cargar();
      return { ok: true };
    },
    [tickets, crearAviso, cargar],
  );

  const crearSolicitud = useCallback(
    async (datos: NuevaSolicitud): Promise<Resultado> => {
      if (!userId) return { ok: false, error: "Inicia sesión para enviar tu solicitud." };
      if (!datos.fechaInicio || !datos.fechaFin)
        return { ok: false, error: "Indica la fecha de inicio y de fin." };
      if (datos.fechaFin < datos.fechaInicio)
        return { ok: false, error: "La fecha de fin no puede ser anterior a la de inicio." };
      const { error } = await supabase.from("solicitudes").insert({
        colaborador_id: userId,
        tipo: datos.tipo,
        motivo: datos.motivo.slice(0, 1500),
        fecha_inicio: datos.fechaInicio,
        fecha_fin: datos.fechaFin,
        dias: datos.dias,
        con_salario: datos.conSalario,
        base_legal: datos.baseLegal,
        soporte: datos.soporte ?? null,
      } as never);
      if (error) return { ok: false, error: error.message };
      // Avisa a Recursos Humanos y Administración.
      const gestores = colaboradores.filter(
        (c) => c.rol === "Administrador" || c.rol === "Recursos Humanos",
      );
      for (const g of gestores) {
        await crearAviso(
          g.id,
          `Nueva solicitud: ${datos.tipo}`,
          `${sesion.nombre} solicitó ${datos.tipo} del ${datos.fechaInicio} al ${datos.fechaFin} (${datos.dias} día(s)). Motivo: ${datos.motivo || "sin detalle"}.`,
        );
      }
      await cargar();
      return { ok: true };
    },
    [userId, colaboradores, sesion.nombre, crearAviso, cargar],
  );

  const cancelarSolicitud = useCallback(
    async (id: string): Promise<Resultado> => {
      const { error } = await supabase
        .from("solicitudes")
        .update({ estado: "Cancelada" } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

  const responderSolicitud = useCallback(
    async (
      id: string,
      estado: "Aprobada" | "Rechazada",
      respuesta: string,
    ): Promise<Resultado> => {
      const s = solicitudes.find((x) => x.id === id);
      const { error } = await supabase
        .from("solicitudes")
        .update({
          estado,
          respuesta,
          respondido_por: userId,
          respondido_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      if (s) {
        await crearAviso(
          s.colaboradorId,
          `Tu solicitud de ${s.tipo} fue ${estado.toLowerCase()}`,
          `Fechas: ${s.fechaInicio} al ${s.fechaFin} (${s.dias} día(s)).${respuesta ? ` Comentario: ${respuesta}` : ""}`,
        );
      }
      await cargar();
      return { ok: true };
    },
    [solicitudes, userId, crearAviso, cargar],
  );

  /** Administración / RR.HH. asigna una tarea a un colaborador. */
  const crearTarea = useCallback(
    async (datos: {
      colaboradorId: string;
      titulo: string;
      detalle?: string;
      vence?: string;
      prioridad?: TareaAsignada["prioridad"];
    }): Promise<Resultado> => {
      if (!datos.colaboradorId) return { ok: false, error: "Selecciona un colaborador." };
      if (datos.titulo.trim().length < 3) return { ok: false, error: "Escribe el título de la tarea." };
      const { error } = await supabase.from("tareas").insert({
        colaborador_id: datos.colaboradorId,
        titulo: datos.titulo.trim(),
        detalle: (datos.detalle ?? "").trim(),
        vence: datos.vence || null,
        prioridad: datos.prioridad ?? "Media",
        asignada_por: userId,
      } as never);
      if (error) return { ok: false, error: error.message };
      await crearAviso(
        datos.colaboradorId,
        `Nueva tarea asignada: ${datos.titulo.trim()}`,
        `${(datos.detalle ?? "").trim() || "Revisa la sección Tareas del portal."}${datos.vence ? ` Vence: ${datos.vence}.` : ""}`,
        { etiqueta: "Tarea" },
      );
      await cargar();
      return { ok: true };
    },
    [userId, crearAviso, cargar],
  );

  const marcarTarea = useCallback(
    async (id: string, completada: boolean): Promise<Resultado> => {
      const { error } = await supabase
        .from("tareas")
        .update({
          completada,
          completada_at: completada ? new Date().toISOString() : null,
        } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

  const eliminarTarea = useCallback(
    async (id: string): Promise<Resultado> => {
      const { error } = await supabase.from("tareas").delete().eq("id", id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

  /** Envía un aviso (con correo) a un colaborador o a todo el personal activo. */
  const enviarAvisoManual = useCallback(
    async ({
      destino,
      titulo,
      detalle,
    }: {
      destino: string;
      titulo: string;
      detalle: string;
    }): Promise<Resultado & { enviados?: number }> => {
      if (titulo.trim().length < 3) return { ok: false, error: "Escribe un título" };
      if (detalle.trim().length < 3) return { ok: false, error: "Escribe el mensaje" };

      const destinatarios =
        destino === "todos"
          ? colaboradores.map((c) => c.id)
          : [destino];
      if (!destinatarios.length) return { ok: false, error: "No hay destinatarios" };

      for (const id of destinatarios) {
        await crearAviso(id, titulo.trim(), detalle.trim(), { etiqueta: "Comunicado" });
      }
      await cargar();
      return { ok: true, enviados: destinatarios.length };
    },
    [colaboradores, crearAviso, cargar],
  );

  const marcarAvisosLeidos = useCallback(async () => {
    if (!userId) return;
    await supabase.from("avisos").update({ nuevo: false }).eq("para_id", userId);
    await cargar();
  }, [userId, cargar]);

  const valor: Contexto = {
    cargando,
    sesionActiva: Boolean(userId),
    portalVacio,
    sesionEmail: sesion.email,
    sesion,
    cuentas,
    colaboradores,
    pagos,
    avisos,
    colaboradorActual,
    esAdmin: sesion.rol === "Administrador" || sesion.rol === "Contabilidad",
    esRRHH:
      sesion.rol === "Administrador" ||
      sesion.rol === "Recursos Humanos" ||
      sesion.rol === "Contabilidad",
    esContable: sesion.rol === "Administrador" || sesion.rol === "Contabilidad",
    esNomina: Boolean(colaboradorActual?.accesoNomina),
    fotosPendientes: colaboradores.filter((c) => c.estadoFoto === "pendiente"),
    misAvisos: avisos.filter((a) => a.para === sesion.email),
    tickets,
    misTickets: tickets.filter((t) => t.creadorId === userId),
    solicitudes,
    misSolicitudes: solicitudes.filter((s) => s.colaboradorId === userId),
    solicitudesPendientes: solicitudes.filter((s) => s.estado === "Pendiente"),
    tareas,
    misTareas: tareas.filter((t) => t.colaboradorId === userId),
    crearTarea,
    marcarTarea,
    eliminarTarea,
    crearSolicitud,
    cancelarSolicitud,
    responderSolicitud,
    autenticar,
    claveProvisional: Boolean(colaboradorActual?.claveProvisional),
    establecerClave,
    crearPrimerAdmin,
    cerrarSesion,
    guardarCuenta,
    eliminarCuenta,
    guardarColaborador,
    eliminarColaborador,
    subirFoto,
    aprobarFoto,
    rechazarFoto,
    actualizarPago,
    guardarFirma,
    borrarFirma,
    pedirRenovarFirma,
    verificar,
    consumirFirma,
    enviarAvisoManual,
    crearTicket,
    responderTicket,
    marcarAvisosLeidos,
    recargar: cargar,
    puenteWhatsappUrl,
    puenteWhatsappToken,
    guardarPuenteWhatsappUrl,
    guardarPuenteWhatsappConfig,
    actualizarMisAvisos,
  };

  return <PortalContext.Provider value={valor}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal debe usarse dentro de PortalProvider");
  return ctx;
}
