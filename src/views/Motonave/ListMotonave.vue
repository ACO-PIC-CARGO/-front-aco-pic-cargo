<template>
  <v-container fluid>
    <MotonaveComponent />
    <v-navigation-drawer
      v-model="$store.state.motonave.drawer"
      location="right"
      absolute
      
      width="30%"
      temporary
    >
      <FilterMotonave />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    MotonaveComponent: defineAsyncComponent(() =>
      import("../../components/Motonave/ListMotonaveComponent.vue")),
    FilterMotonave: defineAsyncComponent(() => import("../../components/filtros/FilterMotonave.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS DE MOTO NAVES`;
  },
};
</script>

<style></style>
