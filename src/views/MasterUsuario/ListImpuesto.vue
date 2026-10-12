<template>
  <v-container fluid>
    <Impuestos />
    <v-navigation-drawer
      v-model="$store.state.masterusuarios.drawer"
      location="right"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterImpuesto />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Impuestos: defineAsyncComponent(() =>
      import("@/components/MasterUsuario/ListImpuestoComponent.vue")),
    FilterImpuesto: defineAsyncComponent(() => import("../../components/filtros/FilterImpuesto.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE IMPUESTOS`;
  },
};
</script>

<style></style>
