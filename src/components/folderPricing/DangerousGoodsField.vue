<script setup lang="ts">
withDefaults(defineProps<{ modelValue?: boolean | null; readonly?: boolean }>(), { readonly: false });
defineEmits<{ "update:modelValue": [value: boolean | null] }>();

const answers = [
  { title: "Sí", value: true },
  { title: "No", value: false },
];
</script>

<template>
  <div>
    <v-select
      :model-value="modelValue"
      label="¿Mercancía peligrosa (DG/IMO)?"
      variant="outlined"
      density="compact"
      class="my-1"
      :items="answers"
      :readonly="readonly"
      :clearable="!readonly"
      @update:model-value="$emit('update:modelValue', $event ?? null)"
    />
    <v-alert
      v-if="modelValue === true"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-2"
    >
      <div class="d-flex flex-wrap align-center justify-space-between ga-2">
        <div>
          <div>Debes solicitar al cliente los siguientes documentos:</div>
          <v-chip
            class="mr-2 mt-1"
            size="small"
          >
            MSDS
          </v-chip>
          <v-chip
            class="mt-1"
            size="small"
          >
            CNASS
          </v-chip>
        </div>
        <strong>Sin estos documentos no podrás cotizar.</strong>
      </div>
    </v-alert>
  </div>
</template>

<style>
.dangerous-goods-section {
  background-color: rgba(var(--v-theme-error), 0.08) !important;
  border: 1px solid rgb(var(--v-theme-error)) !important;
}
</style>
