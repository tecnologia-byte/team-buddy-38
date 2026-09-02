import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type Context,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { iniciales as inicialesDe, type Cuenta, type Empleado, type Rol } from "@/lib/data";
import {
  guardarCuentaFn,
  eliminarCuentaFn,
  crearPrimerAdminFn,
  portalVacioFn,
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
};

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
  fotosPendientes: Colaborador[];
  misAvisos: Aviso[];
  tickets: Ticket[];
  misTickets: Ticket[];
  autenticar: (email: string, clave: string) => Promise<Resultado>;
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
};

// Se guarda en globalThis para que las recargas en caliente (HMR) no creen
// dos contextos distintos y rompan el provider.
const g = globalThis as unknown as { __ivadPortalContext?: Context<Contexto | null> };
const PortalContext =
  g.__ivadPortalContext ?? (g.__ivadPortalContext = createContext<Contexto | null>(null));

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

  const cargar = useCallback(async () => {
    const { data: sesionData } = await supabase.auth.getSession();
    const uid = sesionData.session?.user.id ?? null;
    setUserId(uid);

    if (!uid) {
      setColaboradores([]);
      setPagos([]);
      setAvisos([]);
      setTickets([]);
      try {
        const r = await portalVacioFn();
        setPortalVacio(r.vacio);
      } catch {
        setPortalVacio(false);
      }
      setCargando(false);
      return;
    }

    const [perfilesRes, directorioRes, rolesRes, pagosRes, avisosRes, ticketsRes] =
      await Promise.all([
        supabase.from("perfiles").select("*").order("nombre"),
        supabase.from("directorio").select("*").order("nombre"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("pagos").select("*").order("created_at", { ascending: false }),
        supabase.from("avisos").select("*").order("created_at", { ascending: false }),
        supabase.from("soporte_tickets").select("*").order("created_at", { ascending: false }),
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
        estado_foto: "sin_foto",
        motivo_rechazo: null,
        firma: null,
        firma_actualizada: null,
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
      ];
      for (const [clave, columna] of campos) {
        const valor = datos[clave];
        if (valor !== undefined) fila[columna] = valor as string | number;
      }
      if (datos.nombre) fila["iniciales"] = inicialesDe(datos.nombre);

      const { error } = await supabase.from("perfiles").update(fila as never).eq("id", datos.id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

  const eliminarColaborador = useCallback(
    async (id: string): Promise<Resultado> => {
      const r = await eliminarCuentaFn({ data: { id } });
      if (r.ok) await cargar();
      return r;
    },
    [cargar],
  );

  const crearAviso = useCallback(async (paraId: string, titulo: string, detalle: string) => {
    await supabase.from("avisos").insert({ para_id: paraId, titulo, detalle });
  }, []);

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
        .update({ firma: dataUrl, firma_actualizada: new Date().toISOString() } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      if (id !== userId) {
        await crearAviso(
          id,
          "Tu firma digital fue registrada",
          "Se usará automáticamente en el espacio de 'Recibido por' de tus recibos de pago.",
        );
      }
      await cargar();
      return { ok: true };
    },
    [userId, crearAviso, cargar],
  );

  const borrarFirma = useCallback(
    async (id: string): Promise<Resultado> => {
      const { error } = await supabase
        .from("perfiles")
        .update({ firma: null, firma_actualizada: null } as never)
        .eq("id", id);
      if (error) return { ok: false, error: error.message };
      await cargar();
      return { ok: true };
    },
    [cargar],
  );

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
    esAdmin: sesion.rol === "Administrador",
    esRRHH: sesion.rol === "Administrador" || sesion.rol === "Recursos Humanos",
    fotosPendientes: colaboradores.filter((c) => c.estadoFoto === "pendiente"),
    misAvisos: avisos.filter((a) => a.para === sesion.email),
    tickets,
    misTickets: tickets.filter((t) => t.creadorId === userId),
    autenticar,
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
    crearTicket,
    responderTicket,
    marcarAvisosLeidos,
    recargar: cargar,
  };

  return <PortalContext.Provider value={valor}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal debe usarse dentro de PortalProvider");
  return ctx;
}
