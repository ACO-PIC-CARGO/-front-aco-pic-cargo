<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import { useEnterprisesStore } from "@/stores/enterprises";

const appStore = useAppStore();
const enterprisesStore = useEnterprisesStore();
</script>

<template>
  <div>
    <v-container>
      <v-row density="compact">
        <v-col cols="12">
          <h3>Totales</h3>
        </v-col>

        <v-col
          cols="12"
          md="3"
        >
          <p>Total de Ingresos: {{ appStore.totalIngresos }} USD</p>
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <p>Total de Costos: {{ appStore.totalEgresos }} USD</p>
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <p>
            Total de {{ enterprisesStore.impuesto.nombre_impuesto }}:
            {{ appStore.dataTotalIGV ? appStore.dataTotalIGV : 0 }} USD
          </p>
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <b>Total PROFIT:
            {{
              (
                (appStore.totalIngresos
                  ? appStore.totalIngresos
                  : 0) -
                (appStore.totalEgresos
                  ? appStore.totalEgresos
                  : 0)
              ).toFixed(2)
            }}
            USD</b>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style lang="scss" scoped></style>
