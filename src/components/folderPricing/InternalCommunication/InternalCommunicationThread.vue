<script setup lang="ts">
import { toRef } from "vue";
import moment from "moment";
import type { SentMessage } from "./internalCommunicationApi";
import { messageLabel } from "./messageLabel";
import { useInternalThread } from "./useInternalThread";

const props = defineProps<{ quoteId: number }>();
const emit = defineEmits<{ sent: [message: SentMessage] }>();

const { messages, draft, sending, errorText, count, canSend, send } = useInternalThread(
  toRef(props, "quoteId"),
  (message) => emit("sent", message),
);
defineExpose({ count });

const formatDate = (value: string) => moment(value).format("DD/MM/YYYY HH:mm");
</script>

<template>
  <section class="internal-thread">
    <h3 class="text-title-medium font-weight-bold mb-2">
      Historial de comunicación interna ({{ count }})
    </h3>
    <p
      v-if="!count && !errorText"
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
          {{ message.author_name || "Usuario sin nombre" }}
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
