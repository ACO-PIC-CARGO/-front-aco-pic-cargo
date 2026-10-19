<template>
  <v-container fluid>
    <ListAirlinesComponet />
    <v-navigation-drawer
      v-model="airlinesStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterAirlinesComponet :type="airlinesStore.tipo" />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useAirlinesStore } from "@/stores/airlines";
export default {
  components: {
    ListAirlinesComponet: defineAsyncComponent(() =>
      import("@/components/Maestros/Airlines/ListAirlinesComponet.vue")),
    FilterAirlinesComponet: defineAsyncComponent(() =>
      import("../../components/filtros/FiltroAirlines.vue")),
  },
  computed: {
    ...mapStores(useAirlinesStore),
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
