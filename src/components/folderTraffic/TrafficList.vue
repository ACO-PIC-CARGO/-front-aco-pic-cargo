<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { usePermissions } from "@/composables/usePermissions";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficFile, TrafficState } from "@/types/traffic";
import { trafficStatusLabel } from "@/utils/trafficSend";
import TrafficCorrelativeDialog from "./TrafficCorrelativeDialog.vue";
import TrafficFileCreateDialog from "./TrafficFileCreateDialog.vue";
import TrafficSendToOperations from "./TrafficSendToOperations.vue";
import TrafficStatusDialog from "./TrafficStatusDialog.vue";
import { TRAFFIC_TABLE_FOOTER } from "./trafficTableFooter";

const STATE_OPTIONS = [
  { title: "Pendientes", value: "PENDING" },
  { title: "Enviados a operaciones", value: "SENT" },
  { title: "Todos", value: null },
];
const headers = [
  { title: "N° Tráfico", key: "code_traffic" },
  { title: "Creado", key: "created_at" },
  { title: "Cotización", key: "quote_number" },
  { title: "Sentido", key: "namemodality" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },
  { title: "Cliente", key: "nameconsigner" },
  { title: "Estatus", key: "status", sortable: false },
  { title: "Master", key: "code_master" },
  { title: "Acciones", key: "actions", sortable: false },
] as const;

const router = useRouter();
const trafficStore = useTrafficStore();
const canModify = usePermissions().can("lstTraffic", "MODIFICAR");
const canCreate = usePermissions().can("lstTraffic", "NUEVO");
const creating = shallowRef(false);
const state = shallowRef<TrafficState | null>("PENDING");
const status = shallowRef<number | null>(null);
const loading = shallowRef(false);
const page = shallowRef(1);
const pageSize = shallowRef(10);
const numbering = shallowRef(false);
const relabelling = ref<TrafficFile | null>(null);
const sending = ref<TrafficFile | null>(null);

const statusOptions = computed(() => [
  { title: "Todos los estatus", value: null },
  ...trafficStore.statuses.map((option) => ({ title: option.name, value: option.id })),
]);
const emptyText = computed(() =>
  state.value === "PENDING"
    ? "No hay expedientes pendientes en Tráfico. Envía una cotización a Tráfico desde su pantalla para verla aquí."
    : "No hay expedientes de tráfico con esos filtros. Cambia el estado o el estatus.",
);

async function load() {
  loading.value = true;
  await trafficStore.loadFiles({ state: state.value, status: status.value }, { pagina: page.value, limit: pageSize.value });
  loading.value = false;
}

const openFile = (file: TrafficFile) => router.push({ name: "trafficVer", params: { id: file.id_house } });

async function onRelabelled() {
  relabelling.value = null;
  await load();
}

async function onSent() {
  sending.value = null;
  await load();
}

watch([state, status], () => (page.value === 1 ? load() : (page.value = 1)));
watch([page, pageSize], load);
onMounted(() => {
  trafficStore.loadStatuses();
  load();
});
</script>

<template>
  <v-card
    variant="flat"
    class="pa-3"
  >
    <div class="d-flex flex-wrap align-center ga-3 mb-3">
      <v-select
        id="traffic-state"
        v-model="state"
        :items="STATE_OPTIONS"
        label="Estado"
        density="compact"
        hide-details
        class="traffic-filter"
      />
      <v-select
        id="traffic-status"
        v-model="status"
        :items="statusOptions"
        label="Estatus"
        density="compact"
        hide-details
        class="traffic-filter"
      />
      <v-spacer />
      <v-btn
        v-if="canCreate"
        color="primary"
        prepend-icon="mdi-plus"
        class="mr-2"
        @click="creating = true"
      >
        Nuevo pre-expediente
      </v-btn>
      <v-btn
        v-if="canModify"
        variant="tonal"
        prepend-icon="mdi-counter"
        @click="numbering = true"
      >
        Configurar correlativo
      </v-btn>
    </div>
    <v-data-table-server
      v-bind="TRAFFIC_TABLE_FOOTER"
      v-model:page="page"
      v-model:items-per-page="pageSize"
      :headers="headers"
      :items="trafficStore.files"
      :items-length="trafficStore.totalFiles"
      disable-sort
      :loading="loading"
      :no-data-text="emptyText"
      item-value="id_traffic"
      density="compact"
    >
      <template #[`item.quote_number`]="{ item }">
        {{ item.quote_number ?? "Sin cotización" }}
      </template>
      <template #[`item.status`]="{ item }">
        <v-chip
          size="small"
          :color="item.sent_at ? 'success' : undefined"
        >
          {{ trafficStatusLabel(item) }}
        </v-chip>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-btn
          icon="mdi-eye"
          size="small"
          variant="text"
          :aria-label="`Ver ${item.code_traffic}`"
          @click="openFile(item)"
        />
        <template v-if="canModify && !item.sent_at">
          <v-btn
            icon="mdi-tag-outline"
            size="small"
            variant="text"
            :aria-label="`Cambiar estatus de ${item.code_traffic}`"
            @click="relabelling = item"
          />
          <v-btn
            icon="mdi-send"
            size="small"
            variant="text"
            color="primary"
            :aria-label="`Enviar ${item.code_traffic} a Operaciones`"
            @click="sending = item"
          />
        </template>
      </template>
    </v-data-table-server>
  </v-card>
  <TrafficStatusDialog
    v-if="relabelling"
    :file="relabelling"
    @close="relabelling = null"
    @saved="onRelabelled"
  />
  <TrafficSendToOperations
    v-if="sending"
    :file="sending"
    @close="sending = null"
    @sent="onSent"
  />
  <TrafficCorrelativeDialog v-model="numbering" />
  <TrafficFileCreateDialog
    v-model="creating"
    @created="load"
  />
</template>

<style scoped>
.traffic-filter {
  max-width: 260px;
}
</style>
