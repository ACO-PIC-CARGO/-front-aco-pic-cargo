<template>
  <v-card class="mx-3" elevation="0">
    <v-card-title primary-title class="text-uppercase">
      Configuración Correlativo Expediente</v-card-title
    >
    <v-list-subheader class="text-uppercase">
      Configurar desde que número se empezará su correlativo del Expediente
    </v-list-subheader>
    <v-card-text>
      <v-text-field
        variant="outlined"
        type="number"
        label="Correlativo de Expediente"
        v-model="$store.state.configEmpresa.configEmpresa.correlativomaster"
        style="width: 50%"
      />
      <p>En caso no lo configure, se empezará desde 1</p>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  mounted() {
    this.$store.state.configEmpresa.configEmpresa.correlativomaster = 1;
  },
};
</script>

<style></style>
