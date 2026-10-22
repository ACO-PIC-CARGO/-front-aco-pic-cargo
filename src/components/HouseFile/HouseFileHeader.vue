<script setup lang="ts">
import { computed } from "vue";
import { useHousesStore } from "@/stores/houses";
import TrackingLinkButton from "./TrackingLinkButton.vue";

defineProps<{ houseId: number }>();

const housesStore = useHousesStore();
const shown = (value: unknown, unit = "") => (value || value === 0 ? `${value}${unit}` : "—");
const items = computed(() => [
  { icon: "mdi-account-outline", label: "Cliente", value: shown(housesStore.house.consigner) },
  { icon: "mdi-office-building-outline", label: "Proveedor", value: shown(housesStore.house.proveedor) },
  { icon: "mdi-weight", label: "Peso", value: shown(housesStore.house.peso, " kg") },
  { icon: "mdi-cube-outline", label: "Volumen", value: shown(housesStore.house.volumen, " m³") },
  { icon: "mdi-anchor", label: "Incoterm", value: shown(housesStore.house.incoterms) },
]);
</script>

<template>
  <header class="aco-card house-file-header">
    <div class="house-file-header__item">
      <v-icon
        icon="mdi-file-document-outline"
        size="32"
      />
      <div>
        <p class="aco-caption">
          Expediente
        </p>
        <p class="aco-title-row">
          {{ shown(housesStore.house.code_house) }}
        </p>
        <span
          v-if="housesStore.house.incoterms"
          class="aco-chip aco-chip--primary"
        >{{ housesStore.house.incoterms }}</span>
      </div>
    </div>
    <div
      v-for="item in items"
      :key="item.label"
      class="house-file-header__item"
    >
      <v-icon
        :icon="item.icon"
        size="28"
      />
      <div>
        <p class="aco-caption">
          {{ item.label }}
        </p>
        <p class="aco-title-row">
          {{ item.value }}
        </p>
      </div>
    </div>
    <div class="house-file-header__action">
      <TrackingLinkButton :house-id="houseId" />
    </div>
  </header>
</template>

<style scoped>
.house-file-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-4) var(--aco-space-5);
  padding: var(--aco-space-4) var(--aco-space-5);
}

.house-file-header__item {
  display: flex;
  flex: 1 1 150px;
  align-items: center;
  gap: var(--aco-space-3);
  min-width: 0;
  color: rgb(var(--v-theme-on-surface));
}

.house-file-header__action {
  margin-left: auto;
}
</style>
