<template>
  <v-card class="px-5">
    <v-row>
      <v-col cols="12">
        <v-radio-group
          v-model="operativoflag"
          row
          label="Tipo de Pago a Realizar"
        >
          <v-radio label="Cuentas Por Cobrar" color="red" value="0"></v-radio>
          <v-radio label="Control de Gastos" value="1"></v-radio>
          <!-- <v-radio
            label="Control de Gasto Correlativo por Proveedor"
            value="2"
          ></v-radio> -->
        </v-radio-group>
      </v-col>

      <v-col cols="12" v-if="operativoflag == 0" class="mt-0">
        <CuentasPorPagar filtrarFlag="true" tipo="nuevo" />
      </v-col>
      <v-col cols="12" v-if="operativoflag == 1">
        <ConTrolGastoComponet filtrarFlag="true" tipo="nuevo" />
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
export default {
  components: {
    //  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
    ConTrolGastoComponet: () =>
      import("../../components/folderRequests/checkDebs.vue"),
    CuentasPorPagar: () =>
      import("../../components/folderBanks/payForCliente.vue"),
  },
  data() {
    return {
      operativoflag: null,
    };
  },
  mounted() {
    this.$store.state.mainTitle = "BANCOS - PAGOS - ENTRADAS";
  },
};
</script>

<style></style>
