<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BOTTOM_BAR_HEIGHT, BOTTOM_SHEET_HEIGHT, openBottomBars } from "./bottomBar";

const props = withDefaults(
  defineProps<{ icon: string; title: string; label: string; contentId: string; active?: boolean; expands?: boolean }>(),
  { active: true, expands: true },
);
const emit = defineEmits<{ activate: [] }>();

const open = ref(false);

function onBarClick() {
  if (props.expands) open.value = !open.value;
  else emit("activate");
}
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
          :aria-expanded="expands ? open : undefined"
          :aria-controls="expands ? contentId : undefined"
          :aria-haspopup="expands ? undefined : 'dialog'"
          @click="onBarClick"
        >
          <v-icon
            :icon="icon"
            color="blue-darken-4"
            size="x-large"
          />
          <span
            class="bottom-bar__divider"
            aria-hidden="true"
          />
          <span class="bottom-bar__title">{{ title }}</span>
        </button>
        <div class="bottom-bar__end">
          <slot
            name="header"
            :open="open"
          />
          <v-icon
            :icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'"
            color="blue-darken-4"
            size="large"
          />
        </div>
      </header>
      <div
        v-if="expands"
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
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: calc(var(--bottom-bar-height) - 8px);
  margin: 4px 16px;
  padding: 0 16px;
  flex-shrink: 0;
  border: 1.5px solid rgb(var(--v-theme-secondary));
  border-radius: 12px;
  background: linear-gradient(rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-primary), 0.18));
}

.bottom-bar__toggle {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  height: calc(var(--bottom-bar-height) - 8px);
}

/* The whole bar opens the sheet; the header slot sits above this hit area. */
.bottom-bar__toggle::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.bottom-bar__divider {
  width: 2px;
  height: 28px;
  background: rgb(var(--v-theme-on-surface));
}

.bottom-bar__end {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 16px;
}

.bottom-bar__end > :deep(:not(.v-icon)) {
  position: relative;
  z-index: 1;
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

@media (max-width: 599px) {
  .bottom-bar__bar {
    grid-template-columns: minmax(0, 1fr) auto;
    margin: 4px 8px;
    padding: 0 12px;
  }

  .bottom-bar__toggle {
    grid-column: 1;
    min-width: 0;
  }

  .bottom-bar__end {
    display: contents;
  }

  .bottom-bar__end > .v-icon {
    grid-area: 1 / 2;
  }

  .bottom-bar__end > :deep(:not(.v-icon)) {
    grid-column: 1 / -1;
    margin-bottom: 8px;
  }

  .bottom-bar__title {
    min-width: 0;
    overflow: hidden;
    font-size: 1.125rem;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .bottom-bar__content {
    padding: 4px 12px 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-bar__sheet {
    transition: none;
  }
}
</style>
