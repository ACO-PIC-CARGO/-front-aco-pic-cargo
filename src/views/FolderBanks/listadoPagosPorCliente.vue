<template>
  <v-container fluid class="pt-0 mt-0">
    <v-tabs v-model="tab" centered dense>
      <v-tabs-slider></v-tabs-slider>

      <v-tab color="primary" href="#agrupado"> Datos Agrupado </v-tab>

      <v-tab href="#detallado"> Detallado </v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab" class="fill-height">
      <v-tab-item value="agrupado">
        <listPayForCliente />
      </v-tab-item>
      <v-tab-item value="detallado">
        <listPayForClienteDetalle />
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script>
import listPayForCliente from "../../components/folderBanks/listPayForCliente";
// Cambia la "l" por "L"
import listPayForClienteDetalle from "../../components/folderBanks/ListPayForClienteDetalles.vue";
export default {
  components: {
    listPayForCliente,
    listPayForClienteDetalle,
  },
  data() {
    return {
      tab: "agrupado",
    };
  },
  mounted() {
    this.$store.state.mainTitle = "LISTADO DE INGRESOS";
  },
};
</script>

<style></style>
