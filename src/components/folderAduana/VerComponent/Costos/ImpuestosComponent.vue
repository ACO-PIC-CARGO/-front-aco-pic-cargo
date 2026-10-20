<script setup lang="ts">
import { useAduanaStore } from "@/stores/aduana";
import { currencyFormat } from "@/utils/cotizacion";
import type { Impuesto, Numerico } from "@/types/cotizacion";

const props = defineProps<{
  amount?: Numerico;
  impuestos: Impuesto[];
  index?: number | string;
}>();

const aduanaStore = useAduanaStore();

const headers = [
  { title: "#", key: "index" },
  { title: "Código", key: "codigo" },
  { title: "Descripción", key: "descripcion" },
  { title: "Porcentaje", key: "porcentaje" },
  { title: "Monto", key: "monto" },
];
const noPorcentaje = ["04", "01", "02", "10", "11", "12"];

function calcularImpuestos({ item = null as unknown as Impuesto }: { item?: Impuesto }) {
  let monto: number | string = 0;
  if (item.codigo === "01") {
    monto = parseFloat(
      String(aduanaStore.datosPrincipales.amount)
    ).toFixed(2);
  }
  if (item.codigo === "02") {
    monto = parseFloat(String(aduanaStore.totalFlete)).toFixed(2);
  }
  if (item.codigo === "03") {
    monto = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
        (item.codigo01 as number)) /
        100)
    ).toFixed(2);
  }
  if (item.codigo === "04") {
    const fob = parseFloat(String(aduanaStore.datosPrincipales.amount));
    const flet = parseFloat(String(aduanaStore.totalFlete));
    const seguro = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    monto = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
  }
  if (item.codigo === "05") {
    const fob = parseFloat(String(aduanaStore.datosPrincipales.amount));
    const flet = parseFloat(String(aduanaStore.totalFlete));
    const seguro = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    monto = (cif * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "06") {
    const fob = parseFloat(String(aduanaStore.datosPrincipales.amount));
    const flet = parseFloat(String(aduanaStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    monto = ((cif + adv) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "07") {
    const fob = parseFloat(String(aduanaStore.datosPrincipales.amount));
    const flet = parseFloat(String(aduanaStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    const isc = ((cif + adv) * (obtenerPorcentaje({ code: "06" }) as number)) / 100;
    monto = ((cif + adv + isc) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "08") {
    const fob = parseFloat(String(aduanaStore.datosPrincipales.amount));
    const flet = parseFloat(String(aduanaStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
        (obtenerPorcentaje({ code: "03" }) as number)) /
        100)
    );
    const cif = parseFloat(String(fob)) + parseFloat(String(flet)) + parseFloat(String(seguro));
    const adv = (cif * (obtenerPorcentaje({ code: "05" }) as number)) / 100;
    const isc = ((cif + adv) * (obtenerPorcentaje({ code: "06" }) as number)) / 100;
    monto = ((cif + adv + isc) * (item.codigo01 as number)) / 100;
  }
  if (item.codigo === "09") {
    const fob = parseFloat(String(aduanaStore.datosPrincipales.amount));
    const flet = parseFloat(String(aduanaStore.totalFlete));

    const seguro = parseFloat(
      String(((parseFloat(String(aduanaStore.totalFlete)) +
        parseFloat(String(aduanaStore.datosPrincipales.amount))) *
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function amountOption() {
  // @ts-expect-error called without its destructured argument, so it throws
  calcularImpuestos();
}
</script>

<template>
  <v-container>
    <v-expansion-panels
      multiple
      class="condensed my-1"
    >
      <v-expansion-panel>
        <v-expansion-panel-title color="#90CAF9">
          <p>
            Impuestos Opción - {{ index }} :
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
                disabled
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
