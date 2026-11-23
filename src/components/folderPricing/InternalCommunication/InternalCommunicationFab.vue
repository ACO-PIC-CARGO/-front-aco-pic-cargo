<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { BOTTOM_BAR_HEIGHT, BOTTOM_SHEET_HEIGHT, openBottomBars } from "../bottomBar";
import InternalCommunicationThread from "./InternalCommunicationThread.vue";

const props = withDefaults(defineProps<{ quoteId: number | null; visible?: boolean }>(), { visible: true });

const TITLE = "Historial de comunicación interna";
const FAB_GAP = 16;

const open = ref(false);
const thread = ref<InstanceType<typeof InternalCommunicationThread>>();
const active = computed(() => props.visible && props.quoteId !== null);
const count = computed(() => thread.value?.count ?? 0);
const fabBottom = computed(() =>
  openBottomBars.size ? `calc(${BOTTOM_SHEET_HEIGHT} + ${FAB_GAP}px)` : `${BOTTOM_BAR_HEIGHT + FAB_GAP}px`,
);

watch(active, (value) => {
  if (!value) open.value = false;
});
</script>

<template>
  <template v-if="quoteId !== null">
    <div
      v-show="active"
      class="history-fab"
      :style="{ bottom: fabBottom }"
    >
      <v-tooltip
        :text="TITLE"
        location="left"
      >
        <template #activator="{ props: tooltip }">
          <v-badge
            :model-value="count > 0"
            :content="count"
            color="error"
          >
            <v-btn
              v-bind="tooltip"
              icon
              size="large"
              color="blue-darken-4"
              :aria-label="TITLE"
              @click="open = true"
            >
              <span class="history-fab__letter">H</span>
            </v-btn>
          </v-badge>
        </template>
      </v-tooltip>
    </div>
    <v-dialog
      v-model="open"
      max-width="960"
      scrollable
      eager
      :aria-label="TITLE"
    >
      <v-card>
        <v-card-title class="text-wrap">
          {{ TITLE }} ({{ count }})
        </v-card-title>
        <v-card-text>
          <InternalCommunicationThread
            ref="thread"
            hide-header
            :quote-id="quoteId"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="open = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
</template>

<style scoped>
.history-fab {
  position: fixed;
  right: 24px;
  z-index: 7;
  transition: bottom 0.25s ease;
}

.history-fab__letter {
  font-size: 1.5rem;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .history-fab {
    transition: none;
  }
}
</style>
