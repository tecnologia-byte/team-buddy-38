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

export const usuarioActual = {
  nombre: "Ana Rodríguez",
  primerNombre: "Ana",
  cargo: "Asistente Administrativa",
  area: "Administración",
  email: "ana.rodriguez@ivad.com.do",
  telefono: "(809) 555-6789",
  ingreso: "12 de marzo de 2021",
  supervisor: "María Rox Lara",
  codigo: "IVAD-0428",
  iniciales: "AR",
  vacacionesDisponibles: 9,
  vacacionesTomadas: 5,
};

export const empleados: Empleado[] = [
  {
    id: "1",
    nombre: "Manuel Gómez Marcano",
    cargo: "Director de Tecnología",
    area: "Tecnología",
    email: "manuel.gomez@ivad.com.do",
    telefono: "(809) 555-1234",
    ingreso: "2016",
    cumple: "14 de marzo",
    estado: "activo",
    iniciales: "MG",
  },
  {
    id: "2",
    nombre: "María Rox Lara",
    cargo: "Gerente Sr. de Planificación & Control",
    area: "Planificación",
    email: "maria.rox@ivad.com.do",
    telefono: "(809) 555-2345",
    ingreso: "2018",
    cumple: "2 de julio",
    estado: "activo",
    iniciales: "MR",
  },
  {
    id: "3",
    nombre: "Carlos Pérez",
    cargo: "Analista de Sistemas",
    area: "Tecnología",
    email: "carlos.perez@ivad.com.do",
    telefono: "(809) 555-3456",
    ingreso: "2020",
    cumple: "9 de septiembre",
    estado: "activo",
    iniciales: "CP",
  },
  {
    id: "4",
    nombre: "Laura Fernández",
    cargo: "Coordinadora de RRHH",
    area: "Recursos Humanos",
    email: "laura.fernandez@ivad.com.do",
    telefono: "(809) 555-4567",
    ingreso: "2019",
    cumple: "1 de septiembre",
    estado: "activo",
    iniciales: "LF",
  },
  {
    id: "5",
    nombre: "José Martínez",
    cargo: "Ejecutivo de Ventas",
    area: "Comercial",
    email: "jose.martinez@ivad.com.do",
    telefono: "(809) 555-5678",
    ingreso: "2022",
    cumple: "23 de abril",
    estado: "vacaciones",
    iniciales: "JM",
  },
  {
    id: "6",
    nombre: "Ana Rodríguez",
    cargo: "Asistente Administrativa",
    area: "Administración",
    email: "ana.rodriguez@ivad.com.do",
    telefono: "(809) 555-6789",
    ingreso: "2021",
    cumple: "18 de octubre",
    estado: "activo",
    iniciales: "AR",
  },
  {
    id: "7",
    nombre: "Pedro Santana",
    cargo: "Encargado de Almacén",
    area: "Operaciones",
    email: "pedro.santana@ivad.com.do",
    telefono: "(809) 555-7890",
    ingreso: "2015",
    cumple: "5 de febrero",
    estado: "ausente",
    iniciales: "PS",
  },
  {
    id: "8",
    nombre: "Rosa Peña",
    cargo: "Analista de Nómina",
    area: "Finanzas",
    email: "rosa.pena@ivad.com.do",
    telefono: "(809) 555-8901",
    ingreso: "2017",
    cumple: "30 de noviembre",
    estado: "activo",
    iniciales: "RP",
  },
];

export const areas = [
  "Tecnología",
  "Planificación",
  "Recursos Humanos",
  "Comercial",
  "Administración",
  "Operaciones",
  "Finanzas",
];

export const anuncios = [
  {
    titulo: "Reunión general",
    detalle: "Este viernes 24 a las 10:00 a.m. en sala de juntas.",
    fecha: "Hoy",
  },
  {
    titulo: "Nuevo plan médico",
    detalle: "Ya puedes inscribir dependientes desde tu perfil.",
    fecha: "Ayer",
  },
  {
    titulo: "Jornada de vacunación",
    detalle: "Martes 28 en el lobby, de 9:00 a.m. a 1:00 p.m.",
    fecha: "2 días",
  },
];

export const eventos = [
  {
    titulo: "Reunión de Equipo",
    area: "Departamento de Operaciones",
    cuando: "16 de mayo, 10:00 a.m.",
    dia: 16,
  },
  {
    titulo: "Pago de Nómina",
    area: "Departamento de Finanzas",
    cuando: "20 de mayo, 08:00 a.m.",
    dia: 20,
  },
  {
    titulo: "Capacitación: Seguridad Laboral",
    area: "Departamento de Recursos Humanos",
    cuando: "23 de mayo, 02:00 p.m.",
    dia: 23,
  },
  {
    titulo: "Cumpleaños de la Empresa",
    area: "Todos los colaboradores",
    cuando: "31 de mayo, Todo el día",
    dia: 31,
  },
];

