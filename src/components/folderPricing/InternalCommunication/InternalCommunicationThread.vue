<script setup lang="ts">
import { computed, ref, watch } from "vue";
import moment from "moment";
import { getInternalMessages, sendInternalMessage, type InternalMessage, type SentMessage } from "./internalCommunicationApi";
import { messageLabel } from "./messageLabel";

const props = defineProps<{ quoteId: number }>();
const emit = defineEmits<{ sent: [message: SentMessage] }>();

const messages = ref<InternalMessage[]>([]);
const draft = ref("");
const sending = ref(false);
const errorText = ref("");

const count = computed(() => messages.value.length);
const canSend = computed(() => draft.value.trim() !== "" && !sending.value);
defineExpose({ count });

const formatDate = (value: string) => moment(value).format("DD/MM/YYYY HH:mm");

async function load() {
  try {
    const response = await getInternalMessages(props.quoteId);
    messages.value = response.estadoflag ? response.data : [];
    errorText.value = "";
  } catch {
    errorText.value = "No pudimos cargar los mensajes. Revisa tu conexión e intenta de nuevo.";
  }
}

async function send() {
  if (!canSend.value) return;
  sending.value = true;
  errorText.value = "";
  try {
    const response = await sendInternalMessage(props.quoteId, draft.value.trim());
    if (!response.estadoflag) {
      errorText.value = response.mensaje;
      return;
    }
    draft.value = "";
    await load();
    if (response.data[0]) emit("sent", response.data[0]);
  } catch {
    errorText.value = "No pudimos enviar el mensaje. Revisa tu conexión e intenta de nuevo.";
  } finally {
    sending.value = false;
  }
}

watch(() => props.quoteId, load, { immediate: true });
</script>

<template>
  <section class="internal-thread">
    <h3 class="text-title-medium font-weight-bold mb-2">
      Historial de comunicación interna ({{ count }})
    </h3>
    <p
      v-if="!count"
      class="text-body-medium text-medium-emphasis mb-2"
    >
      Todavía no hay mensajes. Escribe el primero para Pricing o Ventas.
    </p>
    <div
      v-for="message in messages"
      :key="message.id"
      class="d-flex ga-3 align-start py-2 border-b"
    >
      <v-chip
        :color="message.direction === 'sales_to_pricing' ? 'primary' : 'success'"
        size="small"
        label
      >
        {{ messageLabel(message.direction) }}
      </v-chip>
      <div class="flex-grow-1">
        <div class="text-body-medium font-weight-bold">
          {{ message.author_name }}
        </div>
        <div class="text-body-small text-medium-emphasis">
          {{ formatDate(message.created_at) }}
        </div>
        <div
          class="text-body-medium"
          style="white-space: pre-wrap"
        >
          {{ message.body }}
        </div>
      </div>
    </div>
    <v-alert
      v-if="errorText"
      type="error"
      variant="tonal"
      density="compact"
      class="my-2"
    >
      {{ errorText }}
    </v-alert>
    <div class="d-flex ga-3 align-end mt-2">
      <v-textarea
        v-model="draft"
        label="Nueva nota / respuesta"
        rows="2"
        auto-grow
        hide-details
      />
      <v-btn
        color="primary"
        :disabled="!canSend"
        :loading="sending"
        @click="send"
      >
        Enviar
      </v-btn>
    </div>
  </section>
</template>
