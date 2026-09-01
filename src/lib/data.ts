export type Empleado = {
  id: string;
  nombre: string;
  cargo: string;
  area: string;
  email: string;
  telefono: string;
  ingreso: string;
  cumple: string;
  estado: "activo" | "ausente" | "vacaciones";
  iniciales: string;
};

/** Áreas disponibles al registrar colaboradores. */
export const areas = [
  "Tecnología",
  "Planificación",
  "Recursos Humanos",
  "Comercial",
  "Administración",
  "Operaciones",
  "Finanzas",
];

export type Anuncio = { titulo: string; detalle: string; fecha: string };
export const anuncios: Anuncio[] = [];

export type Evento = { titulo: string; area: string; cuando: string; dia: number };
export const eventos: Evento[] = [];

export type Tarea = { titulo: string; vence: string; prioridad: string; lista: boolean };
export const tareas: Tarea[] = [];

export type Solicitud = {
  tipo: string;
  solicitante: string;
  rango: string;
  estado: string;
};
export const solicitudes: Solicitud[] = [];

export const tiposSolicitud = [
  "Solicitudes Varias",
  "Solicitudes Permisos",
  "Aprobación Permisos",
  "Aprobación Vacaciones",
  "Solicitudes Licencias",
  "Aprobación Licencias",
];

export type RegistroAsistencia = {
  dia: string;
  entrada: string;
  salida: string;
  horas: string;
  estado: string;
};
export const asistencia: RegistroAsistencia[] = [];

export const nomina = {
  anual: { ingresos: 0, descuentos: 0, neto: 0 },
  meses: [] as { mes: string; ingresos: number; descuentos: number; neto: number }[],
};

export type Notificacion = { titulo: string; detalle: string; nuevo: boolean };
export const notificaciones: Notificacion[] = [];

export type MensajeChat = { de: "rrhh" | "yo"; texto: string; hora: string };
export const chatRRHH: MensajeChat[] = [];

export const pesos = (valor: number) =>
  valor.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type Rol = "Administrador" | "Recursos Humanos" | "Supervisor" | "Colaborador";

export type Cuenta = {
  email: string;
  clave: string;
  nombre: string;
  rol: Rol;
  cargo: string;
  iniciales: string;
};

export const roles: Rol[] = [
  "Administrador",
  "Recursos Humanos",
  "Supervisor",
  "Colaborador",
];

export const iniciales = (nombre: string) =>
  nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "NC";
