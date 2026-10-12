<template>
  <v-container fluid>
    <Town />
    <v-navigation-drawer
      v-model="$store.state.town.drawer"
      location="right bottom"
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
export default {
  components: {
    Town: () => import("../../components/Town/ListTownComponet.vue"),
    FilterTown: () => import("../../components/filtros/FilterTown.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE DISTRITOS`;
  },
};
</script>

<style></style>
