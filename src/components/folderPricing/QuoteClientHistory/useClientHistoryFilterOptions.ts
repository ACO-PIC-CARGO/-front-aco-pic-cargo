import { ref, watch } from "vue";
import type { Ref } from "vue";
import http from "@/api/http";
import type { ApiResponse } from "@/types/api";
import type { ModalityOption, NamedOption } from "./quoteHistoryFilters";

export interface ClientHistoryFilterOptions {
  total_count: number;
  transports: NamedOption[];
  modalities: ModalityOption[];
  origins: NamedOption[];
  destinations: NamedOption[];
  statuses: NamedOption[];
}

interface FilterOptionsRow extends Omit<ClientHistoryFilterOptions, "total_count"> {
  total_count: number | string;
}

type ClientId = number | string;

const NO_RECORDS = "TMSGINF";
const EMPTY_OPTIONS: ClientHistoryFilterOptions = {
  total_count: 0,
  transports: [],
  modalities: [],
  origins: [],
  destinations: [],
  statuses: [],
};

function toOptions(row: FilterOptionsRow): ClientHistoryFilterOptions {
  return {
    total_count: Number(row.total_count),
    transports: row.transports ?? [],
    modalities: row.modalities ?? [],
    origins: row.origins ?? [],
    destinations: row.destinations ?? [],
    statuses: row.statuses ?? [],
  };
}

export function useClientHistoryFilterOptions(clientId: Ref<ClientId | null | undefined>) {
  const cache = new Map<ClientId, ClientHistoryFilterOptions>();
  const options = ref<ClientHistoryFilterOptions>(EMPTY_OPTIONS);

  async function load(id: ClientId | null | undefined) {
    options.value = (id && cache.get(id)) || EMPTY_OPTIONS;
    if (!id || cache.has(id)) return;
    try {
      const { data } = await http<ApiResponse<FilterOptionsRow[]>>({
        method: "get",
        url: `${import.meta.env.VITE_URL_MAIN}quote_client_history_filters`,
        params: { entitie_id: id },
      });
      if (!data.estadoflag && data.tipomensaje !== NO_RECORDS) return;
      const loaded = data.estadoflag && data.data[0] ? toOptions(data.data[0]) : EMPTY_OPTIONS;
      cache.set(id, loaded);
      if (clientId.value === id) options.value = loaded;
    } catch {
      // Without options the filters stay empty; the history request reports the connection problem to the user.
    }
  }

  watch(clientId, (id) => void load(id), { immediate: true });

  return { options };
}
