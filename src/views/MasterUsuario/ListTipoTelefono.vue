<template>
  <v-container fluid>
    <TipoTelefono />
    <v-navigation-drawer
      v-model="masterusuariosStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTipoTelefono />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
export default {
  components: {
    TipoTelefono: defineAsyncComponent(() =>
      import("../../components/MasterUsuario/ListTipoTelefonoComponet.vue")),
    FilterTipoTelefono: defineAsyncComponent(() => import("../../components/filtros/FilterTipoTelefono.vue")),
  },
  computed: {
    ...mapStores(useMasterusuariosStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE TIPO DE TELÉFONO`;
  },
};
</script>

<style></style>
