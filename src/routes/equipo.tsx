import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Cake, Mail, Phone, Search } from "lucide-react";
import { AppShell, Avatar, BrandLogo } from "@/components/app-shell";
import { areas, empleados } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/equipo")({
  head: () => ({
    meta: [
      { title: "Equipo de Trabajo — Portal IVAD" },
      {
        name: "description",
        content: "Directorio de colaboradores de IVAD Home & Goods por área, con contacto y aniversarios.",
      },
      { property: "og:title", content: "Equipo de Trabajo — Portal IVAD" },
      { property: "og:description", content: "Conoce a tu equipo y colaboradores de otras áreas." },
    ],
  }),
  component: Equipo,
});

function Equipo() {
  const [q, setQ] = useState("");

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return empleados;
    return empleados.filter((e) =>
      [e.nombre, e.cargo, e.area].some((v) => v.toLowerCase().includes(t)),
    );
  }, [q]);

  return (
    <AppShell>
      <header className="brand-gradient rounded-b-3xl px-4 pb-6 pt-6 text-primary-foreground">
        <div className="flex justify-center">
          <BrandLogo className="h-12 w-12" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Equipo de Trabajo</h1>
        <p className="mt-1 text-sm opacity-75">Conoce a tu equipo y colaboradores de otras áreas.</p>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, cargo o área..."
            className="bg-card pl-9 text-foreground"
          />
        </div>
      </header>

      <div className="px-4 py-5">
        <Tabs defaultValue="todos">
          <TabsList className="w-full">
            <TabsTrigger value="todos" className="flex-1">
              Todos
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex-1">
              Por Área
            </TabsTrigger>
            <TabsTrigger value="aniversarios" className="flex-1">
              Aniversarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{filtrados.length} colaboradores</p>
            {filtrados.map((e) => (
              <article key={e.id} className="surface-card flex gap-3 p-4">
                <Avatar iniciales={e.iniciales} estado={e.estado} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-foreground">{e.nombre}</h3>
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                      {e.area}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-accent">{e.cargo}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.email}</p>
                  <p className="text-xs text-muted-foreground">{e.telefono}</p>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={`mailto:${e.email}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary"
                      aria-label={`Escribir a ${e.nombre}`}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                    <a
                      href={`tel:${e.telefono.replace(/\D/g, "")}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary"
                      aria-label={`Llamar a ${e.nombre}`}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="areas" className="mt-4 space-y-4">
            {areas.map((area) => {
              const gente = empleados.filter((e) => e.area === area);
              if (!gente.length) return null;
              return (
                <section key={area} className="surface-card p-4">
                  <h3 className="font-display font-bold text-foreground">{area}</h3>
                  <p className="text-xs text-muted-foreground">{gente.length} colaboradores</p>
                  <ul className="mt-3 space-y-3">
                    {gente.map((e) => (
                      <li key={e.id} className="flex items-center gap-3">
                        <Avatar iniciales={e.iniciales} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{e.nombre}</p>
                          <p className="text-xs text-muted-foreground">{e.cargo}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </TabsContent>

          <TabsContent value="aniversarios" className="mt-4 space-y-3">
            {empleados.map((e) => (
              <article key={e.id} className="surface-card flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Cake className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{e.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Cumpleaños: {e.cumple} · En IVAD desde {e.ingreso}
                  </p>
                </div>
              </article>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
