<script setup lang="ts">
import { computed } from "vue";

// sub: sub-paso (p. ej. 7.2) con número en píldora y separador, como en el diseño.
const props = defineProps<{
  number: number | string;
  title: string;
  subtitle?: string;
  sub?: boolean;
  active?: boolean;
  complete?: boolean;
  locked?: boolean;
}>();
const emit = defineEmits<{ select: [] }>();
// "7.2" → sub-paso aunque no se pase "sub".
const esSub = computed(() => props.sub || String(props.number).includes("."));
</script>

<template>
  <div
    class="ins-step"
    :class="{ 'is-active': active, 'is-complete': complete, 'is-locked': locked, 'is-sub': esSub }"
  >
    <button
      type="button"
      class="ins-step__head"
      :disabled="locked"
      @click="emit('select')"
    >
      <span class="ins-step__num">{{ number }}</span>
      <span
        v-if="esSub"
        class="ins-step__sep"
      />
      <span class="ins-step__title">
        {{ title }}
        <span
          v-if="subtitle"
          class="ins-step__subtitle"
        >{{ subtitle }}</span>
      </span>
      <slot name="aside" />
      <!-- "v" para abrir el paso (arriba cuando está abierto) -->
      <v-icon
        v-if="!locked"
        size="20"
        class="ins-step__chevron"
      >
        {{ active ? "mdi-chevron-up" : "mdi-chevron-down" }}
      </v-icon>
    </button>
    <v-expand-transition>
      <div
        v-if="active"
        class="ins-step__body"
      >
        <slot />
      </div>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.ins-step {
  border: 1px solid transparent;
  border-radius: 12px;
  margin-bottom: 4px;
  transition: background-color 0.2s, border-color 0.2s;
}
.ins-step.is-active {
  background: #eaf2ff;
  border-color: #c9dcfb;
}
.ins-step__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
}
.ins-step:not(.is-active):not(.is-locked) .ins-step__head:hover {
  background: #f1f4f9;
}
.ins-step.is-locked .ins-step__head {
  cursor: not-allowed;
}
.ins-step.is-locked .ins-step__title {
  color: #9ca3af;
}
.ins-step__num {
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #6b7280;
  background: #e5e7eb;
  transition: background-color 0.2s, color 0.2s;
}
.ins-step.is-complete .ins-step__num {
  color: #ffffff;
  background: #22a559;
}
.ins-step.is-active .ins-step__num {
  color: #ffffff;
  background: #1f73e8;
}
.ins-step.is-active.is-complete .ins-step__num {
  background: #22a559;
  box-shadow: 0 0 0 3px #c9dcfb;
}
.ins-step__title {
  flex: 1;
  font-size: 14px;
  line-height: 1.25;
  color: #1f2a44;
}
.ins-step.is-complete .ins-step__title {
  color: #15803d;
}
.ins-step.is-active .ins-step__title {
  font-weight: 700;
  color: #1f73e8;
}
.ins-step.is-sub .ins-step__num {
  flex: 0 0 auto;
  width: auto;
  min-width: 42px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
}
.ins-step__sep {
  align-self: stretch;
  width: 2px;
  margin: 2px 0;
  background: #c9d3e3;
  border-radius: 2px;
}
.ins-step.is-active .ins-step__sep {
  background: #1f73e8;
}
.ins-step__subtitle {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #5b6b85;
}
.ins-step__chevron {
  color: #1f73e8;
}
.ins-step__body {
  margin: 0 10px 10px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #dfe7f3;
  border-radius: 10px;
}
.ins-step__body :deep(.text-red) {
  font-size: 12px;
  line-height: 1.35;
  margin-bottom: 6px;
}
</style>
