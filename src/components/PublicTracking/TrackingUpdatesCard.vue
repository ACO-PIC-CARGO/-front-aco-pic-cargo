<script setup lang="ts">
import { computed, ref } from "vue";
import { stepDateTimeLabel } from "@/components/HouseFile/houseTrackingFormat";
import type { TrackingUpdate } from "./publicTrackingFormat";

const LATEST_COUNT = 3;

const props = defineProps<{ updates: TrackingUpdate[]; timeZone: string }>();
const showAll = ref(false);
const shown = computed(() => (showAll.value ? props.updates : props.updates.slice(0, LATEST_COUNT)));
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    class="pa-4"
    aria-labelledby="tracking-updates-title"
  >
    <h2
      id="tracking-updates-title"
      class="text-title-medium font-weight-bold ma-0 mb-2"
    >
      Últimas actualizaciones
    </h2>
    <p
      v-if="!updates.length"
      class="text-body-medium text-medium-emphasis"
    >
      Aún no hay actualizaciones. Aquí verás cada avance de tu carga.
    </p>
    <v-list
      v-else
      id="tracking-updates-list"
      class="pa-0"
    >
      <template
        v-for="(update, index) in shown"
        :key="update.key"
      >
        <v-divider
          v-if="index"
          color="border"
          class="border-opacity-100"
        />
        <v-list-item class="px-0 py-2">
          <template #prepend>
            <v-avatar
              size="40"
              color="primary-soft"
              class="me-3"
            >
              <v-icon
                :icon="update.icon"
                color="primary"
                size="20"
              />
            </v-avatar>
          </template>
          <div class="d-flex flex-wrap align-center gc-4 gr-1">
            <span class="text-body-medium text-medium-emphasis text-no-wrap">
              {{ stepDateTimeLabel(update.at, timeZone) }}
            </span>
            <span class="text-body-medium text-break">{{ update.text }}</span>
          </div>
        </v-list-item>
      </template>
    </v-list>
    <v-btn
      v-if="updates.length > LATEST_COUNT"
      variant="outlined"
      color="primary"
      size="small"
      class="mt-3 text-none"
      prepend-icon="mdi-format-list-bulleted"
      :append-icon="showAll ? 'mdi-chevron-up' : 'mdi-chevron-right'"
      :aria-expanded="showAll"
      aria-controls="tracking-updates-list"
      @click="showAll = !showAll"
    >
      {{ showAll ? "Ver menos" : "Ver historial completo" }}
    </v-btn>
  </v-card>
</template>
