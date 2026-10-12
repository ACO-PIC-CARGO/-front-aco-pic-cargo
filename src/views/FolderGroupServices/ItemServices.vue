<template>
  <v-container fluid>
    <ListItemServiceComponet />
    <v-navigation-drawer
      v-model="$store.state.itemServices.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterTown />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    ListItemServiceComponet: () =>
      import("../../components/FolderGroupServices/ListItemServiceComponet.vue"),
    FilterTown: () => import("../../components/filtros/FilterGrupoServices.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE DETALLES DE SERVICIO`;
  },
};
</script>

<style></style>
