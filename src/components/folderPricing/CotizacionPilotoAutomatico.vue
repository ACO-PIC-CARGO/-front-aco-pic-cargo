<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import moment from "moment";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { useProveedorStore } from "@/stores/proveedor";
import { usePricingStore } from "@/stores/pricing";
import { calcularValor, currencyFormat } from "@/utils/cotizacion";
import type { Costo, Numerico } from "@/types/cotizacion";

const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const proveedorStore = useProveedorStore();
const { calcularFac } = useCotizacionCalculos();

const e6 = ref(1);
const profit = ref(0);
const mostrarOrigenFlag = ref(false);
const mostrarLocalFlag = ref(false);
const mostrarAduanaFlag = ref(false);
const mostrarFleteExportFlag = ref(false);
const mostrarAlmacenFlag = ref(false);
const mostrarGastosTercerosFlag = ref(false);
const resumenOpcion = ref({
  flete: 0,
  origen: 0,
  gasto: 0,
  aduana: 0,
  almacen: 0,
  gastostercero: 0,
});
const resumenOpcionVentas = ref({
  flete: 0,
  origen: 0,
  gasto: 0,
  aduana: 0,
  almacen: 0,
  gastostercero: 0,
});
const valores = usePricingStore().opcionCostos[0]!.listCostos.filter(
  (v) => v.esopcionflag == 1 && v.costounitario == 0,
);
const valoresVentas = usePricingStore().opcionCostos[0]!.listCostos.filter(
  (v) => v.esventaflag == 1,
);
let totalOption: number | undefined;
const isImport = undefined as boolean | undefined;
// Not defined anywhere, so calling these throws.
const montoConfeccion = undefined as unknown as (valor: Costo) => string;
const montoITBM = undefined as unknown as (valor: Costo) => string;
const montoNotaCredito = undefined as unknown as (valor: Costo) => string;
const frmFecha = useTemplateRef("frmFecha");
// Not defined anywhere, so clicking the button throws.
const eliminarCostos = undefined as unknown as (args: { costo: Costo }) => void;
const abrirModalRegistroProveedor = undefined as unknown as (valor: Costo) => void;

