<script setup lang="ts">
import { ref } from "vue";
import Swal from "sweetalert2";
import { createPricingRequest, getPricingRequestInfo } from "./pricingRequestApi";
import type { PricingRequestInfo } from "./pricingRequestApi";

const props = defineProps<{ quoteId: number }>();

const LOAD_FAILED = "No pudimos cargar los datos de la solicitud. Revisa tu conexión e inténtalo de nuevo.";
const SEND_FAILED = "No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.";

const dialog = ref(false);
const loading = ref(false);
const sending = ref(false);
const info = ref<PricingRequestInfo | null>(null);
const loadError = ref<string | null>(null);
const sendError = ref<string | null>(null);

async function open() {
  dialog.value = true;
  info.value = null;
  loadError.value = null;
  sendError.value = null;
  loading.value = true;
  try {
    const response = await getPricingRequestInfo(props.quoteId);
    if (response.estadoflag && response.data[0]) info.value = response.data[0];
    else loadError.value = response.mensaje || LOAD_FAILED;
  } catch {
    loadError.value = LOAD_FAILED;
  } finally {
    loading.value = false;
  }
}

async function send() {
  sending.value = true;
  sendError.value = null;
  try {
    const response = await createPricingRequest(props.quoteId);
    if (!response.estadoflag) {
      sendError.value = response.mensaje || SEND_FAILED;
      return;
    }
    dialog.value = false;
    void Swal.fire({ icon: "success", text: response.mensaje });
  } catch {
    sendError.value = SEND_FAILED;
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <v-tooltip location="top">
    <template #activator="{ props: tooltip }">
      <v-btn
        v-bind="tooltip"
        variant="text"
        icon
        size="x-small"
        aria-label="Solicitar a pricing"
        @click="open"
      >
        <v-icon
          color="#1A237E"
          size="small"
        >
          mdi-account-arrow-right
        </v-icon>
      </v-btn>
    </template>
    <span>Solicitar a pricing</span>
  </v-tooltip>

  <v-dialog
    v-model="dialog"
    max-width="480"
  >
    <v-card>
      <v-card-title>Solicitar a pricing</v-card-title>
      <v-card-text>
        <p v-if="loading">
          Cargando los datos de la solicitud…
        </p>
        <template v-else-if="info">
          <p>¿Solicitar a {{ info.pricing_name ?? "pricing" }} que revise la cotización {{ info.quote_code }}?</p>
          <p class="text-label-large mt-3">
            Notas a pricing
          </p>
          <p class="pricing-request-notes">
            {{ info.pricing_notes || "Esta cotización no tiene notas a pricing." }}
          </p>
        </template>
        <v-alert
          v-if="loadError || info?.blocked_reason"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ loadError ?? info?.blocked_reason }}
        </v-alert>
        <v-alert
          v-if="sendError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ sendError }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="dialog = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="loading || !info?.can_request"
          :loading="sending"
          @click="send"
        >
          Solicitar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pricing-request-notes {
  white-space: pre-line;
}
</style>
