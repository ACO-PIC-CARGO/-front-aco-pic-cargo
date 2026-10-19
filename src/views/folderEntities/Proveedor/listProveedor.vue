<template>
  <v-container fluid>
    <v-card>
      <ListProveedorComponentVue />
    </v-card>
    <v-navigation-drawer
      v-model="entitiesStore.filtrarProveedor"
      location="right"
      
      width="20%"
      temporary
    >
      <v-card elevation="0">
        <FiltroProveedor />
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";
export default {
  components: {
    ListProveedorComponentVue: defineAsyncComponent(() =>
      import(
        "@/components/folderEntities/Proveedor/ListProveedorComponent.vue"
      )),
    FiltroProveedor: defineAsyncComponent(() => import("@/components/filtros/FiltroProveedor.vue")),
  },
  computed: {
    ...mapStores(useEntitiesStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE PROVEEDORES`;
  },
};
</script>

<style></style>
