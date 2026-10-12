<template>
  <v-container fluid>
    <StateComponent />
    <v-navigation-drawer
      v-model="$store.state.states.drawer"
      location="right"
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
import { defineAsyncComponent } from "vue";
export default {
  components: {
    StateComponent: defineAsyncComponent(() =>
      import("../../components/State/ListStateComponent.vue")),
    FilterState: defineAsyncComponent(() => import("../../components/filtros/FilterState.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS`;
  },
};
</script>

<style></style>
