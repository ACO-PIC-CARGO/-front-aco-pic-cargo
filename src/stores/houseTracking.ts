import { defineStore } from "pinia";
import { ref } from "vue";
import type { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type { HouseTrackingPhase } from "@/types/houseTracking";
import { todayIn } from "@/components/HouseFile/houseTrackingFormat";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";

const TOKEN_ERROR_MESSAGE = "No pudimos generar el enlace de tracking. Intenta de nuevo.";
const houseUrl = (houseId: number) => `house_tracking/${houseId}`;
const stepUrl = (houseId: number, stepId: number) => `${houseUrl(houseId)}/steps/${stepId}`;

export const useHouseTrackingStore = defineStore("houseTracking", () => {
  const phases = ref<HouseTrackingPhase[]>([]);
  const loading = ref(false);

  async function load(houseId: number): Promise<string | null> {
    loading.value = true;
    const response = await request<HouseTrackingPhase>({ method: "get", url: houseUrl(houseId) });
    loading.value = false;
    if (hasFailed(response)) return response.mensaje;
    phases.value = response.data;
    return null;
  }

  async function mutate(houseId: number, config: AxiosRequestConfig): Promise<string | null> {
    const response: ApiResponse = await request(config);
    if (!response.estadoflag) return response.mensaje;
    await load(houseId);
    notifySuccess(response.mensaje);
    return null;
  }

  const confirm = (houseId: number, stepId: number, confirmedAt: string) =>
    mutate(houseId, { method: "put", url: `${stepUrl(houseId, stepId)}/confirmation`, data: { confirmed_at: confirmedAt } });

  const addComment = (houseId: number, stepId: number, stepCommentId: number) =>
    mutate(houseId, {
      method: "post",
      url: `${stepUrl(houseId, stepId)}/comments`,
      data: { step_comment_id: stepCommentId },
    });

  const sendComment = (houseId: number, commentId: number) =>
    mutate(houseId, { method: "put", url: `${houseUrl(houseId)}/comments/${commentId}/send` });

  const sendStep = (houseId: number, stepId: number) =>
    mutate(houseId, { method: "put", url: `${stepUrl(houseId, stepId)}/send` });

  const setStepDate = (houseId: number, stepId: number, scheduledAt: string) =>
    mutate(houseId, { method: "put", url: `${stepUrl(houseId, stepId)}/date`, data: { scheduled_at: scheduledAt } });

  async function requestTrackingToken(houseId: number): Promise<string | null> {
    const response = await request<{ token: string }>({
      method: "put",
      url: "setTrackingToken",
      data: { id_house: houseId, token: uuidv4(), fecha: todayIn(useBranchTimeZoneStore().timeZone) },
    });
    if (response.estadoflag && response.data[0]?.token) return response.data[0].token;
    Swal.fire({ icon: "error", text: response.tipomensaje === "TMSGERR" ? TOKEN_ERROR_MESSAGE : response.mensaje });
    return null;
  }

  return { phases, loading, load, confirm, addComment, sendStep, sendComment, setStepDate, requestTrackingToken };
});
