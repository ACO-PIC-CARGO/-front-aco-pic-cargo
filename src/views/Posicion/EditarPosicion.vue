<template>
    <v-container fluid>
      <Posicion />
    
    </v-container>
  </template>
  
  <script>
import { defineAsyncComponent } from "vue";
  export default {
    components: {
      Posicion: defineAsyncComponent(() => import("../../components/Posicion/EditarPosicionComponet.vue")),
      FilterPosicion: defineAsyncComponent(() => import("../../components/filtros/FilterPosicion.vue")),
    },
    mounted() {
      this.$store.state.mainTitle = `ROLES DE USUARIOS DEL SISTEMA POSICIÓN`;
    },
  };
  </script>
  
  <style></style>