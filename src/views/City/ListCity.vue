<template>
  <v-container fluid>
    <City />
    <v-navigation-drawer
      v-model="$store.state.city.drawer"
      location="right"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterCity />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    City: defineAsyncComponent(() => import("../../components/City/ListCityComponet.vue")),
    FilterCity: defineAsyncComponent(() => import("../../components/filtros/FilterCity.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE CIUDADES`;
  },
};
</script>

<style></style>
