import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { sessionBranchId, sessionUser } from "@/utils/sesion";
import { shortDate } from "@/utils/dates";
import { listPendingCotizacionAvisos, markCotizacionAvisoVisto } from "./quoteNotificationApi";
import type { CotizacionAvisoPendiente } from "./quoteNotificationApi";

export const GENERATED_QUOTE_ROLES = ["08", "10"];
export const GENERATED_QUOTE_USER_IDS = [1, 22];

export type GeneratedQuoteSource = "bot" | "calculadora";

export interface GeneratedQuotePayload {
  id_branch: number | string;
  nro_cotizacion: number | string;
  id_cotizacion?: number | string | null;
  cliente?: string | null;
  telefono?: string | null;
  puerto_origen?: string | null;
  tipo?: string | null;
  volumen?: number | string | null;
  peso?: number | string | null;
  valor_mercancia?: number | string | null;
  tieneindividualflag?: boolean | number | string | null;
  tienegrupalflag?: boolean | number | string | null;
  /** aviso guardado en BD (CA-000001): con él se marca como visto */
  codigo?: string | null;
  /** "YYYY-MM-DD HH:mm:ss" */
  fecha_registro?: string | null;
  /** FCL: contenedor y cantidad (ej. 40S x 1) */
  contenedor?: string | null;
  cantidad_contenedor?: number | string | null;
}

export type QuoteModality = "individual" | "grupal";

export interface GeneratedQuoteNotice extends GeneratedQuotePayload {
  source: GeneratedQuoteSource;
}

export const GENERATED_QUOTE_EVENTS: Record<string, GeneratedQuoteSource> = {
  "cotizacion-bot": "bot",
  "cotizacion-calculadora": "calculadora",
};

interface NoticeSocket {
  on(event: string, listener: (payload: GeneratedQuotePayload) => void): unknown;
  off(event: string, listener: (payload: GeneratedQuotePayload) => void): unknown;
}

// al reconectarse el socket se vuelven a pedir los avisos no vistos (los que llegaron sin conexión)
export const RECONNECT_EVENT = "connect";
// otro usuario actualizó la cotización o la envió a pricing: el aviso sale de la lista de todos
export const ATTENDED_EVENT = "cotizacion-aviso-atendido";

function userSeesGeneratedQuotes(): boolean {
  const user = sessionUser();
  if (GENERATED_QUOTE_USER_IDS.includes(Number(user.id_user))) return true;
  const positions = user.position_code ?? [];
  return positions.some((code) => GENERATED_QUOTE_ROLES.includes(String(code)));
}

const isBlank = (value: unknown) => value === undefined || value === null || String(value).trim() === "";

// Formats a numeric socket value with thousands separators; non-numeric text is shown as sent.
function formatAmount(value: number | string | null | undefined, digits: { min: number; max: number }): string | null {
  if (isBlank(value)) return null;
  const amount = Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(amount)) return String(value);
  return amount.toLocaleString("en-US", { minimumFractionDigits: digits.min, maximumFractionDigits: digits.max });
}

export function formatQuoteValue(value: GeneratedQuotePayload["valor_mercancia"]): string | null {
  const amount = formatAmount(value, { min: 0, max: 2 });
  return amount && `USD ${amount}`;
}

export function formatQuoteWeight(value: GeneratedQuotePayload["peso"]): string | null {
  const amount = formatAmount(value, { min: 0, max: 2 });
  return amount && `${amount} kg`;
}

export function formatQuoteVolume(value: GeneratedQuotePayload["volumen"]): string | null {
  const amount = formatAmount(value, { min: 2, max: 2 });
  return amount && `${amount} m³`;
}

// FCL: "40S x 1" (contenedor y cantidad) en lugar de peso / volumen
export function formatQuoteContainer(notice: Pick<GeneratedQuotePayload, "contenedor" | "cantidad_contenedor">): string | null {
  if (isBlank(notice.contenedor)) return null;
  const cantidad = Number(notice.cantidad_contenedor);
  return `${String(notice.contenedor).trim().toUpperCase()} x ${Number.isInteger(cantidad) && cantidad > 0 ? cantidad : 1}`;
}

// Fecha y hora del aviso con el helper de FormatFecha: "17/NOV/2026 11:21 a. m."
export function formatQuoteDate(value: string | null | undefined): string | null {
  if (isBlank(value)) return null;
  const texto = String(value);
  const [hora, minuto] = texto.slice(11, 16).split(":").map(Number);
  const fecha = shortDate(texto.slice(0, 10));
  if (hora === undefined || minuto === undefined || Number.isNaN(hora) || Number.isNaN(minuto)) return fecha;
  return `${fecha} ${hora % 12 || 12}:${String(minuto).padStart(2, "0")} ${hora < 12 ? "a. m." : "p. m."}`;
}

// Fecha y hora en dos líneas para la lista: { fecha: "17/NOV/2026", hora: "09:25" }
export function quoteDateParts(value: string | null | undefined): { fecha: string; hora: string | null } | null {
  if (isBlank(value)) return null;
  const texto = String(value);
  const hora = /^\d{2}:\d{2}$/.test(texto.slice(11, 16)) ? texto.slice(11, 16) : null;
  return { fecha: shortDate(texto.slice(0, 10)), hora };
}

