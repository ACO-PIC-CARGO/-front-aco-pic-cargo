<template>
  <v-container fluid>
    <TipoTelefono />
    <v-navigation-drawer
      v-model="$store.state.masterusuarios.drawer"
      location="right"
      absolute
      
      width="30%"
      temporary
    >
      <FilterTipoTelefono />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
export default {
  components: {
    TipoTelefono: defineAsyncComponent(() =>
      import("../../components/MasterUsuario/ListTipoTelefonoComponet.vue")),
    FilterTipoTelefono: defineAsyncComponent(() => import("../../components/filtros/FilterTipoTelefono.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE TIPO DE TELÉFONO`;
  },
};
</script>

<style></style>
