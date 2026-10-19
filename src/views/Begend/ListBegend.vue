<template>
  <v-container fluid>
    <Begend />
    <v-navigation-drawer
      v-model="begendStore.drawer"
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
import { useBegendStore } from "@/stores/begend";
export default {
  components: {
    Begend: defineAsyncComponent(() => import("../../components/Begend/ListBegendComponent.vue")),
    FilterBegend: defineAsyncComponent(() => import("../../components/filtros/FilterBegend.vue")),
  },
  computed: {
    ...mapStores(useBegendStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE SERVICIOS`;
  },
};
</script>

<style></style>
