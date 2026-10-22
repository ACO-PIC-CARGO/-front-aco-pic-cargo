<script setup lang="ts">
import { calendarDateLabel, transportIcon } from "./publicTrackingFormat";

defineProps<{ port: string; eta: string; shipment: string | null }>();
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    color="primary-soft"
    class="pa-4"
    aria-labelledby="next-arrival-title"
  >
    <h2
      id="next-arrival-title"
      class="text-title-medium font-weight-bold ma-0 mb-3"
    >
      Próximo movimiento estimado
    </h2>
    <v-card
      variant="flat"
      border
      rounded="lg"
      class="d-flex align-center ga-4 pa-4"
    >
      <v-avatar
        size="56"
        color="primary-soft"
      >
        <v-icon
          :icon="transportIcon(shipment)"
          color="primary"
          size="28"
        />
      </v-avatar>
      <div>
        <div class="text-title-large font-weight-bold">
          Llegada a {{ port }}
        </div>
        <div class="text-body-large text-medium-emphasis">
          Estimado para <strong class="text-high-emphasis">{{ calendarDateLabel(eta) }}</strong>
        </div>
        <div class="text-body-small text-medium-emphasis">
          Fecha estimada sujeta a actualización según naviera.
        </div>
      </div>
    </v-card>
  </v-card>
</template>
