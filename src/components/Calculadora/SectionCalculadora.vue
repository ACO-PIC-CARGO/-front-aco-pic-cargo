<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="calculadorasStore.lstTipoCosto"
    >
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";

export default {
  props: {
    type: {
      default: "FCL",
      type: String,
    },
    id_modality: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return {
      headers: [
        { title: "Modalidad", key: "modality" },
        { title: "Sección", key: "nombre" },
      ],
    };
  },
  mounted() {},
  computed: {
    ...mapStores(useCalculadorasStore),
  },
  methods: {
    ...mapPiniaActions(useCalculadorasStore, ["GetTipoCosto"]),
  },
};
</script>

<style></style>
