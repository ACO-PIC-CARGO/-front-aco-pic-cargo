<script setup lang="ts">
import { computed, ref } from "vue";
import moment from "moment";
import type { ValidationRule } from "vuetify";

withDefaults(
  defineProps<{
    label?: string;
    outlined?: boolean;
    dense?: boolean;
    errorMessages?: string | string[];
    verflag?: boolean;
    clearable?: boolean;
    hideDetails?: boolean;
    disabled?: boolean;
    // Añadir esta prop para interceptar las reglas del padre
    rules?: ValidationRule[];
  }>(),
  {
    label: "Fecha",
    outlined: false,
    dense: false,
    errorMessages: "",
    verflag: false,
    clearable: false,
    hideDetails: false,
    disabled: false,
    rules: () => [],
  },
);
const model = defineModel<string | null>({ default: null });

const menuDesde = ref(false);

const labelFormateada = computed(() => {
  if (!model.value) return "";
  const [year, month, day] = model.value.split("-");
  const meses = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];
  return `${day}/${meses[parseInt(month!) - 1]}/${year}`;
});

function selectDate(date: moment.MomentInput) {
  model.value = moment(date).format("YYYY-MM-DD");
  menuDesde.value = false;
}
function limpiarFecha() {
  model.value = null;
}
</script>

<template>
  <v-menu
    v-model="menuDesde"
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="auto"
    :disabled="verflag || disabled"
  >
    <template #activator="{ props }">
      <v-text-field
        :model-value="labelFormateada"
        :label="label"
        prepend-icon="mdi-calendar"
        readonly
        :disabled="verflag"
        v-bind="verflag ? {} : props"
        :variant="outlined ? 'outlined' : undefined"
        :density="dense ? 'compact' : undefined"
        :error-messages="errorMessages"
        :error="!!errorMessages"
        :clearable="clearable"
        :rules="rules"
        @click:clear="limpiarFecha"
        :hide-details="hideDetails"
      />
    </template>
    <v-locale-provider locale="es">
      <v-date-picker
        :model-value="model"
        @update:model-value="selectDate"
        hide-header
      />
    </v-locale-provider>
  </v-menu>
</template>
