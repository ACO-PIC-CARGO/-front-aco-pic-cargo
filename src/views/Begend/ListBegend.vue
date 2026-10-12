<template>
  <v-container fluid>
    <Begend />
    <v-navigation-drawer
      v-model="$store.state.begend.drawer"
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
    Begend: () => import("../../components/Begend/ListBegendComponent.vue"),
    FilterBegend: () => import("../../components/filtros/FilterBegend.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SERVICIOS`;
  },
};
</script>

<style></style>
