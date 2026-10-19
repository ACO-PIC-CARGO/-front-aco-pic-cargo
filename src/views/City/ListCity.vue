<template>
  <v-container fluid>
    <City />
    <v-navigation-drawer
      v-model="cityStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterCity />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useCityStore } from "@/stores/city";
export default {
  components: {
    City: defineAsyncComponent(() => import("../../components/City/ListCityComponet.vue")),
    FilterCity: defineAsyncComponent(() => import("../../components/filtros/FilterCity.vue")),
  },
  computed: {
    ...mapStores(useCityStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE CIUDADES`;
  },
};
</script>

<style></style>
