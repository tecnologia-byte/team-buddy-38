import { useState, useRef } from "react";
import {
  Send,
  Sparkles,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Copy,
  Check,
  Lock,
  ShieldCheck,
  Calculator,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mimiFn } from "@/lib/mimi.functions";

type Fuente = { titulo: string; url: string; resumen: string };

type AdjuntoLocal = {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  datosBase64?: string;
  texto?: string;
  vistaPrevia?: string;
};

type Mensaje = {
  rol: "user" | "assistant";
  texto: string;
  adjuntos?: Array<{
    nombre: string;
    tipo: string;
    tamano?: number;
    vistaPrevia?: string;
  }>;
  fuentes?: Fuente[];
};

const SUGERENCIAS = [
  "Auditar el volante o nómina adjunta y verificar retenciones",
  "¿Cuáles son los porcentajes y topes vigentes de TSS (AFP y SFS)?",
  "¿Cómo se calcula la retención de ISR de un salario de RD$ 65,000?",
  "Calcular horas extras diurnas (35%) y nocturnas (100%) de este período",
  "Calcular liquidación laboral: Preaviso y Cesantía (Código de Trabajo RD)",
];

const BIENVENIDA: Mensaje = {
  rol: "assistant",
  texto:
    "¡Hola! Soy Mimi, tu Asistente Privada de Contabilidad y Nómina para IVAD SRL.\n\nPuedo auditar volantes, calcular deducciones de ley (TSS, ISR según DGII), revisar horas extras y prestaciones laborales bajo el Código de Trabajo Dominicano.\n\n🔒 **Privacidad Total Garantizada**: Puedes subir fotos de comprobantes, volantes, firmas, hojas de cálculo o PDFs. Toda tu información se procesa de forma aislada y estrictamente confidencial para Contabilidad (nunca se comparte de forma global ni con otros colaboradores).\n\n¿Con qué colaborador o documento empezamos?",
};

