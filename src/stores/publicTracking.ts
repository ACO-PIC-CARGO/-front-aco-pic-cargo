import { defineStore } from "pinia";
import { ref } from "vue";
import { request } from "@/utils/request";
import type { PublicTracking } from "@/types/publicTracking";

const LOAD_ERROR_MESSAGE = "No pudimos cargar el seguimiento. Revisa tu conexión e inténtalo de nuevo.";

export interface TrackingLoadError {
  message: string;
  canRetry: boolean;
}

export const usePublicTrackingStore = defineStore("publicTracking", () => {
  const tracking = ref<PublicTracking | null>(null);
  const loading = ref(false);

  async function load(token: string): Promise<TrackingLoadError | null> {
    loading.value = true;
    const response = await request<PublicTracking>({
      method: "get",
      url: `house_tracking/public/${encodeURIComponent(token)}`,
    });
    loading.value = false;
    if (response.estadoflag && response.data[0]) {
      tracking.value = response.data[0];
      return null;
    }
    const canRetry = response.tipomensaje === "TMSGERR";
    return { message: canRetry ? LOAD_ERROR_MESSAGE : response.mensaje, canRetry };
  }

  return { tracking, loading, load };
});
