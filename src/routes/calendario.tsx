import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CalendarDays,
  Calendar as CalendarIcon,
  AlertCircle,
  Bell,
  Cake,
  CheckCircle2,
} from "lucide-react";
import { AppShell, AppHeader, SectionTitle } from "@/components/app-shell";
import { usePortal, type FechaImportante } from "@/lib/portal-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario y Fechas Importantes — Portal IVAD" },
      {
        name: "description",
        content:
          "Calendario corporativo oficial de IVAD Home & Goods: feriados nacionales, eventos de empresa, reuniones y fechas clave.",
      },
      { property: "og:title", content: "Calendario — Portal IVAD" },
      {
        property: "og:description",
        content: "Agenda interna de IVAD: eventos, feriados y capacitaciones del personal.",
      },
    ],
  }),
  component: Calendario,
});

const DIAS_SEMANA = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const CATEGORIAS_CONFIG: Record<
  FechaImportante["tipo"],
  { label: string; badgeClass: string; dotClass: string; boxClass: string }
> = {
  feriado: {
    label: "Feriado Oficial",
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50",
    dotClass: "bg-red-500",
    boxClass: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50",
  },
  empresa: {
    label: "Evento IVAD",
    badgeClass: "bg-primary/15 text-primary border-primary/30",
    dotClass: "bg-primary",
    boxClass: "bg-primary/10 text-primary border-primary/20",
  },
  reunion: {
    label: "Reunión",
    badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
    dotClass: "bg-purple-500",
    boxClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50",
  },
  capacitacion: {
    label: "Capacitación",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    dotClass: "bg-amber-500",
    boxClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  },
  pago: {
    label: "Nómina / Pago",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    dotClass: "bg-emerald-500",
    boxClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
  },
  otro: {
    label: "Importante",
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-slate-400",
    boxClass: "bg-secondary text-foreground border-border",
  },
};

