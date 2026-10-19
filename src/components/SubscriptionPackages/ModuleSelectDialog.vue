<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import type { SubscriptionPackage } from "@/types/suscripciones";

const props = withDefaults(
  defineProps<{ pkg?: SubscriptionPackage | null; confirmLabel?: string }>(),
  { pkg: null, confirmLabel: "Continuar al pago" },
);
const modelValue = defineModel<boolean>({ default: false });
const emit = defineEmits<{ confirm: [moduleIds: number[]] }>();

const { xs } = useDisplay();

const selectedIds = ref<number[]>([]);

const limit = computed(() => (props.pkg ? props.pkg.module_selection_limit : 0));
const limitLabel = computed(() => (limit.value === 1 ? "1 módulo" : `${limit.value} módulos`));
const isComplete = computed(() => selectedIds.value.length === limit.value);
const countLabel = computed(() => `Elegiste ${selectedIds.value.length} de ${limit.value}.`);

watch(modelValue, (isOpen) => {
  if (isOpen) selectedIds.value = [];
});

function isLocked(moduleId: number) {
  return isComplete.value && !selectedIds.value.includes(moduleId);
}
function close() {
  modelValue.value = false;
}
function confirm() {
  if (!isComplete.value) return;
  emit("confirm", [...selectedIds.value]);
  close();
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    persistent
    :fullscreen="xs"
    content-class="plans-theme plans-theme--app package-dialog"
  >
    <v-form
      v-if="pkg"
      class="module-select"
      aria-labelledby="module-select-title"
      @submit.prevent="confirm"
    >
      <header class="module-select__header">
        <div>
          <h2
            id="module-select-title"
            class="module-select__title"
          >
            Elige tus módulos
          </h2>
          <p class="module-select__subtitle">
            ACO {{ pkg.name }} incluye {{ limitLabel }} a elegir. Los usarás
            desde que se active tu plan.
          </p>
        </div>
        <v-btn
          variant="text"
          icon
          class="icon-button"
          aria-label="Cerrar"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </header>

      <fieldset class="module-select__options">
        <legend class="module-select__legend">
          Módulos
        </legend>
        <v-checkbox
          v-for="module in pkg.modules"
          :key="module.id"
          v-model="selectedIds"
          class="module-select__option"
          :value="module.id"
          :label="module.name"
          :disabled="isLocked(module.id)"
          hide-details
          density="compact"
        />
      </fieldset>
      <p
        class="module-select__count"
        aria-live="polite"
      >
        {{ countLabel }}
      </p>

      <footer class="module-select__footer">
        <v-btn
          variant="text"
          class="plans-button plans-button--ghost"
          @click="close"
        >
          Cancelar
        </v-btn>
        <v-btn
          variant="text"
          type="submit"
          class="plans-button plans-button--primary"
          :disabled="!isComplete"
        >
          {{ confirmLabel }}
        </v-btn>
      </footer>
    </v-form>
  </v-dialog>
</template>

<style scoped>
.module-select {
  display: flex;
  flex-direction: column;
  color: var(--planes-text);
  background: var(--planes-bg);
}

.module-select :where(h2, p, fieldset, legend) {
  margin: 0;
  padding: 0;
  border: 0;
}

.module-select__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--planes-divider);
}

.module-select__title {
  font-size: 22px;
  font-weight: 700;
}

.module-select__subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.module-select__options {
  display: grid;
  gap: 10px;
  padding: 20px 24px 8px;
}

.module-select__legend {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--planes-accent);
}

.plans-theme .module-select__option.v-input {
  align-items: center;
  min-height: 44px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid var(--planes-border);
  border-radius: var(--planes-radius-control);
}

.plans-theme .module-select__option.v-input:not(.v-input--disabled) :deep(.v-label) {
  color: var(--planes-text);
}

.plans-theme .module-select__option :deep(.v-selection-control--dirty .v-icon) {
  color: var(--planes-accent) !important;
}

.module-select__count {
  padding: 0 24px 16px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.module-select__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--planes-divider);
}

@media (max-width: 600px) {
  .module-select__header,
  .module-select__options,
  .module-select__count,
  .module-select__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .module-select__footer .plans-button {
    flex: 1;
  }
}
</style>
