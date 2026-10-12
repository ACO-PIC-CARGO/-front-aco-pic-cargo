<template>
  <v-container fluid>
    <StateComponent />
    <v-navigation-drawer
      v-model="$store.state.states.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterState />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    StateComponent: () =>
      import("../../components/State/ListStateComponent.vue"),
    FilterState: () => import("../../components/filtros/FilterState.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS`;
  },
};
</script>

<style></style>
