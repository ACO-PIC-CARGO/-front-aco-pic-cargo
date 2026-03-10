<template>
  <v-container fluid>
    <v-tabs v-model="tab" centered dense>
      <v-tabs-slider></v-tabs-slider>

      <v-tab color="primary" href="#agrupado"> Datos Agrupado </v-tab>

      <v-tab href="#detallado"> Detallado </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item value="agrupado">
        <listPayForProveedor />
      </v-tab-item>
      <v-tab-item value="detallado">
        <pagosPorProveedorDetallado />
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script>
import listPayForProveedor from "@/components/folderBanks/listPayForProveedor";
import pagosPorProveedorDetallado from "../../components/folderBanks/pagosPorProveedorDetallado.vue";

export default {
  components: {
    listPayForProveedor,
    pagosPorProveedorDetallado,
  },
  data() {
    return {
      tab: "agrupado",
    };
  },
  mounted() {
    this.$store.state.mainTitle = "LISTADO DE SALIDAS";
  },
};
</script>

<style></style>
