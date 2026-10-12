<template>
  <v-card class="pa-3">
    <listProyeccionCXP />
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    listProyeccionCXP: defineAsyncComponent(() =>
      import("../../components/proyeccion/proyeccionCxP.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "PROYECCIÓN DE GASTOS";
  },
};
</script>

<style></style>