/** Procesa archivos en el navegador para enviarlos de forma óptima a la IA */
async function procesarArchivo(file: File): Promise<AdjuntoLocal> {
  const id = Math.random().toString(36).substring(2, 9);
  const nombre = file.name;
  const tipo = file.type || "application/octet-stream";
  const tamano = file.size;

  // Si es imagen: la optimizamos y redimensionamos a un máximo seguro
  if (tipo.startsWith("image/")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, w, h);
          const resized = canvas.toDataURL("image/jpeg", 0.88);
          resolve({
            id,
            nombre,
            tipo: "image/jpeg",
            tamano: Math.round((resized.length * 3) / 4),
            datosBase64: resized,
            vistaPrevia: resized,
          });
        };
        img.onerror = () => {
          resolve({ id, nombre, tipo, tamano, datosBase64: dataUrl, vistaPrevia: dataUrl });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  // Si es archivo de texto, CSV, TSV o JSON
  if (
    tipo.startsWith("text/") ||
    nombre.endsWith(".csv") ||
    nombre.endsWith(".txt") ||
    nombre.endsWith(".tsv") ||
    nombre.endsWith(".json")
  ) {
    const texto = await file.text();
    return {
      id,
      nombre,
      tipo,
      tamano,
      texto: texto.slice(0, 50000),
    };
  }

  // Si es PDF u otro documento
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      resolve({
        id,
        nombre,
        tipo,
        tamano,
        datosBase64: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  });
}

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extraerVolanteJson(texto: string): { textoLimpio: string; datosVolante: any | null } {
  // 1. Intentar bloque de código JSON
  const match =
    /```(?:json:volante|json)?\s*(\{[\s\S]*?\})\s*```/.exec(texto) ||
    /(\{[\s\S]*?"ingresos"[\s\S]*?"deducciones"[\s\S]*?\})/.exec(texto);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && (parsed.ingresos || parsed.deducciones || parsed.nombre)) {
        const normalizar = (arr: any[]) =>
          (Array.isArray(arr) ? arr : []).map((x) => ({
            concepto: String(x.concepto || ""),
            monto: String(x.monto ?? ""),
          }));

        const datosNormalizados = {
          ...parsed,
          nombre: String(parsed.nombre || "").trim(),
          cargo: String(parsed.cargo || "").trim(),
          departamento: String(parsed.departamento || "").trim(),
          comprobante: parsed.comprobante ? String(parsed.comprobante) : undefined,
          periodoDesde: parsed.periodoDesde ? String(parsed.periodoDesde) : undefined,
          periodoHasta: parsed.periodoHasta ? String(parsed.periodoHasta) : undefined,
          ingresos: normalizar(parsed.ingresos),
          deducciones: normalizar(parsed.deducciones),
        };

        const textoLimpio = texto.replace(match[0], "").trim();
        return { textoLimpio, datosVolante: datosNormalizados };
      }
    } catch {
      /* continuar al detector de texto */
    }
  }

  // 2. Fallback inteligente: Si el texto contiene cálculos de nómina dominicana
  const tieneCalculo =
    /(?:AFP|SFS|TSS|ISR|Salario Base|Neto a (?:pagar|cobrar))/i.test(texto) &&
    /(?:RD\$|RD\s*\$|\b\d{4,}\b)/i.test(texto);

  if (tieneCalculo) {
    const extraerMonto = (regex: RegExp) => {
      const m = regex.exec(texto);
      if (!m) return "";
      return m[1].replace(/,/g, "").trim();
    };

    const extraerTexto = (regex: RegExp) => {
      const m = regex.exec(texto);
      return m ? m[1].trim() : "";
    };

    const nombre = extraerTexto(
      /(?:Colaborador(?:a)?|Empleado(?:a)?|Volante de(?:l colaborador)?)\s*:?\s*[*_]*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)[*_]*(?:\n|$|·|-|,|\()/i,
    );
    const salario = extraerMonto(
      /(?:Salario|Sueldo)(?:\s+Base)?(?:\s+del\s+per[íi]odo|\s+bruto)?\s*:?\s*[*_]*(?:RD\$\s*)?([\d,.]+)/i,
    );
    const afp = extraerMonto(
      /(?:AFP|Pensiones)(?:\s*\(2\.87%\))?\s*:?\s*[*_]*(?:RD\$\s*)?([\d,.]+)/i,
    );
    const sfs = extraerMonto(
      /(?:SFS|Salud)(?:\s*\(3\.04%\))?\s*:?\s*[*_]*(?:RD\$\s*)?([\d,.]+)/i,
    );
    const isr =
      extraerMonto(/(?:Retenci[óo]n\s+)?ISR(?:\s*-\s*DGII)?\s*:?\s*[*_]*(?:RD\$\s*)?([\d,.]+)/i) ||
      "0";

    if (salario) {
      const numSalario = Number(salario);
      const afpCalculado = afp || (numSalario * 0.0287).toFixed(2);
      const sfsCalculado = sfs || (numSalario * 0.0304).toFixed(2);

      const datosAuto = {
        nombre: nombre || "",
        ingresos: [
          { concepto: "Salario Base del Período", monto: salario },
          { concepto: "Horas Extras", monto: "0" },
        ],
        deducciones: [
          { concepto: "Aporte AFP - Fondo de Pensiones (2.87%)", monto: String(afpCalculado) },
          { concepto: "Aporte SFS - Seguro de Salud (3.04%)", monto: String(sfsCalculado) },
          { concepto: "Retención ISR - DGII", monto: String(isr) },
        ],
      };
      return { textoLimpio: texto, datosVolante: datosAuto };
    }
  }

  return { textoLimpio: texto, datosVolante: null };
}

