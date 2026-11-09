<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useQuoteNotificationInbox } from "./useQuoteNotificationInbox";
import type { QuoteNotice, QuoteNoticeKind } from "./quoteNotificationApi";

const props = defineProps<{
  socket: {
    on(event: string, listener: (notice: QuoteNotice) => void): unknown;
    off(event: string, listener: (notice: QuoteNotice) => void): unknown;
  };
}>();

const TITLES: Record<QuoteNoticeKind, string> = {
  pricing_request: "Te solicitaron una cotización",
  sent_to_client: "Cotización enviada al cliente",
};
const ICONS: Record<QuoteNoticeKind, string> = {
  pricing_request: "mdi-account-arrow-right",
  sent_to_client: "mdi-whatsapp",
};
const DATE_LABELS: Record<QuoteNoticeKind, string> = {
  pricing_request: "Solicitada el",
  sent_to_client: "Enviada el",
};

const router = useRouter();
const { current, dismiss } = useQuoteNotificationInbox(props.socket);

const noticeText = computed(() => {
  const notice = current.value;
  if (!notice) return "";
  const who = notice.created_by_name ?? "Un usuario";
  if (notice.kind === "sent_to_client") {
    const client = notice.client_name ? ` a ${notice.client_name}` : "";
    return `${who} envió la cotización ${notice.quote_code}${client} por WhatsApp.`;
  }
  const client = notice.client_name ? ` de ${notice.client_name}` : "";
  return `${who} te pide revisar la cotización ${notice.quote_code}${client}.`;
});

function viewQuote() {
  const notice = dismiss();
  if (notice) window.open(router.resolve({ name: "verQuote", params: { id: notice.quote_id } }).href, "_blank", "noopener");
}
</script>

<template>
  <v-dialog
    :model-value="!!current"
    persistent
    max-width="480"
  >
    <v-card v-if="current">
      <v-card-title class="d-flex align-center ga-2">
        <v-icon :color="current.kind === 'sent_to_client' ? 'success' : 'primary'">
          {{ ICONS[current.kind] }}
        </v-icon>
        {{ TITLES[current.kind] }}
      </v-card-title>
      <v-card-text>
        <p>{{ noticeText }}</p>
        <p class="text-body-small text-medium-emphasis mt-1">
          {{ DATE_LABELS[current.kind] }} {{ current.created_at }}
        </p>
        <div
          v-if="current.kind === 'pricing_request' && current.pricing_notes"
          class="mt-3"
        >
          <p class="text-label-large">
            Notas a pricing
          </p>
          <p class="quote-notice-notes">
            {{ current.pricing_notes }}
          </p>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="dismiss()"
        >
          Cerrar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="viewQuote"
        >
          Ver cotización
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.quote-notice-notes {
  white-space: pre-line;
}
</style>
