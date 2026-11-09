<script setup lang="ts">
import { computed, ref } from "vue";
import QuoteListPanel from "@/components/folderPricing/QuoteListPanel.vue";
import { usePricingStore } from "@/stores/pricing";

type ListTab = "all" | "pending_send" | "pricing_requested";

const tab = ref<ListTab>(usePricingStore().pricingView || "all");
const pricingView = computed(() => (tab.value === "all" ? "" : tab.value));
</script>

<template>
  <div>
    <v-tabs
      v-model="tab"
      color="primary"
      class="px-3"
    >
      <v-tab value="all">
        Todas las cotizaciones
      </v-tab>
      <v-tab value="pending_send">
        Pendientes de envío
      </v-tab>
      <v-tab value="pricing_requested">
        Solicitadas a pricing
      </v-tab>
    </v-tabs>
    <QuoteListPanel
      :key="tab"
      :pricing-view="pricingView"
    />
  </div>
</template>
