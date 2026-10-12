<template>
  <v-container fluid>
    <Impuestos />
    <v-navigation-drawer
      v-model="$store.state.masterusuarios.drawer"
      location="right bottom"
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
export default {
  components: {
    Impuestos: () =>
      import("@/components/MasterUsuario/ListImpuestoComponent.vue"),
    FilterImpuesto: () => import("../../components/filtros/FilterImpuesto.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE IMPUESTOS`;
  },
};
</script>

<style></style>
