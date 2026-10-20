<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { useAduanaStore } from "@/stores/aduana";
import { calcularValor, currencyFormat } from "@/utils/cotizacion";
import type { Costo, FormNuevoCosto, Numerico } from "@/types/cotizacion";

const props = defineProps<{
  valores: Costo[];
  actualizarCostosFlag?: boolean;
  amount?: Numerico;
}>();

const aduanaStore = useAduanaStore();
const { calcularFac } = useCotizacionCalculos();

const resumenOpcion = ref({
  flete: 0,
  origen: 0,
  gasto: 0,
  aduana: 0,
  almacen: 0,
  gastostercero: 0,
});
const dialog = ref(false);
const fromDataService = ref<FormNuevoCosto>({
  ventaFlag: 0,
  esopcionflag: 0,
  id_begend: 0,
  costounitario: "",
  esorigenflag: 0,
  eslocalflag: 0,
  esaduanaflag: 0,
  esalmacenflag: 0,
  seguro: 0,
  cif: 0,
  esventaflag: 1,
  status: 1,
  id_groupservices: 0,
  id_multiplicador: 0,
  id_proveedor: 0,
});
 
let totalOption: number | undefined;
const frmNuevoCosto = useTemplateRef("frmNuevoCosto");


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const totalVenta = computed(() => {
  return totalOption;
});

