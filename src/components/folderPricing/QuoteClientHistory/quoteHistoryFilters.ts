import { computed, ref, watch } from "vue";
import type { Ref } from "vue";

export interface NamedOption {
  id: number;
  name: string;
}

export interface ModalityOption {
  shipment_id: number;
  group_flag: boolean | null;
  label: string;
}

export interface ClientHistoryFilters {
  transport_id: number | null;
  modality: ModalityOption | null;
  weight_from: number | null;
  weight_to: number | null;
  volume_from: number | null;
  volume_to: number | null;
  port_begin_id: number | null;
  port_end_id: number | null;
  status_id: number | null;
}

export interface FilterForm extends Omit<ClientHistoryFilters, "weight_from" | "weight_to" | "volume_from" | "volume_to"> {
  weight_from: string | number | null;
  weight_to: string | number | null;
  volume_from: string | number | null;
  volume_to: string | number | null;
}

type Measure = "peso" | "volumen";

export const NO_FILTERS: ClientHistoryFilters = {
  transport_id: null,
  modality: null,
  weight_from: null,
  weight_to: null,
  volume_from: null,
  volume_to: null,
  port_begin_id: null,
  port_end_id: null,
  status_id: null,
};

const ID_FILTERS = ["transport_id", "port_begin_id", "port_end_id", "status_id"] as const;
const AMOUNT_FILTERS = ["weight_from", "weight_to", "volume_from", "volume_to"] as const;

export function rangeError(from: number | null, to: number | null, measure: Measure): string | null {
  if ((from ?? 0) < 0 || (to ?? 0) < 0) return `El ${measure} no puede ser negativo.`;
  if (from !== null && to !== null && from > to) return `El ${measure} desde no puede ser mayor que el ${measure} hasta.`;
  return null;
}

export function filterParams(filters: ClientHistoryFilters): Record<string, number | boolean> {
  const params: Record<string, number | boolean> = {};
  if (filters.modality) {
    params.shipment_id = filters.modality.shipment_id;
    if (filters.modality.group_flag !== null) params.group_flag = filters.modality.group_flag;
  }
  [...ID_FILTERS, ...AMOUNT_FILTERS].forEach((name) => {
    const value = filters[name];
    if (value !== null) params[name] = value;
  });
  return params;
}

function toAmount(value: string | number | null): number | null {
  if (value === null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function toFilters(form: FilterForm): ClientHistoryFilters {
  return {
    ...form,
    weight_from: toAmount(form.weight_from),
    weight_to: toAmount(form.weight_to),
    volume_from: toAmount(form.volume_from),
    volume_to: toAmount(form.volume_to),
  };
}

export function useHistoryFilterForm(clientId: Ref<number | string | null | undefined>) {
  const form = ref<FilterForm>({ ...NO_FILTERS });
  const applied = ref<ClientHistoryFilters>({ ...NO_FILTERS });
  const weightError = computed(() => rangeError(toAmount(form.value.weight_from), toAmount(form.value.weight_to), "peso"));
  const volumeError = computed(() => rangeError(toAmount(form.value.volume_from), toAmount(form.value.volume_to), "volumen"));

  watch(
    form,
    () => {
      if (!weightError.value && !volumeError.value) applied.value = toFilters(form.value);
    },
    { deep: true },
  );

  function clear() {
    form.value = { ...NO_FILTERS };
  }

  watch(clientId, clear);

  return {
    form,
    applied,
    weightError,
    volumeError,
    active: computed(() => Object.keys(filterParams(applied.value)).length > 0),
    clear,
  };
}
