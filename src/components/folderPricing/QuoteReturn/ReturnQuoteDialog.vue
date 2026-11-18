<script setup lang="ts">
import { computed, ref, watch } from "vue";
import Swal from "sweetalert2";
import { listQuoteReturnStatuses, returnQuoteToSales } from "./quoteReturnApi";
import type { QuoteReturnStatus } from "./quoteReturnApi";
import { needsStatusChoice } from "./needsStatusChoice";
import { returnFailureMessage } from "./returnFailureMessage";

const props = defineProps<{ quoteId: number | null }>();
const emit = defineEmits<{ returned: []; close: [] }>();

const LOAD_FAILED = "No pudimos cargar los estados de devolución. Revisa tu conexión e inténtalo de nuevo.";
const SEND_FAILED = "No pudimos devolver la cotización. Revisa tu conexión e inténtalo de nuevo.";
const NO_STATUS = "Primero marca un estado con «Notificar a Ventas para Corrección» en Ficheros › Estados de cotizaciones.";

const loading = ref(false);
const sending = ref(false);
const statuses = ref<QuoteReturnStatus[]>([]);
const statusId = ref<number | null>(null);
const reason = ref("");
const error = ref<string | null>(null);

const open = computed(() => props.quoteId !== null);
const showsStatusSelect = computed(() => needsStatusChoice(statuses.value));
const canSend = computed(
  () => !loading.value && statuses.value.length > 0 && reason.value.trim() !== "" && (!showsStatusSelect.value || statusId.value !== null),
);

let loadToken = 0;

async function load() {
  const token = ++loadToken;
  statuses.value = [];
  statusId.value = null;
  reason.value = "";
  error.value = null;
  loading.value = true;
  try {
    const response = await listQuoteReturnStatuses();
    if (token !== loadToken) return;
    if (response.estadoflag && response.data.length) statuses.value = response.data;
    else error.value = NO_STATUS;
  } catch {
    if (token === loadToken) error.value = LOAD_FAILED;
  } finally {
    if (token === loadToken) loading.value = false;
  }
}

async function send() {
  if (props.quoteId === null || sending.value) return;
  sending.value = true;
  error.value = null;
  try {
    const response = await returnQuoteToSales(props.quoteId, {
      reason: reason.value.trim(),
      ...(showsStatusSelect.value && statusId.value !== null ? { status_id: statusId.value } : {}),
    });
    if (!response.estadoflag) {
      error.value = response.mensaje || SEND_FAILED;
      return;
    }
    void Swal.fire({ icon: "success", text: response.mensaje });
    emit("returned");
  } catch (failure) {
    error.value = returnFailureMessage(failure);
  } finally {
    sending.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) void load();
});
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="480"
    persistent
  >
    <v-card>
      <v-card-title>No se puede procesar</v-card-title>
      <v-card-text>
        <p v-if="loading">
          Cargando los estados de devolución…
        </p>
        <template v-else-if="statuses.length">
          <v-select
            v-if="showsStatusSelect"
            v-model="statusId"
            :items="statuses"
            item-title="name"
            item-value="id"
            label="Estado"
            variant="outlined"
            density="comfortable"
          />
          <v-textarea
            v-model="reason"
            label="Motivo"
            placeholder="Cuéntale a Ventas qué debe corregir"
            variant="outlined"
            rows="4"
            auto-grow
          />
        </template>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('close')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!canSend"
          :loading="sending"
          @click="send"
        >
          Devolver a Ventas
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
