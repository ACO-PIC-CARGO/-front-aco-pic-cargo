<template>
  <v-container fluid>
    <ListAirlinesComponet />
    <v-navigation-drawer
      v-model="$store.state.airlines.drawer"
      location="right"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterAirlinesComponet :type="$store.state.airlines.tipo" />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    ListAirlinesComponet: defineAsyncComponent(() =>
      import("@/components/Maestros/Airlines/ListAirlinesComponet.vue")),
    FilterAirlinesComponet: defineAsyncComponent(() =>
      import("../../components/filtros/FiltroAirlines.vue")),
  },
  data() {
    return {};
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE AEROLÍNEAS`;
  },
};
</script>

<style></style>
