<template>
  <v-container fluid>
    <listQuoteStatus />
    <v-navigation-drawer
      v-model="QuoteStatusStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterQuoteStatus :type="airlinesStore.tipo" />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useQuoteStatusStore } from "@/stores/QuoteStatus";
import { useAirlinesStore } from "@/stores/airlines";
export default {
  components: {
    listQuoteStatus: defineAsyncComponent(() =>
      import("./../../components/StatusQuote/listQuoteStatusComponent.vue")),
    FilterQuoteStatus: defineAsyncComponent(() =>
      import("../../components/filtros/FiltroQuoteStatus.vue")),
  },
  computed: {
    ...mapStores(useAirlinesStore, useQuoteStatusStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS DE LA COTIZACIÓN`;
  },
};
</script>

<style></style>
