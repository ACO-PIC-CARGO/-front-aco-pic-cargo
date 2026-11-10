import { computed, ref, watch } from "vue";
import type { Ref } from "vue";
import http from "@/api/http";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";
import { sessionIsoPais } from "@/utils/sesion";
import { quoteOptionTotals } from "./quoteOptionTotals";
import { filterParams } from "./quoteHistoryFilters";
import type { ClientHistoryFilters } from "./quoteHistoryFilters";
import type { QuoteTotals } from "./quoteOptionTotals";
import type { ApiResponse } from "@/types/api";
import type { Costo, Multiplicador } from "@/types/cotizacion";

export interface HistoryContainer {
  id_containers?: number | string;
  cantidad?: number;
  name?: string | null;
}

export interface ClientQuoteHistoryRow {
  id: number;
  quote_code: string;
  created_date: string;
  cursor_created_at: string;
  transport_name: string | null;
  shipment_name: string | null;
  incoterm_name: string | null;
  group_flag: boolean;
  individual_flag: boolean;
  weight: number | null;
  volume: number | null;
  amount: number | null;
  containers: HistoryContainer[];
  origin: string | null;
  destination: string | null;
  status_name: string | null;
  approved_flag: boolean;
  multipliers: Multiplicador[];
  costs: Costo[];
  total_count: number | string | null;
  has_more: boolean;
}

export type ClientQuoteHistoryItem = Omit<ClientQuoteHistoryRow, "multipliers" | "costs"> & QuoteTotals;

type ClientId = number | string;

interface HistoryQuery {
  id: ClientId;
  key: string;
  params: Record<string, number | boolean>;
}

interface ClientHistory {
  items: ClientQuoteHistoryItem[];
  totalCount: number;
  hasMore: boolean;
}

export const PAGE_SIZE = 5;
export const LOAD_FAILED = "No pudimos cargar el historial. Revisa tu conexión e inténtalo de nuevo.";
const NO_RECORDS = "TMSGINF";
const EMPTY_HISTORY: ClientHistory = { items: [], totalCount: 0, hasMore: false };

function withTotals({ multipliers, costs, ...row }: ClientQuoteHistoryRow): ClientQuoteHistoryItem {
  const cargo = { weight: row.weight, volume: row.volume, amount: row.amount, containers: row.containers };
  return { ...row, ...quoteOptionTotals({ costs, multipliers, cargo, isoCountry: sessionIsoPais() }) };
}

function queryOf(id: ClientId, filters: ClientHistoryFilters): HistoryQuery {
  const params = filterParams(filters);
  return { id, key: `${id}|${JSON.stringify(params)}`, params };
}

export function useClientQuoteHistory(clientId: Ref<ClientId | null | undefined>, filters: Ref<ClientHistoryFilters>) {
  const histories = new Map<string, ClientHistory>();
  const history = ref<ClientHistory | null>(null);
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);
  const wanted = computed(() => (clientId.value ? queryOf(clientId.value, filters.value) : null));
  let request: AbortController | null = null;
  let shown: HistoryQuery | null = null;

  async function fetchPage(query: HistoryQuery, after?: ClientQuoteHistoryItem) {
    request?.abort();
    const current = new AbortController();
    request = current;
    loading.value = true;
    errorMessage.value = null;
    try {
      const { data } = await http<ApiResponse<ClientQuoteHistoryRow[]>>({
        method: "get",
        url: `${import.meta.env.VITE_URL_MAIN}quote_client_history`,
        params: {
          entitie_id: query.id,
          limit: PAGE_SIZE,
          cursor_created_at: after?.cursor_created_at,
          cursor_id: after?.id,
          ...query.params,
        },
        signal: current.signal,
      });
      if (current.signal.aborted) return;
      if (!data.estadoflag && data.tipomensaje !== NO_RECORDS) {
        errorMessage.value = data.mensaje || LOAD_FAILED;
        return;
      }
      const previous = (after && histories.get(query.key)) || EMPTY_HISTORY;
      const rows = data.estadoflag ? data.data : [];
      const next: ClientHistory = {
        items: [...previous.items, ...rows.map(withTotals)],
        totalCount: after ? previous.totalCount : Number(rows[0]?.total_count ?? 0),
        hasMore: Boolean(rows[0]?.has_more),
      };
      histories.set(query.key, next);
      history.value = next;
    } catch {
      if (!current.signal.aborted) errorMessage.value = LOAD_FAILED;
    } finally {
      if (request === current) loading.value = false;
    }
  }

  const show = useDebouncedSearch((query: HistoryQuery | null) => {
    request?.abort();
    errorMessage.value = null;
    shown = query;
    history.value = (query && histories.get(query.key)) || null;
    if (query && !history.value) void fetchPage(query);
  });

  watch(() => wanted.value?.key, () => show(wanted.value), { immediate: true });

  function lastItem() {
    const items = history.value?.items ?? [];
    return items[items.length - 1];
  }

  function isShowingWanted() {
    return shown !== null && shown.key === wanted.value?.key;
  }

  function loadMore() {
    const last = lastItem();
    if (!isShowingWanted() || !last || loading.value) return;
    void fetchPage(shown!, last);
  }

  function retry() {
    if (isShowingWanted()) void fetchPage(shown!, lastItem());
  }

  return {
    items: computed(() => history.value?.items ?? []),
    totalCount: computed(() => history.value?.totalCount ?? 0),
    hasMore: computed(() => history.value?.hasMore ?? false),
    loaded: computed(() => history.value !== null),
    loading,
    errorMessage,
    loadMore,
    retry,
  };
}
