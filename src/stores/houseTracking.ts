import { defineStore } from "pinia";
import { ref } from "vue";
import type { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import { v4 as uuidv4 } from "uuid";
import { hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type { HouseTrackingPhase, WeightCheck } from "@/types/houseTracking";
import { todayIn } from "@/components/HouseFile/houseTrackingFormat";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHousesStore } from "@/stores/houses";

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

  async function confirm(houseId: number, stepId: number, confirmedAt: string, validation?: WeightCheck) {
    const message = await mutate(houseId, {
      method: "put",
      url: `${stepUrl(houseId, stepId)}/confirmation`,
      data: { confirmed_at: confirmedAt, validation },
    });
    if (message) await load(houseId);
    return message;
  }

  const unconfirm = (houseId: number, stepId: number) =>
    mutate(houseId, { method: "delete", url: `${stepUrl(houseId, stepId)}/confirmation` });

  const keepRate = (houseId: number, stepId: number) =>
    mutate(houseId, { method: "put", url: `${stepUrl(houseId, stepId)}/rate_keep` });

  const addComment = (houseId: number, stepId: number, comment: string) =>
    mutate(houseId, { method: "post", url: `${stepUrl(houseId, stepId)}/comments`, data: { comment } });

  const deleteComment = (houseId: number, commentId: number) =>
    mutate(houseId, { method: "delete", url: `${houseUrl(houseId)}/comments/${commentId}` });

  const sendComment = (houseId: number, commentId: number) =>
    mutate(houseId, { method: "put", url: `${houseUrl(houseId)}/comments/${commentId}/send` });

  const withdrawComment = (houseId: number, commentId: number) =>
    mutate(houseId, { method: "delete", url: `${houseUrl(houseId)}/comments/${commentId}/send` });

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

  async function trackingToken(houseId: number): Promise<string | null> {
    const housesStore = useHousesStore();
    if (housesStore.house.token_rastreo) return housesStore.house.token_rastreo;
    const token = await requestTrackingToken(houseId);
    if (token) housesStore.house.token_rastreo = token;
    return token;
  }

  return {
    phases,
    loading,
    load,
    confirm,
    unconfirm,
    keepRate,
    addComment,
    deleteComment,
    sendComment,
    withdrawComment,
    setStepDate,
    requestTrackingToken,
    trackingToken,
  };
});
