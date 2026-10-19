<template>
  <v-container fluid>
    <ListItemServiceComponet />
    <v-navigation-drawer
      v-model="itemServicesStore.drawer"
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
import { mapStores } from "pinia";
import { useItemServicesStore } from "@/stores/itemServices";
export default {
  components: {
    ListItemServiceComponet: defineAsyncComponent(() =>
      import("../../components/FolderGroupServices/ListItemServiceComponet.vue")),
    FilterTown: defineAsyncComponent(() => import("../../components/filtros/FilterGrupoServices.vue")),
  },
  computed: {
    ...mapStores(useItemServicesStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE DETALLES DE SERVICIO`;
  },
};
</script>

<style></style>
