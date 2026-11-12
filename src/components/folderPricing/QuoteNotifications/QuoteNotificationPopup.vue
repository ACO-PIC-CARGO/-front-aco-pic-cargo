<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useQuoteNotificationInbox } from "./useQuoteNotificationInbox";
import PricingRequestNotice from "./PricingRequestNotice.vue";
import SentToClientNotice from "./SentToClientNotice.vue";
import type { QuoteNotice } from "./quoteNotificationApi";

const props = defineProps<{
  socket: {
    on(event: string, listener: (notice: QuoteNotice) => void): unknown;
    off(event: string, listener: (notice: QuoteNotice) => void): unknown;
  };
}>();

const router = useRouter();
const { current, dismiss } = useQuoteNotificationInbox(props.socket);

const maxWidth = computed(() => (current.value?.kind === "pricing_request" ? 640 : 450));

function viewQuote() {
  const notice = dismiss();
  if (notice) window.open(router.resolve({ name: "verQuote", params: { id: notice.quote_id } }).href, "_blank", "noopener");
}
</script>

<template>
  <v-dialog
    :model-value="!!current"
    persistent
    :max-width="maxWidth"
  >
    <template v-if="current">
      <PricingRequestNotice
        v-if="current.kind === 'pricing_request'"
        :notice="current"
        @view="viewQuote"
        @close="dismiss()"
      />
      <SentToClientNotice
        v-else
        :notice="current"
        @view="viewQuote"
        @close="dismiss()"
      />
    </template>
  </v-dialog>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap");
</style>
