<script setup lang="ts">
import { computed, ref } from "vue";
import { useHousesStore } from "@/stores/houses";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { notifySuccess } from "@/utils/request";
import { trackingLink } from "./houseTrackingFormat";

const props = defineProps<{ houseId: number }>();

const housesStore = useHousesStore();
const store = useHouseTrackingStore();
const dialog = ref(false);
const loading = ref(false);
const copyError = ref("");
const link = computed(() => (housesStore.house.token_rastreo ? trackingLink(housesStore.house.token_rastreo) : ""));

async function open() {
  if (!housesStore.house.token_rastreo) {
    loading.value = true;
    const token = await store.requestTrackingToken(props.houseId);
    loading.value = false;
    if (!token) return;
    housesStore.house.token_rastreo = token;
  }
  copyError.value = "";
  dialog.value = true;
}

async function copy() {
  try {
    await navigator.clipboard.writeText(link.value);
    notifySuccess("Copiamos el enlace.");
  } catch {
    copyError.value = "No pudimos copiar el enlace. Selecciónalo y cópialo manualmente.";
  }
}
</script>

<template>
  <v-btn
    color="primary"
    variant="outlined"
    prepend-icon="mdi-send-outline"
    :loading="loading"
    @click="open"
  >
    Enviar tracking
  </v-btn>
  <v-dialog
    v-model="dialog"
    max-width="560"
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <v-card-title class="aco-title-card pt-5 px-6">
        Enlace de tracking del cliente
      </v-card-title>
      <v-card-text class="px-6">
        <p class="aco-caption mb-3">
          Comparte este enlace con tu cliente. Verá los pasos visibles al cliente y sus comentarios públicos.
        </p>
        <v-text-field
          :model-value="link"
          label="Enlace"
          readonly
          hide-details
        />
        <v-alert
          v-if="copyError"
          type="warning"
          variant="tonal"
          class="mt-3"
          :text="copyError"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn
          variant="text"
          @click="dialog = false"
        >
          Cerrar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-copy"
          @click="copy"
        >
          Copiar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
