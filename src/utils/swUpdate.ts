import { reactive } from "vue";

// Ciclo de vida de una nueva versión servida por el Service Worker (Workbox):
//  idle → descargando (updatefound / installing) → lista (installed, en espera) → aplicando (skipWaiting + recarga)
export type FaseActualizacion = "idle" | "descargando" | "lista" | "aplicando";

export const swUpdate = reactive({
  fase: "idle" as FaseActualizacion,
  // 0–100. Real cuando se puede leer el manifiesto de precache; si no, una estimación que nunca llega a 100 sola.
  progreso: 0,
  archivosListos: 0,
  archivosTotales: 0,
  oculto: false,
});

const CHECK_EVERY_MS = 30 * 60_000;
const POLL_MS = 300;
// Tiempo para que el barco termine de llegar al final antes de mostrar "lista".
export const LLEGADA_MS = 900;

let registration: ServiceWorkerRegistration | null = null;
let applying = false;

export const getRegistration = () => registration;

interface PrecacheEntry {
  url: string;
  revision: string | null;
}

// El SW generado por Workbox trae el manifiesto inline: precacheAndRoute([{url:"…",revision:…},…]).
export const parsePrecacheManifest = (script: string): PrecacheEntry[] =>
  [...script.matchAll(/\{url:"([^"]+)",revision:(?:null|"([^"]+)")\}/g)].map((match) => ({
    url: match[1]!,
    revision: match[2] ?? null,
  }));

// Clave con la que Workbox guarda cada archivo en la caché de precache.
export const precacheKey = (entry: PrecacheEntry, scope: string) => {
  const url = new URL(entry.url, scope);
  if (entry.revision) url.searchParams.set("__WB_REVISION__", entry.revision);
  return url.href;
};

const cachedPrecacheKeys = async (): Promise<Set<string>> => {
  const keys = new Set<string>();
  for (const name of await caches.keys()) {
    if (!name.startsWith("workbox-precache")) continue;
    for (const request of await (await caches.open(name)).keys()) keys.add(request.url);
  }
  return keys;
};

const setProgress = (value: number) => {
  swUpdate.progreso = Math.max(swUpdate.progreso, Math.min(100, Math.round(value)));
};

// Sigue la descarga del SW nuevo: cuenta cuántos archivos del nuevo manifiesto ya están en caché.
const trackDownload = async (worker: ServiceWorker, scope: string) => {
  let expected: string[] = [];
  try {
    const script = await (await fetch(worker.scriptURL, { cache: "no-store" })).text();
    expected = parsePrecacheManifest(script).map((entry) => precacheKey(entry, scope));
  } catch {
    expected = [];
  }
  swUpdate.archivosTotales = expected.length;

  const started = Date.now();
  while (worker.state === "installing" && swUpdate.fase === "descargando") {
    if (expected.length && "caches" in window) {
      const cached = await cachedPrecacheKeys().catch(() => new Set<string>());
      swUpdate.archivosListos = expected.filter((key) => cached.has(key)).length;
      // Se reserva el último tramo para el paso "installed".
      setProgress((swUpdate.archivosListos / expected.length) * 95);
    } else {
      // Sin manifiesto legible: curva que se acerca a 90 % sin llegar.
      setProgress(90 * (1 - Math.exp(-(Date.now() - started) / 4000)));
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

const markReady = () => {
  if (swUpdate.fase === "lista" || swUpdate.fase === "aplicando") return;
  setProgress(100);
  swUpdate.archivosListos = swUpdate.archivosTotales;
  // Deja que el barco llegue al final antes de cambiar el mensaje.
  setTimeout(() => {
    if (swUpdate.fase === "descargando") swUpdate.fase = "lista";
  }, swUpdate.fase === "descargando" ? LLEGADA_MS : 0);
  if (swUpdate.fase === "idle") swUpdate.fase = "lista";
};

const watchWorker = (worker: ServiceWorker, scope: string) => {
  // Primera instalación (sin versión previa): no hay nada que avisar.
  if (!navigator.serviceWorker.controller) return;

  const onState = () => {
    if (worker.state === "installed") markReady();
    if (worker.state === "redundant" && swUpdate.fase === "descargando") {
      // La descarga falló o la reemplazó otra más nueva; se vuelve a escuchar.
      swUpdate.fase = "idle";
      swUpdate.progreso = 0;
    }
  };
  worker.addEventListener("statechange", onState);

  if (worker.state === "installing") {
    swUpdate.fase = "descargando";
    swUpdate.progreso = 0;
    swUpdate.archivosListos = 0;
    swUpdate.oculto = false;
    trackDownload(worker, scope);
  } else {
    onState();
  }
};

export const checkForUpdate = () => registration?.update().catch(() => undefined);

// Equivale a Ctrl+F5: borra las cachés del navegador y entra con ?v=<hora> para que el
// index.html y los archivos se pidan de nuevo al servidor (algunos equipos se quedaban en la versión antigua).
let hardReloading = false;
export const hardReload = async (now = Date.now(), go = (href: string) => window.location.replace(href)) => {
  if (hardReloading) return;
  hardReloading = true;
  localStorage.setItem("actualizando", "1");
  if ("caches" in window) {
    await caches
      .keys()
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
      .catch(() => undefined);
  }
  const url = new URL(window.location.href);
  url.searchParams.set("v", String(now));
  go(url.href);
};

// Aplica la versión en espera: skipWaiting en el SW nuevo y, cuando toma el control, recarga forzada.
export const applyUpdate = (): boolean => {
  const waiting = registration?.waiting;
  if (!waiting) return false;
  applying = true;
  swUpdate.fase = "aplicando";
  waiting.postMessage({ type: "SKIP_WAITING" });
  // Si controllerchange no llega (navegador raro), se recarga igual.
  setTimeout(() => hardReload(), 4000);
  return true;
};

export const registerServiceWorker = async (url: string) => {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (applying) hardReload();
  });

  try {
    registration = await navigator.serviceWorker.register(url);
  } catch (error) {
    console.error("Error during service worker registration:", error);
    return;
  }

  const reg = registration;
  if (reg.waiting && navigator.serviceWorker.controller) markReady();
  if (reg.installing) watchWorker(reg.installing, reg.scope);
  reg.addEventListener("updatefound", () => {
    if (reg.installing) watchWorker(reg.installing, reg.scope);
  });

  setInterval(checkForUpdate, CHECK_EVERY_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
};

// Solo en desarrollo: recorre las dos fases sin Service Worker para revisar el diseño.
export const simulateUpdate = (duracionMs = 6000) => {
  swUpdate.fase = "descargando";
  swUpdate.oculto = false;
  swUpdate.progreso = 0;
  swUpdate.archivosTotales = 40;
  const started = Date.now();
  const timer = setInterval(() => {
    const ratio = Math.min(1, (Date.now() - started) / duracionMs);
    swUpdate.archivosListos = Math.round(ratio * 40);
    setProgress(ratio * 95);
    if (ratio >= 1) {
      clearInterval(timer);
      markReady();
    }
  }, POLL_MS);
};
