import type { Colaborador } from "@/lib/portal-store";

export type TipoVerificacion = "admin" | "empleado";

/** Sello festoneado tipo insignia (dorado = administración, azul = colaborador verificado). */
export function SelloVerificado({
  tipo,
  className = "h-5 w-5",
  titulo,
}: {
  tipo: TipoVerificacion;
  className?: string;
  titulo?: string;
}) {
  const admin = tipo === "admin";
  const etiqueta =
    titulo ?? (admin ? "Cuenta de administración verificada" : "Colaborador verificado");
  const id = admin ? "sello-dorado" : "sello-azul";

  // 16 puntas onduladas alrededor del círculo.
  const puntas = 16;
  const centro = 32;
  const rExt = 30;
  const rInt = 25.5;
  let d = "";
  for (let i = 0; i < puntas * 2; i++) {
    const ang = (Math.PI / puntas) * i - Math.PI / 2;
    const r = i % 2 === 0 ? rExt : rInt;
    const x = centro + r * Math.cos(ang);
    const y = centro + r * Math.sin(ang);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  d += "Z";

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={etiqueta}
      className={`shrink-0 ${className}`}
    >
      <title>{etiqueta}</title>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {admin ? (
            <>
              <stop offset="0%" stopColor="#f6d365" />
              <stop offset="55%" stopColor="#d9a521" />
              <stop offset="100%" stopColor="#a9741b" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#57b9ff" />
              <stop offset="55%" stopColor="#1d8ce8" />
              <stop offset="100%" stopColor="#0f5ea8" />
            </>
          )}
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path
        d="M19 33.5 L27.5 42 L45 24.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Reglas de verificación: administración = dorado; colaborador activo y completo = azul. */
export function tipoVerificacion(
  c: Partial<Colaborador> & { estado?: string },
): TipoVerificacion | null {
  const rol = c.rol;
  if (rol === "Administrador" || rol === "Recursos Humanos" || rol === "Contabilidad") {
    return "admin";
  }
  const completo =
    (c.estado ?? "").toLowerCase() === "activo" &&
    !!c.nombre &&
    !!c.cargo &&
    !!c.area &&
    c.estadoFoto === "aprobada";
  return completo ? "empleado" : null;
}

/** Sello opcional según las reglas; no renderiza nada si el perfil no califica. */
export function VerificacionPerfil({
  colaborador,
  className,
}: {
  colaborador: Partial<Colaborador> & { estado?: string };
  className?: string;
}) {
  const tipo = tipoVerificacion(colaborador);
  if (!tipo) return null;
  return <SelloVerificado tipo={tipo} className={className} />;
}
