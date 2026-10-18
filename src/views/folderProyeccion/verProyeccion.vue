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
        import("../../components/proyeccion/verProyeccion.vue")),
    },
    mounted() {
      this.$store.state.mainTitle =
        "VER PROYECCIÓN DE GASTOS";
    },
  };
  </script>
  
  <style></style>
  