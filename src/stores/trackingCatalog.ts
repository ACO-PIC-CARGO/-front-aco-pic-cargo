import { defineStore } from "pinia";
import { ref } from "vue";
import type { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import { hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type {
  MoveDirection,
  TrackingPhase,
  TrackingPhaseDraft,
  TrackingStep,
  TrackingStepDraft,
} from "@/types/trackingCatalog";

const CATALOG_URL = "tracking_catalog";
const PHASES_URL = "tracking_phases";
const STEPS_URL = "tracking_steps";

export const stepRangeLabel = ({ first_step_number: first, last_step_number: last }: TrackingPhase): string => {
  if (first === null || last === null) return "Sin pasos activos";
  return first === last ? `Paso ${first}` : `Pasos ${first}–${last}`;
};

const saveConfig = <Draft extends { id: number | null }>(url: string, draft: Draft): AxiosRequestConfig => {
  const { id, ...body } = draft;
  return id ? { method: "put", url: `${url}/${id}`, data: body } : { method: "post", url, data: body };
};

const warn = (response: ApiResponse) =>
  Swal.fire({ icon: response.tipomensaje === "TMSGADV" ? "warning" : "error", text: response.mensaje });

export const useTrackingCatalogStore = defineStore("trackingCatalog", () => {
  const phases = ref<TrackingPhase[]>([]);
  const loading = ref(false);
  const busy = ref(false);

  async function loadCatalog(): Promise<string | null> {
    loading.value = true;
    const response = await request<TrackingPhase>({ method: "get", url: CATALOG_URL });
    loading.value = false;
    if (hasFailed(response)) return response.mensaje;
    phases.value = response.data;
    return null;
  }

  async function mutate(config: AxiosRequestConfig): Promise<ApiResponse> {
    busy.value = true;
    const response = await request(config);
    if (response.estadoflag) await loadCatalog();
    busy.value = false;
    return response;
  }

  async function save(url: string, draft: TrackingPhaseDraft | TrackingStepDraft): Promise<string | null> {
    const response = await mutate(saveConfig(url, draft));
    if (!response.estadoflag) return response.mensaje;
    notifySuccess(response.mensaje);
    return null;
  }

  async function move(url: string, id: number, direction: MoveDirection): Promise<void> {
    const response = await mutate({ method: "put", url: `${url}/${id}/move`, data: { direction } });
    if (!response.estadoflag) warn(response);
  }

  const savePhase = (draft: TrackingPhaseDraft) => save(PHASES_URL, draft);
  const saveStep = (draft: TrackingStepDraft) => save(STEPS_URL, draft);
  const movePhase = (id: number, direction: MoveDirection) => move(PHASES_URL, id, direction);
  const moveStep = (id: number, direction: MoveDirection) => move(STEPS_URL, id, direction);

  async function setStepVisibility(phaseId: number, step: TrackingStep, visible: boolean): Promise<void> {
    const response = await mutate(
      saveConfig(STEPS_URL, {
        id: step.id,
        phase_id: phaseId,
        name: step.name,
        icon: step.icon,
        visible_to_client: visible,
        active: step.active,
      }),
    );
    if (!response.estadoflag) warn(response);
  }

  return { phases, loading, busy, loadCatalog, savePhase, saveStep, movePhase, moveStep, setStepVisibility };
});
