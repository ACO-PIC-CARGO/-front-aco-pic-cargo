<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import moment from "moment";
import type { ValidationRule } from "vuetify";
import { shortDate } from "@/utils/dates";

const props = withDefaults(
  defineProps<{
    label?: string;
    outlined?: boolean;
    dense?: boolean;
    errorMessages?: string | string[];
    verflag?: boolean;
    clearable?: boolean;
    hideDetails?: boolean | "auto";
    disabled?: boolean;
    // Añadir esta prop para interceptar las reglas del padre
    rules?: ValidationRule[];
    // Opcionales para formularios con diseño propio (ícono dentro del campo, etc.)
    prependInnerIcon?: string;
    density?: "default" | "comfortable" | "compact";
    placeholder?: string;
    id?: string;
    fieldClass?: string;
    min?: string;
    max?: string;
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
    prependInnerIcon: undefined,
    density: undefined,
    placeholder: undefined,
    id: undefined,
    fieldClass: undefined,
    min: undefined,
    max: undefined,
  },
);
const model = defineModel<string | null>({ default: null });

const menuDesde = ref(false);
const campo = ref<{ focus: () => void } | null>(null);

const labelFormateada = computed(() => {
  if (!model.value) return "";
  return shortDate(model.value);
});
const densidad = computed(() => props.density ?? (props.dense ? "compact" : undefined));

function selectDate(date: moment.MomentInput) {
  model.value = moment(date).format("YYYY-MM-DD");
  menuDesde.value = false;
}
function limpiarFecha() {
  model.value = null;
}
// Enter / espacio abren el calendario cuando se llega con Tab
function abrirConTeclado() {
  if (!props.verflag && !props.disabled) menuDesde.value = true;
}
async function focus() {
  campo.value?.focus();
  await nextTick();
  abrirConTeclado();
}

defineExpose({ focus });
</script>

<template>
  <v-menu
    v-model="menuDesde"
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="auto"
    :disabled="verflag || disabled"
  >
    <template #activator="{ props: activador }">
      <v-text-field
        :id="id"
        ref="campo"
        :model-value="labelFormateada"
        :label="label"
        :placeholder="placeholder"
        :prepend-icon="prependInnerIcon ? undefined : 'mdi-calendar'"
        :prepend-inner-icon="prependInnerIcon"
        readonly
        :disabled="verflag"
        v-bind="verflag ? {} : activador"
        :variant="outlined ? 'outlined' : undefined"
        :density="densidad"
        :class="fieldClass"
        :error-messages="errorMessages"
        :error="!!errorMessages"
        :clearable="clearable"
        :rules="rules"
        @click:clear="limpiarFecha"
        @keydown.enter.prevent="abrirConTeclado"
        @keydown.space.prevent="abrirConTeclado"
        :hide-details="hideDetails"
      />
    </template>
    <v-locale-provider locale="es">
      <v-date-picker
        :model-value="model"
        :min="min"
        :max="max"
        @update:model-value="selectDate"
        hide-header
      />
    </v-locale-provider>
  </v-menu>
</template>
