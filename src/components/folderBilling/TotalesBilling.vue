<script setup lang="ts">
import { useStore } from "vuex";
import { useEnterprisesStore } from "@/stores/enterprises";

const rootStore = useStore();
const enterprisesStore = useEnterprisesStore();
</script>

<template>
  <div>
    <v-container>
      <v-row density="compact">
        <v-col cols="12">
          <h3>Totales</h3>
        </v-col>

        <v-col cols="12" md="3">
          <p>Total de Ingresos: {{ rootStore.state.totalIngresos }} USD</p>
        </v-col>
        <v-col cols="12" md="3">
          <p>Total de Costos: {{ rootStore.state.totalEgresos }} USD</p>
        </v-col>
        <v-col cols="12" md="3">
          <p>
            Total de {{ enterprisesStore.impuesto.nombre_impuesto }}:
            {{ rootStore.state.dataTotalIGV ? rootStore.state.dataTotalIGV : 0 }} USD
          </p>
        </v-col>
        <v-col cols="12" md="3">
          <b
            >Total PROFIT:
            {{
              (
                (rootStore.state.totalIngresos
                  ? rootStore.state.totalIngresos
                  : 0) -
                (rootStore.state.totalEgresos
                  ? rootStore.state.totalEgresos
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

<style lang="scss" scoped></style>
