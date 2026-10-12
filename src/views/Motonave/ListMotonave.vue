<template>
  <v-container fluid>
    <MotonaveComponent />
    <v-navigation-drawer
      v-model="$store.state.motonave.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterMotonave />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    MotonaveComponent: () =>
      import("../../components/Motonave/ListMotonaveComponent.vue"),
    FilterMotonave: () => import("../../components/filtros/FilterMotonave.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS DE MOTO NAVES`;
  },
};
</script>

<style></style>
