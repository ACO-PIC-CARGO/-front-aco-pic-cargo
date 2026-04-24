<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-radio-group
          v-model="operativoflag"
          row
          label="Tipo de Pago a Realizar"
        >
          <v-radio label="Cuentas Por Pagar" color="red" value="0"></v-radio>
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
      <v-col cols="12" v-if="operativoflag == 2" class="mt-0">
        <Correlativo filtrarFlag="true" tipo="nuevo" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  components: {
    //  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
    ConTrolGastoComponet: () =>
      import("../folderRequests/listRequestPayment.vue"),
    CuentasPorPagar: () =>
      import("./payForProveedor.vue"),
  
  },
  data() {
    return {
      operativoflag: null,
    };
  },
  mounted() {
    this.$store.state.mainTitle = "BANCOS - PAGOS - SALIDAS";
  },
};
</script>

<style></style>
