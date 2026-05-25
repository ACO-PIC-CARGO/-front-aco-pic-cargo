<template>
  <div>
    <listControlGastosCom></listControlGastosCom>

    <v-navigation-drawer
      v-model="$store.state.cg_filtrarData"
      right
      absolute
      bottom
      persistent
      width="20%"
      temporary
    >
      <v-card elevation="0">
        <FiltroControlGastos />
      </v-card>
    </v-navigation-drawer>
  </div>
</template>
<script>
import listControlGastosCom from "@/components/folderBilling/listControlGastos.vue";
import FiltroControlGastos from "@/components/filtros/FiltroControlGastos";

export default {
  name: "listEntities",
  components: {
    listControlGastosCom,
    FiltroControlGastos,
  },
  mounted() {
    this.$store.state.mainTitle = "LISTA DE CONTROL DE GASTOS";
  },
  data() {
    return {};
  },
};
</script>
