<template>
  <v-container fluid>
    <SubIngreso />
    <v-navigation-drawer
      v-model="$store.state.subingreso.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterBegend />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    SubIngreso: () =>
      import("../../components/FolderIngresos/listSubIngresoCompponent.vue"),
    FilterBegend: () => import("../../components/filtros/FilterSubIngreso.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SUB INGRESOS`;
  },
};
</script>

<style></style>
