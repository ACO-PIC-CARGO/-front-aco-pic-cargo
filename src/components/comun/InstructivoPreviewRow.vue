<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  hint?: string;
  active?: boolean;
}>();
</script>

<template>
  <div
    class="ins-row"
    :class="{ 'is-active': active }"
  >
    <div class="ins-row__icon">
      <v-icon size="20">
        {{ icon }}
      </v-icon>
    </div>
    <div class="ins-row__label">
      {{ label }}
      <span
        v-if="hint"
        class="ins-row__hint"
      >{{ hint }}</span>
    </div>
    <div class="ins-row__value">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ins-row {
  display: grid;
  grid-template-columns: 36px 220px 1fr;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  border-radius: 10px;
  transition: background-color 0.3s, box-shadow 0.3s;
}
.ins-row.is-active {
  background: #eaf2ff;
  box-shadow: 0 0 0 2px #9cc0f7;
}
.ins-row__icon {
  display: flex;
  justify-content: center;
  color: #5b6b85;
}
.ins-row.is-active .ins-row__icon {
  color: #1f73e8;
}
.ins-row__label {
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
  line-height: 1.25;
  padding: 6px 0;
}
.ins-row__hint {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: #dc2626;
}
.ins-row__value {
  min-height: 34px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 13px;
  color: #111827;
  background: #ffffff;
  border: 1px solid #e3e8f0;
  border-radius: 8px;
  word-break: break-word;
}
@media (max-width: 960px) {
  .ins-row {
    grid-template-columns: 30px 1fr;
  }
  .ins-row__value {
    grid-column: 1 / -1;
  }
}
</style>
