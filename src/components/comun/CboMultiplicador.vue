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
    class="widthTD"
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

      this.valorAnterior = id;

      this.$emit("input", id);
      this.$emit("change", id);
    },
  },
};
</script>

<style>
.widthTD {
  width: 100%;
  min-width: 180px;
  padding: 0 18px !important;
}
</style>
