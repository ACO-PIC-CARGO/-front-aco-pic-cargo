import { defineStore } from "pinia";
import { ref } from "vue";
import { request } from "@/utils/request";

const DEFAULT_TIME_ZONE = "America/Lima";

export const useBranchTimeZoneStore = defineStore("branchTimeZone", () => {
  const timeZone = ref(DEFAULT_TIME_ZONE);
  let loaded = false;

  async function load(): Promise<void> {
    if (loaded) return;
    const response = await request<{ time_zone: string }>({ method: "get", url: "branch_time_zone" });
    const zone = response.estadoflag ? response.data[0]?.time_zone : undefined;
    if (!zone) return;
    timeZone.value = zone;
    loaded = true;
  }

  return { timeZone, load };
});
