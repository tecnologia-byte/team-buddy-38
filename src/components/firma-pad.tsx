import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onGuardar: (dataUrl: string) => void | Promise<void>;
  guardando?: boolean;
  etiqueta?: string;
};

/** Lienzo para capturar la firma digital con dedo, mouse o lápiz. */
export function FirmaPad({ onGuardar, guardando = false, etiqueta = "Guardar firma" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const ancho = canvas.clientWidth;
    const alto = canvas.clientHeight;
    canvas.width = ancho * ratio;
    canvas.height = alto * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f2542";
  }, []);

  const punto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const inicio = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    dibujando.current = true;
    const { x, y } = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const mover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setVacio(false);
  };

  const fin = () => {
    dibujando.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-dashed border-accent/60 bg-card p-2">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none rounded-lg bg-card"
          onPointerDown={inicio}
          onPointerMove={mover}
          onPointerUp={fin}
          onPointerLeave={fin}
        />
        <p className="px-1 pb-1 text-center text-[11px] text-muted-foreground">
          Firma dentro del recuadro
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          disabled={vacio || guardando}
          onClick={() => {
            const dataUrl = canvasRef.current?.toDataURL("image/png");
            if (dataUrl) void onGuardar(dataUrl);
          }}
        >
          {etiqueta}
        </Button>
        <Button type="button" variant="outline" onClick={limpiar} disabled={guardando}>
          <Eraser className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
