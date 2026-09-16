export type Tema = "claro" | "oscuro" | "sistema";

const LLAVE = "ivad-tema";
const LLAVE_DISPOSITIVO = "ivad-dispositivo";

/** Aplica el tema al documento (clase `dark` para el modo oscuro). */
export function aplicarTema(tema: Tema) {
  if (typeof document === "undefined") return;
  const oscuro =
    tema === "oscuro" ||
    (tema === "sistema" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", oscuro);
}

/** Tema guardado en este dispositivo. */
export function temaGuardado(): Tema {
  if (typeof localStorage === "undefined") return "sistema";
  const v = localStorage.getItem(LLAVE);
  return v === "claro" || v === "oscuro" || v === "sistema" ? v : "sistema";
}

export function guardarTemaLocal(tema: Tema) {
  if (typeof localStorage !== "undefined") localStorage.setItem(LLAVE, tema);
  aplicarTema(tema);
}

/** Identificador estable de este dispositivo, guardado solo en el navegador. */
export function huellaDispositivo(): string {
  if (typeof localStorage === "undefined") return "";
  let h = localStorage.getItem(LLAVE_DISPOSITIVO);
  if (!h) {
    h = crypto.randomUUID();
    localStorage.setItem(LLAVE_DISPOSITIVO, h);
  }
  return h;
}

/** Nombre legible del dispositivo, a partir del navegador. */
export function nombreDispositivo(): string {
  if (typeof navigator === "undefined") return "Dispositivo";
  const ua = navigator.userAgent;
  const sistema = /iPhone|iPad/.test(ua)
    ? "iPhone / iPad"
    : /Android/.test(ua)
      ? "Android"
      : /Mac/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : "Otro";
  const navegador = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Navegador";
  return `${sistema} · ${navegador}`;
}
