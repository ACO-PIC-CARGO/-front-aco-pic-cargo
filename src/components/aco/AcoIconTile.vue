<script setup lang="ts">
const ICON_SIZES = { sm: 18, md: 24, lg: 32 } as const;

withDefaults(
  defineProps<{ icon: string; size?: keyof typeof ICON_SIZES; tone?: "primary" | "neutral" | "solid" }>(),
  { size: "md", tone: "primary" },
);
</script>

<template>
  <span
    class="aco-icon-tile"
    :class="[`aco-icon-tile--${size}`, `aco-icon-tile--${tone}`]"
    aria-hidden="true"
  >
    <v-icon
      :icon="icon"
      :size="ICON_SIZES[size]"
    />
  </span>
</template>

<style scoped>
.aco-icon-tile {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color var(--aco-transition), color var(--aco-transition);
}

.aco-icon-tile--sm {
  width: 36px;
  height: 36px;
}

.aco-icon-tile--md {
  width: 48px;
  height: 48px;
}

.aco-icon-tile--lg {
  width: 64px;
  height: 64px;
}

.aco-icon-tile--primary {
  background: rgb(var(--v-theme-primary-soft));
  color: rgb(var(--v-theme-primary));
}

.aco-icon-tile--neutral {
  background: rgb(var(--v-theme-neutral-soft));
  color: rgb(var(--v-theme-neutral));
}

.aco-icon-tile--solid {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>
