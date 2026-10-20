<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { usePricingStore } from "@/stores/pricing";
import { calcularValor, currencyFormat } from "@/utils/cotizacion";
import type {
  Costo,
  Numerico,
  EncabezadoComparativa,
  OpcionComparativa,
} from "@/types/cotizacion";

const appStore = useAppStore();
const pricingStore = usePricingStore();
const { calcularFac } = useCotizacionCalculos();

const loadingTable = ref(false);
const headers = ref<EncabezadoComparativa[]>([]);
const opcionesSeleccionadas = ref<OpcionComparativa[]>([]);
const resumenOpcion = ref({
  flete: 0,
  origen: 0,
  gasto: 0,
  aduana: 0,
  almacen: 0,
  gastostercero: 0,
});
const flete = ref(false);
const origen = ref(false);
const local = ref(false);
const aduana = ref(false);
const almacen = ref(false);
const gastostercero = ref(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let totalOption: number | undefined;
let dialog: boolean | undefined;

const actualizarComparativa = computed(
  () => pricingStore.actualizarComparativa,
);

watch(actualizarComparativa, async () => {
  await calcularTotalesOpciones();

  setTimeout(async () => {
    await agregarFilasAlHeader();
  }, 1000);
});

onMounted(async () => {
  await calcularTotalesOpciones();
  setTimeout(async () => {
    await agregarFilasAlHeader();
  }, 120);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function regregar() {
  Swal.fire({
    width: 1000,
    icon: "question",
    html: `<h1>¿Desea regresar a la OPCIÓN - COSTOS ${pricingStore.opcionCostos.length}?<h1>`,
    confirmButtonColor: "green",
    showCancelButton: true,
    cancelButtonColor: "red",
    confirmButtonText: "<h1>Si, volver</h1>",
    cancelButtonText: "<h1>Cancelar</h1>",
    showCloseButton: true,
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
  }).then((action) => {
    if (action.isConfirmed) {
      pricingStore.tab = 2;
    }
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function bloquearSeleccionada(opcion: OpcionComparativa) {
  if (pricingStore.opcionCostos.length == 1) return true;
  if (
    opcion.selected &&
    pricingStore.opcionCostos.filter((v) => v.selected)
      .length == 1
  )
    return true;
}
function agregarFilasAlHeader() {
  headers.value = [
    { text: "Tarifa de Costos", value: "tarifa" },
    { text: "Proveedor Flete", value: "proveedor" },
  ];

  if (opcionesSeleccionadas.value.some((v) => parseFloat(v.flete) > 0)) {
    headers.value.push({
      text: nombreTipoCosto("FL", "Flete"),
      value: "flete",
    });
  }

  if (
    opcionesSeleccionadas.value.some(
      (v) => v.flete != currencyFormat(0)
    )
  ) {
    headers.value.push({
      text: nombreTipoCosto("FL", "Flete"),
      value: "flete",
      cellClass: "centrado",
    });
    flete.value = true;
  }

  if (
    opcionesSeleccionadas.value.some(
      (v) => v.origen != currencyFormat(0)
    )
  ) {
    headers.value.push({
      text: nombreTipoCosto("OR", "Origen"),
      value: "origen",
    });
    origen.value = true;
  }
  if (
    opcionesSeleccionadas.value.some(
      (v) => v.local != currencyFormat(0)
    )
  ) {
    headers.value.push({
      text: nombreTipoCosto("LO", "Local"),
      value: "local",
    });
    local.value = true;
  }
  if (
    opcionesSeleccionadas.value.some(
      (v) => v.aduana != currencyFormat(0)
    )
  ) {
    headers.value.push({
      text: nombreTipoCosto("AD", "Aduana"),
      value: "aduana",
    });
    aduana.value = true;
  }
  if (
    opcionesSeleccionadas.value.some(
      (v) => v.almacen != currencyFormat(0)
    )
  ) {
    headers.value.push({
      text: nombreTipoCosto("AL", "Almacén"),
      value: "almacen",
    });
    almacen.value = true;
  }

  if (
    opcionesSeleccionadas.value.some(
      (v) => v.gastostercero != currencyFormat(0)
    )
  ) {
    headers.value.push({
      text: nombreTipoCosto("GT", "Gastos de tercero"),
      value: "gastostercero",
    });
    gastostercero.value = true;
  }
  headers.value.push({ text: "TOTAL", value: "total" });
  headers.value.push({
    text: "TIEMPO EN TRÁNSITO",
    value: "tiempo_transito",
  });
  headers.value.push({ text: "SELECCIONE", value: "selected" });
}
function nombreTipoCosto(codigo: string, nombrePredeterminado: string) {
  const tipoCosto = (pricingStore.listTipoCostos || []).find(
    (tipo) => tipo && tipo.codigo == codigo,
  );
  return tipoCosto?.name || nombrePredeterminado;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuar() {
  pricingStore.tab = 2;
  // if (this.$store.state.pricing.opcionCostos.some((v) => v.selected)) {
  //   Swal.fire({
  //     icon: "question",
  //     text: `¿Desea regresar a la OPCIÓN - COSTOS ${this.$store.state.pricing.opcionCostos.length}?`,
  //     confirmButtonColor: "green",
  //     showCancelButton: true,
  //     cancelButtonColor: "#4A85D2",
  //     confirmButtonText: "Si, ir a la venta del cliente final",
  //     cancelButtonText: "Regresar a la comparatirva",
  //   }).then((action) => {
  //     if (action.isConfirmed) {
  //       this.$store.state.pricing.tab = 2;
  //       this.$store.state.pricing.llenadoCostos = false;
  //     }
  //   });
  // } else {
  //   Swal.fire({
  //     icon: "warning",
  //     text: "Para poder continuar, debe seleccionar al menos una opción de costos.",
  //     confirmButtonText: "Entendido",
  //   });
  // }
}
async function calcularTotalesOpciones() {
  opcionesSeleccionadas.value = [];
  loadingTable.value = true;
  (pricingStore.opcionCostos as OpcionComparativa[]).forEach((element) => {
    const id_proveedor = element.listCostos.some(
      (v) => v.esopcionflag == 1 && v.code_cost == 4
    )
      ? element.listCostos.filter(
          (v) => v.esopcionflag == 1 && v.code_cost == 4
        )[0]!.id_proveedor
      : "";
    const proveedor = appStore.provedores.find(
      (v: { id: number | string }) => v.id == id_proveedor,
    )
        ;
    setTimeout(async () => {
      await calcTotales(element.listCostos);
      element.proveedor = proveedor ? proveedor.namelong : '';
      element.flete = resumenOpcion.value.flete
        ? currencyFormat(resumenOpcion.value.flete)
        : currencyFormat(0);
      element.origen = resumenOpcion.value.origen
        ? currencyFormat(resumenOpcion.value.origen)
        : currencyFormat(0);
      // element.origen = this.resumenOpcion.origen
      //   ? this.currencyFormat(this.resumenOpcion.origen)
      //   : this.currencyFormat(0);
      element.local = resumenOpcion.value.gasto
        ? currencyFormat(resumenOpcion.value.gasto)
        : currencyFormat(0);
      element.aduana = resumenOpcion.value.aduana
        ? currencyFormat(resumenOpcion.value.aduana)
        : currencyFormat(0);
      element.almacen = resumenOpcion.value.almacen
        ? currencyFormat(resumenOpcion.value.almacen)
        : currencyFormat(0);
      element.gastostercero = resumenOpcion.value.gastostercero
        ? currencyFormat(resumenOpcion.value.gastostercero)
        : currencyFormat(0);
      element.total = currencyFormat(
        parseFloat(String(resumenOpcion.value.flete ? resumenOpcion.value.flete : 0)) +
          parseFloat(String(resumenOpcion.value.origen ? resumenOpcion.value.origen : 0)) +
          parseFloat(String(resumenOpcion.value.gasto ? resumenOpcion.value.gasto : 0)) +
          parseFloat(String(resumenOpcion.value.aduana ? resumenOpcion.value.aduana : 0)) +
          parseFloat(String(resumenOpcion.value.almacen ? resumenOpcion.value.almacen : 0)) +
          parseFloat(String(resumenOpcion.value.gastostercero ? resumenOpcion.value.gastostercero : 0))
      );
      opcionesSeleccionadas.value.push(element);
    }, 100);
    // console.log(element);
  });
  loadingTable.value = false;
}
async function calcTotales(data: Costo[]) {
  await calcularTotalesFlete(data);
  await calcularTotalesNoFlete(data);
}
function calcularTotalesFlete(data: Costo[]) {
  totalOption = 0;
  resumenOpcion.value = {
    flete: 0,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };

  if (isFlete(data)) {
    data
      .filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1
      )
      .forEach((element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          resumenOpcion.value.flete +=
            (pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador
            ).length > 0
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0]!.valor as number
              : 0) *
            (element.costounitario as number) *
            (calcularFac(
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "N",
              pricingStore.datosPrincipales.volumen,
              pricingStore.datosPrincipales.peso,
              pricingStore.datosPrincipales.containers,
              pricingStore.datosPrincipales.amount
            ) as number);
        } else {
          resumenOpcion.value.flete += calcularValor(
            pricingStore.datosPrincipales.amount,
            pricingStore.totalFlete,
            pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador
            ).length > 0
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                )[0]!.code
              : "",
            pricingStore.listMultiplicador.some(
              (v) =>
                v.id == element.id_multiplicador &&
                (v.code == 14 || v.code == 13 || v.code == 5)
            )
              ? pricingStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13)
                )
                ? element.cif
                : element.seguro
              : 0
          );
        }
      });
  }
}
function calcularTotalesNoFlete(data: Costo[]) {
  resumenOpcion.value = {
    flete: resumenOpcion.value.flete,
    origen: 0,
    gasto: 0,
    aduana: 0,
    almacen: 0,
    gastostercero: 0,
  };
  data
    .filter((v) => v.status == 1 && v.esopcionflag == 1)
    .forEach((element) => {
      //   GASTOS
      if (isOrigen(data)) {
        if (element.esorigenflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.origen +=
              (pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor as number
                : 0) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.origen += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      if (isLocal(data)) {
        if (element.eslocalflag) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gasto +=
              (pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor as number
                : 0) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.gasto += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      //   ADUANA
      if (isAduana(data)) {
        if (element.esaduanaflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.aduana +=
              (pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor as number
                : 0) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.aduana += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      //   ALMACEN
      if (isAlmacen(data)) {
        if (element.esalmacenflag) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.almacen +=
              (pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor as number
                : 0) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.almacen += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13)
                  )
                  ? element.cif
                  : element.seguro
                : 0
            );
          }
        }
      }
      //   ALMACEN
      if (isGastosTercero(data)) {
        if (element.esgastostercerosflag) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gastostercero +=
              (pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.valor as number
                : 0) *
              (element.costounitario as number) *
              (calcularFac(
                pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador
                ).length > 0
                  ? pricingStore.listMultiplicador.filter(
                      (v) => v.id == element.id_multiplicador
                    )[0]!.code
                  : "N",
                pricingStore.datosPrincipales.volumen,
                pricingStore.datosPrincipales.peso,
                pricingStore.datosPrincipales.containers,
                pricingStore.datosPrincipales.amount
              ) as number);
          } else {
            resumenOpcion.value.gastostercero += calcularValor(
              pricingStore.datosPrincipales.amount,
              pricingStore.totalFlete,
              pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              ).length > 0
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "",
              pricingStore.listMultiplicador.some(
                (v) =>
                  v.id == element.id_multiplicador &&
                  (v.code == 14 || v.code == 13 || v.code == 5)
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13)
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
function isFlete(data: Costo[]) {
  const val = data.some((v) => v.esfleteflag == 1 && v.status == true);

  return val;
}
function isOrigen(data: Costo[]) {
  const val = data.some((v) => v.esorigenflag == 1 && v.status == true);
  return val;
}
function isLocal(data: Costo[]) {
  const val = data.some((v) => v.eslocalflag == 1 && v.status == true);
  return val;
}

function isAduana(data: Costo[]) {
  const val = data.some((v) => v.esaduanaflag == 1 && v.status == true);
  return val;
}
function isAlmacen(data: Costo[]) {
  const val = data.some((v) => v.esalmacenflag == 1 && v.status == true);
  return val;
}
function isGastosTercero(data: Costo[]) {
  const val = data.some(
    (v) => v.esgastostercerosflag == 1 && v.status == true
  );
  return val;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isConfeccion(code: Numerico) {
  return code == 33 ? true : false;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function montoConfeccion(item: Costo) {
  let monto = 0;
  if (item.code_cost == 33) {
    const amount = pricingStore.datosPrincipales.amount;
    const cif =
      parseFloat(String(amount)) +
      parseFloat(String(pricingStore.totalFlete)) +
      (parseFloat(String(amount)) + parseFloat(String(pricingStore.totalFlete))) *
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isITBM(code: Numerico) {
  return code == 38 ? true : false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function montoITBM(item: Costo) {
  let monto = 0;
  const code = [29, 36, 41, 68];
  if (item.code_cost == 38) {
    // @ts-expect-error data is not defined in this method, so this throws
    const val = data.filter((v) => code.includes(v.code_cost));
    val.forEach((element: Costo) => {
      monto += parseFloat(
        String(
          ((pricingStore.listMultiplicador.some(
            (v) => v.id == element.id_multiplicador
          )
            ? pricingStore.listMultiplicador.filter(
                (v) => v.id == element.id_multiplicador
              )[0]!.valor
            : 0) as number) *
            (element.costounitario as number) *
            (calcularFac(
              pricingStore.listMultiplicador.some(
                (v) => v.id == element.id_multiplicador
              )
                ? pricingStore.listMultiplicador.filter(
                    (v) => v.id == element.id_multiplicador
                  )[0]!.code
                : "N",
              pricingStore.datosPrincipales.volumen,
              pricingStore.datosPrincipales.peso,
              pricingStore.datosPrincipales.containers,
              pricingStore.datosPrincipales.amount
            ) as number)
        )
      );
    });
  }
  item.costounitario = parseFloat(String(monto * 0.07)).toFixed(2);
  return currencyFormat(parseFloat(String(monto * 0.07)).toFixed(2));
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isNotaCredito(code: Numerico) {
  return code == 69 ? true : false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function montoNotaCredito(item: Costo) {
  let monto = 0 as Numerico;
  const code = [33];
  if (item.code_cost == 69) {
    // @ts-expect-error data is not defined in this method, so this throws
    const val = data.filter((v) => code.includes(v.code_cost));
    val.forEach((element: Costo) => {
      monto = element.costounitario;
    });
  }
  item.costounitario = -1 * Number(parseFloat(String((monto as number) * 0.5)).toFixed(2));
  return currencyFormat(-1 * Number(parseFloat(String((monto as number) * 0.5)).toFixed(2)));
}
function isNotPorcentaje(element: Costo, id_multiplicador: Costo["id_multiplicador"]) {
  const code = [5, 13, 14];

  const mul = pricingStore.listMultiplicador.some(
    (v) => v.id == id_multiplicador && code.includes(v.code as number)
  );

  return !mul;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModal() {
  dialog = !dialog;
  // @ts-expect-error limpiar is not defined in this component, so this throws
  limpiar();
}
</script>

<template>
  <v-container fluid>
    <h1>Comparativa de Costos</h1>
    <v-row>
      <v-col cols="12">
        <v-table
          density="compact"
          class="elevation-1 my-7"
        >
          <thead>
            <tr>
              <th
                class="centrado"
                v-for="(header, index) in headers"
                :key="index"
              >
                {{ header.text }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(opcion, index) in opcionesSeleccionadas"
              :key="index"
            >
              <td>Opción - {{ opcion.nro_propuesta }}</td>
              <td>{{ opcion.proveedor }}</td>
              <td
                class="centrado"
                v-if="flete"
              >
                {{ opcion.flete }}
              </td>
              <td
                class="centrado"
                v-if="origen"
              >
                {{ opcion.origen }}
              </td>
              <td
                class="centrado"
                v-if="local"
              >
                {{ opcion.local }}
              </td>
              <td
                class="centrado"
                v-if="aduana"
              >
                {{ opcion.aduana }}
              </td>
              <td
                class="centrado"
                v-if="almacen"
              >
                {{ opcion.almacen }}
              </td>
              <td
                class="centrado"
                v-if="gastostercero"
              >
                {{ opcion.gastostercero }}
              </td>
              <td class="totalClass">
                {{ opcion.total }}
              </td>
              <td class="centrado">
                {{ opcion.tiempo_transito }} días
              </td>
              <td>
                <v-checkbox
                  label=""
                  class="mx-auto"
                  disabled
                  v-model="opcion.selected"
                />
              </td>
              <!-- <td>{{ opcion }}</td> -->
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <!-- <v-col cols="6" class="izquierda">
        <v-btn @click="regregar()" color="default">Anterior</v-btn>
      </v-col> -->
      <!-- <v-col cols="12" class="derecha">
        <v-btn @click="continuar()" color="#3363A2" dark> Continuar</v-btn>
      </v-col> -->
    </v-row>
  </v-container>
</template>

<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.izquierda {
  text-align: left !important;
  align-content: left !important;
}
.totalClass {
  background: #bbdefb !important;
  color: #0d47a1;
  /* font-weight: bold */
}

.centrado {
  align-content: center !important;
  text-align: center !important;
}
</style>
