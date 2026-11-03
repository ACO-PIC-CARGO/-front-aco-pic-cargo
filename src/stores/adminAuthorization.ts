import { defineStore } from "pinia";
import { ref } from "vue";
import type { AdminCredentials } from "@/types/seguridad";

export const useAdminAuthorizationStore = defineStore("adminAuthorization", () => {
  const credentials = ref<AdminCredentials | null>(null);
  return { credentials };
});
