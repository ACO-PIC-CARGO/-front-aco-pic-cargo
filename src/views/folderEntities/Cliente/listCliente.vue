<template>
  <v-container fluid>
    <v-card>
      <ListClienteComponentVue />
    </v-card>
    <v-navigation-drawer
      v-model="$store.state.entities.filtrarProveedor"
      location="right bottom"
      absolute
      
      persistent
      width="20%"
      temporary
    >
      <v-card elevation="0">
        <FiltroCliente />
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    ListClienteComponentVue: () =>
      import("@/components/folderEntities/Cliente/ListClienteComponent.vue"),
    FiltroCliente: () => import("@/components/filtros/FiltroCliente.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE CLIENTES`;
  },
};
</script>

<style></style>