export const tareas = [
  { titulo: "Actualizar expedientes de personal", vence: "Hoy", prioridad: "Alta", lista: false },
  { titulo: "Enviar reporte de asistencia", vence: "Mañana", prioridad: "Media", lista: false },
  { titulo: "Confirmar sala para inducción", vence: "23 de mayo", prioridad: "Baja", lista: false },
  { titulo: "Revisar solicitudes pendientes", vence: "24 de mayo", prioridad: "Alta", lista: false },
  { titulo: "Cargar facturas de suministros", vence: "Ayer", prioridad: "Media", lista: true },
];

export const solicitudes = [
  {
    tipo: "Vacaciones",
    solicitante: "José Martínez",
    rango: "10 al 17 de junio",
    estado: "Pendiente",
  },
  {
    tipo: "Permiso",
    solicitante: "Carlos Pérez",
    rango: "3 de junio, medio día",
    estado: "Aprobada",
  },
  {
    tipo: "Licencia médica",
    solicitante: "Pedro Santana",
    rango: "28 al 30 de mayo",
    estado: "Pendiente",
  },
  {
    tipo: "Solicitud varia",
    solicitante: "Ana Rodríguez",
    rango: "Carta de trabajo",
    estado: "Rechazada",
  },
];

export const tiposSolicitud = [
  "Solicitudes Varias",
  "Solicitudes Permisos",
  "Aprobación Permisos",
  "Aprobación Vacaciones",
  "Solicitudes Licencias",
  "Aprobación Licencias",
];

export const asistencia = [
  { dia: "Lunes 20", entrada: "08:02 a.m.", salida: "05:04 p.m.", horas: "9h 02m", estado: "A tiempo" },
  { dia: "Martes 21", entrada: "08:12 a.m.", salida: "05:00 p.m.", horas: "8h 48m", estado: "Tardanza" },
  { dia: "Miércoles 22", entrada: "07:58 a.m.", salida: "05:10 p.m.", horas: "9h 12m", estado: "A tiempo" },
  { dia: "Jueves 23", entrada: "08:00 a.m.", salida: "05:02 p.m.", horas: "9h 02m", estado: "A tiempo" },
  { dia: "Viernes 24", entrada: "—", salida: "—", horas: "—", estado: "Permiso" },
];

export const nomina = {
  anual: { ingresos: 1248750, descuentos: 284560, neto: 964190 },
  meses: [
    { mes: "Enero", ingresos: 175748.06, descuentos: 40192.76, neto: 135556.3 },
    { mes: "Febrero", ingresos: 140000, descuentos: 29788.44, neto: 110211.56 },
    { mes: "Marzo", ingresos: 140000, descuentos: 30198.55, neto: 109801.45 },
    { mes: "Abril", ingresos: 120500, descuentos: 28450.3, neto: 92049.7 },
    { mes: "Mayo", ingresos: 135000, descuentos: 31250.8, neto: 103749.2 },
    { mes: "Junio", ingresos: 150000, descuentos: 32500.4, neto: 117499.6 },
    { mes: "Julio", ingresos: 125000, descuentos: 27300.5, neto: 97699.5 },
    { mes: "Agosto", ingresos: 130000, descuentos: 29650.2, neto: 100349.8 },
  ],
};

export const notificaciones = [
  { titulo: "Tienes 2 nuevos mensajes", detalle: "Ver detalles de mensajes", nuevo: true },
  { titulo: "Hoy tienes 2 compañeros de cumpleaños", detalle: "Ver listado de cumpleaños", nuevo: true },
  { titulo: "Tu solicitud de carta de trabajo fue procesada", detalle: "Ver solicitudes", nuevo: false },
  { titulo: "Recuerda registrar tu asistencia", detalle: "Ir a asistencia", nuevo: false },
];

export const chatRRHH = [
  { de: "rrhh", texto: "¡Saludos! Bienvenido al chat con Recursos Humanos. ¿En qué podemos ayudarte hoy?", hora: "09:30 a.m." },
  { de: "yo", texto: "Hola, buen día.", hora: "09:32 a.m." },
  { de: "yo", texto: "Quisiera saber cómo solicitar vacaciones.", hora: "09:33 a.m." },
  {
    de: "rrhh",
    texto:
      "Con gusto te ayudamos. Puedes realizar tu solicitud desde la opción “Solicitudes” en el menú principal, luego selecciona “Vacaciones” y completa el formulario.",
    hora: "09:35 a.m.",
  },
  { de: "yo", texto: "Perfecto, muchas gracias.", hora: "09:36 a.m." },
];

export const pesos = (valor: number) =>
  valor.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type Cuenta = {
  email: string;
  clave: string;
  nombre: string;
  rol: "Administrador" | "Recursos Humanos" | "Supervisor" | "Colaborador";
  cargo: string;
  iniciales: string;
};

export type UsuarioDemo = Cuenta;

/** Única cuenta precargada: el administrador crea las demás credenciales. */
export const cuentasIniciales: Cuenta[] = [
  {
    email: "admin@ivad.com.do",
    clave: "IvadAdmin2026*",
    nombre: "Manuel Gómez Marcano",
    rol: "Administrador",
    cargo: "Director de Tecnología",
    iniciales: "MG",
  },
];

export const roles: Cuenta["rol"][] = [
  "Administrador",
  "Recursos Humanos",
  "Supervisor",
  "Colaborador",
];

