<template>
  <v-container fluid>
    <listQuoteStatus />
    <v-navigation-drawer
      v-model="$store.state.QuoteStatus.drawer"
      location="right"
      absolute
      
      width="30%"
      temporary
    >
      <FilterQuoteStatus :type="$store.state.airlines.tipo" />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    listQuoteStatus: defineAsyncComponent(() =>
      import("./../../components/StatusQuote/listQuoteStatusComponent.vue")),
    FilterQuoteStatus: defineAsyncComponent(() =>
      import("../../components/filtros/FiltroQuoteStatus.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS DE LA COTIZACIÓN`;
  },
};
</script>

<style></style>
