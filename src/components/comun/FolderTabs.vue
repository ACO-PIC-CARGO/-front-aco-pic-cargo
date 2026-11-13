<script setup lang="ts" generic="T extends string | number">
defineProps<{ items: { value: T; title: string; subtitle?: string }[] }>();

const selected = defineModel<T>({ required: true });
</script>

<template>
  <div class="folder-tabs">
    <v-tabs
      v-model="selected"
      class="folder-tabs__bar"
      height="auto"
      hide-slider
      grow
    >
      <v-tab
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :ripple="false"
        class="folder-tabs__tab"
      >
        <span class="folder-tabs__title">{{ item.title }}</span>
        <span
          v-if="item.subtitle"
          class="folder-tabs__subtitle"
        >{{ item.subtitle }}</span>
      </v-tab>
    </v-tabs>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700&display=swap");

.folder-tabs {
  --folder-tabs-active: #0d6fc4;
  --folder-tabs-ink: #0d1836;
  --folder-tabs-muted: #4a5263;
  --folder-tabs-surface: #fafbfc;
  --folder-tabs-border: #e1e5eb;
  --folder-tabs-hover: #f0f4f9;
  --folder-tabs-radius: 12px;
  --folder-tabs-gap: 8px;

  width: min(700px, calc(100% - 32px));
  margin: 16px 16px 0;
  padding: 8px 12px 0;
  background: var(--folder-tabs-surface);
  border: 1px solid var(--folder-tabs-border);
  border-bottom: none;
  border-radius: var(--folder-tabs-radius) var(--folder-tabs-radius) 0 0;
  font-family: Montserrat, Roboto, sans-serif;
}

.folder-tabs__bar {
  height: auto;
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
  gap: 4px var(--folder-tabs-gap);
  transform: none !important;
}

.folder-tabs__tab {
  flex: 1 1 180px;
  min-width: 0;
  padding: 10px var(--folder-tabs-gap) var(--folder-tabs-gap);
  border-bottom: 2px solid transparent;
  border-radius: 0;
  text-transform: none;
  letter-spacing: normal;
  font-family: inherit;
}

.folder-tabs__tab :deep(.v-btn__content) {
  flex-direction: column;
  gap: var(--folder-tabs-gap);
  white-space: normal;
  text-align: center;
}

.folder-tabs__tab :deep(.v-btn__overlay) {
  display: none;
}

.folder-tabs__tab:hover {
  background: var(--folder-tabs-hover);
}

.folder-tabs__title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--folder-tabs-ink);
}

.folder-tabs__subtitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--folder-tabs-muted);
}

.folder-tabs__tab.v-tab--selected {
  border-bottom-color: var(--folder-tabs-active);
}

.folder-tabs__tab.v-tab--selected .folder-tabs__title {
  color: var(--folder-tabs-active);
}
</style>
