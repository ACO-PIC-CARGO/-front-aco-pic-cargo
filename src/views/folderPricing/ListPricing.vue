<script setup lang="ts">
import { computed, ref } from "vue";
import FolderTabs from "@/components/comun/FolderTabs.vue";
import QuoteListPanel from "@/components/folderPricing/QuoteListPanel.vue";
import { usePricingStore } from "@/stores/pricing";

type ListTab = "all" | "pending_send" | "pricing_requested";

const TABS: { value: ListTab; title: string; subtitle: string }[] = [
  { value: "all", title: "Todas las cotizaciones", subtitle: "Todos los registros" },
  { value: "pending_send", title: "Solicitadas por Ventas", subtitle: "Pricing pendiente por cotizar" },
  { value: "pricing_requested", title: "Enviadas al Cliente", subtitle: "Pricing ya envió al cliente" },
];

const tab = ref<ListTab>(usePricingStore().pricingView || "all");
const pricingView = computed(() => (tab.value === "all" ? "" : tab.value));
</script>

<template>
  <div>
    <FolderTabs
      v-model="tab"
      :items="TABS"
    />
    <QuoteListPanel
      :key="tab"
      class="quote-list-panel"
      :pricing-view="pricingView"
    />
  </div>
</template>

<style scoped>
.quote-list-panel {
  padding-top: 0;
}

.quote-list-panel > :deep(.v-card) {
  border-top-left-radius: 0;
}
</style>
