<template>
  <v-container fluid>
    <Posicion />
    <v-navigation-drawer
      v-model="$store.state.position.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterPosicion />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    Posicion: () =>
      import("../../components/Posicion/ListPosicionComponet.vue"),
    FilterPosicion: () => import("../../components/filtros/FilterPosicion.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ROLES DE USUARIOS DEL SISTEMA`;
  },
};
</script>

<style></style>
