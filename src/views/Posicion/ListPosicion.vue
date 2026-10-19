<template>
  <v-container fluid>
    <Posicion />
    <v-navigation-drawer
      v-model="positionStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterPosicion />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { usePositionStore } from "@/stores/position";
export default {
  components: {
    Posicion: defineAsyncComponent(() =>
      import("../../components/Posicion/ListPosicionComponet.vue")),
    FilterPosicion: defineAsyncComponent(() => import("../../components/filtros/FilterPosicion.vue")),
  },
  computed: {
    ...mapStores(usePositionStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE ROLES DE USUARIOS DEL SISTEMA`;
  },
};
</script>

<style></style>
