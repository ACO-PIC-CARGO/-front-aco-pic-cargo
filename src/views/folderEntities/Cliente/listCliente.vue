<template>
  <v-container fluid>
    <v-card>
      <ListClienteComponentVue />
    </v-card>
    <v-navigation-drawer
      v-model="$store.state.entities.filtrarProveedor"
      location="right"
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
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListClienteComponentVue: defineAsyncComponent(() =>
      import("@/components/folderEntities/Cliente/ListClienteComponent.vue")),
    FiltroCliente: defineAsyncComponent(() => import("@/components/filtros/FiltroCliente.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE CLIENTES`;
  },
};
</script>

<style></style>
