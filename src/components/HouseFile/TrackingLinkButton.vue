<script setup lang="ts">
import { ref } from "vue";
import Swal from "sweetalert2";
import { useHousesStore } from "@/stores/houses";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { notifySuccess } from "@/utils/request";
import { trackingLink } from "./houseTrackingFormat";

const props = defineProps<{ houseId: number }>();

const housesStore = useHousesStore();
const store = useHouseTrackingStore();
const loading = ref(false);

async function houseToken(): Promise<string | null> {
  if (housesStore.house.token_rastreo) return housesStore.house.token_rastreo;
  const token = await store.requestTrackingToken(props.houseId);
  if (token) housesStore.house.token_rastreo = token;
  return token;
}

async function copyLink() {
  loading.value = true;
  const token = await houseToken();
  loading.value = false;
  if (!token) return;
  const link = trackingLink(token);
  try {
    await navigator.clipboard.writeText(link);
    notifySuccess("Copiamos el enlace.");
  } catch {
    Swal.fire({ icon: "warning", titleText: "No pudimos copiar el enlace", text: `Cópialo manualmente: ${link}` });
  }
}
</script>

<template>
  <v-btn
    color="primary"
    variant="outlined"
    prepend-icon="mdi-content-copy"
    :loading="loading"
    @click="copyLink"
  >
    Copiar link
  </v-btn>
</template>
