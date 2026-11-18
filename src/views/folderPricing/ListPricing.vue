<script setup lang="ts">
import { computed, ref } from "vue";
import FolderTabs from "@/components/comun/FolderTabs.vue";
import QuoteListPanel from "@/components/folderPricing/QuoteListPanel.vue";
import { usePricingStore } from "@/stores/pricing";

type ListTab = "all" | "pending_send" | "pricing_requested" | "returned";

const TABS: { value: ListTab; title: string; subtitle: string; icon: string }[] = [
  { value: "all", title: "Todas las cotizaciones", subtitle: "Todos los registros del sistema", icon: "mdi-file-document-multiple-outline" },
  { value: "pending_send", title: "Solicitadas por Ventas", subtitle: "Pricing pendiente por cotizar", icon: "mdi-account-arrow-right-outline" },
  { value: "pricing_requested", title: "Enviadas al Cliente", subtitle: "Cotizaciones ya remitidas al cliente", icon: "mdi-send-check-outline" },
  { value: "returned", title: "Observadas por Pricing", subtitle: "Solicitudes retornadas a Ventas para corregir o completar información", icon: "mdi-alert-circle-outline" },
];

const tab = ref<ListTab>(usePricingStore().pricingView || "all");
const pricingView = computed(() => (tab.value === "all" ? "" : tab.value));
</script>

<template>
  <div>
    <header class="list-header">
      <h1 class="list-header__title">
        <v-icon icon="mdi-clipboard-text-outline" />
        Cotizaciones
      </h1>
      <p class="list-header__note">
        <v-icon
          icon="mdi-information"
          size="16"
        />
        Listado de solicitudes de cotización y su comunicación interna entre Ventas y Pricing
      </p>
    </header>
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
.list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin: 16px 16px 0;
}

.list-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
}

.list-header__note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 12px;
  border-radius: 8px;
  background: #e8f1fb;
  color: #0d6fc4;
  font-size: 12px;
}

.quote-list-panel {
  padding-top: 0;
}

.quote-list-panel > :deep(.v-card) {
  border-top-left-radius: 0;
}
</style>
