<template>
  <v-container fluid>
    <TipoTelefono />
    <v-navigation-drawer
      v-model="$store.state.masterusuarios.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterTipoTelefono />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    TipoTelefono: () =>
      import("../../components/MasterUsuario/ListTipoTelefonoComponet.vue"),
    FilterTipoTelefono: () => import("../../components/filtros/FilterTipoTelefono.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE TIPO DE TELÉFONO`;
  },
};
</script>

<style></style>
