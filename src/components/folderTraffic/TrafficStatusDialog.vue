<script setup lang="ts">
import { computed, shallowRef } from "vue";
import Swal from "sweetalert2";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficFile } from "@/types/traffic";
import { notifySuccess } from "@/utils/request";

const props = defineProps<{ file: TrafficFile }>();
const emit = defineEmits<{ close: []; saved: [] }>();

const trafficStore = useTrafficStore();
const chosen = shallowRef<number | null>(props.file.id_status);
const saving = shallowRef(false);

const options = computed(() => [
  { title: "Sin estatus", value: null },
  ...trafficStore.statuses.map((status) => ({ title: status.name, value: status.id })),
]);

async function save() {
  saving.value = true;
  const answer = await trafficStore.setFileStatus(props.file.id_traffic, chosen.value);
  saving.value = false;
  if (!answer.estadoflag) {
    Swal.fire({ icon: "error", title: "No se pudo cambiar el estatus", text: answer.mensaje });
    return;
  }
  notifySuccess(answer.mensaje);
  emit("saved");
}
</script>

<template>
  <v-dialog
    :model-value="true"
    max-width="460"
    persistent
  >
    <v-card :title="`Estatus de ${file.code_traffic}`">
      <v-card-text>
        <v-select
          id="traffic-file-status"
          v-model="chosen"
          :items="options"
          label="Estatus"
          :hint="trafficStore.statuses.length ? '' : 'Aún no hay estatus. Créalos en Ficheros, Estatus de tráfico.'"
          persistent-hint
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="emit('close')">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          @click="save"
        >
          Guardar estatus
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
