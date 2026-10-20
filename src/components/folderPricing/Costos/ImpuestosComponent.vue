<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { usePricingStore } from "@/stores/pricing";
import {
  calcularImpuestos as calcularImpuestosCotizacion,
  currencyFormat,
  obtenerPorcentaje as obtenerPorcentajeCotizacion,
} from "@/utils/cotizacion";
import type { Costo, Impuesto, Numerico } from "@/types/cotizacion";

const props = defineProps<{
  amount?: Numerico;
  impuestos: Impuesto[];
  index?: number | string;
  listCostos?: Costo[];
}>();

const pricingStore = usePricingStore();
const { calcularTotalFleteVentaPorOpcion } = useCotizacionCalculos();

const mostrar = ref(true);
const headers = [
  { title: "#", key: "index" },
  { title: "Código", key: "codigo" },
  { title: "Descripción", key: "descripcion" },
  { title: "Porcentaje", key: "porcentaje" },
  { title: "Monto", key: "monto" },
];
const noPorcentaje = ["04", "01", "02", "10", "11", "12"];
const abierto = ref(0);
const siCalcula = ["05", "06", "07", "08", "09", "10", "11", "12"];

const actualizarCostosFlag = computed(() => pricingStore.actualizarCostosFlag);

function calcularImpuestos({ item = null }: { item?: Impuesto | null } = {}) {
  if (!item) return "0.00";
  const pricing = pricingStore;
  return calcularImpuestosCotizacion({
    impuestos: props.impuestos || [],
    item,
    totalFlete: calcularTotalFleteVentaPorOpcion({
      listCostos: props.listCostos,
    }),
    datosPrincipales: {
      ...pricing.datosPrincipales,
      amount:
        props.amount !== undefined && props.amount !== null
          ? props.amount
          : pricing.datosPrincipales.amount,
    },
  });
}
function calcularTotalImpuesto() {
  let total = 0;
  (props.impuestos || [])
    .filter(Boolean)
    .filter((v) => siCalcula.includes(String(v.codigo)))
    .forEach((element) => {
      total += parseFloat(calcularImpuestos({ item: element }));
    });
  return currencyFormat(total);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function obtenerPorcentaje({ code = "" }) {
  return obtenerPorcentajeCotizacion({
    listImpuestos: props.impuestos || [],
    code,
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function disabledImp({ code = "" }: { code?: string | number }) {
  return false;
}
function claseFila(item: Impuesto) {
  // Arreglo con los códigos que queremos pintar
  const codigosResaltados = ["01", "02", "03", "04", "05"]; // eslint-disable-line @typescript-eslint/no-unused-vars

  if (!siCalcula.includes(item.codigo as string)) {
    return "fila-color-especial"; // Nombre de la clase CSS que aplicaremos
  }
  return ""; // Las demás filas se quedan normales
}

watch(
  () => props.impuestos,
  () => {
    calcularImpuestos();
    abierto.value = 0;
  },
);
watch(actualizarCostosFlag, () => {
  setTimeout(() => {
    mostrar.value = !mostrar.value;
    mostrar.value = !mostrar.value;
    abierto.value = 0;
  }, 120);
});
watch(
  () => props.amount,
  () => {
    calcularImpuestos();
    abierto.value = 0;
  },
);
</script>

<template>
  <v-container v-if="mostrar">
    <v-expansion-panels
      class="condensed my-1"
      v-model="abierto"
    >
      <v-expansion-panel>
        <v-expansion-panel-title color="#90CAF9">
          <p>
            Impuestos Opción - {{ impuestos[0]!.nro_propuesta }} :
            <b>{{ calcularTotalImpuesto() }}</b>
          </p>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="impuestos"
            item-value="id"
            density="compact"
            disable-sort
            :row-props="({ item }) => ({ class: claseFila(item) })"
          >
            <template #[`item.descripcion`]="{ item }">
              {{ item.descripcion }}
              <p
                class="my-0 py-0"
                v-if="item.codigo=='04'"
                style="color:blue;font-style:italic ; font-size: 0.8em;"
              >
                Monto para Cálculo de Impuestos
              </p>
            </template>
            <template #[`item.index`]="{ index: indiceFila }">
              {{ indiceFila + 1 }}
            </template>
            <template #[`item.porcentaje`]="{ item }">
              <v-text-field
                v-model="item.codigo01"
                density="compact"
                v-if="!noPorcentaje.includes(item.codigo as string)"
                type="number"
                step="0.01"
                prefix="%"
                :disabled="disabledImp({ code: item.codigo })"
              />
            </template>
            <template #[`item.monto`]="{ item }">
              {{ calcularImpuestos({ item: item }) }}
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<style>
.fila-color-especial {
  background-color: #fff9c4 !important; /* Puedes cambiar este color */
}
</style>
