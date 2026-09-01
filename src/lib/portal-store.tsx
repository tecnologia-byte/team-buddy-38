import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { empleados, usuariosDemo, type Empleado, type UsuarioDemo } from "@/lib/data";

export type Rol = UsuarioDemo["rol"];

export type EstadoFoto = "sin_foto" | "pendiente" | "aprobada" | "rechazada";

export type Colaborador = Empleado & {
  foto?: string | undefined;
  fotoPendiente?: string | undefined;
  estadoFoto: EstadoFoto;
  motivoRechazo?: string | undefined;
  salario: number;
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

const salariosBase: Record<string, number> = {
  "1": 185000,
  "2": 165000,
  "3": 92000,
  "4": 110000,
  "5": 78000,
  "6": 65000,
  "7": 58000,
  "8": 72000,
};

const colaboradoresIniciales: Colaborador[] = empleados.map((e) => ({
  ...e,
  estadoFoto: "sin_foto",
  salario: salariosBase[e.id] ?? 60000,
}));

const pagosIniciales: Pago[] = colaboradoresIniciales.map((c) => ({
  id: `p-${c.id}`,
  colaboradorId: c.id,
  periodo: "Mayo 2024 · 2da quincena",
  monto: Math.round((c.salario / 2) * 100) / 100,
  estado: Number(c.id) % 3 === 0 ? "Pendiente" : "Pagado",
  recibo: Number(c.id) % 2 === 0 ? "Enviado" : "No enviado",
}));

export type DatosColaborador = {
  [K in keyof Colaborador]?: Colaborador[K] | undefined;
};

type Estado = {
  sesionEmail: string;
  colaboradores: Colaborador[];
  pagos: Pago[];
  avisos: Aviso[];
};

const estadoInicial: Estado = {
  sesionEmail: "ana.rodriguez@ivad.com.do",
  colaboradores: colaboradoresIniciales,
  pagos: pagosIniciales,
  avisos: [],
};

const CLAVE = "ivad-portal-v1";

type Contexto = Estado & {
  sesion: UsuarioDemo;
  colaboradorActual?: Colaborador | undefined;
  esAdmin: boolean;
  esRRHH: boolean;
  fotosPendientes: Colaborador[];
  misAvisos: Aviso[];
  iniciarSesion: (email: string) => void;
  guardarColaborador: (datos: DatosColaborador) => void;
  eliminarColaborador: (id: string) => void;
  subirFoto: (id: string, dataUrl: string) => void;
  aprobarFoto: (id: string) => void;
  rechazarFoto: (id: string, motivo: string) => void;
  actualizarPago: (id: string, cambios: Partial<Pago>) => void;
  marcarAvisosLeidos: () => void;
};

const PortalContext = createContext<Contexto | null>(null);

const ahora = () =>
  new Date().toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });

