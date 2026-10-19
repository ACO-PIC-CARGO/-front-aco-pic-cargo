<template>
  <v-container fluid>
    <MotonaveComponent />
    <v-navigation-drawer
      v-model="motonaveStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterMotonave />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useMotonaveStore } from "@/stores/motonave";
export default {
  components: {
    MotonaveComponent: defineAsyncComponent(() =>
      import("../../components/Motonave/ListMotonaveComponent.vue")),
    FilterMotonave: defineAsyncComponent(() => import("../../components/filtros/FilterMotonave.vue")),
  },
  computed: {
    ...mapStores(useMotonaveStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ESTADOS DE MOTO NAVES`;
  },
};
</script>

<style></style>
