<script setup lang="ts">
import { computed } from "vue";
import { nextStepDateLabel } from "./publicTrackingFormat";
import type { PublicNextStep } from "@/types/publicTracking";

const props = defineProps<{ step: PublicNextStep; timeZone: string }>();
const dateLabel = computed(() => nextStepDateLabel(props.step.date, props.timeZone));
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    color="primary-soft"
    class="pa-4"
    aria-labelledby="next-step-title"
  >
    <h2
      id="next-step-title"
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
          :icon="step.icon"
          color="primary"
          size="28"
        />
      </v-avatar>
      <div>
        <div class="text-title-large font-weight-bold">
          {{ step.name }}
        </div>
        <div class="text-body-large text-medium-emphasis">
          <template v-if="step.date">
            Estimado para <strong class="text-high-emphasis">{{ dateLabel }}</strong>
          </template>
          <template v-else>
            {{ dateLabel }}
          </template>
        </div>
        <div class="text-body-small text-medium-emphasis">
          Fecha estimada; puede cambiar.
        </div>
      </div>
    </v-card>
  </v-card>
</template>
