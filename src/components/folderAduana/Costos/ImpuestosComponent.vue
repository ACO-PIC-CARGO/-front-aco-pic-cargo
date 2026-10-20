<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePricingStore } from "@/stores/pricing";
import { currencyFormat } from "@/utils/cotizacion";
import type { Impuesto, Numerico } from "@/types/cotizacion";

const props = defineProps<{
  amount?: Numerico;
  impuestos: Impuesto[];
  index?: number | string;
}>();

const pricingStore = usePricingStore();

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


const actualizarCostosFlag = computed(() => {
  return pricingStore.actualizarCostosFlag;
});

function calcularImpuestos({ item = null as unknown as Impuesto }: { item?: Impuesto }) {
  let monto: number | string = 0;
  if (item.codigo === "01") {
    monto = parseFloat(
      String(pricingStore.datosPrincipales.amount)
    ).toFixed(2);
  }
  if (item.codigo === "02") {
    monto = parseFloat(String(pricingStore.totalFlete)).toFixed(2);
  }
  if (item.codigo === "03") {
    monto = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (item.codigo01 as number)) /
        100)
    ).toFixed(2);
  }
  if (item.codigo === "04") {
    const fob = parseFloat(String(pricingStore.datosPrincipales.amount));
    const flet = parseFloat(String(pricingStore.totalFlete));
    const seguro = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    monto = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
  }
  if (item.codigo === "05") {
    const fob = parseFloat(String(pricingStore.datosPrincipales.amount));
    const flet = parseFloat(String(pricingStore.totalFlete));
    const seguro = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    monto = (cif * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "06") {
    const fob = parseFloat(String(pricingStore.datosPrincipales.amount));
    const flet = parseFloat(String(pricingStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    monto = ((cif + adv) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "07") {
    const fob = parseFloat(String(pricingStore.datosPrincipales.amount));
    const flet = parseFloat(String(pricingStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    const isc = ((cif + adv) * (obtenerPorcentaje({ code: "06" }) as number)) / 100;
    monto = ((cif + adv + isc) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "08") {
    const fob = parseFloat(String(pricingStore.datosPrincipales.amount));
    const flet = parseFloat(String(pricingStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    const isc = ((cif + adv) * (obtenerPorcentaje({ code: "06" }) as number)) / 100;
    monto = ((cif + adv + isc) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "09") {
    const fob = parseFloat(String(pricingStore.datosPrincipales.amount));
    const flet = parseFloat(String(pricingStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(pricingStore.totalFlete)) +
        parseFloat(String(pricingStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    const isc = ((cif + adv) * (obtenerPorcentaje({ code: "06" }) as number)) / 100;
    const ipm =
      ((cif + adv + isc) * (obtenerPorcentaje({ code: "07" }) as number)) / 100;
    const igv =
      ((cif + adv + isc) * (obtenerPorcentaje({ code: "08" }) as number)) / 100;

    monto = ((cif + adv + isc + igv + ipm) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "10") {
    monto = 100;
  }
  if (item.codigo === "11") {
    monto = 7;
  }
  if (item.codigo === "12") {
    monto = 3;
  }
  return parseFloat(String(monto)).toFixed(2);
}
function calcularTotalImpuesto() {
  let total = 0;
  const siCalcula = ["05", "06", "07", "08", "09", "10", "11", "12"];
  props.impuestos
    .filter((v) => siCalcula.includes(v.codigo as string))
    .forEach((element) => {
      total += parseFloat(calcularImpuestos({ item: element }));
    });
  return currencyFormat(total);
}
function obtenerPorcentaje({ code = "" }: { code?: string | number }) {
  const porcentaje =
    props.impuestos.filter((v) => v.codigo == code).length > 0
      ? props.impuestos.filter((v) => v.codigo == code)[0]!.codigo01
      : 0;
  return porcentaje;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function disabledImp({ code = "" }: { code?: string | number }) {
  return false;
}

watch(() => props.impuestos, () => {
  // @ts-expect-error Kept: called without its destructured argument, so it throws
  calcularImpuestos();
  abierto.value = 0;
});
watch(actualizarCostosFlag, () => {
  setTimeout(() => {
    mostrar.value = !mostrar.value;
    mostrar.value = !mostrar.value;
    abierto.value = 0;
  }, 120);
});
watch(() => props.amount, () => {
  // @ts-expect-error Kept: called without its destructured argument, so it throws
  calcularImpuestos();
  abierto.value = 0;
});
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
          >
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

<style></style>
