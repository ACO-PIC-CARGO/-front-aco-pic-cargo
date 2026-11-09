<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePricingRequestInbox } from "./usePricingRequestInbox";
import type { PricingRequestNotice } from "./pricingRequestApi";

const props = defineProps<{
  socket: {
    on(event: string, listener: (notice: PricingRequestNotice) => void): unknown;
    off(event: string, listener: (notice: PricingRequestNotice) => void): unknown;
  };
}>();

const router = useRouter();
const { current, dismiss } = usePricingRequestInbox(props.socket);

const requestText = computed(() => {
  const notice = current.value;
  if (!notice) return "";
  const client = notice.client_name ? ` de ${notice.client_name}` : "";
  return `${notice.requested_by_name ?? "Un usuario"} te pide revisar la cotización ${notice.quote_code}${client}.`;
});

async function viewQuote() {
  const notice = await dismiss();
  if (notice) void router.push({ name: "verQuote", params: { id: notice.quote_id } });
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
        <v-icon color="primary">
          mdi-account-arrow-right
        </v-icon>
        Te solicitaron una cotización
      </v-card-title>
      <v-card-text>
        <p>{{ requestText }}</p>
        <p class="text-body-small text-medium-emphasis mt-1">
          Solicitada el {{ current.created_at }}
        </p>
        <div
          v-if="current.pricing_notes"
          class="mt-3"
        >
          <p class="text-label-large">
            Notas a pricing
          </p>
          <p class="pricing-request-notes">
            {{ current.pricing_notes }}
          </p>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="dismiss"
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
.pricing-request-notes {
  white-space: pre-line;
}
</style>
