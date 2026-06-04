<template>
  <v-container fluid>
    <NotasCotizacion />
    <v-navigation-drawer
      v-model="$store.state.masterusuarios.drawer"
      right
      absolute
      bottom
      persistent
      width="50%"
      temporary
    >
      <FilterNotasCotizacion />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    NotasCotizacion: () =>
      import("../../components/MasterUsuario/ListNotaCotizacionComponent.vue"),
    FilterNotasCotizacion: () =>
      import("../../components/filtros/FilterNotasCotizacion.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE NOTAS DE LA COTIZACIÓN`;
  },
};
</script>

<style></style>