/** Chat de Mimi: Asistente Contable Privada con análisis de documentos y privacidad estricta */
export function MimiChat({
  onCargarVolante,
}: {
  onCargarVolante?: (datos: any, colaboradorId?: string) => void;
} = {}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [adjuntos, setAdjuntos] = useState<AdjuntoLocal[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agregarArchivos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;
    const lista = Array.from(archivos);
    const procesados: AdjuntoLocal[] = [];

    for (const f of lista) {
      if (f.size > 15 * 1024 * 1024) {
        toast.error(`El archivo "${f.name}" supera el límite de 15MB.`);
        continue;
      }
      try {
        const item = await procesarArchivo(f);
        procesados.push(item);
      } catch (err) {
        toast.error(`No se pudo procesar "${f.name}".`);
      }
    }

    if (procesados.length > 0) {
      setAdjuntos((prev) => [...prev, ...procesados].slice(0, 5));
      toast.success(`${procesados.length} documento(s) adjuntado(s) de forma privada.`);
    }
  };

  const eliminarAdjunto = (id: string) => {
    setAdjuntos((prev) => prev.filter((a) => a.id !== id));
  };

  const copiarTexto = async (textoACopiar: string, indice: number) => {
    try {
      await navigator.clipboard.writeText(textoACopiar);
      setCopiadoId(indice);
      toast.success("Respuesta copiada al portapapeles.");
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if ((!limpio && adjuntos.length === 0) || pensando) return;

    const textoFinal = limpio || "Por favor analiza este documento contable adjunto de manera confidencial:";

    const nuevosAdjuntos = adjuntos.map((a) => ({
      nombre: a.nombre,
      tipo: a.tipo,
      tamano: a.tamano,
      vistaPrevia: a.vistaPrevia,
      datosBase64: a.datosBase64,
      texto: a.texto,
    }));

    const mensajeUsuario: Mensaje = {
      rol: "user",
      texto: textoFinal,
      adjuntos: nuevosAdjuntos.map((a) => ({
        nombre: a.nombre,
        tipo: a.tipo,
        tamano: a.tamano,
        vistaPrevia: a.vistaPrevia,
      })),
    };

    const historial = [...mensajes, mensajeUsuario];
    setMensajes(historial);
    setTexto("");
    setAdjuntos([]);
    setPensando(true);

    try {
      // Preparamos payload para server function
      const payloadMensajes = historial.slice(-20).map((m, idx) => {
        const esUltimo = idx === historial.slice(-20).length - 1;
        return {
          rol: m.rol,
          texto: m.texto.slice(0, 8000),
          ...(esUltimo && nuevosAdjuntos.length > 0
            ? {
                adjuntos: nuevosAdjuntos.map((a) => ({
                  nombre: a.nombre,
                  tipo: a.tipo,
                  datosBase64: a.datosBase64,
                  texto: a.texto,
                })),
              }
            : {}),
        };
      });

      const res = await mimiFn({
        data: {
          mensajes: payloadMensajes,
        },
      });

      if (!res.ok) {
        toast.error(res.error);
        setMensajes((m) => [
          ...m,
          { rol: "assistant", texto: res.error ?? "No pude responder ahora mismo." },
        ]);
      } else {
        setMensajes((m) => [
          ...m,
          {
            rol: "assistant",
            texto: res.texto,
            ...(res.fuentes?.length ? { fuentes: res.fuentes } : {}),
          },
        ]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mimi no está disponible");
    } finally {
      setPensando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tarjeta de Encabezado y Garantía de Privacidad */}
      <div className="surface-card space-y-3 p-4 border-l-4 border-primary">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                Mimi · Asistente Contable y de Nómina
                <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Acceso Exclusivo Contabilidad
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Auditoría de volantes, cálculo de deducciones TSS / ISR y análisis de documentos contables.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-lg border border-border">
            <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>100% Privada y Aislada</strong> · Datos y firmas protegidos
            </span>
          </div>
        </div>

        {/* Sugerencias rápidas */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void enviar(s)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Historial de Mensajes */}
      <div className="surface-card space-y-4 p-4 min-h-[360px] max-h-[560px] overflow-y-auto">
        {mensajes.map((m, i) => {
          const { textoLimpio, datosVolante } =
            m.rol === "assistant"
              ? extraerVolanteJson(m.texto)
              : { textoLimpio: m.texto, datosVolante: null };

          return (
            <div
              key={i}
              className={`max-w-[90%] rounded-2xl p-3.5 text-sm ${
                m.rol === "user"
                  ? "ml-auto bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground border border-border/50"
              }`}
            >
              {/* Adjuntos del mensaje */}
              {m.adjuntos && m.adjuntos.length > 0 ? (
                <div className="mb-2 space-y-1.5 pb-2 border-b border-primary-foreground/20">
                  <p className="text-[11px] font-semibold opacity-90">Documentos adjuntos:</p>
                  <div className="flex flex-wrap gap-2">
                    {m.adjuntos.map((a, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 rounded-lg bg-black/15 px-2.5 py-1 text-xs backdrop-blur-sm"
                      >
                        {a.vistaPrevia ? (
                          <img
                            src={a.vistaPrevia}
                            alt={a.nombre}
                            className="h-5 w-5 rounded object-cover border border-white/20"
                          />
                        ) : a.tipo.includes("pdf") ? (
                          <FileText className="h-4 w-4" />
                        ) : a.tipo.includes("csv") || a.nombre.endsWith(".csv") ? (
                          <FileSpreadsheet className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="truncate max-w-[160px] font-medium">{a.nombre}</span>
                        {a.tamano ? (
                          <span className="text-[10px] opacity-75">({formatearTamano(a.tamano)})</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Texto del mensaje con formato limpio */}
              <div className="whitespace-pre-wrap leading-relaxed font-sans">{textoLimpio}</div>

              {/* Tarjeta de acción interactiva para Cargar en el Editor de Volantes */}
              {datosVolante && (
                <div className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-foreground">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        Propuesta de Volante Lista para Cargar
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {datosVolante.nombre || "Colaborador"} · {datosVolante.periodoDesde || "Período"} {datosVolante.periodoHasta ? `al ${datosVolante.periodoHasta}` : ""}
                      </p>
                    </div>
                  </div>
                  {onCargarVolante && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onCargarVolante(datosVolante)}
                      className="text-xs h-8 flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                      <span>Cargar en Editor de Volantes</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Botón para copiar respuesta de la asistente */}
              {m.rol === "assistant" && i > 0 ? (
                <div className="mt-3 flex items-center justify-end border-t border-border/40 pt-2">
                  <button
                    type="button"
                    onClick={() => void copiarTexto(textoLimpio, i)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiadoId === i ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar cálculo / reporte</span>
                      </>
                    )}
                  </button>
                </div>
              ) : null}

            {/* Fuentes oficiales consultadas */}
            {m.fuentes?.length ? (
              <div className="mt-2.5 space-y-1 border-t border-border/60 pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  Fuentes oficiales consultadas (DGII / TSS / MT):
                </p>
                {m.fuentes.map((f) => (
                  <a
                    key={f.url}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] underline opacity-90 hover:opacity-100"
                  >
                    {f.titulo || f.url}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

        {pensando ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 p-3 rounded-xl border border-border/40">
            <Sparkles className="h-4 w-4 animate-spin text-primary" />
            <span>Mimi está analizando los documentos contables y verificando deducciones…</span>
          </div>
        ) : null}
      </div>

      {/* Zona de Entrada, Adjuntos y Drag & Drop */}
      <div
        className={`surface-card space-y-3 p-3 transition-colors ${
          arrastrando ? "border-primary bg-primary/5" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          void agregarArchivos(e.dataTransfer.files);
        }}
      >
        {/* Vista previa de archivos adjuntos pendientes de envío */}
        {adjuntos.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-secondary/50 rounded-xl border border-border">
            {adjuntos.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5 text-xs shadow-sm border border-border"
              >
                {a.vistaPrevia ? (
                  <img
                    src={a.vistaPrevia}
                    alt={a.nombre}
                    className="h-6 w-6 rounded object-cover border border-border"
                  />
                ) : a.tipo.includes("pdf") ? (
                  <FileText className="h-4 w-4 text-red-500" />
                ) : a.tipo.includes("csv") || a.nombre.endsWith(".csv") ? (
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-500" />
                )}
                <div className="min-w-0 max-w-[180px]">
                  <p className="truncate font-medium text-foreground">{a.nombre}</p>
                  <p className="text-[10px] text-muted-foreground">{formatearTamano(a.tamano)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarAdjunto(a.id)}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                  title="Eliminar archivo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.csv,.txt,.tsv,.json"
          multiple
          className="hidden"
          onChange={(e) => {
            void agregarArchivos(e.target.files);
            e.target.value = "";
          }}
        />

        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={6000}
          placeholder="Escríbele a Mimi o sube documentos: ej: 'Audita este volante que adjunto', '¿Por qué dio RD$ 42,300 de neto?', 'Calcula la regalía pascual'..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void enviar(texto);
            }
          }}
        />

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pensando || adjuntos.length >= 5}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              <span>Adjuntar documento o foto</span>
            </Button>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              (PDF, fotos de recibos, volantes o Excel/CSV)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={pensando || (!texto.trim() && adjuntos.length === 0)}
              onClick={() => void enviar(texto)}
              className="flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Enviar a Mimi</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
