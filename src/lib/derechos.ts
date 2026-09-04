/**
 * Catálogo de permisos, licencias y vacaciones según el Código de Trabajo de la
 * República Dominicana (Ley 16-92) y normas complementarias.
 *
 * Sirve de guía informativa para el colaborador: conocer el derecho NO sustituye
 * la solicitud formal ni la aprobación de Recursos Humanos.
 */

export type TipoSolicitud = {
  id: string;
  nombre: string;
  categoria: "Vacaciones" | "Licencia" | "Permiso" | "Horario";
  resumen: string;
  duracion: string;
  conSalario: boolean | "depende";
  baseLegal: string;
  requisitos: string[];
  aviso: string;
  soporte: string;
};

export const tiposSolicitud: TipoSolicitud[] = [
  {
    id: "permiso-salida",
    nombre: "Permiso de salida",
    categoria: "Permiso",
    resumen:
      "Autorización para ausentarte de la jornada o salir antes por un asunto personal, médico o legal.",
    duracion: "Horas o el día indicado",
    conSalario: "depende",
    baseLegal: "Código de Trabajo (Ley 16-92), art. 54 y política interna IVAD.",
    requisitos: [
      "Indicar la fecha y la hora de salida y de regreso, si aplica.",
      "Explicar brevemente el motivo.",
      "Contar con la aprobación de tu supervisor y de Recursos Humanos.",
    ],
    aviso: "Solicítalo con al menos 24 horas de antelación cuando sea posible.",
    soporte: "Constancia médica o documento del motivo, si lo tienes.",
  },
  {
    id: "vacaciones",
    nombre: "Vacaciones",
    categoria: "Vacaciones",
    resumen:
      "Descanso anual remunerado tras cumplir un año de trabajo continuo en la empresa.",
    duracion: "14 días laborables (1 a 5 años) · 18 días laborables (más de 5 años)",
    conSalario: true,
    baseLegal: "Código de Trabajo (Ley 16-92), arts. 177 y 180 y ss.",
    requisitos: [
      "Haber cumplido al menos un año de trabajo continuo.",
      "Acordar las fechas con tu supervisor para no afectar la operación.",
      "El salario de vacaciones se paga antes de iniciar el disfrute.",
    ],
    aviso: "Solicítalo con al menos 15 días de antelación.",
    soporte: "No requiere documento.",
  },
  {
    id: "certificado-trabajo",
    nombre: "Certificado de trabajo",
    categoria: "Permiso",
    resumen:
      "Carta o certificación laboral emitida por Recursos Humanos con tu cargo, fecha de ingreso y, si lo pides, tu salario.",
    duracion: "Entrega en 1 a 3 días laborables",
    conSalario: true,
    baseLegal: "Código de Trabajo (Ley 16-92), art. 63.",
    requisitos: [
      "Indicar para qué institución o gestión lo necesitas.",
      "Señalar si debe incluir el salario.",
    ],
    aviso: "Solicítalo con 3 días laborables de antelación.",
    soporte: "No requiere documento.",
  },
];

export const tipoPorId = (id: string) => tiposSolicitud.find((t) => t.id === id);

export const nombresTipos = tiposSolicitud.map((t) => t.nombre);

/** Derechos generales que no se solicitan pero conviene conocer. */
export const derechosGenerales = [
  {
    titulo: "Jornada de trabajo",
    detalle:
      "La jornada ordinaria no excede 8 horas diarias ni 44 semanales. Las horas extras se pagan con recargo.",
    base: "Código de Trabajo, arts. 147, 203 y 204.",
  },
  {
    titulo: "Descanso semanal",
    detalle: "Tienes derecho a un descanso ininterrumpido de 36 horas cada semana.",
    base: "Código de Trabajo, art. 163.",
  },
  {
    titulo: "Días feriados",
    detalle:
      "Los días declarados no laborables se pagan; si se trabaja, se compensa según la ley.",
    base: "Código de Trabajo, arts. 165 y 166.",
  },
  {
    titulo: "Salario de Navidad",
    detalle:
      "Se paga a más tardar el 20 de diciembre, equivalente a la doceava parte del salario ordinario del año.",
    base: "Código de Trabajo, arts. 219 y ss.",
  },
  {
    titulo: "Participación en los beneficios",
    detalle: "Bonificación anual sobre las utilidades de la empresa, según la antigüedad.",
    base: "Código de Trabajo, arts. 223 y ss.",
  },
  {
    titulo: "Seguridad social",
    detalle:
      "Estás afiliado al Seguro Familiar de Salud, pensiones y riesgos laborales del Sistema Dominicano de Seguridad Social.",
    base: "Ley 87-01.",
  },
];
