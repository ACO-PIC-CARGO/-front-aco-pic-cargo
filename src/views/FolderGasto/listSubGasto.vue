<template>
  <v-container fluid>
    <SubGasto />
    <v-navigation-drawer
      v-model="subgastoStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterSubGasto />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useSubgastoStore } from "@/stores/subgasto";
export default {
  components: {
    SubGasto: defineAsyncComponent(() =>
      import("../../components/FolderGasto/listSubGastoCompponent.vue")),
    FilterSubGasto: defineAsyncComponent(() => import("../../components/filtros/FilterSubGasto.vue")),
  },
  computed: {
    ...mapStores(useSubgastoStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SUB GASTO`;
  },
};
</script>

<style></style>
