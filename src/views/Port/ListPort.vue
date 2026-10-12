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
import { defineAsyncComponent } from "vue";
export default {
  components: {
    PuertoComponent: defineAsyncComponent(() =>
      import("../../components/Port/ListPortComponent.vue")),
    FilterPort: defineAsyncComponent(() => import("../../components/filtros/FiltroPuerto.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE PUERTOS Y AEROLÍNEAS`;
  },
};
</script>

<style></style>