const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export function PortalProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(estadoInicial);

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado) setEstado({ ...estadoInicial, ...JSON.parse(guardado) });
    } catch {
      /* estado por defecto */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      /* cuota excedida */
    }
  }, [estado]);

  const sesion = useMemo(
    () => usuariosDemo.find((u) => u.email === estado.sesionEmail) ?? usuariosDemo[3]!,
    [estado.sesionEmail],
  );

  const colaboradorActual = useMemo(
    () => estado.colaboradores.find((c) => c.email === sesion.email),
    [estado.colaboradores, sesion.email],
  );

  const iniciarSesion = useCallback((email: string) => {
    setEstado((p) => ({ ...p, sesionEmail: email }));
  }, []);

  const guardarColaborador = useCallback((datos: DatosColaborador) => {
    setEstado((p) => {
      if (datos.id && p.colaboradores.some((c) => c.id === datos.id)) {
        return {
          ...p,
          colaboradores: p.colaboradores.map((c) =>
            c.id === datos.id
              ? {
                  ...c,
                  ...datos,
                  iniciales: datos.nombre ? iniciales(datos.nombre) : c.iniciales,
                }
              : c,
          ),
        };
      }
      const id = `c-${Date.now()}`;
      const nuevo: Colaborador = {
        id,
        nombre: datos.nombre ?? "Nuevo colaborador",
        cargo: datos.cargo ?? "Sin cargo",
        area: datos.area ?? "Administración",
        email: datos.email ?? "",
        telefono: datos.telefono ?? "",
        ingreso: datos.ingreso ?? String(new Date().getFullYear()),
        cumple: datos.cumple ?? "—",
        estado: datos.estado ?? "activo",
        iniciales: iniciales(datos.nombre ?? "NC"),
        estadoFoto: "sin_foto",
        salario: datos.salario ?? 45000,
      };
      return {
        ...p,
        colaboradores: [...p.colaboradores, nuevo],
        pagos: [
          ...p.pagos,
          {
            id: `p-${id}`,
            colaboradorId: id,
            periodo: "Mayo 2024 · 2da quincena",
            monto: Math.round((nuevo.salario / 2) * 100) / 100,
            estado: "Pendiente",
            recibo: "No enviado",
          },
        ],
      };
    });
  }, []);

  const eliminarColaborador = useCallback((id: string) => {
    setEstado((p) => ({
      ...p,
      colaboradores: p.colaboradores.filter((c) => c.id !== id),
      pagos: p.pagos.filter((pago) => pago.colaboradorId !== id),
    }));
  }, []);

  const subirFoto = useCallback((id: string, dataUrl: string) => {
    setEstado((p) => ({
      ...p,
      colaboradores: p.colaboradores.map((c) =>
        c.id === id
          ? { ...c, fotoPendiente: dataUrl, estadoFoto: "pendiente", motivoRechazo: undefined }
          : c,
      ),
    }));
  }, []);

  const aprobarFoto = useCallback((id: string) => {
    setEstado((p) => {
      const c = p.colaboradores.find((x) => x.id === id);
      if (!c?.fotoPendiente) return p;
      return {
        ...p,
        colaboradores: p.colaboradores.map((x) =>
          x.id === id
            ? { ...x, foto: x.fotoPendiente, fotoPendiente: undefined, estadoFoto: "aprobada" }
            : x,
        ),
        avisos: [
          {
            id: `a-${Date.now()}`,
            para: c.email,
            titulo: "Tu foto de perfil fue aprobada",
            detalle: "Ya es visible para todo el equipo en el directorio.",
            fecha: ahora(),
            nuevo: true,
          },
          ...p.avisos,
        ],
      };
    });
  }, []);

  const rechazarFoto = useCallback((id: string, motivo: string) => {
    setEstado((p) => {
      const c = p.colaboradores.find((x) => x.id === id);
      if (!c) return p;
      return {
        ...p,
        colaboradores: p.colaboradores.map((x) =>
          x.id === id
            ? { ...x, fotoPendiente: undefined, estadoFoto: "rechazada", motivoRechazo: motivo }
            : x,
        ),
        avisos: [
          {
            id: `a-${Date.now()}`,
            para: c.email,
            titulo: "Tu foto de perfil no aplica",
            detalle: `${motivo} Sube una nueva foto desde Mi Perfil.`,
            fecha: ahora(),
            nuevo: true,
          },
          ...p.avisos,
        ],
      };
    });
  }, []);

  const actualizarPago = useCallback((id: string, cambios: Partial<Pago>) => {
    setEstado((p) => {
      const pago = p.pagos.find((x) => x.id === id);
      const colaborador = p.colaboradores.find((c) => c.id === pago?.colaboradorId);
      const avisos =
        cambios.recibo === "Enviado" && colaborador
          ? [
              {
                id: `a-${Date.now()}`,
                para: colaborador.email,
                titulo: "Recibo de nómina disponible",
                detalle: `${pago?.periodo}: tu recibo fue enviado por Contabilidad.`,
                fecha: ahora(),
                nuevo: true,
              },
              ...p.avisos,
            ]
          : p.avisos;
      return {
        ...p,
        pagos: p.pagos.map((x) => (x.id === id ? { ...x, ...cambios } : x)),
        avisos,
      };
    });
  }, []);

  const marcarAvisosLeidos = useCallback(() => {
    setEstado((p) => ({
      ...p,
      avisos: p.avisos.map((a) => (a.para === p.sesionEmail ? { ...a, nuevo: false } : a)),
    }));
  }, []);

  const valor: Contexto = {
    ...estado,
    sesion,
    colaboradorActual,
    esAdmin: sesion.rol === "Administrador",
    esRRHH: sesion.rol === "Administrador" || sesion.rol === "Recursos Humanos",
    fotosPendientes: estado.colaboradores.filter((c) => c.estadoFoto === "pendiente"),
    misAvisos: estado.avisos.filter((a) => a.para === sesion.email),
    iniciarSesion,
    guardarColaborador,
    eliminarColaborador,
    subirFoto,
    aprobarFoto,
    rechazarFoto,
    actualizarPago,
    marcarAvisosLeidos,
  };

  return <PortalContext.Provider value={valor}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal debe usarse dentro de PortalProvider");
  return ctx;
}
