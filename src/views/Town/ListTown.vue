<template>
  <v-container fluid>
    <Town />
    <v-navigation-drawer
      v-model="$store.state.town.drawer"
      location="right"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterTown />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    Town: defineAsyncComponent(() => import("../../components/Town/ListTownComponet.vue")),
    FilterTown: defineAsyncComponent(() => import("../../components/filtros/FilterTown.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE DISTRITOS`;
  },
};
</script>

<style></style>
