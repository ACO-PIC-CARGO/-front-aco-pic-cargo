import { defineStore } from "pinia";
import { ref } from "vue";
import type { AxiosRequestConfig } from "axios";
import { hasFailed, notifySuccess, request } from "@/utils/request";
import type { TrackingStepComment } from "@/types/trackingCatalog";

const stepCommentsUrl = (stepId: number) => `tracking_steps/${stepId}/comments`;
const commentUrl = (id: number) => `tracking_step_comments/${id}`;

export const useTrackingStepCommentsStore = defineStore("trackingStepComments", () => {
  const commentsByStep = ref<Record<number, TrackingStepComment[]>>({});

  const commentsOf = (stepId: number): TrackingStepComment[] => commentsByStep.value[stepId] ?? [];

  async function load(stepId: number): Promise<string | null> {
    const response = await request<TrackingStepComment>({ method: "get", url: stepCommentsUrl(stepId) });
    if (hasFailed(response)) return response.mensaje;
    commentsByStep.value[stepId] = response.data;
    return null;
  }

  async function mutate(stepId: number, config: AxiosRequestConfig): Promise<string | null> {
    const response = await request(config);
    if (!response.estadoflag) return response.mensaje;
    await load(stepId);
    notifySuccess(response.mensaje);
    return null;
  }

  const create = (stepId: number, comment: string) =>
    mutate(stepId, { method: "post", url: stepCommentsUrl(stepId), data: { comment } });

  const update = (stepId: number, id: number, comment: string) =>
    mutate(stepId, { method: "put", url: commentUrl(id), data: { comment } });

  const remove = (stepId: number, id: number) => mutate(stepId, { method: "delete", url: commentUrl(id) });

  return { commentsOf, load, create, update, remove };
});
