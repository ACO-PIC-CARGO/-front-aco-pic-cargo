<script setup lang="ts">
import { toRef } from "vue";
import moment from "moment";
import type { SentMessage } from "./internalCommunicationApi";
import { messageAuthor, messageRecipient, messageRoute } from "./messageLabel";
import { useInternalThread } from "./useInternalThread";

const props = defineProps<{ quoteId: number; readonly?: boolean; hideHeader?: boolean; collapsible?: boolean }>();
const emit = defineEmits<{ sent: [message: SentMessage & { body: string }]; collapse: [] }>();

const { messages, draft, sending, errorText, count, canSend, send } = useInternalThread(
  toRef(props, "quoteId"),
  (message) => emit("sent", message),
);
defineExpose({ count });

const formatDate = (value: string) => moment(value).format("DD/MM/YYYY HH:mm");
</script>

<template>
  <section
    class="internal-thread"
    :class="{ 'internal-thread--card': !hideHeader }"
  >
    <header
      v-if="!hideHeader"
      class="internal-thread__header"
    >
      <v-icon
        icon="mdi-forum-outline"
        color="blue-darken-3"
      />
      <h3 class="text-title-small font-weight-bold flex-grow-1">
        Historial de comunicación interna
      </h3>
      <v-chip
        size="small"
        color="blue-darken-3"
        variant="tonal"
      >
        {{ count === 1 ? "1 mensaje" : `${count} mensajes` }}
      </v-chip>
      <v-btn
        v-if="collapsible"
        icon="mdi-chevron-up"
        variant="text"
        size="small"
        aria-label="Ocultar el historial"
        @click="emit('collapse')"
      />
    </header>
    <div class="internal-thread__body">
      <p
        v-if="!count && !errorText"
        class="text-body-medium text-medium-emphasis mb-2"
      >
        Todavía no hay mensajes. Escribe el primero para Pricing o Ventas.
      </p>
      <article
        v-for="message in messages"
        :key="message.id"
        class="internal-thread__message"
      >
        <v-chip
          :color="message.direction === 'sales_to_pricing' ? 'blue-darken-2' : 'green-darken-2'"
          size="small"
          label
          class="internal-thread__route font-weight-bold"
        >
          {{ messageRoute(message.direction) }}
        </v-chip>
        <div class="internal-thread__people">
          <v-avatar
            color="blue-lighten-5"
            size="36"
          >
            <v-icon
              icon="mdi-account"
              color="blue-darken-2"
            />
          </v-avatar>
          <div>
            <div class="text-body-medium font-weight-bold">
              {{ messageAuthor(message) }}
            </div>
            <div class="text-body-small">
              Para: {{ messageRecipient(message) }}
            </div>
          </div>
        </div>
        <div class="internal-thread__date text-body-medium">
          <v-icon
            icon="mdi-calendar-month-outline"
            size="18"
          />
          {{ formatDate(message.created_at) }}
        </div>
        <div class="internal-thread__bubble text-body-medium">
          {{ message.body }}
        </div>
      </article>
      <v-alert
        v-if="errorText"
        type="error"
        variant="tonal"
        density="compact"
        class="my-2"
      >
        {{ errorText }}
      </v-alert>
      <div
        v-if="!readonly"
        class="d-flex ga-3 align-center mt-3"
      >
        <v-textarea
          v-model="draft"
          aria-label="Nueva nota / respuesta"
          placeholder="Nueva nota / respuesta…"
          variant="outlined"
          density="compact"
          rows="1"
          auto-grow
          hide-details
        />
        <v-btn
          color="blue-darken-2"
          prepend-icon="mdi-send"
          :disabled="!canSend"
          :loading="sending"
          @click="send"
        >
          Enviar
        </v-btn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.internal-thread--card {
  border: 1px solid rgba(var(--v-theme-secondary), 0.35);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

.internal-thread__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(var(--v-theme-primary), 0.08);
}

.internal-thread--card .internal-thread__body {
  padding: 4px 12px 12px;
}

.internal-thread__message {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 8px 0;
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.internal-thread__route {
  justify-content: center;
  min-width: 132px;
}

.internal-thread__people {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
  white-space: nowrap;
}

.internal-thread__date {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 16px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  white-space: nowrap;
}

.internal-thread__bubble {
  flex: 1 1 280px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  white-space: pre-wrap;
}
</style>