const mostrarOrigen = computed(() => {
  return mostrarOrigenFlag.value;
});
const mostrarLocal = computed(() => {
  return mostrarLocalFlag.value;
});
const mostrarAduana = computed(() => {
  return mostrarAduanaFlag.value;
});
const mostrarAlmacen = computed(() => {
  return mostrarAlmacenFlag.value;
});
const mostrarGastosTerceros = computed(() => {
  return mostrarGastosTercerosFlag.value;
});
const isFlete = computed(() => {
  return pricingStore.opcionCostos[
    pricingStore.index
  ]!.listCostos.some((v) => v.esfleteflag == 1 && v.status == 1);
});
const isOrigen = computed(() => {
  return pricingStore.opcionCostos[
    pricingStore.index
  ]!.listCostos.some((v) => v.esorigenflag == 1 && v.status == 1);
});
const isLocal = computed(() => {
  return pricingStore.opcionCostos[
    pricingStore.index
  ]!.listCostos.some((v) => v.eslocalflag == 1 && v.status == 1);
});
const isAduana = computed(() => {
  return pricingStore.opcionCostos[
    pricingStore.index
  ]!.listCostos.some((v) => v.esaduanaflag == 1 && v.status == 1);
});
const isAlmacen = computed(() => {
  return pricingStore.opcionCostos[
    pricingStore.index
  ]!.listCostos.some((v) => v.esalmacenflag == 1 && v.status == 1);
});
const isGastosTercero = computed(() => {
  return pricingStore.opcionCostos[
    pricingStore.index
  ]!.listCostos.some((v) => v.esgastostercerosflag == 1 && v.status == 1);
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mostrarFleteExport = computed(() => {
  return !isImport && mostrarFleteExportFlag.value;
});

function recargarHayOpciones() {
  if (isOrigen.value) {
    mostrarOrigenFlag.value = true;
  }
  if (isLocal.value) {
    mostrarLocalFlag.value = true;
  }

  if (isAduana.value) {
    mostrarAduanaFlag.value = true;
  }
  if (isFlete.value && !isImport) {
    mostrarFleteExportFlag.value = true;
  }
  if (isAlmacen.value) {
    mostrarAlmacenFlag.value = true;
  }
  if (isGastosTercero.value) {
    mostrarGastosTercerosFlag.value = true;
  }
}
async function recargarProveedores(e: string | null) {
  const opciones = [...pricingStore.opcionCostos];
  const IdProveedor: Costo["id_proveedor"][] = [];
  opciones.forEach((opcion) => {
    opcion.listCostos.forEach((costo) => {
      if (!IdProveedor.some((v) => v == costo.id_proveedor))
        IdProveedor.push(costo.id_proveedor);
    });
  });
  await proveedorStore.obtenerProveedorPricing({
    id: IdProveedor.join(","),
    search: e,
  });
}
function isDateValid(date: string) {
  if (!date) {
    return true; // Pasa la validación si el campo está vacío
  }

  const selectedDate = moment(date, "YYYY-MM-DD", true);
  const today = moment();

  return selectedDate.isAfter(today);
}
async function continuar(step: number) {
  pricingStore.tiporeporte = "AGRUPADO";
  if (step == 2 && !(await frmFecha.value!.validate()).valid) {
    return;
  }
  if (step === 5) {
    console.log(pricingStore.listMultiplicador);
    const idEmbarque = pricingStore.listMultiplicador.filter(
      (v) => Number(v.code) == 1,
    )[0]!.id;
    const flags = { origin: 0, local: 0, aduana: 0, almacen: 0, terceros: 0 };
    if (mostrarOrigen.value) {
      flags.origin = 1;
    } else if (mostrarLocal.value) {
      flags.local = 1;
    } else if (mostrarAduana.value) {
      flags.aduana = 1;
    } else if (mostrarAlmacen.value) {
      flags.almacen = 1;
    } else if (mostrarGastosTerceros.value) {
      flags.terceros = 1;
    }
    const fromDataService = {
      id: "",
      code_cost: "0",
      ventaFlag: 0,
      esopcionflag: 0,
      id_begend: 0,
      costounitario: Number(profit.value),
      esorigenflag: 0,
      eslocalflag: 1,
      esaduanaflag: 0,
      esalmacenflag: 0,
      seguro: 0,
      cif: 0,
      esventaflag: 1,
      status: 1,
      id_groupservices: 0,
      id_multiplicador: idEmbarque,
      id_proveedor: 0,
      nameservice: "PROFIT",
    };
    pricingStore.opcionCostos[0]!.listCostos.push(
      fromDataService,
    );
    setTimeout(() => {
      console.log(valoresVentas);
    }, 500);
    }
  e6.value = step;
}
function cancelar() {
  e6.value--;
}

function copiarCostostoVentas() {
  const costos = pricingStore.opcionCostos[0]!.listCostos.filter(
    (v) => v.esopcionflag == 1,
  );
  valoresVentas
    .filter((v) => v.status == 1)
    .forEach((venta) => {
      const costo = costos.find((c) => c.nameservice == venta.nameservice);
      if (costo) {
        venta.costounitario = costo.costounitario;
        venta.id_multiplicador = costo.id_multiplicador;
        venta.cif = costo.cif;
        venta.seguro = costo.seguro;
      }
    });
  continuar(4);
}
async function calcTotales() {
  Promise.all([
    calcularTotalesFlete(),
    calcularTotalesNoFlete(),
  ]).then(() => {
    calcTotal();
  });
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

  if (isFlete.value) {
    valores
      .filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
      )
      .forEach((element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          resumenOpcion.value.flete +=
            ((pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0]!.valor
              : 0) as number) *
            (element.costounitario as number) *
            (calcularFac(
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "N",
              pricingStore.datosPrincipales.volumen,
              pricingStore.datosPrincipales.peso,
              pricingStore.datosPrincipales.containers,
              pricingStore.datosPrincipales.amount,
            ) as number);
        } else {
          resumenOpcion.value.flete += calcularValor(
            pricingStore.datosPrincipales.amount,
            pricingStore.totalFlete,
            pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0]!.code
              : "",
            pricingStore.listMultiplicador.some(
              (v) =>
                v.id == element.id_multiplicador &&
                (v.code == 14 ||
                  v.code == 13 ||
                  v.code == 15 ||
                  v.code == 5),
            )
              ? pricingStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 ||
                      v.code == 13 ||
                      v.code == 15 ||
                      v.code == 5),
                )
                ? element.cif
                : element.seguro
              : 0,
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
  valores
    .filter((v) => v.status == 1)
    .forEach((element) => {
      //   GASTOS
      if (isOrigen.value) {
        if (element.esorigenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.origen +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcion.value.origen += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      if (isLocal.value) {
        if (element.eslocalflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gasto +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcion.value.gasto += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ADUANA
      if (isAduana.value) {
        if (element.esaduanaflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.aduana +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcion.value.aduana += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ALMACEN
      if (isAlmacen.value) {
        if (element.esalmacenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.almacen +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcion.value.almacen += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   GASTOS DE TERCEROS
      if (isGastosTercero.value) {
        if (element.esgastostercerosflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gastostercero +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcion.value.gastostercero += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
    });
}
function calcTotal() {
  totalOption = 0;
  totalOption =
    resumenOpcion.value.flete +
    resumenOpcion.value.gasto +
    resumenOpcion.value.aduana +
    resumenOpcion.value.origen +
    resumenOpcion.value.almacen +
    resumenOpcion.value.gastostercero;

  pricingStore.totalCosto = totalOption;
  // this.setTotalOpcion(valores);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function calcTotalesVentas() {
  Promise.all([
    calcularTotalesFleteVentas(),
    calcularTotalesNoFleteVentas(),
  ]).then(() => {
    calcTotalVentas();
  });
}

function calcularTotalesFleteVentas() {
  totalOption = 0;
  resumenOpcionVentas.value = {
    flete: 0,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };

  if (isFlete.value) {
    valores
      .filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
      )
      .forEach((element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          resumenOpcionVentas.value.flete +=
            ((pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0]!.valor
              : 0) as number) *
            (element.costounitario as number) *
            (calcularFac(
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "N",
              pricingStore.datosPrincipales.volumen,
              pricingStore.datosPrincipales.peso,
              pricingStore.datosPrincipales.containers,
              pricingStore.datosPrincipales.amount,
            ) as number);
        } else {
          resumenOpcionVentas.value.flete += calcularValor(
            pricingStore.datosPrincipales.amount,
            pricingStore.totalFlete,
            pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            ).length > 0
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0]!.code
              : "",
            pricingStore.listMultiplicador.some(
              (v) =>
                v.id == element.id_multiplicador &&
                (v.code == 14 ||
                  v.code == 13 ||
                  v.code == 15 ||
                  v.code == 5),
            )
              ? pricingStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 ||
                      v.code == 13 ||
                      v.code == 15 ||
                      v.code == 5),
                )
                ? element.cif
                : element.seguro
              : 0,
          );
        }
      });
  }
}
function calcularTotalesNoFleteVentas() {
  resumenOpcionVentas.value = {
    flete: resumenOpcionVentas.value.flete,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };
  valores
    .filter((v) => v.status == 1)
    .forEach((element) => {
      //   GASTOS
      if (isOrigen.value) {
        if (element.esorigenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcionVentas.value.origen +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcionVentas.value.origen += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      if (isLocal.value) {
        if (element.eslocalflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcionVentas.value.gasto +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcionVentas.value.gasto += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ADUANA
      if (isAduana.value) {
        if (element.esaduanaflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcionVentas.value.aduana +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcionVentas.value.aduana += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ALMACEN
      if (isAlmacen.value) {
        if (element.esalmacenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcionVentas.value.almacen +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcionVentas.value.almacen += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   GASTOS DE TERCEROS
      if (isGastosTercero.value) {
        if (element.esgastostercerosflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcionVentas.value.gastostercero +=
              ((pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.valor
                : 0) as number) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador,
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount,
              ) as number);
          } else {
            resumenOpcionVentas.value.gastostercero += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador,
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador,
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 ||
                    v.code == 13 ||
                    v.code == 15 ||
                    v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 ||
                        v.code == 13 ||
                        v.code == 15 ||
                        v.code == 5),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
    });
}
function calcTotalVentas() {
  totalOption = 0;
  totalOption =
    resumenOpcionVentas.value.flete +
    resumenOpcionVentas.value.gasto +
    resumenOpcionVentas.value.aduana +
    resumenOpcionVentas.value.origen +
    resumenOpcionVentas.value.almacen +
    resumenOpcionVentas.value.gastostercero;

  pricingStore.totalVenta = totalOption;
  // this.setTotalOpcion(valores);
}
function isNotPorcentaje(element: Costo, id_multiplicador: Costo["id_multiplicador"]) {
  const code = [5, 13, 14, 15];

  const mul = pricingStore.listMultiplicador.some(
    (v) => v.id == id_multiplicador && code.includes(v.code as number),
  );

  return !mul;
}
function isITBM(code: Numerico) {
  return code == 38 ? true : false;
}
function isConfeccion(code: Numerico) {
  return code == 33 ? true : false;
}
function isNotaCredito(code: Numerico) {
  return code == 69 ? true : false;
}
async function editarCotizacion() {
  appStore.spiner = false;
  await pricingStore.updateQuote();

  router.push({
    name: "verQuote",
    params: {
      id: pricingStore.id,
      step: pricingStore.step
        ? pricingStore.step
        : 1,
    },
  });
  appStore.spiner = false;
  emit("close");
}

onMounted(() => {
  nextTick(() => {
    e6.value = 1;
    recargarHayOpciones();

    console.log(mostrarLocalFlag.value);
    console.log(mostrarAduanaFlag.value);
    console.log(mostrarAlmacenFlag.value);
    console.log(mostrarGastosTercerosFlag.value);
  });
});
</script>

<template>
  <v-container>
    <v-stepper-vertical
      v-model="e6"
      hide-actions
      eager
    >
      <v-stepper-vertical-item
        :complete="e6 > 1"
        :value="1"
        title="Fechas:"
      >
        <v-form ref="frmFecha">
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="
                  pricingStore.opcionCostos[pricingStore.index]!
                    .date_end
                "
                type="date"
                label="`Fecha Validez de la cotización`"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => isDateValid(v) || 'La fecha debe ser mayor que hoy.',
                ]"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="
                  pricingStore.opcionCostos[pricingStore.index]!
                    .tiempo_transito
                "
                type="number"
                label="`Tiempo en tránsito de la Opción`"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser positivo.',
                ]"
              />
            </v-col>
            <v-col cols="12">
              <v-btn
                size="small"
                class="mx-1"
                color="primary"
                @click="continuar(2)"
              >
                Continue
              </v-btn>
              <v-btn
                size="small"
                class="mx-1"
                color="error"
                @click="cancelar"
              >
                Cancel
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-stepper-vertical-item>

      <v-stepper-vertical-item
        :complete="e6 > 2"
        :value="2"
        title="Costos Requerido:"
      >
        <v-table density="compact">
          <thead>
            <tr>
              <th />
              <th style="">
                Proveedor
              </th>
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
              v-for="(valor, i) in valores.filter((v) => v.status == 1)"
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
              <td class="colProveedorMultiplicador">
                <v-autocomplete
                  density="compact"
                  item-title="namelong"
                  item-value="id"
                  :items="proveedorStore.lstProveedores"
                  v-model="valor.id_proveedor"
                  @update:search="recargarProveedores"
                  hide-details
                  menu-icon=""
                >
                  <template #append-inner>
                    <v-icon
                      icon="mdi-plus"
                      @mousedown.stop
                      @click.stop="abrirModalRegistroProveedor(valor)"
                    />
                  </template>
                </v-autocomplete>
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
                  :items="pricingStore.listMultiplicador"
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
                  :error-messages="valor.error"
                  :rules="[
                    (v) => {
                      if (v > 0) {
                        valor.error = ''; // Borra el mensaje de error si el valor es válido
                        return true; // La regla se cumple
                      }
                      valor.error = 'El costo que tiene un valor 0.00.';
                      return false; // La regla no se cumple
                    },
                  ]"
                  prefix="$"
                  type="number"
                  step="0.01"
                  :min="valor.minimo"
                  @blur="calcTotales"
                />
                <v-text-field
                  class="derecha tdMontos"
                  v-if="
                    pricingStore.listMultiplicador.some(
                      (v) =>
                        v.id == valor.id_multiplicador &&
                        (v.code == 13 || v.code == 14 || v.code == 15),
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
                    pricingStore.listMultiplicador.some(
                      (v) => v.id == valor.id_multiplicador && v.code == 5,
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
                  v-if="isITBM(valor.code_cost)"
                  readonly
                  density="compact"
                  v-model="valor.costounitario"
                  :error-messages="valor.error"
                  prefix="$"
                />

                <v-text-field
                  v-if="isConfeccion(valor.code_cost)"
                  readonly
                  density="compact"
                  v-model="valor.costounitario"
                  :error-messages="valor.error"
                  prefix="$"
                />
                <v-text-field
                  v-if="isNotaCredito(valor.code_cost)"
                  readonly
                  density="compact"
                  v-model="valor.costounitario"
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
                    ((pricingStore.listMultiplicador.filter(
                      (v) => v.id == valor.id_multiplicador,
                    ).length > 0
                      ? pricingStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador,
                      )[0]!.valor
                      : 0) as number) *
                      (valor.costounitario as number) *
                      (calcularFac(
                        pricingStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador,
                        ).length > 0
                          ? pricingStore.listMultiplicador.filter(
                            (v) => v.id == valor.id_multiplicador,
                          )[0]!.code
                          : "N",
                        pricingStore.datosPrincipales.volumen,
                        pricingStore.datosPrincipales.peso,
                        pricingStore.datosPrincipales.containers,
                        pricingStore.datosPrincipales.amount,
                      ) as number),
                  )
                }}
              </td>

              <td
                class="colCostos"
                v-if="
                  !isNotPorcentaje(valor, valor.id_multiplicador) &&
                    !isITBM(valor.code_cost) &&
                    !isConfeccion(valor.code_cost) &&
                    !isNotaCredito(valor.code_cost)
                "
              >
                {{
                  currencyFormat(
                    calcularValor(
                      pricingStore.datosPrincipales.amount,
                      pricingStore.totalFlete,
                      pricingStore.listMultiplicador.filter(
                        (v) => v.id == valor.id_multiplicador,
                      ).length > 0
                        ? pricingStore.listMultiplicador.filter(
                          (v) => v.id == valor.id_multiplicador,
                        )[0]!.code
                        : "",
                      pricingStore.listMultiplicador.some(
                        (v) =>
                          v.id == valor.id_multiplicador &&
                          (v.code == 14 ||
                            v.code == 13 ||
                            v.code == 15 ||
                            v.code == 5),
                      )
                        ? pricingStore.listMultiplicador.some(
                          (v) =>
                            v.id == valor.id_multiplicador &&
                            (v.code == 14 || v.code == 13 || v.code == 15),
                        )
                          ? valor.cif
                          : valor.seguro
                        : 0,
                    ),
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
        <br>
        <v-btn
          size="small"
          class="mx-1"
          color="primary"
          @click="continuar(3)"
        >
          Continue
        </v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="error"
          @click="cancelar"
        >
          Cancel
        </v-btn>
      </v-stepper-vertical-item>

      <v-stepper-vertical-item
        :complete="e6 > 3"
        :value="3"
        title="Copiar costos a la sección de ventas:"
      >
        <v-spacer />
        <v-btn
          class="mx-2"
          color="success"
          @click="copiarCostostoVentas()"
        >
          Si, Copiar
        </v-btn>
        <v-btn
          class="mx-2"
          color="warning"
          @click="continuar(4)"
        >
          No Copiar
        </v-btn>
      </v-stepper-vertical-item>

      <v-stepper-vertical-item
        :value="4"
        title="Profit Estimado"
      >
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="profit"
              type="numer"
              step="0.01"
            />
          </v-col>
          <v-col cols="12">
            <v-btn
              size="small"
              color="primary"
              @click="continuar(5)"
            >
              Continue
            </v-btn>
            <v-btn
              size="small"
              class="mx-1"
              color="error"
              @click="cancelar"
            >
              Cancel
            </v-btn>
          </v-col>
        </v-row>
      </v-stepper-vertical-item>
      <v-stepper-vertical-item
        :value="5"
        title="Finalizar"
      >
        <v-btn
          color="success"
          @click="editarCotizacion"
        >
          Finalizar
        </v-btn>
      </v-stepper-vertical-item>
    </v-stepper-vertical>
  </v-container>
</template>

<style scoped>
.widthTD {
  max-width: 180px !important;
  padding: 0 18px !important;
}

.btnAccion {
  width: 5% !important;
  max-width: 5% !important;
}

.colProveedorMultiplicador {
  width: 20% !important;
  max-width: 20% !important;
}
.colConcepto {
  width: 35% !important;
  max-width: 35% !important;
  min-width: 35% !important;
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
</style>
