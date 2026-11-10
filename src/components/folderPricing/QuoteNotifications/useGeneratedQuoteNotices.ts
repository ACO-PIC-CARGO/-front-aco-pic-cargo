import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

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
  tieneindividualflag?: boolean | number | string | null;
  tienegrupalflag?: boolean | number | string | null;
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

function userSeesGeneratedQuotes(): boolean {
  const user = sessionUser();
  if (GENERATED_QUOTE_USER_IDS.includes(Number(user.id_user))) return true;
  const positions = user.position_code ?? [];
  return positions.some((code) => GENERATED_QUOTE_ROLES.includes(String(code)));
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

export function useGeneratedQuoteNotices(socket: NoticeSocket) {
  const queue = ref<GeneratedQuoteNotice[]>([]);
  const listeners = Object.entries(GENERATED_QUOTE_EVENTS).map(([event, source]) => {
    const listener = (payload: GeneratedQuotePayload) => {
      if (Number(payload.id_branch) !== Number(sessionBranchId()) || !userSeesGeneratedQuotes()) return;
      queue.value.push({ ...payload, source });
    };
    return { event, listener };
  });

  onMounted(() => listeners.forEach(({ event, listener }) => socket.on(event, listener)));
  onBeforeUnmount(() => listeners.forEach(({ event, listener }) => socket.off(event, listener)));

  function dismiss() {
    queue.value = queue.value.slice(1);
  }

  return { current: computed(() => queue.value[0] ?? null), dismiss };
}
