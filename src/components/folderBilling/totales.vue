<template>
  <div>
    <v-container>
      <v-row density="compact">
        <v-col cols="12">
          <h3>Totales</h3>
        </v-col>

        <v-col cols="12" md="3">
          <p>Total de Ingresos: {{ this.$store.state.totalIngresos }} USD</p>
        </v-col>
        <v-col cols="12" md="3">
          <p>Total de Costos: {{ this.$store.state.totalEgresos }} USD</p>
        </v-col>
        <v-col cols="12" md="3">
          <p>
            Total de {{ $store.state.enterprises.impuesto.nombre_impuesto }}:
            {{ $store.state.dataTotalIGV ? $store.state.dataTotalIGV : 0 }} USD
          </p>
        </v-col>
        <v-col cols="12" md="3">
          <b
            >Total PROFIT:
            {{
              (
                (this.$store.state.totalIngresos
                  ? this.$store.state.totalIngresos
                  : 0) -
                (this.$store.state.totalEgresos
                  ? this.$store.state.totalEgresos
                  : 0)
              ).toFixed(2)
            }}
            USD</b
          >
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: "totales",
};
</script>

<style lang="scss" scoped></style>
