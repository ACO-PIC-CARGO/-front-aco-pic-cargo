<template>
  <v-container fluid class="pt-0 mt-0">
    <v-tabs v-model="tab" align-tabs="center">
      <v-tab color="primary" value="agrupado"> Datos Agrupado </v-tab>

      <v-tab value="detallado"> Detallado </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="agrupado">
        <listPayForProveedor />
      </v-tabs-window-item>
      <v-tabs-window-item value="detallado">
        <pagosPorProveedorDetallado />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>
</template>

<script>
import listPayForProveedor from "@/components/folderBanks/listPayForProveedor.vue";
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
