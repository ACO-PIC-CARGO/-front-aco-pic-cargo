<script setup lang="ts" generic="T extends string | number">
defineProps<{ items: { value: T; title: string; subtitle?: string; icon?: string }[] }>();

const selected = defineModel<T>({ required: true });
</script>

<template>
  <div class="folder-tabs">
    <v-tabs
      v-model="selected"
      class="folder-tabs__bar"
      height="auto"
      hide-slider
    >
      <v-tab
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :ripple="false"
        class="folder-tabs__tab"
      >
        <v-icon
          v-if="item.icon"
          :icon="item.icon"
          size="28"
          class="folder-tabs__icon"
        />
        <span class="folder-tabs__text">
          <span class="folder-tabs__title">{{ item.title }}</span>
          <span
            v-if="item.subtitle"
            class="folder-tabs__subtitle"
          >{{ item.subtitle }}</span>
        </span>
      </v-tab>
    </v-tabs>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap");

.folder-tabs {
  --folder-tabs-active: #0d6fc4;
  --folder-tabs-on-active: #ffffff;
  --folder-tabs-ink: #0d1836;
  --folder-tabs-muted: #4a5263;
  --folder-tabs-surface: #fafbfc;
  --folder-tabs-border: #e1e5eb;
  --folder-tabs-hover: #f0f4f9;
  --folder-tabs-radius: 12px;
  --folder-tabs-gap: 8px;

  margin: 16px 16px 12px;
  font-family: Montserrat, Roboto, sans-serif;
}

.folder-tabs__bar {
  height: auto;
  overflow: visible;
  background: transparent;
}

.folder-tabs__bar :deep(.v-slide-group__container) {
  overflow: visible;
}

/* Wrapped tabs never need the slide group's scroll offset, which would hide the first row's start. */
.folder-tabs__bar :deep(.v-slide-group__content) {
  flex: 1 1 auto;
  flex-wrap: wrap;
  max-width: 100%;
  gap: var(--folder-tabs-gap);
  transform: none !important;
}

.folder-tabs__tab {
  flex: 1 1 0;
  min-width: 220px;
  max-width: 360px;
  justify-content: flex-start;
  padding: 12px 16px;
  border: 1px solid var(--folder-tabs-border);
  border-radius: var(--folder-tabs-radius);
  background: var(--folder-tabs-surface);
  overflow: visible;
  text-transform: none;
  letter-spacing: normal;
  font-family: inherit;
}

.folder-tabs__tab :deep(.v-btn__content) {
  gap: 12px;
  white-space: normal;
  text-align: start;
}

.folder-tabs__tab :deep(.v-btn__overlay) {
  display: none;
}

.folder-tabs__tab:hover {
  background: var(--folder-tabs-hover);
}

.folder-tabs__tab:focus-visible {
  outline: 2px solid var(--folder-tabs-active);
  outline-offset: 2px;
}

.folder-tabs__icon {
  flex-shrink: 0;
  color: var(--folder-tabs-ink);
}

.folder-tabs__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.folder-tabs__title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--folder-tabs-ink);
}

.folder-tabs__subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--folder-tabs-muted);
}

.folder-tabs__tab.v-tab--selected {
  border-color: var(--folder-tabs-active);
  background: var(--folder-tabs-active);
}

.folder-tabs__tab.v-tab--selected::after {
  content: "";
  position: absolute;
  top: auto;
  right: auto;
  bottom: -8px;
  left: 50%;
  width: 0;
  height: 0;
  opacity: 1;
  border-radius: 0;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: var(--folder-tabs-active);
  border-bottom: 0;
}

.folder-tabs__tab.v-tab--selected :is(.folder-tabs__icon, .folder-tabs__title, .folder-tabs__subtitle) {
  color: var(--folder-tabs-on-active);
}
</style>
