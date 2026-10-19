<template>
  <v-container fluid>
    <NotasCotizacion />
    <v-navigation-drawer
      v-model="masterusuariosStore.drawer"
      location="right"
      
      width="50%"
      temporary
    >
      <FilterNotasCotizacion />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
export default {
  components: {
    NotasCotizacion: defineAsyncComponent(() =>
      import("../../components/MasterUsuario/ListNotaCotizacionComponent.vue")),
    FilterNotasCotizacion: defineAsyncComponent(() =>
      import("../../components/filtros/FilterNotasCotizacion.vue")),
  },
  computed: {
    ...mapStores(useMasterusuariosStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE NOTAS DE LA COTIZACIÓN`;
  },
};
</script>

<style></style>
