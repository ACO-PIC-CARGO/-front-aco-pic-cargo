<template>
  <v-container fluid>
    <City />
    <v-navigation-drawer
      v-model="$store.state.city.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterCity />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    City: () => import("../../components/City/ListCityComponet.vue"),
    FilterCity: () => import("../../components/filtros/FilterCity.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE CIUDADES`;
  },
};
</script>

<style></style>
