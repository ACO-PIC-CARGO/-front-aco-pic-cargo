<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficCorrelative } from "@/types/traffic";
import { notifySuccess } from "@/utils/request";

const open = defineModel<boolean>({ required: true });

const trafficStore = useTrafficStore();
const current = ref<TrafficCorrelative | null>(null);
const start = shallowRef<number | null>(null);
const manual = shallowRef(true);
const refusal = shallowRef("");
const saving = shallowRef(false);

async function loadCurrent() {
  current.value = await trafficStore.correlative();
  start.value = current.value?.correlativo ?? null;
  manual.value = current.value?.manual ?? true;
  refusal.value = "";
}

async function save() {
  if (!manual.value && (!start.value || start.value < 1)) {
    refusal.value = "Escribe un número mayor que cero.";
    return;
  }
  saving.value = true;
  const answer = await trafficStore.setCorrelative(manual.value ? null : start.value, manual.value);
  saving.value = false;
  if (!answer.estadoflag) {
    refusal.value = answer.mensaje;
    return;
  }
  notifySuccess(answer.mensaje);
  open.value = false;
}

watch(open, (isOpen) => {
  if (isOpen) loadCurrent();
});
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="460"
  >
    <v-card title="Correlativo de Tráfico">
      <v-card-text>
        <v-switch
          id="traffic-manual-number"
          v-model="manual"
          label="Pedir correlativo manual"
          color="primary"
          hide-details
          class="mb-2"
        />
        <p
          v-if="manual"
          class="mb-4"
        >
          Al enviar una cotización a Tráfico se te pedirá el número del expediente.
        </p>
        <p
          v-else-if="current"
          class="mb-4"
        >
          El siguiente expediente será <strong>{{ current.next_code }}</strong>.
          {{ current.last_used ? `Hasta hoy se usaron ${current.last_used} números.` : "Todavía no hay expedientes de tráfico." }}
        </p>
        <v-text-field
          v-if="!manual"
          id="traffic-start-number"
          v-model.number="start"
          type="number"
          min="1"
          label="Empezar desde el número"
          hint="Debe ser mayor que el último número usado."
          persistent-hint
          :error-messages="refusal"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          @click="save"
        >
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
