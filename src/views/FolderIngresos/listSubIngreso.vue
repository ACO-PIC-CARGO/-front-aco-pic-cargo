<template>
  <v-container fluid>
    <SubIngreso />
    <v-navigation-drawer
      v-model="$store.state.subingreso.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterBegend />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    SubIngreso: defineAsyncComponent(() =>
      import("../../components/FolderIngresos/listSubIngresoCompponent.vue")),
    FilterBegend: defineAsyncComponent(() => import("../../components/filtros/FilterSubIngreso.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SUB INGRESOS`;
  },
};
</script>

<style></style>
