<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { usePermissions } from "@/composables/usePermissions";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficFileOfHouse } from "@/types/traffic";
import { quoteRouteOf } from "@/utils/trafficSend";
import TrafficSendToOperations from "./TrafficSendToOperations.vue";

const props = defineProps<{ houseId: number }>();

const router = useRouter();
const trafficStore = useTrafficStore();
const canSend = usePermissions().can("lstTraffic", "MODIFICAR");
const file = ref<TrafficFileOfHouse | null>(null);
const sending = shallowRef(false);

async function loadFile() {
  file.value = await trafficStore.fileOfHouse(props.houseId);
}

async function onSent() {
  sending.value = false;
  await loadFile();
}

watch(() => props.houseId, loadFile, { immediate: true });

const openQuote = () => router.push(quoteRouteOf(file.value!));
const openExpenses = () => router.push({ name: "billControlGastos", params: { id_house: props.houseId } });
</script>

<template>
  <v-alert
    v-if="file"
    type="info"
    variant="tonal"
    density="compact"
    class="mb-3"
  >
    <div class="d-flex flex-wrap align-center ga-2">
      <strong>Expediente de tráfico {{ file.code_traffic }}</strong>
      <v-chip
        size="small"
        :color="file.sent ? 'success' : 'warning'"
      >
        {{ file.sent ? "Enviado a operaciones" : "Pendiente de enviar a operaciones" }}
      </v-chip>
      <v-spacer />
      <v-btn
        size="small"
        variant="text"
        @click="openQuote"
      >
        Ver cotización
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        @click="openExpenses"
      >
        Control de gastos
      </v-btn>
      <v-btn
        v-if="!file.sent && canSend"
        size="small"
        color="primary"
        @click="sending = true"
      >
        Enviar a Operaciones
      </v-btn>
    </div>
  </v-alert>
  <TrafficSendToOperations
    v-if="file && sending"
    :file="file"
    @close="sending = false"
    @sent="onSent"
  />
</template>
