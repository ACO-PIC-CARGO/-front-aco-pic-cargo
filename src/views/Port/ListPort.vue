<template>
  <v-container fluid>
    <PuertoComponent />
    <v-navigation-drawer
      v-model="puertoStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterPort />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { usePuertoStore } from "@/stores/puerto";
export default {
  components: {
    PuertoComponent: defineAsyncComponent(() =>
      import("../../components/Port/ListPortComponent.vue")),
    FilterPort: defineAsyncComponent(() => import("../../components/filtros/FiltroPuerto.vue")),
  },
  computed: {
    ...mapStores(usePuertoStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE PUERTOS Y AEROLÍNEAS`;
  },
};
</script>

<style></style>
