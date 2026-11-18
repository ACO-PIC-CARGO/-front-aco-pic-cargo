<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import InternalCommunicationThread from "./InternalCommunicationThread.vue";

const props = withDefaults(defineProps<{ quoteId: number | null; visible?: boolean }>(), { visible: true });

const BAR_HEIGHT = 56;
const open = ref(false);
const thread = ref<InstanceType<typeof InternalCommunicationThread>>();
const active = computed(() => props.visible && props.quoteId !== null);
watch(active, (isActive) => {
  if (!isActive) open.value = false;
});

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => window.addEventListener("keydown", closeOnEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));
</script>

<template>
  <v-layout-item
    position="bottom"
    :size="BAR_HEIGHT"
    :model-value="active"
    class="internal-bar"
    :class="{ 'internal-bar--open': open }"
  >
    <section
      v-show="active"
      class="internal-bar__sheet bg-surface"
      :class="{ 'internal-bar__sheet--open': open }"
      :style="{ '--internal-bar-height': `${BAR_HEIGHT}px` }"
      aria-label="Historial de comunicación interna"
    >
      <button
        type="button"
        class="internal-bar__toggle"
        :aria-expanded="open"
        aria-controls="internal-bar-content"
        @click="open = !open"
      >
        <v-icon
          icon="mdi-message-text"
          color="blue-darken-4"
          size="x-large"
        />
        <span class="internal-bar__title">Historial de comunicación interna ({{ thread?.count ?? 0 }})</span>
        <v-icon :icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
      </button>
      <div
        id="internal-bar-content"
        class="internal-bar__content"
        :inert="!open"
      >
        <InternalCommunicationThread
          v-if="quoteId !== null"
          ref="thread"
          :quote-id="quoteId"
        />
      </div>
    </section>
  </v-layout-item>
  <div
    class="history-bars-spacer"
    aria-hidden="true"
  />
</template>

<style scoped>
.history-bars-spacer {
  height: calc(2 * 56px + 32px);
}

.internal-bar {
  overflow: visible;
  z-index: 5;
}

.internal-bar--open {
  z-index: 6;
}

.internal-bar__sheet {
  position: absolute;
  inset: auto 0 0 0;
  height: 50vh;
  display: flex;
  flex-direction: column;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgba(var(--v-theme-on-surface), 0.12);
  transform: translateY(calc(100% - var(--internal-bar-height)));
  transition: transform 0.25s ease;
}

.internal-bar__sheet--open {
  transform: translateY(0);
}

.internal-bar__toggle {
  align-self: center;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--internal-bar-height);
  flex-shrink: 0;
}

.internal-bar__title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.internal-bar__content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 32px 20px;
}

@media (prefers-reduced-motion: reduce) {
  .internal-bar__sheet {
    transition: none;
  }
}
</style>
