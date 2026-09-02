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
    id: "vacaciones",
    nombre: "Vacaciones anuales",
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
    id: "matrimonio",
    nombre: "Licencia por matrimonio",
    categoria: "Licencia",
    resumen: "Licencia con disfrute de salario por la celebración de tu matrimonio.",
    duracion: "5 días",
    conSalario: true,
    baseLegal: "Código de Trabajo, art. 54, ordinal 1º.",
    requisitos: ["Indicar la fecha de la boda.", "Entregar el acta de matrimonio al regresar."],
    aviso: "Avisa en cuanto tengas la fecha.",
    soporte: "Acta o certificación de matrimonio.",
  },
  {
    id: "nacimiento",
    nombre: "Licencia por nacimiento de hijo (paternidad)",
    categoria: "Licencia",
    resumen: "Licencia con salario por el nacimiento de un hijo o hija.",
    duracion: "2 días",
    conSalario: true,
    baseLegal: "Código de Trabajo, art. 54, ordinal 2º.",
    requisitos: ["Notificar el nacimiento.", "Entregar el acta de nacimiento."],
    aviso: "Puede solicitarse el mismo día del nacimiento.",
    soporte: "Acta de nacimiento o constancia del centro de salud.",
  },
  {
    id: "duelo",
    nombre: "Licencia por fallecimiento de familiar",
    categoria: "Licencia",
    resumen:
      "Licencia con salario por el fallecimiento de abuelo, abuela, padre, madre, hijo, hija o cónyuge.",
    duracion: "3 días",
    conSalario: true,
    baseLegal: "Código de Trabajo, art. 54, ordinal 3º.",
    requisitos: ["Indicar el parentesco.", "Entregar el acta de defunción o constancia funeraria."],
    aviso: "Notifica de inmediato, aunque el documento llegue después.",
    soporte: "Acta de defunción o constancia funeraria.",
  },
  {
    id: "maternidad",
    nombre: "Licencia por maternidad",
    categoria: "Licencia",
    resumen:
      "Descanso obligatorio antes y después del parto, con subsidio a cargo de la seguridad social.",
    duracion: "12 semanas (6 antes y 6 después del parto)",
    conSalario: true,
    baseLegal: "Código de Trabajo, arts. 236 y ss.; Ley 87-01 (subsidio por maternidad).",
    requisitos: [
      "Presentar el certificado médico con la fecha probable de parto.",
      "Coordinar el subsidio con Recursos Humanos y Contabilidad.",
    ],
    aviso: "Solicítalo desde el sexto mes de embarazo.",
    soporte: "Certificado médico.",
  },
  {
    id: "lactancia",
    nombre: "Descansos por lactancia",
    categoria: "Horario",
    resumen: "Descansos remunerados durante la jornada para lactar, tras el período de maternidad.",
    duracion: "3 descansos de 20 minutos al día, hasta el primer año del bebé",
    conSalario: true,
    baseLegal: "Código de Trabajo, art. 240.",
    requisitos: ["Acordar los horarios con tu supervisor.", "Acta de nacimiento del bebé."],
    aviso: "Solicítalo al reintegrarte.",
    soporte: "Acta de nacimiento.",
  },
  {
    id: "medica",
    nombre: "Licencia médica / enfermedad",
    categoria: "Licencia",
    resumen:
      "Ausencia justificada por enfermedad o accidente, respaldada por certificado médico. El subsidio por enfermedad lo cubre la seguridad social.",
    duracion: "Según indique el certificado médico",
    conSalario: "depende",
    baseLegal: "Código de Trabajo, art. 58 y ss.; Ley 87-01 (subsidio por enfermedad).",
    requisitos: [
      "Avisar a la empresa el mismo día de la ausencia.",
      "Entregar el certificado médico dentro de las 48 horas.",
    ],
    aviso: "Avisa el mismo día; regulariza al volver.",
    soporte: "Certificado médico con sello y firma.",
  },
  {
    id: "cita-medica",
    nombre: "Permiso para cita médica",
    categoria: "Permiso",
    resumen: "Salida parcial de la jornada para asistir a una consulta o estudio médico.",
    duracion: "Horas necesarias del día",
    conSalario: true,
    baseLegal: "Política interna IVAD (facilidad al trabajador).",
    requisitos: ["Indicar la hora de la cita.", "Entregar la constancia de asistencia."],
    aviso: "Solicítalo con 24 horas de antelación cuando sea posible.",
    soporte: "Constancia o récipe médico.",
  },
  {
    id: "estudios",
    nombre: "Permiso por estudios o exámenes",
    categoria: "Permiso",
    resumen: "Permiso para presentar exámenes, defensa de tesis o actividades académicas.",
    duracion: "Horas o día del examen",
    conSalario: "depende",
    baseLegal: "Política interna IVAD.",
    requisitos: ["Carta o calendario de la institución educativa."],
    aviso: "Solicítalo con 5 días de antelación.",
    soporte: "Constancia de la institución.",
  },
  {
    id: "personal",
    nombre: "Permiso personal sin disfrute de salario",
    categoria: "Permiso",
    resumen:
      "Ausencia autorizada por asuntos personales que no está cubierta por una licencia legal.",
    duracion: "Según acuerdo (se descuenta del salario)",
    conSalario: false,
    baseLegal: "Acuerdo entre las partes (Código de Trabajo, art. 54, párrafo).",
    requisitos: ["Explicar el motivo.", "Contar con la aprobación del supervisor y RR.HH."],
    aviso: "Solicítalo con 3 días de antelación.",
    soporte: "Opcional.",
  },
  {
    id: "electoral",
    nombre: "Permiso para votar o deberes legales",
    categoria: "Permiso",
    resumen:
      "Tiempo para ejercer el voto, comparecer ante autoridad o cumplir un deber legal o cívico.",
    duracion: "Tiempo necesario del día",
    conSalario: true,
    baseLegal: "Código de Trabajo, art. 54 y leyes electorales vigentes.",
    requisitos: ["Indicar el recinto o la citación recibida."],
    aviso: "Solicítalo con 2 días de antelación.",
    soporte: "Citación oficial, si aplica.",
  },
  {
    id: "horario",
    nombre: "Cambio de horario o turno",
    categoria: "Horario",
    resumen: "Ajuste temporal o permanente de la jornada laboral acordada.",
    duracion: "Según acuerdo",
    conSalario: true,
    baseLegal: "Código de Trabajo, arts. 147 y ss. (jornada de trabajo).",
    requisitos: ["Explicar el motivo y el horario propuesto.", "Aprobación del supervisor."],
    aviso: "Solicítalo con 7 días de antelación.",
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
