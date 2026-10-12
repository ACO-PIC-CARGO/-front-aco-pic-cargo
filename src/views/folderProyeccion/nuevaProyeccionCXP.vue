<template>
  <v-card>
    <nuevaProyeccion />
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    nuevaProyeccion: defineAsyncComponent(() =>
      import("../../components/proyeccion/nuevaProyeccionCXP.vue")),
  },
  mounted() {
    this.$store.state.mainTitle =
      "REGISTRO DE NUEVA PROYECCIÓN GASTOS";
  },
};
</script>

<style></style>
