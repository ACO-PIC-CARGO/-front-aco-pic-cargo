<template>
  <v-menu
    v-model="menuDesde"
    :close-on-content-click="false"
    transition="scale-transition"
    offset-y
    min-width="auto"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        :value="labelFormateada"
        :label="label"
        prepend-icon="mdi-calendar"
        readonly
        v-bind="attrs"
        v-on="on"
        :outlined="outlined"
        :dense="dense"
        :error-messages="errorMessages"
        :error="!!errorMessages"
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
    // Recibimos el valor del padre (formato YYYY-MM-DD)
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
      default: false, // o "filled"
    },
    dense: {
      type: Boolean,
      default: false,
    },
    errorMessages: {
      type: [String, Array],
      default: "",
    },
  },
  data: () => ({
    menuDesde: false,
  }),
  computed: {
    // Propiedad intermedia para no mutar la prop directamente
    fechaInterna: {
      get() {
        return this.value;
      },
      set(val) {
        // Emitimos el cambio al padre en formato estándar
        this.$emit("input", val);
      },
    },
    // Solo para mostrar en el text-field (DD/MES/YYYY)
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
};
</script>
