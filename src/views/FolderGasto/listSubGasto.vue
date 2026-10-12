<template>
  <v-container fluid>
    <SubGasto />
    <v-navigation-drawer
      v-model="$store.state.subgasto.drawer"
      location="right"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterSubGasto />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    SubGasto: defineAsyncComponent(() =>
      import("../../components/FolderGasto/listSubGastoCompponent.vue")),
    FilterSubGasto: defineAsyncComponent(() => import("../../components/filtros/FilterSubGasto.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SUB GASTO`;
  },
};
</script>

<style></style>
