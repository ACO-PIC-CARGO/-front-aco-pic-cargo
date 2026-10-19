<script setup lang="ts">
import { ref, watch } from "vue";
import { useStore } from "vuex";
import type { ValidationRule } from "vuetify";

withDefaults(
  defineProps<{
    itemText?: string;
    itemValue?: string;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    outlined?: boolean;
    dense?: boolean;
    clearable?: boolean;
    hideDetails?: boolean | "auto";
    errorMessages?: string | string[];
    rules?: ValidationRule[];
  }>(),
  {
    itemText: "name",
    itemValue: "id",
    label: "",
    placeholder: "",
    disabled: false,
    readonly: false,
    outlined: false,
    dense: false,
    clearable: false,
    hideDetails: false,
    errorMessages: "",
    rules: () => [],
  },
);
const model = defineModel<string | number | Record<string, unknown> | null>({ default: null });
const emit = defineEmits<{ change: [id: unknown] }>();

const rootStore = useStore();

const valorAnterior = ref(model.value);
const autocompleteKey = ref(0);

watch(model, (newValue) => {
  valorAnterior.value = newValue;
});

function onInputMultiplicador(id: string | number | Record<string, unknown> | null) {
  const item = rootStore.state.pricing.listMultiplicador.find(
    (item: { id: number | string }) => item.id == id,
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const code = item?.code || null;

  valorAnterior.value = id;

  model.value = id;
  emit("change", id);
}
</script>

<template>
  <v-autocomplete
    :key="autocompleteKey"
    :model-value="model"
    :items="rootStore.state.pricing.listMultiplicador"
    :item-title="itemText"
    :item-value="itemValue"
    :label="label"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :variant="outlined ? 'outlined' : undefined"
    :density="dense ? 'compact' : undefined"
    :clearable="clearable"
    :hide-details="hideDetails"
    :error-messages="errorMessages"
    :error="!!errorMessages"
    :rules="rules"
    class="widthTD"
    @update:model-value="onInputMultiplicador"
  />
</template>

<style>
.widthTD {
  width: 100%;
  min-width: 180px;
  padding: 0 18px !important;
}
</style>