const isOn = (flag: unknown) => [true, 1, "1"].includes(flag as never);

// The calculator list offers each modality only when the quote has it; the bot always opens verQuote.
// Without any flag the calculator event doesn't say which modality exists, so the user chooses.
export function availableModalities(notice: GeneratedQuoteNotice): QuoteModality[] {
  if (notice.source === "bot") return ["individual"];
  const hasFlags = notice.tieneindividualflag != null || notice.tienegrupalflag != null;
  if (!hasFlags) return ["individual", "grupal"];
  const modalities: QuoteModality[] = [];
  if (isOn(notice.tieneindividualflag)) modalities.push("individual");
  if (isOn(notice.tienegrupalflag)) modalities.push("grupal");
  return modalities;
}

export function generatedQuoteLocation(notice: GeneratedQuoteNotice, modality: QuoteModality): RouteLocationRaw | null {
  if (notice.id_cotizacion === undefined || notice.id_cotizacion === null || notice.id_cotizacion === "") return null;
  if (notice.source === "bot") return { name: "verQuote", params: { id: notice.id_cotizacion } };
  const grupal = modality === "grupal";
  return {
    name: "VerCotizacionCalculadora",
    query: { id: notice.id_cotizacion, individualflag: grupal ? 0 : 1, esgrupalflag: grupal ? 1 : 0 },
  };
}

const desdePendiente = (aviso: CotizacionAvisoPendiente): GeneratedQuoteNotice => ({ ...aviso, source: aviso.fuente });

export function useGeneratedQuoteNotices(socket: NoticeSocket) {
  const queue = ref<GeneratedQuoteNotice[]>([]);
  // avisos ya abiertos ("VER"): siguen en la lista pero deshabilitados
  const vistos = ref(new Set<GeneratedQuoteNotice>());

  // Misma validación para el socket y para los guardados: sucursal de la sesión y cargo que ve los avisos
  function enqueue(notice: GeneratedQuoteNotice) {
    if (Number(notice.id_branch) !== Number(sessionBranchId()) || !userSeesGeneratedQuotes()) return;
    // el mismo aviso puede llegar por socket y por la lista de pendientes
    if (notice.codigo && queue.value.some((queued) => queued.codigo === notice.codigo)) return;
    queue.value.push(notice);
  }

  const listeners = Object.entries(GENERATED_QUOTE_EVENTS).map(([event, source]) => {
    const listener = (payload: GeneratedQuotePayload) => enqueue({ ...payload, source });
    return { event, listener };
  });

  // Los avisos que llegaron sin sesión o con la pestaña cerrada están guardados en BD:
  // se cargan al abrir ACO y cada vez que el socket se reconecta
  async function cargarPendientes() {
    if (!userSeesGeneratedQuotes()) return;
    try {
      (await listPendingCotizacionAvisos()).forEach((aviso) => enqueue(desdePendiente(aviso)));
    } catch {
      // siguen guardados y se vuelven a pedir en la próxima reconexión
    }
  }
  const alReconectar = () => {
    void cargarPendientes();
  };
  const alAtender = (payload: GeneratedQuotePayload) => {
    if (!payload?.codigo) return;
    queue.value = queue.value.filter((notice) => notice.codigo !== payload.codigo);
    if (!queue.value.length) vistos.value = new Set();
  };

  onMounted(() => {
    listeners.forEach(({ event, listener }) => socket.on(event, listener));
    socket.on(RECONNECT_EVENT, alReconectar);
    socket.on(ATTENDED_EVENT, alAtender);
    void cargarPendientes();
  });
  onBeforeUnmount(() => {
    listeners.forEach(({ event, listener }) => socket.off(event, listener));
    socket.off(RECONNECT_EVENT, alReconectar);
    socket.off(ATTENDED_EVENT, alAtender);
  });

  const isSeen = (notice: GeneratedQuoteNotice) => vistos.value.has(notice);

  // "VER": queda visto para este usuario en BD y la fila se deshabilita (no se quita de la lista)
  function markSeen(notice: GeneratedQuoteNotice) {
    if (vistos.value.has(notice)) return;
    vistos.value = new Set(vistos.value).add(notice);
    if (notice.codigo) {
      markCotizacionAvisoVisto(notice.codigo).catch(() => {
        // si falla, el aviso vuelve a aparecer la próxima vez que se abra ACO
      });
    }
  }

  // Without an argument it drops the oldest notice; with one, that notice (from the grouped list).
  function dismiss(notice?: GeneratedQuoteNotice) {
    queue.value = notice ? queue.value.filter((queued) => queued !== notice) : queue.value.slice(1);
  }

  // Drops every pending notice, or only the ones matching the predicate.
  function dismissAll(predicate?: (notice: GeneratedQuoteNotice) => boolean) {
    queue.value = predicate ? queue.value.filter((notice) => !predicate(notice)) : [];
    if (!queue.value.length) vistos.value = new Set();
  }

  return {
    notices: computed(() => queue.value),
    current: computed(() => queue.value[0] ?? null),
    pendingCount: computed(() => queue.value.filter((notice) => !vistos.value.has(notice)).length),
    dismiss,
    dismissAll,
    markSeen,
    isSeen,
  };
}
