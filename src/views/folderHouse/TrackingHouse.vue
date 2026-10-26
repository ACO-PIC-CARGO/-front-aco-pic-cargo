<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import "@/styles/aco-ui.css";
import PublicTrackingHeader from "@/components/PublicTracking/PublicTrackingHeader.vue";
import PublicPhaseTrack from "@/components/PublicTracking/PublicPhaseTrack.vue";
import NextStepCard from "@/components/PublicTracking/NextStepCard.vue";
import TrackingUpdatesCard from "@/components/PublicTracking/TrackingUpdatesCard.vue";
import { trackingUpdates } from "@/components/PublicTracking/publicTrackingFormat";
import { usePublicTrackingStore } from "@/stores/publicTracking";
import type { TrackingLoadError } from "@/stores/publicTracking";

const route = useRoute();
const store = usePublicTrackingStore();
const { tracking, loading } = storeToRefs(store);
const loadError = ref<TrackingLoadError | null>(null);
const updates = computed(() => (tracking.value ? trackingUpdates(tracking.value.phases) : []));

async function load() {
  loadError.value = await store.load(String(route.params.token));
}

onMounted(load);
</script>

<template>
  <v-theme-provider
    theme="aco"
    with-background
    class="aco-ui public-tracking"
  >
    <v-container class="public-tracking__content py-6">
      <h1 class="text-headline-small font-weight-bold mb-4">
        Seguimiento de tu carga
      </h1>
      <v-skeleton-loader
        v-if="loading && !tracking"
        type="card, card, card"
      />
      <v-alert
        v-else-if="loadError"
        :type="loadError.canRetry ? 'error' : 'info'"
        variant="tonal"
        :text="loadError.message"
      >
        <template
          v-if="loadError.canRetry"
          #append
        >
          <v-btn
            variant="text"
            @click="load"
          >
            Reintentar
          </v-btn>
        </template>
      </v-alert>
      <div
        v-else-if="tracking"
        class="d-flex flex-column ga-4"
      >
        <PublicTrackingHeader :tracking="tracking" />
        <PublicPhaseTrack
          v-if="tracking.phases.length"
          :phases="tracking.phases"
        />
        <NextStepCard
          v-if="tracking.next_step"
          :step="tracking.next_step"
          :time-zone="tracking.time_zone"
        />
        <TrackingUpdatesCard
          :updates="updates"
          :time-zone="tracking.time_zone"
        />
      </div>
    </v-container>
  </v-theme-provider>
</template>

<style scoped>
.public-tracking {
  min-height: 100vh;
}
.public-tracking__content {
  max-width: 960px;
}
</style>
