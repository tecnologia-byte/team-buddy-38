import { useCallback, useEffect, useState } from "react";
import { Copy, Mail, Pencil, RefreshCw, Trash2, CheckCircle2, Eye, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { enviarVolantesFn } from "@/lib/volantes.functions";
import { pesos } from "@/lib/data";
import { VolantePago, type DatosVolante } from "@/components/volante-pago";

export type VolanteGuardado = {
  id: string;
  colaboradorId: string;
  comprobante: string;
  periodoDesde: string;
  periodoHasta: string;
  fechaEmision: string;
  neto: number;
  estado: string;
  error: string | null;
  datos: DatosVolante;
  creado: string;
};

const tono: Record<string, string> = {
  Borrador: "bg-secondary text-secondary-foreground",
  Listo: "bg-primary/10 text-primary",
  Enviando: "bg-accent/20 text-accent-foreground",
  Enviado: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Error: "bg-destructive/10 text-destructive",
};

/** Bandeja confidencial de volantes guardados: revisar, marcar listos y enviar varios a la vez. */
export function VolantesBandeja({ onEditar }: { onEditar: (v: VolanteGuardado) => void }) {
  const [lista, setLista] = useState<VolanteGuardado[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [previewVolante, setPreviewVolante] = useState<VolanteGuardado | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("volantes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setCargando(false);
    if (error) {
      toast.error("No se pudieron cargar los volantes guardados");
      return;
    }
    setLista(
      (data ?? []).map((f) => ({
        id: f.id,
        colaboradorId: f.colaborador_id,
        comprobante: f.comprobante,
        periodoDesde: f.periodo_desde,
        periodoHasta: f.periodo_hasta,
        fechaEmision: f.fecha_emision,
        neto: Number(f.neto ?? 0),
        estado: f.estado,
        error: f.error,
        datos: (f.datos ?? {}) as unknown as DatosVolante,
        creado: new Date(f.created_at).toLocaleDateString("es-DO"),
      })),
    );
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const alternar = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const listos = lista.filter((v) => v.estado === "Listo" || v.estado === "Error");
  const seleccionados = sel.filter((id) => listos.some((v) => v.id === id));

  const marcarListo = async (v: VolanteGuardado) => {
    const { error } = await supabase
      .from("volantes")
      .update({ estado: v.estado === "Listo" ? "Borrador" : "Listo", error: null })
      .eq("id", v.id);
    if (error) toast.error(error.message);
    else await cargar();
  };

  const eliminar = async (v: VolanteGuardado) => {
    if (!window.confirm(`¿Eliminar el volante ${v.comprobante || "sin número"}?`)) return;
    const { error } = await supabase.from("volantes").delete().eq("id", v.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Volante eliminado");
      await cargar();
    }
  };

  const duplicar = async (v: VolanteGuardado) => {
    const { error } = await supabase.from("volantes").insert({
      colaborador_id: v.colaboradorId,
      comprobante: `${v.comprobante}-COPIA`,
      fecha_emision: v.fechaEmision,
      periodo_desde: v.periodoDesde,
      periodo_hasta: v.periodoHasta,
      datos: v.datos as unknown as Json,
      neto: v.neto,
      estado: "Borrador",
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Se creó una copia como borrador");
      await cargar();
    }
  };

  const enviar = async (ids: string[]) => {
    if (!ids.length) {
      toast.error("Selecciona al menos un volante listo.");
      return;
    }
    if (
      !window.confirm(
        `Se enviará el volante en PDF según los canales elegidos (Correo y/o WhatsApp) a ${ids.length} colaborador(es). ¿Confirmas el envío?`,
      )
    )
      return;
    setEnviando(true);
    try {
      const res = await enviarVolantesFn({ data: { ids } });
      if (!res.ok) toast.error(res.error ?? "No se pudieron enviar los volantes");
      else {
        const bien = res.resultados.filter((r) => r.ok).length;
        const mal = res.resultados.filter((r) => !r.ok);
        if (bien) toast.success(`${bien} volante(s) despachado(s) exitosamente`);
        for (const r of mal) toast.error(`${r.nombre || "Colaborador"}: ${r.error}`);
      }
      setSel([]);
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron enviar los volantes");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="surface-card space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-foreground">Volantes guardados</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Prepara cada volante, guárdalo, revísalo y cuando estén listos envíalos todos juntos.
              Cada colaborador recibe únicamente su propio PDF.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void cargar()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={enviando || !seleccionados.length}
            onClick={() => void enviar(seleccionados)}
          >
            <Mail className="mr-2 h-4 w-4" />
            {enviando ? "Enviando…" : `Enviar seleccionados (${seleccionados.length})`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={enviando || !listos.length}
            onClick={() => void enviar(listos.map((v) => v.id))}
          >
            Enviar todos los listos ({listos.length})
          </Button>
        </div>
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando volantes…</p>
      ) : !lista.length ? (
        <p className="surface-card p-4 text-sm text-muted-foreground">
          Todavía no hay volantes guardados. Prepara uno en la pestaña Volante y usa “Guardar”.
        </p>
      ) : (
        <div className="space-y-2">
          {lista.map((v) => (
            <div key={v.id} className="surface-card space-y-2 p-3">
              <div className="flex items-start gap-3">
                {v.estado === "Listo" || v.estado === "Error" ? (
                  <Checkbox
                    checked={sel.includes(v.id)}
                    onCheckedChange={() => alternar(v.id)}
                    aria-label={`Seleccionar volante de ${v.datos.nombre}`}
                    className="mt-1"
                  />
                ) : (
                  <span className="mt-1 h-4 w-4" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {v.datos.nombre || "Sin colaborador"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.comprobante || "Sin número"} · {v.periodoDesde} al {v.periodoHasta} · Neto RD${" "}
                    {pesos(v.neto)}
                  </p>
                  <p className="text-xs text-muted-foreground">Guardado el {v.creado}</p>
                  {v.error ? <p className="text-xs text-destructive">{v.error}</p> : null}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${tono[v.estado] ?? "bg-secondary"}`}
                >
                  {v.estado}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary font-medium"
                  onClick={() => setPreviewVolante(v)}
                >
                  <Eye className="mr-2 h-4 w-4" /> Vista previa (PDF)
                </Button>
                {v.estado !== "Enviado" ? (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={() => onEditar(v)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void marcarListo(v)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {v.estado === "Listo" ? "Volver a borrador" : "Marcar listo"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={enviando}
                      onClick={() => void enviar([v.id])}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Enviar
                    </Button>
                  </>
                ) : null}
                <Button type="button" size="sm" variant="outline" onClick={() => void duplicar(v)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicar
                </Button>
                {v.estado !== "Enviado" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => void eliminar(v)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Vista Preliminar Oficial del Volante en PDF */}
      <Dialog open={!!previewVolante} onOpenChange={(open) => !open && setPreviewVolante(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="border-b pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Eye className="h-5 w-5 text-primary" />
                  Vista previa del volante oficial (PDF)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Así es exactamente como se genera e imprime el PDF para{" "}
                  <strong className="text-foreground">{previewVolante?.datos?.nombre || "el colaborador"}</strong>.
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="shadow-sm"
              >
                <Printer className="mr-2 h-4 w-4" /> Imprimir / PDF
              </Button>
            </div>
          </DialogHeader>

          {previewVolante && (
            <div className="my-2 rounded-lg border bg-card p-3 shadow-inner overflow-x-auto print:p-0 print:border-0 print:shadow-none">
              <VolantePago datos={previewVolante.datos} />
            </div>
          )}

          <DialogFooter className="border-t pt-3 flex flex-wrap justify-between items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Comprobante: <strong className="text-foreground">{previewVolante?.comprobante || "—"}</strong> ·
              Período: <span className="text-foreground font-medium">{previewVolante?.periodoDesde} al {previewVolante?.periodoHasta}</span> ·
              Estado: <span className="font-semibold text-primary">{previewVolante?.estado}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewVolante(null)}
              >
                Cerrar vista previa
              </Button>
              {previewVolante && previewVolante.estado !== "Enviado" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const v = previewVolante;
                    setPreviewVolante(null);
                    onEditar(v);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Editar este volante
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
