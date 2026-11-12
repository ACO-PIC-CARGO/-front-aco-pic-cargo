<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import { useHousesStore } from "@/stores/houses";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficFileOfHouse } from "@/types/traffic";
import { QUOTELESS_SEND_MESSAGE, quoteRouteOf } from "@/utils/trafficSend";
import TrafficSendToOperations from "./TrafficSendToOperations.vue";

const props = defineProps<{ houseId: number }>();

const router = useRouter();
const trafficStore = useTrafficStore();
const housesStore = useHousesStore();
const canSend = usePermissions().can("lstTraffic", "MODIFICAR");
const file = ref<TrafficFileOfHouse | null>(null);
const sending = shallowRef(false);

async function loadFile() {
  file.value = await trafficStore.fileOfHouse(props.houseId);
}

function startSending() {
  if (file.value!.id_quote) sending.value = true;
  else Swal.fire({ icon: "warning", title: "Falta la cotización", text: QUOTELESS_SEND_MESSAGE });
}

async function onSent() {
  sending.value = false;
  await loadFile();
}

watch(() => [props.houseId, housesStore.house?.id_cot, housesStore.house?.id_quoteaduana], loadFile, { immediate: true });

function openQuote() {
  const { quote_kind, id_quote } = file.value!;
  if (quote_kind && id_quote) router.push(quoteRouteOf({ quote_kind, id_quote }));
}
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
        v-if="file.id_quote"
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
        @click="startSending"
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
