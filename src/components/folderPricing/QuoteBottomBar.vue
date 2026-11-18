<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BOTTOM_BAR_HEIGHT, BOTTOM_SHEET_HEIGHT, openBottomBars } from "./bottomBar";

const props = withDefaults(
  defineProps<{ icon: string; title: string; label: string; contentId: string; active?: boolean }>(),
  { active: true },
);

const open = ref(false);
const isActive = computed(() => props.active);
watch(isActive, (value) => {
  if (!value) open.value = false;
});
watch(open, (value) => (value ? openBottomBars.add(props.contentId) : openBottomBars.delete(props.contentId)));

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => window.addEventListener("keydown", closeOnEscape));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", closeOnEscape);
  openBottomBars.delete(props.contentId);
});
</script>

<template>
  <v-layout-item
    position="bottom"
    :size="BOTTOM_BAR_HEIGHT"
    :model-value="active"
    class="bottom-bar"
    :class="{ 'bottom-bar--open': open }"
  >
    <section
      v-show="active"
      class="bottom-bar__sheet bg-surface"
      :class="{ 'bottom-bar__sheet--open': open }"
      :style="{ '--bottom-bar-height': `${BOTTOM_BAR_HEIGHT}px`, '--bottom-sheet-height': BOTTOM_SHEET_HEIGHT }"
      :aria-label="label"
    >
      <header class="bottom-bar__bar">
        <button
          type="button"
          class="bottom-bar__toggle"
          :aria-expanded="open"
          :aria-controls="contentId"
          @click="open = !open"
        >
          <v-icon
            :icon="icon"
            color="blue-darken-4"
            size="x-large"
          />
          <span class="bottom-bar__title">{{ title }}</span>
          <v-icon :icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
        </button>
        <div
          v-if="$slots.header"
          class="bottom-bar__extra"
        >
          <slot
            name="header"
            :open="open"
          />
        </div>
      </header>
      <div
        :id="contentId"
        class="bottom-bar__content"
        :inert="!open"
      >
        <slot />
      </div>
    </section>
  </v-layout-item>
</template>

<style scoped>
.bottom-bar {
  overflow: visible;
  z-index: 5;
}

.bottom-bar--open {
  z-index: 6;
}

.bottom-bar__sheet {
  position: absolute;
  inset: auto 0 0 0;
  height: var(--bottom-sheet-height);
  display: flex;
  flex-direction: column;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgba(var(--v-theme-on-surface), 0.12);
  transform: translateY(calc(100% - var(--bottom-bar-height)));
  transition: transform 0.25s ease;
}

.bottom-bar__sheet--open {
  transform: translateY(0);
}

.bottom-bar__bar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: var(--bottom-bar-height);
  padding: 0 32px;
  flex-shrink: 0;
}

.bottom-bar__toggle {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--bottom-bar-height);
}

.bottom-bar__extra {
  grid-column: 3;
  justify-self: end;
}

.bottom-bar__title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.bottom-bar__content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 32px 20px;
}

@media (prefers-reduced-motion: reduce) {
  .bottom-bar__sheet {
    transition: none;
  }
}
</style>