function formatearFechaEspanol(fechaStr: string): string {
  try {
    const [a, m, d] = fechaStr.split("-").map(Number);
    if (!a || !m || !d) return fechaStr;
    const fechaObj = new Date(a, m - 1, d);
    return fechaObj.toLocaleDateString("es-DO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return fechaStr;
  }
}

function Calendario() {
  const {
    sesion,
    esAdmin,
    fechasImportantes,
    agregarFechaImportante,
    eliminarFechaImportante,
    colaboradores,
  } = usePortal();

  // Solo Administradores tienen permisos de agregar o eliminar fechas importantes
  const esAdministrador = sesion.rol === "Administrador";

  // Fecha visual de navegación (año y mes)
  const hoy = useMemo(() => new Date(), []);
  const [añoVisual, setAñoVisual] = useState(() => hoy.getFullYear());
  const [mesVisual, setMesVisual] = useState(() => hoy.getMonth()); // 0 a 11
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(() => hoy.getDate());

  // Diálogo para agregar fecha importante (solo administradores)
  const [modalAgregar, setModalAgregar] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<FechaImportante["tipo"]>("empresa");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Diálogo para confirmar eliminación (solo administradores)
  const [fechaAEliminar, setFechaAEliminar] = useState<FechaImportante | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Navegación de meses
  const irMesAnterior = () => {
    if (mesVisual === 0) {
      setMesVisual(11);
      setAñoVisual((a) => a - 1);
    } else {
      setMesVisual((m) => m - 1);
    }
    setDiaSeleccionado(null);
  };

  const irMesSiguiente = () => {
    if (mesVisual === 11) {
      setMesVisual(0);
      setAñoVisual((a) => a + 1);
    } else {
      setMesVisual((m) => m + 1);
    }
    setDiaSeleccionado(null);
  };

  const irAHoy = () => {
    setAñoVisual(hoy.getFullYear());
    setMesVisual(hoy.getMonth());
    setDiaSeleccionado(hoy.getDate());
  };

  // Cálculo de días del mes actual
  const { celdas, totalDiasMes } = useMemo(() => {
    const totalDias = new Date(añoVisual, mesVisual + 1, 0).getDate();
    // Primer día del mes (0: Domingo, 1: Lunes, etc.)
    const primerDiaSemana = new Date(añoVisual, mesVisual, 1).getDay();
    // Ajustar a Lunes = 0, ..., Domingo = 6
    const offsetInicio = (primerDiaSemana + 6) % 7;

    const lista: (number | null)[] = [];
    for (let i = 0; i < offsetInicio; i++) {
      lista.push(null);
    }
    for (let d = 1; d <= totalDias; d++) {
      lista.push(d);
    }

    return { celdas: lista, totalDiasMes: totalDias };
  }, [añoVisual, mesVisual]);

  // Prefijo del mes para filtrar (ej. "2026-09")
  const prefijoMes = `${añoVisual}-${String(mesVisual + 1).padStart(2, "0")}`;

  // Fechas importantes registradas para el mes seleccionado
  const fechasDelMes = useMemo(() => {
    return fechasImportantes
      .filter((f) => f.fecha.startsWith(prefijoMes))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [fechasImportantes, prefijoMes]);

  // Mapa de días que tienen al menos un evento en este mes
  const mapaEventosPorDia = useMemo(() => {
    const mapa = new Map<number, FechaImportante[]>();
    for (const f of fechasDelMes) {
      const diaNum = Number(f.fecha.split("-")[2]);
      if (!mapa.has(diaNum)) mapa.set(diaNum, []);
      mapa.get(diaNum)?.push(f);
    }
    return mapa;
  }, [fechasDelMes]);

  // Cumpleaños de colaboradores en este mes
  const cumpleanosDelMes = useMemo(() => {
    const mesStr = String(mesVisual + 1).padStart(2, "0");
    return colaboradores
      .filter((c) => {
        if (!c.cumple) return false;
        // cumple puede ser "AAAA-MM-DD" o "MM-DD"
        const partes = c.cumple.split("-");
        const m = partes.length === 3 ? partes[1] : partes[0];
        return m === mesStr;
      })
      .map((c) => {
        const partes = c.cumple.split("-");
        const dia = Number(partes.length === 3 ? partes[2] : partes[1]);
        return {
          id: `cumple-${c.id}`,
          nombre: c.nombre,
          area: c.area,
          cargo: c.cargo,
          dia,
        };
      })
      .sort((a, b) => a.dia - b.dia);
  }, [colaboradores, mesVisual]);

  // Eventos a mostrar según el día seleccionado (o todo el mes si no hay día seleccionado)
  const eventosAMostrar = useMemo(() => {
    if (diaSeleccionado !== null) {
      const diaStr = String(diaSeleccionado).padStart(2, "0");
      const fechaBuscada = `${prefijoMes}-${diaStr}`;
      return fechasImportantes.filter((f) => f.fecha === fechaBuscada);
    }
    return fechasDelMes;
  }, [fechasImportantes, prefijoMes, diaSeleccionado, fechasDelMes]);

  const cumpleanosAMostrar = useMemo(() => {
    if (diaSeleccionado !== null) {
      return cumpleanosDelMes.filter((c) => c.dia === diaSeleccionado);
    }
    return cumpleanosDelMes;
  }, [cumpleanosDelMes, diaSeleccionado]);

  // Abrir modal para agregar fecha importante
  const abrirModalNuevaFecha = (diaDefault?: number) => {
    const d = diaDefault ?? diaSeleccionado ?? hoy.getDate();
    const diaValido = Math.min(Math.max(d, 1), totalDiasMes);
    const fechaInicial = `${añoVisual}-${String(mesVisual + 1).padStart(2, "0")}-${String(diaValido).padStart(2, "0")}`;
    setNuevaFecha(fechaInicial);
    setNuevoTitulo("");
    setNuevoTipo("empresa");
    setNuevaDescripcion("");
    setModalAgregar(true);
  };

  // Guardar fecha importante (solo administradores)
  const handleGuardarFecha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) {
      toast.error("Por favor ingresa un título para la fecha o evento");
      return;
    }
    if (!nuevaFecha) {
      toast.error("Por favor selecciona una fecha válida");
      return;
    }

    setGuardando(true);
    const res = await agregarFechaImportante({
      titulo: nuevoTitulo.trim(),
      fecha: nuevaFecha,
      tipo: nuevoTipo,
      descripcion: nuevaDescripcion.trim() || undefined,
    });
    setGuardando(false);

    if (res.ok) {
      toast.success("Fecha importante registrada correctamente en el calendario");
      setModalAgregar(false);
      setNuevoTitulo("");
      setNuevaDescripcion("");
      // Enfocar el día agregado
      const partes = nuevaFecha.split("-");
      if (Number(partes[0]) === añoVisual && Number(partes[1]) === mesVisual + 1) {
        setDiaSeleccionado(Number(partes[2]));
      }
    } else {
      toast.error(res.error ?? "No se pudo guardar la fecha");
    }
  };

  // Eliminar fecha importante (solo administradores)
  const handleConfirmarEliminar = async () => {
    if (!fechaAEliminar) return;
    setEliminando(true);
    const res = await eliminarFechaImportante(fechaAEliminar.id);
    setEliminando(false);

    if (res.ok) {
      toast.success(`La fecha "${fechaAEliminar.titulo}" fue eliminada del calendario`);
      setFechaAEliminar(null);
    } else {
      toast.error(res.error ?? "No se pudo eliminar la fecha");
    }
  };

  return (
    <AppShell>
      <AppHeader titulo="Calendario" />

      <div className="space-y-6 px-4 py-5 max-w-4xl mx-auto">
        {/* Cabecera superior con estado y botón de acción para Administradores */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 surface-card p-4 rounded-xl border border-border/70">
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">
              Calendario Institucional IVAD
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {esAdministrador
                ? "Como Administrador puedes programar o eliminar fechas clave visibles para todo el personal."
                : "Consulta feriados oficiales, eventos de la empresa, pagos de nómina y capacitaciones."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={irAHoy}
              className="text-xs h-8 font-medium"
            >
              Hoy
            </Button>

            {esAdministrador ? (
              <Button
                size="sm"
                onClick={() => abrirModalNuevaFecha()}
                className="h-8 gap-1.5 font-medium shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar fecha</span>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Tarjeta interactiva del Calendario */}
        <section className="surface-card p-5 rounded-2xl border border-border/80 shadow-sm">
          {/* Barra de navegación de mes y año */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <button
              type="button"
              onClick={irMesAnterior}
              aria-label="Mes anterior"
              className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="text-center">
              <h2 className="font-display text-lg font-bold text-foreground capitalize">
                {MESES[mesVisual]} {añoVisual}
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {fechasDelMes.length} {fechasDelMes.length === 1 ? "fecha importante" : "fechas importantes"}
                {cumpleanosDelMes.length > 0 ? ` · ${cumpleanosDelMes.length} cumpleañero(s)` : ""}
              </span>
            </div>

            <button
              type="button"
              onClick={irMesSiguiente}
              aria-label="Mes siguiente"
              className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Cuadrícula de días */}
          <div className="mt-4 grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <span
                key={d}
                className="py-1 text-[11px] font-semibold text-muted-foreground tracking-wider uppercase"
              >
                {d}
              </span>
            ))}

            {celdas.map((d, i) => {
              if (d === null) {
                return (
                  <div key={`vacio-${i}`} className="flex justify-center items-center py-2">
                    <span className="text-xs text-muted-foreground/30 select-none">·</span>
                  </div>
                );
              }

              const esHoy =
                d === hoy.getDate() &&
                mesVisual === hoy.getMonth() &&
                añoVisual === hoy.getFullYear();

              const esSeleccionado = diaSeleccionado === d;
              const eventosDelDia = mapaEventosPorDia.get(d) ?? [];
              const tieneEventos = eventosDelDia.length > 0;
              const tieneCumple = cumpleanosDelMes.some((c) => c.dia === d);

              return (
                <div key={`dia-${d}`} className="flex justify-center items-center py-1">
                  <button
                    type="button"
                    onClick={() => setDiaSeleccionado(d === diaSeleccionado ? null : d)}
                    className={`relative flex h-10 w-10 flex-col items-center justify-center rounded-xl text-sm transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                      esSeleccionado
                        ? "bg-primary font-bold text-primary-foreground shadow-md scale-105"
                        : esHoy
                        ? "border-2 border-primary font-bold text-foreground bg-primary/5"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    <span>{d}</span>

                    {/* Indicadores de eventos y cumpleaños */}
                    <div className="absolute bottom-1 flex items-center gap-0.5">
                      {tieneEventos ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            esSeleccionado
                              ? "bg-primary-foreground"
                              : CATEGORIAS_CONFIG[eventosDelDia[0].tipo]?.dotClass || "bg-accent"
                          }`}
                        />
                      ) : null}

                      {tieneCumple ? (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            esSeleccionado ? "bg-primary-foreground/80" : "bg-pink-500"
                          }`}
                          title="Cumpleaños en esta fecha"
                        />
                      ) : null}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Leyenda rápida */}
          <div className="mt-5 pt-3 border-t border-border/50 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Feriado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Evento IVAD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Nómina</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Reunión</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Capacitación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pink-500" />
              <span>Cumpleaños</span>
            </div>
          </div>
        </section>

        {/* Sección de eventos del día o del mes */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle>
              {diaSeleccionado !== null
                ? `Eventos del ${diaSeleccionado} de ${MESES[mesVisual]}`
                : `Todos los eventos de ${MESES[mesVisual]} ${añoVisual}`}
            </SectionTitle>

            {diaSeleccionado !== null ? (
              <button
                type="button"
                onClick={() => setDiaSeleccionado(null)}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Ver todo el mes ({fechasDelMes.length})
              </button>
            ) : null}
          </div>

          {/* Lista de fechas importantes */}
          {eventosAMostrar.length === 0 && cumpleanosAMostrar.length === 0 ? (
            <div className="surface-card p-8 rounded-xl text-center border border-dashed border-border/80">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
                <CalendarIcon className="h-6 w-6" />
              </div>
              <p className="font-medium text-foreground text-sm">
                {diaSeleccionado !== null
                  ? `No hay eventos programados para el ${diaSeleccionado} de ${MESES[mesVisual]}`
                  : `No hay fechas importantes registradas en ${MESES[mesVisual]} ${añoVisual}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {esAdministrador
                  ? "Puedes programar una nueva fecha o conmemoración oficial usando el botón de abajo."
                  : "Las fechas registradas por la administración aparecerán automáticamente aquí."}
              </p>

              {esAdministrador ? (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirModalNuevaFecha(diaSeleccionado ?? undefined)}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {diaSeleccionado !== null
                        ? `Programar fecha para el día ${diaSeleccionado}`
                        : "Agregar fecha importante"}
                    </span>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Tarjetas de fechas importantes */}
              {eventosAMostrar.map((e) => {
                const config = CATEGORIAS_CONFIG[e.tipo] || CATEGORIAS_CONFIG.otro;
                const diaNum = e.fecha.split("-")[2] || "";
                const mesAbrev = MESES[Number(e.fecha.split("-")[1]) - 1]?.slice(0, 3) || "";

                return (
                  <article
                    key={e.id}
                    className="surface-card flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/70 hover:border-border transition-all shadow-xs"
                  >
                    {/* Caja de día */}
                    <div
                      className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${config.boxClass}`}
                    >
                      <span className="font-display text-lg font-bold leading-tight">
                        {diaNum}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        {mesAbrev}
                      </span>
                    </div>

                    {/* Información del evento */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-foreground leading-snug">
                          {e.titulo}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${config.badgeClass}`}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        <span>{formatearFechaEspanol(e.fecha)}</span>
                        {e.creadoPor ? (
                          <span className="text-muted-foreground/70">
                            {" "}· Registrado por {e.creadoPor}
                          </span>
                        ) : null}
                      </p>

                      {e.descripcion ? (
                        <p className="text-sm text-foreground/90 pt-0.5 leading-relaxed">
                          {e.descripcion}
                        </p>
                      ) : null}
                    </div>

                    {/* Botón de eliminar (SOLO visible para Administradores) */}
                    {esAdministrador ? (
                      <div className="shrink-0 flex items-center justify-end sm:justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFechaAEliminar(e)}
                          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 cursor-pointer"
                          title="Eliminar esta fecha importante si hubo un error"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden">Eliminar</span>
                        </Button>
                      </div>
                    ) : null}
                  </article>
                );
              })}

              {/* Cumpleaños del personal en este mes / día */}
              {cumpleanosAMostrar.map((c) => (
                <article
                  key={c.id}
                  className="surface-card flex items-center gap-4 p-4 rounded-xl border border-pink-200/60 dark:border-pink-900/40 bg-pink-500/5 shadow-xs"
                >
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-pink-500/15 text-pink-700 dark:text-pink-300">
                    <Cake className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-foreground text-sm">
                        Cumpleaños de {c.nombre}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200"
                      >
                        Cumpleaños
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.cargo} · {c.area} (Día {c.dia} de {MESES[mesVisual]})
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Sección informativa de avisos */}
        <section className="rounded-xl bg-brand-soft p-4.5 border border-primary/15">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                Mantente al día con la agenda corporativa
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Todas las fechas importantes programadas por la administración son oficiales para
                el personal de IVAD SRL. Recibirás avisos oportunos a través de tu canal preferido
                (WhatsApp o Correo electrónico).
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL / DIALOG: AGREGAR FECHA IMPORTANTE (SOLO ADMINISTRADORES) */}
      <Dialog open={modalAgregar} onOpenChange={setModalAgregar}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-display">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Nueva Fecha Importante</span>
            </DialogTitle>
            <DialogDescription>
              Solo los administradores pueden programar fechas oficiales en el calendario de IVAD.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGuardarFecha} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="titulo-evento" className="text-xs font-semibold">
                Título del evento o fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo-evento"
                placeholder="Ej. Reunión General Trimestral, Día Feriado, Cierre..."
                value={nuevoTitulo}
                onChange={(e) => setNuevoTitulo(e.target.value)}
                required
                disabled={guardando}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fecha-evento" className="text-xs font-semibold">
                  Fecha <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fecha-evento"
                  type="date"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                  required
                  disabled={guardando}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tipo-evento" className="text-xs font-semibold">
                  Tipo de fecha / Categoría
                </Label>
                <select
                  id="tipo-evento"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value as FechaImportante["tipo"])}
                  disabled={guardando}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="empresa">Evento de la Empresa</option>
                  <option value="feriado">Feriado Oficial</option>
                  <option value="reunion">Reunión General</option>
                  <option value="capacitacion">Capacitación / Taller</option>
                  <option value="pago">Nómina / Pago</option>
                  <option value="otro">Otro / Importante</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc-evento" className="text-xs font-semibold">
                Descripción o detalles <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="desc-evento"
                rows={3}
                placeholder="Indica información relevante: hora, salón, enlace de reunión o notas importantes para el personal..."
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                disabled={guardando}
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAgregar(false)}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>{guardando ? "Guardando..." : "Guardar en calendario"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL / DIALOG: CONFIRMAR ELIMINACIÓN (SOLO ADMINISTRADORES) */}
      <Dialog
        open={Boolean(fechaAEliminar)}
        onOpenChange={(abierto) => !abierto && setFechaAEliminar(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-display">
              <AlertCircle className="h-5 w-5" />
              <span>¿Eliminar fecha importante?</span>
            </DialogTitle>
            <DialogDescription>
              Esta acción removerá la fecha del calendario oficial de todos los empleados de IVAD.
            </DialogDescription>
          </DialogHeader>

          {fechaAEliminar ? (
            <div className="surface-card p-3.5 rounded-lg border border-border my-2 space-y-1 text-sm">
              <p className="font-bold text-foreground">{fechaAEliminar.titulo}</p>
              <p className="text-xs text-muted-foreground">
                Fecha: {formatearFechaEspanol(fechaAEliminar.fecha)}
              </p>
              {fechaAEliminar.descripcion ? (
                <p className="text-xs text-foreground/80 pt-1">
                  {fechaAEliminar.descripcion}
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFechaAEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmarEliminar}
              disabled={eliminando}
              className="gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              <span>{eliminando ? "Eliminando..." : "Sí, eliminar fecha"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
