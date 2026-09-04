<template>
  <v-autocomplete
    :key="autocompleteKey"
    :value="value"
    :items="$store.state.pricing.listMultiplicador"
    :item-text="itemText"
    :item-value="itemValue"
    :label="label"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :outlined="outlined"
    :dense="dense"
    :clearable="clearable"
    :hide-details="hideDetails"
    :error-messages="errorMessages"
    :error="!!errorMessages"
    :rules="rules"
    @input="onInputMultiplicador"
  />
</template>

<script>
import Swal from "sweetalert2";

export default {
  props: {
    value: {
      type: [String, Number, Object],
      default: null,
    },
    itemText: {
      type: String,
      default: "name",
    },
    itemValue: {
      type: String,
      default: "id",
    },
    label: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    outlined: {
      type: Boolean,
      default: false,
    },
    dense: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    hideDetails: {
      type: [Boolean, String],
      default: false,
    },
    errorMessages: {
      type: [String, Array],
      default: "",
    },
    rules: {
      type: Array,
      default: () => [],
    },
  },

  data: () => ({
    valorAnterior: null,
    autocompleteKey: 0,
  }),

  created() {
    this.valorAnterior = this.value;
  },

  watch: {
    value(newValue) {
      this.valorAnterior = newValue;
    },
  },

  methods: {
    onInputMultiplicador(id) {
      const item = this.$store.state.pricing.listMultiplicador.find(
        (item) => item.id == id,
      );

      const code = item?.code || null;

      // ==========================================
      // VALIDACIÓN DESCARGA
      // ==========================================
      if (code == 24) {
        const volumen = this.$store.state.pricing.datosPrincipales.volumen || 0;

        if (volumen < 15) {
          Swal.fire({
            icon: "warning", // Cambiado a warning para que no se vea tan drástico como un error crítico
            title: "Acción no permitida",
            html: `
                <div style="text-align: left; margin-top: 10px; font-size: 14px; color: #555;">
                    <p style="margin-bottom: 8px;">No es posible aplicar el multiplicador <b>Descarga</b> debido a que no cumple con el volumen operativo requerido.</p>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 4px solid #f39c12;">
                    <p style="margin: 0; color: #333;"><b>Volumen actual:</b> ${volumen} m³</p>
                    <p style="margin: 4px 0 0 0; color: #333;"><b>Mínimo requerido:</b> 15 m³</p>
                    </div>
                </div>
                `,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#3085d6",
            buttonsStyling: true,
          });
          this.$nextTick(() => {
            this.autocompleteKey++;
          });

          return;
        }
      }

      // ==========================================
      // SELECCIÓN VÁLIDA
      // ==========================================

      this.valorAnterior = id;

      this.$emit("input", id);
      this.$emit("change", id);
    },
  },
};
</script>

<style>
.widthTD {
  max-width: 180px !important;
  padding: 0 18px !important;
}
</style>
