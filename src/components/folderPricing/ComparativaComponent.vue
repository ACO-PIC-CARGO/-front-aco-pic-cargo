<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Swal from "sweetalert2";
import { useCotizacionCalculos } from "@/composables/useCotizacionCalculos";
import { useProveedorStore } from "@/stores/proveedor";
import { usePricingStore } from "@/stores/pricing";
import { calcularValor, currencyFormat } from "@/utils/cotizacion";
import type {
  Costo,
  EncabezadoComparativa,
  Numerico,
  OpcionComparativa,
} from "@/types/cotizacion";

const emit = defineEmits<{ irVentaCliente: [] }>();

const pricingStore = usePricingStore();
const proveedorStore = useProveedorStore();
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
const totalFleteVentas = ref(0);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let totalOption: number | undefined;

let dialog: boolean | undefined;

const actualizarComparativa = computed(
  () => pricingStore.actualizarComparativa,
);

function regregar() {
  Swal.fire({
    icon: "question",
    html: `<h1>¿Desea regresar a la OPCIÓN - COSTOS ${pricingStore.opcionCostos.length}?<h1>`,
    confirmButtonColor: "green",
    showCancelButton: true,
    cancelButtonColor: "red",
    confirmButtonText: "<h1>Si, volver</h2>",
    cancelButtonText: "<h1>Cancelar</h2>",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
  }).then((action) => {
    if (action.isConfirmed) {
      pricingStore.tab = 2;
    }
  });
}
function agregarFilasAlHeader() {
  headers.value = [
    { text: "Tarifa de Costos", value: "tarifa" },
    { text: "Proveedor Flete", value: "proveedor" },
  ];

  if (opcionesSeleccionadas.value.some((v) => parseFloat(String(v.flete)) > 0)) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "FL",
      )[0]!.name,
      value: "flete",
    });
  }

  if (
    opcionesSeleccionadas.value.some(
      (v) => v.flete != currencyFormat(0),
    )
  ) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "FL",
      )[0]!.name,
      value: "flete",
      cellClass: "centrado",
    });
    flete.value = true;
  }

  if (
    opcionesSeleccionadas.value.some(
      (v) => v.origen != currencyFormat(0),
    )
  ) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "OR",
      )[0]!.name,
      value: "origen",
    });
    origen.value = true;
  }
  if (
    opcionesSeleccionadas.value.some(
      (v) => v.local != currencyFormat(0),
    )
  ) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "LO",
      )[0]!.name,
      value: "local",
    });
    local.value = true;
  }
  if (
    opcionesSeleccionadas.value.some(
      (v) => v.aduana != currencyFormat(0),
    )
  ) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "AD",
      )[0]!.name,
      value: "aduana",
    });
    aduana.value = true;
  }
  if (
    opcionesSeleccionadas.value.some(
      (v) => v.almacen != currencyFormat(0),
    )
  ) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "AL",
      )[0]!.name,
      value: "almacen",
    });
    almacen.value = true;
  }

  if (
    opcionesSeleccionadas.value.some(
      (v) => v.gastostercero != currencyFormat(0),
    )
  ) {
    headers.value.push({
      text: pricingStore.listTipoCostos.filter(
        (v) => v.codigo == "GT",
      )[0]!.name,
      value: "gastostercero",
    });
    gastostercero.value = true;
  }
  headers.value.push({ text: "TOTAL", value: "total" });
  headers.value.push({
    text: "TIEMPO EN TRÁNSITO",
    value: "tiempo_transito",
  });
  headers.value.push({ text: "Usar", value: "selected" });
}
function continuar() {
  if (pricingStore.opcionCostos.some((v) => v.selected)) {
    Swal.fire({
      width: 1000,
      icon: "question",
      html: `<h1>¿Desea regresar a la OPCIÓN - COSTOS ${pricingStore.opcionCostos.length}?</h1>`,
      confirmButtonColor: "green",
      showCancelButton: true,
      cancelButtonColor: "#4A85D2",
      confirmButtonText: "<h1>Si, ir a la venta del cliente final</h1>",
      cancelButtonText: "<h1>Regresar a la comparatirva</h1>",
      showCloseButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((action) => {
      if (action.isConfirmed) {
        pricingStore.llenadoCostos = false;
        pricingStore.recargarCostoSeleccionados =
          !pricingStore.recargarCostoSeleccionados;
        pricingStore.page = 1;
        emit("irVentaCliente");
      }
    });
  } else {
    Swal.fire({
      icon: "warning",
      text: "Para poder continuar, debe seleccionar al menos una opción de costos.",
      confirmButtonText: "Entendido",
    });
  }
}
async function calcularTotalesOpciones() {
  loadingTable.value = true;
  opcionesSeleccionadas.value = [];

  const listaCostos = pricingStore.opcionCostos || [];
  const opcionesCalculadas: OpcionComparativa[] = [];

  for (const element of listaCostos) {
    let nameProveedor = "";
    const opcionProveedor = element.listCostos.find(
      (v) => v.esopcionflag === 1 && v.code_cost === 4,
    );

    if (opcionProveedor) {
      const proveedorEncontrado =
        proveedorStore.lstProveedores.find(
          (v) => v.id === opcionProveedor.id_proveedor,
        );
      if (proveedorEncontrado) {
        nameProveedor = proveedorEncontrado.namelong as string;
      }
    }

    await calcTotales(element.listCostos);

    const flete = parseFloat(String(resumenOpcion.value.flete || 0));
    const origen = parseFloat(String(resumenOpcion.value.origen || 0));
    const gasto = parseFloat(String(resumenOpcion.value.gasto || 0));
    const aduana = parseFloat(String(resumenOpcion.value.aduana || 0));
    const almacen = parseFloat(String(resumenOpcion.value.almacen || 0));
    const gastostercero = parseFloat(String(resumenOpcion.value.gastostercero || 0));

    const totalSuma =
      flete + origen + gasto + aduana + almacen + gastostercero;

    opcionesCalculadas.push({
      ...element,
      proveedor: nameProveedor,
      flete: currencyFormat(flete),
      origen: currencyFormat(origen),
      local: currencyFormat(gasto),
      aduana: currencyFormat(aduana),
      almacen: currencyFormat(almacen),
      gastostercero: currencyFormat(gastostercero),
      total: currencyFormat(totalSuma),
    });
  }

  opcionesSeleccionadas.value = opcionesCalculadas;

  loadingTable.value = false;
}
async function calcTotales(data: Costo[]) {
  await calcularTotalesFleteVentas(data);
  await calcularTotalesFlete(data);
  await calcularTotalesNoFlete(data);
}
function calcularCostoPorMultiplicador(element: Costo) {
  const { datosPrincipales, listMultiplicador } =
    pricingStore;
  const multiplicador = listMultiplicador.find(
    (item) => item.id == element.id_multiplicador,
  );
  let factor = calcularFac(
    multiplicador ? multiplicador.code : "N",
    datosPrincipales.volumen,
    datosPrincipales.peso,
    datosPrincipales.containers,
    datosPrincipales.amount,
  );

  if (element.code_cost == 4 && (datosPrincipales.volumen as number) < 1) {
    factor = Math.max(1, factor as number);
  }

  let monto =
    (multiplicador ? parseFloat(String(multiplicador.valor)) : 0) *
    parseFloat(String(element.costounitario || 0)) *
    (factor as number);

  if (element.considerarvalorminimoflag && element.costounitario != 0) {
    monto = Math.max(Number(element.minimo || 0), Number(monto));
  }

  return monto;
}
function calcularTotalesFleteVentas(data: Costo[]) {
  totalFleteVentas.value = 0;

  if (isFlete(data)) {
    data
      .filter(
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esventaflag == 1,
      )
      .forEach((element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          totalFleteVentas.value +=
            calcularCostoPorMultiplicador(element);
        }
      });
  }
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
        (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
      )
      .forEach((element) => {
        if (isNotPorcentaje(element, element.id_multiplicador)) {
          resumenOpcion.value.flete +=
            calcularCostoPorMultiplicador(element);
        } else {
          resumenOpcion.value.flete += calcularValor(
            pricingStore.datosPrincipales.amount,
            totalFleteVentas.value,
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
                (v.code == 14 || v.code == 13 || v.code == 5),
            )
              ? pricingStore.listMultiplicador.some(
                  (v) =>
                    v.id == element.id_multiplicador &&
                    (v.code == 14 || v.code == 13),
                )
                ? element.cif
                : element.seguro
              : 0,
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
              calcularCostoPorMultiplicador(element);
          } else {
            resumenOpcion.value.origen += calcularValor(
              pricingStore.datosPrincipales.amount,
              totalFleteVentas.value,
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
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      if (isLocal(data)) {
        if (element.eslocalflag) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gasto +=
              calcularCostoPorMultiplicador(element);
          } else {
            resumenOpcion.value.gasto += calcularValor(
              pricingStore.datosPrincipales.amount,
              totalFleteVentas.value,
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
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ADUANA
      if (isAduana(data)) {
        if (element.esaduanaflag == 1) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.aduana +=
              calcularCostoPorMultiplicador(element);
          } else {
            resumenOpcion.value.aduana += calcularValor(
              pricingStore.datosPrincipales.amount,
              totalFleteVentas.value,
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
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ALMACEN
      if (isAlmacen(data)) {
        if (element.esalmacenflag) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.almacen +=
              calcularCostoPorMultiplicador(element);
          } else {
            resumenOpcion.value.almacen += calcularValor(
              pricingStore.datosPrincipales.amount,
              totalFleteVentas.value,
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
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
                  )
                  ? element.cif
                  : element.seguro
                : 0,
            );
          }
        }
      }
      //   ALMACEN
      if (isGastosTercero(data)) {
        if (element.esgastostercerosflag) {
          if (isNotPorcentaje(element, element.id_multiplicador)) {
            resumenOpcion.value.gastostercero +=
              calcularCostoPorMultiplicador(element);
          } else {
            resumenOpcion.value.gastostercero += calcularValor(
              pricingStore.datosPrincipales.amount,
              totalFleteVentas.value,
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
                  (v.code == 14 || v.code == 13 || v.code == 5),
              )
                ? pricingStore.listMultiplicador.some(
                    (v) =>
                      v.id == element.id_multiplicador &&
                      (v.code == 14 || v.code == 13),
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
    (v) => v.esgastostercerosflag == 1 && v.status == true,
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
      parseFloat(String(totalFleteVentas.value)) +
      (parseFloat(String(amount)) + parseFloat(String(totalFleteVentas.value))) * 0.01;

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
        String(((pricingStore.listMultiplicador.some(
          (v) => v.id == element.id_multiplicador,
        )
          ? pricingStore.listMultiplicador.filter(
              (v) => v.id == element.id_multiplicador,
            )[0]!.valor
          : 0) as number) *
          (element.costounitario as number) *
          (calcularFac(
            pricingStore.listMultiplicador.some(
              (v) => v.id == element.id_multiplicador,
            )
              ? pricingStore.listMultiplicador.filter(
                  (v) => v.id == element.id_multiplicador,
                )[0]!.code
              : "N",
            pricingStore.datosPrincipales.volumen,
            pricingStore.datosPrincipales.peso,
            pricingStore.datosPrincipales.containers,
            pricingStore.datosPrincipales.amount,
          ) as number)),
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
  const code = [5, 13, 14, 15];

  const mul = pricingStore.listMultiplicador.some(
    (v) => v.id == id_multiplicador && code.includes(v.code as number),
  );

  return !mul;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModal() {
  dialog = !dialog;
  // @ts-expect-error limpiar is not defined in this component, so this throws
  limpiar();
}
function cambiarOpcionSeleccionada(opcion: OpcionComparativa, selected: boolean) {
  opcion.selected = selected;
  const opcionEnStore = pricingStore.opcionCostos.find(
    (item) => item.nro_propuesta === opcion.nro_propuesta,
  );
  if (opcionEnStore) {
    opcionEnStore.selected = selected;
  }
  pricingStore.page = 1;
}

watch(actualizarComparativa, async () => {
  setTimeout(async () => {
    await calcularTotalesOpciones();
    await agregarFilasAlHeader();
  }, 1000);
});

onMounted(async () => {
  loadingTable.value = false;

  setTimeout(async () => {
    await calcularTotalesOpciones();
    await agregarFilasAlHeader();
  }, 2000);
});
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
                  :model-value="opcion.selected"
                  @update:model-value="cambiarOpcionSeleccionada(opcion, $event as boolean)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col
        cols="6"
        class="izquierda"
      >
        <v-btn
          @click="regregar()"
          color="default"
        >
          Anterior
        </v-btn>
      </v-col>
      <v-col
        cols="6"
        class="derecha"
      >
        <v-btn
          @click="continuar()"
          color="#3363A2"
        >
          Cotizar Venta final del cliente
        </v-btn>
      </v-col>
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
