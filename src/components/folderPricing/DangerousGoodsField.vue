<script setup lang="ts">
import { useId } from "vue";

withDefaults(defineProps<{ modelValue?: boolean | null; readonly?: boolean }>(), { readonly: false });
defineEmits<{ "update:modelValue": [value: boolean | null] }>();

const answers = [
  { title: "Sí", value: true },
  { title: "No", value: false },
];
const DOCUMENTS = ["MSDS", "CNASS"];
const inputId = useId();
</script>

<template>
  <div
    class="my-1"
    :class="{ 'dangerous-goods-section rounded-lg pa-3': modelValue === true }"
  >
    <div class="d-flex align-center ga-3">
      <label
        :for="inputId"
        class="dangerous-goods__question"
        :class="{ 'text-red-darken-2': modelValue === true }"
      >
        <v-icon
          icon="mdi-alert-outline"
          size="20"
        />
        ¿Mercancía peligrosa (DG/IMO)?
      </label>
      <v-select
        :id="inputId"
        :model-value="modelValue"
        placeholder="Selecciona"
        variant="outlined"
        density="compact"
        hide-details
        :items="answers"
        :readonly="readonly"
        :clearable="!readonly"
        @update:model-value="$emit('update:modelValue', $event ?? null)"
      />
    </div>
    <div
      v-if="modelValue === true"
      class="d-flex flex-wrap align-center ga-4 mt-3"
    >
      <div class="d-flex align-center ga-3 dangerous-goods__documents">
        <v-icon
          icon="mdi-file-document-alert-outline"
          color="red-darken-2"
          size="32"
        />
        <div>
          <div class="font-weight-medium">
            Debes solicitar al cliente los siguientes documentos:
          </div>
          <div class="d-flex ga-2 mt-1">
            <v-chip
              v-for="document in DOCUMENTS"
              :key="document"
              color="blue-darken-3"
              variant="outlined"
              prepend-icon="mdi-file-document-outline"
              label
              size="small"
            >
              {{ document }}
            </v-chip>
          </div>
        </div>
      </div>
      <v-divider vertical />
      <div class="d-flex align-center ga-2 text-red-darken-2 font-weight-bold dangerous-goods__warning">
        <v-icon icon="mdi-alert-circle" />
        Sin estos documentos no podrás cotizar.
      </div>
    </div>
  </div>
</template>

<style scoped>
.dangerous-goods-section {
  background-color: rgba(var(--v-theme-error), 0.08) !important;
  border: 1px solid rgb(var(--v-theme-error)) !important;
}

.dangerous-goods__documents {
  flex: 1 1 260px;
}

.dangerous-goods__warning {
  flex: 0 1 200px;
}

.dangerous-goods__question {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
