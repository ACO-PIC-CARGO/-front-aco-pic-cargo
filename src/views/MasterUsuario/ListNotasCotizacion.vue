<template>
  <v-container fluid>
    <NotasCotizacion />
    <v-navigation-drawer
      v-model="$store.state.masterusuarios.drawer"
      location="right"
      absolute
      
      width="50%"
      temporary
    >
      <FilterNotasCotizacion />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    NotasCotizacion: defineAsyncComponent(() =>
      import("../../components/MasterUsuario/ListNotaCotizacionComponent.vue")),
    FilterNotasCotizacion: defineAsyncComponent(() =>
      import("../../components/filtros/FilterNotasCotizacion.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE NOTAS DE LA COTIZACIÓN`;
  },
};
</script>

<style></style>
