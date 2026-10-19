<template>
  <v-container fluid>
    <Impuestos />
    <v-navigation-drawer
      v-model="masterusuariosStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterImpuesto />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
export default {
  components: {
    Impuestos: defineAsyncComponent(() =>
      import("@/components/MasterUsuario/ListImpuestoComponent.vue")),
    FilterImpuesto: defineAsyncComponent(() => import("../../components/filtros/FilterImpuesto.vue")),
  },
  computed: {
    ...mapStores(useMasterusuariosStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE IMPUESTOS`;
  },
};
</script>

<style></style>
