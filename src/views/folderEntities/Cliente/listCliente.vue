<template>
  <v-container fluid>
    <v-card>
      <ListClienteComponentVue />
    </v-card>
    <v-navigation-drawer
      v-model="entitiesStore.filtrarProveedor"
      location="right"
      
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
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";
export default {
  components: {
    ListClienteComponentVue: defineAsyncComponent(() =>
      import("@/components/folderEntities/Cliente/ListClienteComponent.vue")),
    FiltroCliente: defineAsyncComponent(() => import("@/components/filtros/FiltroCliente.vue")),
  },
  computed: {
    ...mapStores(useEntitiesStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE CLIENTES`;
  },
};
</script>

<style></style>
