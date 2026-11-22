<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import Swal from "sweetalert2";
import { createPricingRequest, getPricingRequestInfo } from "./pricingRequestApi";
import type { PricingRequestInfo } from "./pricingRequestApi";
import PricingRequestDialog from "./PricingRequestDialog.vue";
import { newNoteToSend } from "../InternalCommunication/newNote";
import { internalThreadChanged } from "../InternalCommunication/internalThreadRefresh";
import { alreadyRequestedTooltip, isAlreadyRequested } from "./pricingRequestState";

const props = withDefaults(defineProps<{ quoteId: number; activator?: "icon" | "text"; blocked?: boolean; refreshToken?: number }>(), {
  activator: "icon",
  refreshToken: 0,
});

const emit = defineEmits<{ requested: [note: string | null] }>();

const LOAD_FAILED = "No pudimos cargar los datos de la solicitud. Revisa tu conexión e inténtalo de nuevo.";
const SEND_FAILED = "No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.";

const dialog = ref(false);
const loading = ref(false);
const sending = ref(false);
const info = ref<PricingRequestInfo | null>(null);
const loadError = ref<string | null>(null);
const sendError = ref<string | null>(null);
const note = ref("");
const alreadyRequested = ref(false);
const alreadyRequestedReason = ref<string | null>(null);

async function loadAlreadyRequested() {
  alreadyRequested.value = false;
  alreadyRequestedReason.value = null;
  if (props.activator !== "text") return;
  const quoteId = props.quoteId;
  try {
    const response = await getPricingRequestInfo(quoteId);
    const current = response.estadoflag ? response.data[0] : null;
    if (quoteId === props.quoteId && current && isAlreadyRequested(current)) {
      alreadyRequested.value = true;
      alreadyRequestedReason.value = current.blocked_reason;
    }
  } catch {
    return;
  }
}

onMounted(loadAlreadyRequested);
watch(() => [props.quoteId, props.refreshToken], loadAlreadyRequested);

async function open() {
  dialog.value = true;
  info.value = null;
  loadError.value = null;
  sendError.value = null;
  note.value = "";
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
    const sentNote = newNoteToSend(note.value);
    const response = await createPricingRequest(props.quoteId, sentNote);
    if (!response.estadoflag) {
      sendError.value = response.mensaje || SEND_FAILED;
      return;
    }
    dialog.value = false;
    alreadyRequested.value = true;
    alreadyRequestedReason.value = null;
    emit("requested", sentNote);
    if (sentNote) internalThreadChanged();
    void Swal.fire({ icon: "success", text: response.mensaje });
  } catch {
    sendError.value = SEND_FAILED;
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <v-tooltip
    v-if="alreadyRequested || blocked"
    location="top"
  >
    <template #activator="{ props: tooltip }">
      <span v-bind="tooltip">
        <v-btn
          v-if="activator === 'text'"
          variant="elevated"
          class="mx-1"
          disabled
        >
          <v-icon
            class="mx-1"
            size="small"
          >
            mdi-account-check
          </v-icon>
          YA FUE SOLICITADO
        </v-btn>
        <v-btn
          v-else
          variant="text"
          icon
          size="x-small"
          disabled
          aria-label="Ya fue solicitado"
        >
          <v-icon size="small">
            mdi-account-check
          </v-icon>
        </v-btn>
      </span>
    </template>
    <span>{{ alreadyRequestedTooltip(alreadyRequestedReason) }}</span>
  </v-tooltip>
  <v-btn
    v-else-if="activator === 'text'"
    variant="elevated"
    class="mx-1"
    color="light-blue-darken-3"
    @click="open"
  >
    <v-icon
      class="mx-1"
      size="small"
    >
      mdi-account-arrow-right
    </v-icon>
    SOLICITAR A PRICING
  </v-btn>
  <v-tooltip
    v-else
    location="top"
  >
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

  <PricingRequestDialog
    v-model:open="dialog"
    v-model:note="note"
    :quote-id="quoteId"
    :info="info"
    :loading="loading"
    :sending="sending"
    :notice="loadError ?? info?.blocked_reason ?? null"
    :error="sendError"
    @send="send"
  />
</template>