function eliminarCostos({ costo = null as unknown as Costo }: { costo?: Costo }) {
  costo.status = 0;
  aduanaStore.listCostos =
    aduanaStore.listCostos.filter((v) => v.status == 1);
  setTimeout(() => {
    recalcularCostos();
  }, 10);
}
async function calcTotales() {
  setTimeout(async () => {
    await calcularTotalesFlete();
    await calcularTotalesNoFlete();
    await calcTotal();
  }, 100);
}
function calcularTotalesFlete() {
  totalOption = 0;
  resumenOpcion.value = {
    flete: 0,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };

  // @ts-expect-error The method is never called, so the condition is always true
  if (isFlete) {
    props.valores
      .filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1
      )
      .forEach((element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          resumenOpcion.value.flete +=
            ((aduanaStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador
            ).length > 0
              ? aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0]!.valor
              : 0) as number) *
            (element.costounitario as number) *
            (calcularFac(
              aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "N",
              aduanaStore.datosPrincipales.volumen,
              aduanaStore.datosPrincipales.peso,
              aduanaStore.datosPrincipales.containers,
              aduanaStore.datosPrincipales.amount
            ) as number);
        } else {
          resumenOpcion.value.flete += calcularValor(
            aduanaStore.datosPrincipales.amount,
            aduanaStore.totalFlete,
            aduanaStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador
            ).length > 0
              ? aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0]!.code
              : "",
            aduanaStore.listMultiplicador.some(
              (v) =>
                v.id == element.id_multiplicador &&
                (v.code == 14 ||
                  v.code == 13 ||
                  v.code == 15 ||
                  v.code == 5)
            )
              ? aduanaStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 ||
                      v.code == 13 ||
                      v.code == 15 ||
                      v.code == 5)
                )
                ? element.cif
                : element.seguro
              : 0
          );
        }
      });
  }
}
function calcularTotalesNoFlete() {
  resumenOpcion.value = {
    flete: resumenOpcion.value.flete,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };
  props.valores
    .filter((v) => v.status == 1)
    .forEach((element) => {
      //   GASTOS

      // @ts-expect-error The method is never called, so the condition is always true
      if (isOrigen) {
        if (element.esorigenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.origen +=
              ((aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                aduanaStore.datosPrincipales.volumen,
                aduanaStore.datosPrincipales.peso,
                aduanaStore.datosPrincipales.containers,
                aduanaStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.origen += calcularValor(
              aduanaStore.datosPrincipales.amount,
              aduanaStore.totalFlete,
              aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              aduanaStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5)
              )
                ? aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      // @ts-expect-error The method is never called, so the condition is always true
      if (isLocal) {
        if (element.eslocalflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gasto +=
              ((aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                aduanaStore.datosPrincipales.volumen,
                aduanaStore.datosPrincipales.peso,
                aduanaStore.datosPrincipales.containers,
                aduanaStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.gasto += calcularValor(
              aduanaStore.datosPrincipales.amount,
              aduanaStore.totalFlete,
              aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              aduanaStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5)
              )
                ? aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      //   ADUANA

      // @ts-expect-error The method is never called, so the condition is always true
      if (isAduana) {
        if (element.esaduanaflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.aduana +=
              ((aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                aduanaStore.datosPrincipales.volumen,
                aduanaStore.datosPrincipales.peso,
                aduanaStore.datosPrincipales.containers,
                aduanaStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.aduana += calcularValor(
              aduanaStore.datosPrincipales.amount,
              aduanaStore.totalFlete,
              aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              aduanaStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5)
              )
                ? aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      //   ALMACEN

      // @ts-expect-error The method is never called, so the condition is always true
      if (isAlmacen) {
        if (element.esalmacenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.almacen +=
              ((aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                aduanaStore.datosPrincipales.volumen,
                aduanaStore.datosPrincipales.peso,
                aduanaStore.datosPrincipales.containers,
                aduanaStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.almacen += calcularValor(
              aduanaStore.datosPrincipales.amount,
              aduanaStore.totalFlete,
              aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              aduanaStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5)
              )
                ? aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      //   GASTOS DE TERCEROS

      // @ts-expect-error The method is never called, so the condition is always true
      if (isGastosTercero) {
        if (element.esgastostercerosflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gastostercero +=
              ((aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? aduanaStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                aduanaStore.datosPrincipales.volumen,
                aduanaStore.datosPrincipales.peso,
                aduanaStore.datosPrincipales.containers,
                aduanaStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.gastostercero += calcularValor(
              aduanaStore.datosPrincipales.amount,
              aduanaStore.totalFlete,
              aduanaStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? aduanaStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              aduanaStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5)
              )
                ? aduanaStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
    });
}
function calcTotal() {
  nextTick(() => {
    totalOption = 0;
    totalOption =
      (resumenOpcion.value.flete ? resumenOpcion.value.flete : 0) +
      (resumenOpcion.value.gasto ? resumenOpcion.value.gasto : 0) +
      (resumenOpcion.value.aduana ? resumenOpcion.value.aduana : 0) +
      (resumenOpcion.value.origen ? resumenOpcion.value.origen : 0) +
      (resumenOpcion.value.almacen ? resumenOpcion.value.almacen : 0) +
      (resumenOpcion.value.gastostercero
        ? resumenOpcion.value.gastostercero
        : 0);
   
    // this.$store.state.aduana.totalVenta = this.totalOption;
    aduanaStore.totalVenta = totalOption;
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cerrarModalNuevoCosto() {
  frmNuevoCosto.value!.reset();
  dialog.value = !dialog.value;
}
async function guardarCosto() {
  if ((await frmNuevoCosto.value!.validate()).valid) {
    if (fromDataService.value.idOpcion == "OR") {
      fromDataService.value.esorigenflag = 1;
    }
    if (fromDataService.value.idOpcion == "LO") {
      fromDataService.value.eslocalflag = 1;
    }
    if (fromDataService.value.idOpcion == "AD") {
      fromDataService.value.esaduanaflag = 1;
    }
    if (fromDataService.value.idOpcion == "AL") {
      fromDataService.value.esalmacenflag = 1;
    }
    if (fromDataService.value.idOpcion == "FL") {
      fromDataService.value.esfleteflag = 1;
    }
    if (fromDataService.value.idOpcion == "GT") {
      fromDataService.value.esgastostercerosflag = 1;
    }
    aduanaStore.opcionCostos
      .filter((v) => v.nro_propuesta == props.valores[0]!.nro_propuesta)[0]!
      .listCostos.push(fromDataService.value);

    dialog.value = !dialog.value;
    calcTotales();
    aduanaStore.actualizarCostosFlag =
      !aduanaStore.actualizarCostosFlag;
    //
  }
}
function abrirModal() {
  dialog.value = !dialog.value;
  limpiar();
}
function isNotPorcentaje(element: Costo, id_multiplicador: Costo["id_multiplicador"]) {
  const code = [5, 13, 14, 15];

  const mul = aduanaStore.listMultiplicador.some(
    (v) => v.id == id_multiplicador && code.includes((v.code as number))
  );

  return !mul;
}
function isConfeccion(code: Numerico) {
  return code == 33 ? true : false;
}
function isFlete() {
  const val = props.valores.some(
    (v) => v.esfleteflag == 1 && v.status == true
  );

  return val;
}
function isOrigen() {
  const val = props.valores.some(
    (v) => v.esorigenflag == 1 && v.status == true
  );

  return val;
}
function isLocal() {
  const val = props.valores.some(
    (v) => v.eslocalflag == 1 && v.status == true
  );
  return val;
}
function isAduana() {
  const val = props.valores.some(
    (v) => v.esaduanaflag == 1 && v.status == true
  );
  return val;
}
function isAlmacen() {
  const val = props.valores.some(
    (v) => v.esalmacenflag == 1 && v.status == true
  );
  return val;
}
function isGastosTercero() {
  const val = props.valores.some(
    (v) => v.esgastostercerosflag == 1 && v.status == true
  );
  return val;
}
function montoConfeccion(item: Costo) {
  let monto = 0;
  if (item.code_cost == 33) {
    const amount = aduanaStore.datosPrincipales.amount;
    const cif =
      parseFloat(String(amount)) +
      parseFloat(String(aduanaStore.totalFlete)) +
      (parseFloat(String(amount)) +
        parseFloat(String(aduanaStore.totalFlete))) *
        0.01;

    if (cif < 5000) {
      monto = 50;
    }
    if (cif >= 5000 && cif < 10000) {
      monto = 80;
    }
    if (cif >= 10000) {
      monto = 80 + parseFloat(String(cif * 0.0025));
    }
  }

  item.costounitario = parseFloat(String(monto)).toFixed(2);
  return currencyFormat(monto);
}
function isITBM(code: Numerico) {
  return code == 38 ? true : false;
}
function montoITBM(item: Costo) {
  let monto = 0;
  const code = [29, 36, 41, 68];
  if (item.code_cost == 38) {
    const val = props.valores.filter((v) => code.includes((v.code_cost as number)));
    val.forEach((element) => {
      monto += parseFloat(
        String(((aduanaStore.listMultiplicador.some(
          (v) => v.id == element.id_multiplicador
        )
          ? aduanaStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador
            )[0]!.valor
          : 0) as number) *
          (element.costounitario as number) *
          (calcularFac(
            aduanaStore.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador
            )
              ? aduanaStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0]!.code
              : "N",
            aduanaStore.datosPrincipales.volumen,
            aduanaStore.datosPrincipales.peso,
            aduanaStore.datosPrincipales.containers,
            aduanaStore.datosPrincipales.amount
          ) as number))
      );
    });
  }
  item.costounitario = parseFloat(String(monto * 0.07)).toFixed(2);
  return currencyFormat(parseFloat(String(monto * 0.07)).toFixed(2));
}
function isNotaCredito(code: Numerico) {
  return code == 69 ? true : false;
}
function montoNotaCredito(item: Costo) {
  let monto = 0 as Numerico;
  const code = [33];
  if (item.code_cost == 69) {
    const val = props.valores.filter((v) => code.includes((v.code_cost as number)));
    val.forEach((element) => {
      monto = element.costounitario;
    });
  }
  item.costounitario = -1 * Number(parseFloat(String((monto as number) * 0.5)).toFixed(2));
  return currencyFormat(-1 * Number(parseFloat(String((monto as number) * 0.5)).toFixed(2)));
}
function limpiar() {
  fromDataService.value = {
    ventaFlag: 0,
    esopcionflag: 0,
    id_begend: 0,
    costounitario: "",
    esorigenflag: 0,
    eslocalflag: 0,
    esaduanaflag: 0,
    esalmacenflag: 0,
    seguro: 0,
    cif: 0,
    esventaflag: 1,
    status: 1,
    id_groupservices: 0,
    id_multiplicador: 0,
    id_proveedor: 0,
  };
}
function isImport() {
  return aduanaStore.listModality.some(
    (v) =>
      v.id == aduanaStore.datosPrincipales.idsentido &&
      v.code == "I"
  );
}
function recalcularCostos() {
  aduanaStore.actualizarCostosFlag =
    !aduanaStore.actualizarCostosFlag;
  calcTotales();
}
function reponerCero(valor: Costo) {
  if (
    valor.costounitario == "" ||
    valor.costounitario == null ||
    valor.costounitario == undefined
  ) {
    valor.costounitario = 0;
  }
}

watch(() => props.valores, () => {
  calcTotales();
});
watch(() => props.amount, () => {
  calcTotales();
});

onMounted(() => {
  calcTotales();
});
</script>

<template>
  <v-container fluid>
    <!-- {{  valores }} -->
    <div class="">
      <span class="text-headline-small">Ventas {{ currencyFormat(aduanaStore.totalVenta) }}</span>
      <v-btn
        variant="text"
        icon
        color="primary"
        @click="abrirModal"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
    >
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title>
            Nueva Venta
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  density="compact"
                  autocomplete="none"
                  :items="aduanaStore.listTipoCostos"
                  label="Tipo"
                  item-value="codigo"
                  item-title="name"
                  v-model="fromDataService.idOpcion"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  item-title="text"
                  density="compact"
                  label="Multiplicador"
                  :items="aduanaStore.listMultiplicador"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.nameservice"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  density="compact"
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costounitario"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="success"
              @click="guardarCosto()"
            >
              Aceptar
            </v-btn>
            <v-btn
              color="red"
              @click="dialog = !dialog"
            >
              cancelar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
    <v-expansion-panels
      class="condensed my-1"
      v-if="isFlete() && isImport()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "FL"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.flete) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esfleteflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.some(
                          (v) => v.id == valor.id_multiplicador
                        )
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- ORIGEN -->
    <v-expansion-panels
      class="condensed my-1"
      v-if="isOrigen()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "OR"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.origen) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esorigenflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- LOCAL -->
    <v-expansion-panels
      class="condensed my-1"
      v-if="isLocal()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "LO"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.gasto) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.eslocalflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <!-- ADUANA -->
    <v-expansion-panels
      class="condensed my-1"
      v-if="isAduana()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "AD"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.aduana) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esaduanaflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.some(
                          (v) => v.id == valor.id_multiplicador
                        )
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-expansion-panels
      class="condensed my-1"
      v-if="isFlete() && !isImport()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "FL"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.flete) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esfleteflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="recalcularCostos()"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="recalcularCostos()"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="recalcularCostos"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="recalcularCostos"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- ALMACEN -->
    <v-expansion-panels
      class="condensed my-1"
      v-if="isAlmacen()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "AL"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.almacen) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th style="" />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esalmacenflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- GASTOS DE TERCEROS -->
    <v-expansion-panels
      class="condensed my-1"
      v-if="isGastosTercero()"
    >
      <v-expansion-panel>
        <v-expansion-panel-title>
          {{
            aduanaStore.listTipoCostos.length > 0
              ? aduanaStore.listTipoCostos.filter(
                (v) => v.codigo == "GT"
              )[0]!.name
              : ""
          }}:
          <span>{{ currencyFormat(resumenOpcion.gastostercero) }}</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-table density="compact">
            <thead>
              <tr>
                <th style="" />

                <th style="">
                  Conceptos
                </th>
                <th style="">
                  Multipicador
                </th>
                <th
                  class="derecha"
                  style=""
                >
                  Costo Unitario
                </th>
                <th style="">
                  Sub Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(valor, i) in valores.filter(
                  (v) => v.esgastostercerosflag == 1 && v.status == 1
                )"
                :key="i"
              >
                <td class="btnAccion">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    size="x-small"
                    @click="eliminarCostos({ costo: valor })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>

                <td class="colConcepto">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="valor.nameservice"
                  />
                </td>
                <td class="colProveedorMultiplicador">
                  <v-select
                    item-title="text"
                    class="widthTD"
                    :items="aduanaStore.listMultiplicador"
                    v-model="valor.id_multiplicador"
                    placeholder="Multiplicador"
                    hide-details
                    density="compact"
                    @update:model-value="calcTotales"
                    :readonly="
                      isITBM(valor.code_cost) ||
                        isConfeccion(valor.code_cost) ||
                        isNotaCredito(valor.code_cost)
                    "
                  />
                </td>

                <td class="colCostos">
                  <!-- eslint-disable vue/v-on-style -->
                  <!-- @vue-expect-error the element listens to blur twice -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      isNotPorcentaje(valor, valor.id_multiplicador) &&
                        !isConfeccion(valor.code_cost) &&
                        !isITBM(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                    type="number"
                    step="0.01"
                    :min="valor.minimo"
                    v-on:blur="calcTotales"
                  />
                  <!-- eslint-enable vue/v-on-style -->
                  <v-text-field
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 13 || v.code == 14)
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    suffix="%"
                    density="compact"
                    max="100"
                    v-model="valor.cif"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />
                  <v-text-field
                    suffix="%"
                    class="derecha tdMontos"
                    v-if="
                      aduanaStore.listMultiplicador.some(
                        (v) => v.id == valor.id_multiplicador && v.code == 5
                      ) &&
                        !isITBM(valor.code_cost) &&
                        !isConfeccion(valor.code_cost) &&
                        !isNotaCredito(valor.code_cost)
                    "
                    hide-details
                    density="compact"
                    max="100"
                    v-model="valor.seguro"
                    type="number"
                    :min="valor.minimo"
                    step="0.01"
                    @blur="calcTotales"
                  />

                  <v-text-field
                    v-if="isConfeccion(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />
                  <v-text-field
                    v-if="isITBM(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    :error-messages="valor.error"
                    prefix="$"
                  />

                  <v-text-field
                    v-if="isNotaCredito(valor.code_cost)"
                    readonly
                    density="compact"
                    v-model="valor.costounitario"
                    @blur="reponerCero(valor)"
                    prefix="$"
                  />
                </td>

                <td
                  class="colCostos"
                  v-if="
                    isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      ((aduanaStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador
                      ).length > 0
                        ? aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        )[0]!.valor
                        : 0)! as number) *
                        (valor.costounitario as number)! *
                        (calcularFac(
                          aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          ).length > 0
                            ? aduanaStore.listMultiplicador.filter(
                              (v) => v.id == valor.id_multiplicador
                            )[0]!.code
                            : "N",
                          aduanaStore.datosPrincipales.volumen,
                          aduanaStore.datosPrincipales.peso,
                          aduanaStore.datosPrincipales.containers,
                          aduanaStore.datosPrincipales.amount
                        )! as number)
                    )
                  }}
                </td>

                <td
                  class="colCostos"
                  v-if="
                    !isNotPorcentaje(valor, valor.id_multiplicador) &&
                      !isConfeccion(valor.code_cost) &&
                      !isITBM(valor.code_cost) &&
                      !isNotaCredito(valor.code_cost)
                  "
                >
                  {{
                    currencyFormat(
                      calcularValor(
                        aduanaStore.datosPrincipales.amount,
                        aduanaStore.totalFlete,
                        aduanaStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador
                        ).length > 0
                          ? aduanaStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador
                          )[0]!.code
                          : "",
                        aduanaStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15)
                        )
                          ? aduanaStore.listMultiplicador.some(
                            (v) =>
                              v.id == valor.id_multiplicador &&
                              (v.code == 14 || v.code == 13 || v.code == 15)
                          )
                            ? valor.cif
                            : valor.seguro
                          : 0
                      )
                    )
                  }}
                </td>
                <td
                  class="colCostos"
                  v-if="isConfeccion(valor.code_cost)"
                >
                  {{ montoConfeccion(valor) }}
                </td>
                <td
                  class="colCostos"
                  v-if="isITBM(valor.code_cost)"
                >
                  {{ montoITBM(valor) }}
                </td>

                <td
                  class="colCostos"
                  v-if="isNotaCredito(valor.code_cost)"
                >
                  {{ montoNotaCredito(valor) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<style scoped>
.v-expansion-panels.condensed
  .v-expansion-panel-title
  .v-expansion-panel-text__wrapper {
  /* padding-top: 2px;
  padding-bottom: 2px; */
  padding: 2px 8px 2px;
  min-height: auto;
}
.widthTD {
  max-width: 250px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 30% !important;
  max-width: 30% !important;
}
.colConcepto {
  width: 45% !important;
  max-width: 45% !important;
  min-width: 45% !important;
}
.colCostos {
  width: 10% !important;
  max-width: 10% !important;
}
/* .tdMontos {
  width:  !important; 
} */

td {
  padding: 0 3px !important;
}
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.v-field__input {
  max-width: 5px !important;
}

table td:nth-child(4) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}
table td:nth-child(5) {
  align-content: right !important;
  text-align: right !important;
  max-width: 90px !important;
  min-width: 90px !important;
}

.expansion {
  background: salmon !important;
  padding: 0 8px 16px !important;
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 2px 0 2px !important;
}
</style>
