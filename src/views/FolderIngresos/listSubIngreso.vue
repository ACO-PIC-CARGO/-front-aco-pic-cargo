<template>
  <v-container fluid>
    <SubIngreso />
    <v-navigation-drawer
      v-model="subingresoStore.drawer"
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
import { mapStores } from "pinia";
import { useSubingresoStore } from "@/stores/subingreso";
export default {
  components: {
    SubIngreso: defineAsyncComponent(() =>
      import("../../components/FolderIngresos/listSubIngresoCompponent.vue")),
    FilterBegend: defineAsyncComponent(() => import("../../components/filtros/FilterSubIngreso.vue")),
  },
  computed: {
    ...mapStores(useSubingresoStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SUB INGRESOS`;
  },
};
</script>

<style></style>
