<template>
  <v-container fluid>
    <ListItemServiceComponet />
    <v-navigation-drawer
      v-model="$store.state.itemServices.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTown />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListItemServiceComponet: defineAsyncComponent(() =>
      import("../../components/FolderGroupServices/ListItemServiceComponet.vue")),
    FilterTown: defineAsyncComponent(() => import("../../components/filtros/FilterGrupoServices.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE DETALLES DE SERVICIO`;
  },
};
</script>

<style></style>
