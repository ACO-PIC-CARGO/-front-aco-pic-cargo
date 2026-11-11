<script setup lang="ts">
import { computed, ref } from "vue";
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
    <div class="quote-tabs">
      <v-tabs
        v-model="tab"
        class="quote-tabs__bar"
        height="auto"
        hide-slider
        grow
      >
        <v-tab
          v-for="item in TABS"
          :key="item.value"
          :value="item.value"
          :ripple="false"
          class="quote-tabs__tab"
        >
          <span class="quote-tabs__title">{{ item.title }}</span>
          <span class="quote-tabs__subtitle">{{ item.subtitle }}</span>
        </v-tab>
      </v-tabs>
    </div>
    <QuoteListPanel
      :key="tab"
      class="quote-tabs__panel"
      :pricing-view="pricingView"
    />
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap");

.quote-tabs {
  --quote-tabs-active: #0d6fc4;
  --quote-tabs-ink: #0d1836;
  --quote-tabs-muted: #4a5263;
  --quote-tabs-surface: #fafbfc;
  --quote-tabs-border: #e1e5eb;
  --quote-tabs-hover: #f0f4f9;
  --quote-tabs-radius: 12px;
  --quote-tabs-gap: 8px;

  width: min(700px, calc(100% - 32px));
  margin: 16px 16px 0;
  padding: 8px 12px 0;
  background: var(--quote-tabs-surface);
  border: 1px solid var(--quote-tabs-border);
  border-bottom: none;
  border-radius: var(--quote-tabs-radius) var(--quote-tabs-radius) 0 0;
  font-family: Montserrat, Roboto, sans-serif;
}

.quote-tabs__bar {
  height: auto;
  background: transparent;
}

.quote-tabs__bar :deep(.v-slide-group__container) {
  overflow: visible;
}

/* Wrapped tabs never need the slide group's scroll offset, which would hide the first row's start. */
.quote-tabs__bar :deep(.v-slide-group__content) {
  flex: 1 1 auto;
  flex-wrap: wrap;
  max-width: 100%;
  gap: 4px var(--quote-tabs-gap);
  transform: none !important;
}

.quote-tabs__tab {
  flex: 1 1 180px;
  min-width: 0;
  padding: 10px var(--quote-tabs-gap) var(--quote-tabs-gap);
  border-bottom: 2px solid transparent;
  border-radius: 0;
  text-transform: none;
  letter-spacing: normal;
  font-family: inherit;
}

.quote-tabs__tab :deep(.v-btn__content) {
  flex-direction: column;
  gap: var(--quote-tabs-gap);
  white-space: normal;
  text-align: center;
}

.quote-tabs__tab :deep(.v-btn__overlay) {
  display: none;
}

.quote-tabs__tab:hover {
  background: var(--quote-tabs-hover);
}

.quote-tabs__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--quote-tabs-ink);
}

.quote-tabs__subtitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--quote-tabs-muted);
}

.quote-tabs__tab.v-tab--selected {
  border-bottom-color: var(--quote-tabs-active);
}

.quote-tabs__tab.v-tab--selected .quote-tabs__title {
  color: var(--quote-tabs-active);
}

.quote-tabs__panel {
  padding-top: 0;
}

.quote-tabs__panel > :deep(.v-card) {
  border-top-left-radius: 0;
}
</style>
