<template>
  <v-container fluid>
    <PuertoComponent />
    <v-navigation-drawer
      v-model="$store.state.puerto.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterPort />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    PuertoComponent: () =>
      import("../../components/Port/ListPortComponent.vue"),
    FilterPort: () => import("../../components/filtros/FiltroPuerto.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE PUERTOS Y AEROLÍNEAS`;
  },
};
</script>

<style></style>
