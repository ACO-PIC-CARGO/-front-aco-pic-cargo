<template>
  <v-container fluid>
    <StateComponent />
    <v-navigation-drawer
      v-model="statesStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterState />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useStatesStore } from "@/stores/states";
export default {
  components: {
    StateComponent: defineAsyncComponent(() =>
      import("../../components/State/ListStateComponent.vue")),
    FilterState: defineAsyncComponent(() => import("../../components/filtros/FilterState.vue")),
  },
  computed: {
    ...mapStores(useStatesStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS`;
  },
};
</script>

<style></style>
