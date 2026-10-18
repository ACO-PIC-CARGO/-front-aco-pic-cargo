<template>
  <v-menu
    v-model="menuDesde"
    :close-on-content-click="false"
    transition="scale-transition"
    min-width="auto"
    :disabled="verflag || disabled"
  >
    <template v-slot:activator="{ props }">
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
      ></v-text-field>
    </template>
    <v-locale-provider locale="es">
      <v-date-picker
        :model-value="modelValue"
        @update:model-value="selectDate"
        hide-header
      ></v-date-picker>
    </v-locale-provider>
  </v-menu>
</template>

<script>
import moment from "moment";

export default {
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      default: "Fecha",
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    dense: {
      type: Boolean,
      default: false,
    },
    errorMessages: {
      type: [String, Array],
      default: "",
    },
    verflag: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    hideDetails: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // Añadir esta prop para interceptar las reglas del padre
    rules: {
      type: Array,
      default: () => [],
    },
  },
  data: () => ({
    menuDesde: false,
  }),
  computed: {
    labelFormateada() {
      if (!this.modelValue) return "";
      const [year, month, day] = this.modelValue.split("-");
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
      return `${day}/${meses[parseInt(month) - 1]}/${year}`;
    },
  },
  methods: {
    selectDate(date) {
      this.$emit("update:modelValue", moment(date).format("YYYY-MM-DD"));
      this.menuDesde = false;
    },
    limpiarFecha() {
      this.$emit("update:modelValue", null);
    },
  },
};
</script>
