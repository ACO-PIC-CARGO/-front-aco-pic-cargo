<template>
  <v-menu
    v-model="menuDesde"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    min-width="auto"
    :disabled="verflag || disabled"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        :value="labelFormateada"
        :label="label"
        prepend-icon="mdi-calendar"
        readonly
        :disabled="verflag"
        v-bind="attrs"
        v-on="verflag ? {} : on"
        :outlined="outlined"
        :dense="dense"
        :error-messages="errorMessages"
        :error="!!errorMessages"
        :clearable="clearable"
        :rules="rules"
        @click:clear="limpiarFecha"
        :hide-details="hideDetails"
      ></v-text-field>
    </template>
    <v-date-picker
      v-model="fechaInterna"
      @input="menuDesde = false"
      locale="es-es"
      no-title
    ></v-date-picker>
  </v-menu>
</template>

<script>
export default {
  props: {
    value: {
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
    fechaInterna: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    labelFormateada() {
      if (!this.value) return "";
      const [year, month, day] = this.value.split("-");
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
    limpiarFecha() {
      this.$emit("input", null);
    },
  },
};
</script>
