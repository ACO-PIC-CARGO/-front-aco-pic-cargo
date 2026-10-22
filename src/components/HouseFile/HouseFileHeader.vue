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
  <v-card
    tag="header"
    variant="flat"
    border
    rounded="lg"
    class="d-flex flex-wrap align-center gc-6 gr-2 px-4 py-2"
  >
    <div class="d-flex align-center ga-2">
      <v-icon
        icon="mdi-file-document-outline"
        color="primary"
        size="22"
      />
      <div>
        <div class="text-body-small text-medium-emphasis">
          Expediente
        </div>
        <div class="d-flex align-center ga-2 text-body-medium font-weight-bold">
          {{ shown(housesStore.house.code_house) }}
          <v-chip
            v-if="housesStore.house.incoterms"
            size="x-small"
            color="primary"
            variant="tonal"
            label
          >
            {{ housesStore.house.incoterms }}
          </v-chip>
        </div>
      </div>
    </div>
    <div
      v-for="item in items"
      :key="item.label"
      class="d-flex align-center ga-2"
    >
      <v-icon
        :icon="item.icon"
        color="primary"
        size="20"
      />
      <div>
        <div class="text-body-small text-medium-emphasis">
          {{ item.label }}
        </div>
        <div class="text-body-medium font-weight-bold">
          {{ item.value }}
        </div>
      </div>
    </div>
    <div class="ms-auto">
      <TrackingLinkButton :house-id="houseId" />
    </div>
  </v-card>
</template>
