<template>
  <v-container fluid class="pt-0 mt-0">
    <v-tabs v-model="tab" align-tabs="center" dense>
      <v-tab color="primary" value="agrupado"> Datos Agrupado </v-tab>

      <v-tab value="detallado"> Detallado </v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab" class="fill-height">
      <v-tabs-window-item value="agrupado">
        <listPayForCliente />
      </v-tabs-window-item>
      <v-tabs-window-item value="detallado">
        <listPayForClienteDetalle />
      </v-tabs-window-item>
    </v-tabs-window>
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
