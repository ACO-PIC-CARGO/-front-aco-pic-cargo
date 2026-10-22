<script setup lang="ts">
import { computed } from "vue";
import { displayValue } from "@/components/HouseFile/houseTrackingFormat";
import type { PublicTracking } from "@/types/publicTracking";

const props = defineProps<{ tracking: PublicTracking }>();
const items = computed(() => [
  { label: "Expediente", value: displayValue(props.tracking.house_code) },
  { label: "Cliente", value: displayValue(props.tracking.client) },
  { label: "Proveedor", value: displayValue(props.tracking.supplier) },
  { label: "Incoterm", value: displayValue(props.tracking.incoterm) },
  { label: "Peso", value: displayValue(props.tracking.weight, " kg") },
  { label: "Volumen", value: displayValue(props.tracking.volume, " m³") },
]);
</script>

<template>
  <v-card
    tag="header"
    variant="flat"
    border
    rounded="lg"
    class="pa-4"
  >
    <dl class="d-flex flex-wrap gc-10 gr-3 ma-0">
      <div
        v-for="item in items"
        :key="item.label"
      >
        <dt class="text-body-small text-medium-emphasis">
          {{ item.label }}
        </dt>
        <dd class="text-body-large font-weight-bold ma-0">
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </v-card>
</template>
