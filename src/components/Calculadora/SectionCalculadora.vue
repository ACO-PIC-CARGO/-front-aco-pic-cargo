<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="$store.state.calculadoras.lstTipoCosto"
    >
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";

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
  methods: {
    ...mapActions(["GetTipoCosto"]),
  },
};
</script>

<style></style>
