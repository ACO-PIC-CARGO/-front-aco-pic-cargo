<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useBancosStore } from "@/stores/bancos";
import { useBankStore } from "@/stores/bank";
import { useFilesStore } from "@/stores/files";
import type { CuentaIngreso, OperacionSimilar } from "@/types/banks";
import type {
  DetalleEgreso,
  ErroresPagoProveedor,
} from "@/types/banksProveedor";

const rootStore = useStore();
const bankStore = useBankStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const provedores = computed(() => rootStore.state.provedores);
//  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
const FormatFecha = defineAsyncComponent(() => import("../comun/FormatFecha.vue"));
const ArrastraYSolarComponent = defineAsyncComponent(() =>
  import("../comun/ArrastraYSolarComponent.vue"));

const dialogLlenarMontoDepositadoBanco = ref(false);
const esDuplicado = ref(false);
const timer = ref<ReturnType<typeof setTimeout> | null>(null);
const operacionesSimilares = ref<OperacionSimilar[]>({} as OperacionSimilar[]);
const comentarios = ref("");
const conceptogastobancario = ref("");
const montogastobancario = ref<number | string>(0);
const monto_local = ref<number | string | null>(0);
const mostrarDetalle = ref(false);
const pasos = ref(0);
const monto = ref<number | string>(0);
const numerooperacion = ref("");
const proveedor = ref<number | null>(null);
const symbol = ref("USD");
const id_cuenta = ref<CuentaIngreso>({} as CuentaIngreso);
const fechaoperacion = ref<string | null>(null);
const id_path = ref<number | null>(null);
const selected = ref<DetalleEgreso[]>([]);
const invoicesOnPage = ref<DetalleEgreso[]>([]);
const loading = ref(false);
const headers = [
  { title: "Abono Completo o Parcial", key: "parcialflag" },
  { title: "Moneda Y Monto", key: "montopagar" },
  { title: "Expediente", key: "code_master" },
  { title: "Tipo", key: "tipo_gasto" },
  { title: "Ver Factura.", key: "action" },
  { title: "Fecha Factura", key: "fecha" },

  { title: "Monto Equivalente en Dólares", key: "saldo_pendiente" },
  { title: "Moneda y Monto Facturado", key: "saldo_pendiente_local" },
  { title: "Saldo", key: "saldo" },
  { title: "Total Monto Abonado", key: "totalabonado" },
];
const headersPagosGastosBancario = [
  { title: "Abono Completo o Parcial", key: "parcialflag" },
  { title: "Moneda Y Monto", key: "montoparcial" },
  // { text: "Fecha Facturación", value: "fecha" },
  { title: "Expediente", key: "code_master" },
  { title: "Fecha Factura", key: "fecha" },
  { title: "Tipo", key: "tipo_gasto", align: "center" as const },

  { title: "Moneda y Monto Facturado", key: "saldo_pendiente_local" },
  { title: "Monto Equivalente en Dólares", key: "saldo_pendiente" },
  { title: "Saldo", key: "saldo" },
  // { text: "Factura", value: "documentos" },
  { title: "Total Monto Abonado", key: "totalabonado" },
];
const errorMesage = ref<ErroresPagoProveedor>({
  proveedor: "",
  id_cuenta: "",
  fechaoperacion: "",
  numerooperacion: "",
});
const editable = ref(false);
const editableGastoBancario = ref(false);
const searchTableDetalle = ref("");
const cboParcial = [
  { text: "Abono Completo", value: false },
  { text: "Abono Parcial", value: true },
];

const totalGeneralAbonado = computed(() => {
  return monto.value || "0.00";
});
const mostrarTipoCambio = computed(() => {
  if (selected.value.length == 0) return false;
  if (symbol.value != "USD") {
    return true;
  }

  if (selected.value.some((v) => v.symbol != "USD")) {
    return true;
  }
  return false;
  // return this.selected.some((v) => v.symbol != "USD");
});
const tipocambio = computed(() => {
  if (symbol.value == "USD") {
    return 1;
  }
  const tc =
    (parseFloat(String(monto_local.value)) +
      parseFloat(String(montogastobancario.value || 0))) /
    (monto.value as number);
  return tc ? tc.toFixed(4) : 1;
});
const totalGeneralAbonadoMonLocal = computed(() => {
  let monto = selected.value.reduce((acc: number, item) => {
    const monto = parseFloat(String(item.montoparcial)) || 0;

    return acc + monto;
  }, 0);
  monto = monto + parseFloat(String(montogastobancario.value || 0));
  return parseFloat(String(monto)).toFixed(2);
});
const totalGeneralAbonadoMonLocalSeleccionado = computed(() => {
  let monto = selected.value.reduce((acc: number, item) => {
    const monto = parseFloat(String(item.montoparcial)) || 0;

    return acc + monto;
  }, 0);
  monto = monto;
  return parseFloat(String(monto)).toFixed(2);
});
const itemsOrdenados = computed(() => {
  const items = [...bankStore.deudaAProveedor] as unknown as DetalleEgreso[];
  return items.sort((a, b) => {
    const aSeleccionado = selected.value.some((sel) => sel.id === a.id);
    const bSeleccionado = selected.value.some((sel) => sel.id === b.id);

    if (aSeleccionado && !bSeleccionado) return -1;
    if (!aSeleccionado && bSeleccionado) return 1;
    return 0;
  });
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const montoFinal = computed(() => {
  let gastoBancario = 0;
  gastoBancario = Number(montogastobancario.value || 0);
  const total = Number(totalGeneralAbonado.value || 0) + gastoBancario;
  return total.toFixed(2);
});

function cancelarllenadoDeMonto() {
  dialogLlenarMontoDepositadoBanco.value = false;
  monto_local.value = null;
  id_cuenta.value = {} as CuentaIngreso;
}
function abrirFactura(item: DetalleEgreso & { id_admininvoice?: number }) {
  const id = item.id_admininvoice;
  window.open(`/home/folderModulesPays/viewAccountPays/${id}`, "_blank");
}
// abrirFactura(item) {

//   let id = item.id_admininvoice;
//   window.open(
//     `/home/folderModulesPays/viewAccountPays/${id}`,
//     "Instructivo",
//     "width=1593,height=1293,menubar=no,location=no,resizable=no",
//   );
// },
function confirmarDeposito() {
  if (monto_local.value) {
    dialogLlenarMontoDepositadoBanco.value = false;
    mostrarDetalle.value = true;
  }
}
async function onItemSelected({ item, value }: { item: DetalleEgreso; value: boolean }) {
  if (value) {
    console.log("Item seleccionado:", item);
    if (item.symbol !== symbol.value) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Moneda diferente",
        html: `
              La factura seleccionada está en <b>${item.symbol}</b>
              y la cuenta está en <b>${symbol.value}</b>
              <br><br>
              ¿Desea Continuar?
            `,
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        reverseButtons: true,
      });

      // Si cancela, quitar la factura de selected
      if (!result.isConfirmed) {
        selected.value = selected.value.filter((i) => i.id !== item.id);

        calcularTotal();
        return;
      }
    }

    item.parcialflag = false;
    item.montoparcial = item.saldo_pendiente_local;
  } else {
    // Si se deselecciona, vuelve a 0
    item.montoparcial = 0;
    item.parcialflag = false;
  }
  calcularTotal();
}
function onSelectAll({ items, value }: { items: DetalleEgreso[]; value: boolean }) {
  items.forEach((item) => {
    if (value) {
      item.parcialflag = false;
      item.montoparcial = item.saldo_pendiente_local;
    } else {
      item.montoparcial = 0;
      item.parcialflag = false;
    }
  });
  calcularTotal();
}
function recibirId(file: { id?: unknown }) {
  if (Object.keys(file).length > 0) {
    id_path.value = file.id as number;
  } else {
    id_path.value = null;
  }
  // this.payfile = file.archivo;

  // this.msgfile = "Archivo procesado y vinculado correctamente.";
  // this.errfile = "";
}
async function obtenerListado() {
  errorMesage.value.proveedor = "";
  selected.value = [];
  monto.value = 0;
  monto_local.value = 0;
  montogastobancario.value = 0;
  conceptogastobancario.value = "";

  pasos.value = 0;
  editable.value = false;
  editableGastoBancario.value = false;

  searchTableDetalle.value = "";

  id_cuenta.value = {} as CuentaIngreso;

  fechaoperacion.value = null;
  numerooperacion.value = "";

  id_path.value = null;

  esDuplicado.value = false;
  operacionesSimilares.value = [];
  mostrarDetalle.value = false;
  if (proveedor.value) {
    rootStore.state.spiner = true;

    try {
      await bankStore.getDeudaAProveedorPorSucursal(proveedor.value);
    } finally {
      rootStore.state.spiner = false;
    }
  } else {
    bankStore.deudaAProveedor = [];
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function anadirFila() {
  const nuevaFila = {
    id: Date.now(), // Generamos un ID temporal único
    documentos: "",
    code_master: "",
    tipo_gasto: "",
    total_facturas: 0,
    total_egresos: 0,
    total_pagado: 0,
    saldo_pendiente: 0,
    nuevoflag: true,
  };
  bankStore.deudaAProveedor.unshift(nuevaFila as unknown as (typeof bankStore.deudaAProveedor)[number]);
  nextTick(() => {
    const index = 0;
    const input = document.getElementById(`txtConcepto${index}`);

    if (input) {
      input.focus();
    } else {
      console.warn(
        "No se encontró el input con id:",
        `txtConcepto${index}`,
      );
    }
  });
}
function continuarDetalles() {
  errorMesage.value = {
    proveedor: "",
    id_cuenta: "",
    fechaoperacion: "",
    numerooperacion: "",
  };
  if (
    Object.keys(id_cuenta.value).length > 0 &&
    fechaoperacion.value &&
    numerooperacion.value &&
    id_path.value &&
    !esDuplicado.value
  ) {
    const hoy = new Date();
    const fechaOp = new Date(fechaoperacion.value);
    const unMesEnMs = 30 * 24 * 60 * 60 * 1000;
    const diferencia = Math.abs(fechaOp.getTime() - hoy.getTime());
    if (diferencia < unMesEnMs) {
      pasos.value = 2;
      editableGastoBancario.value = true;
    } else {
      Swal.fire({
        icon: "warning",
        title: "Fecha inusual : tiempo",
        html: `La fecha seleccionada <b> (${fechaoperacion.value})</b> tiene más de un mes de diferencia con la actual. ¿Es correcta?`,
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "No, revisar",
      }).then((result) => {
        if (result.isConfirmed) {
          pasos.value = 2;
          editableGastoBancario.value = true;
        }
      });
    }
  } else {
    errorMesage.value.proveedor = proveedor.value
      ? ""
      : "Proveedor es requerido";
    errorMesage.value.id_cuenta =
      Object.keys(id_cuenta.value).length > 0 ? "" : "Cuenta es requerida";
    errorMesage.value.fechaoperacion = fechaoperacion.value
      ? ""
      : "Fecha de Operación es requerida";
    errorMesage.value.numerooperacion = numerooperacion.value
      ? false
      : "Número de Operación es requerido";
    if (!id_path.value) {
      Swal.fire({
        icon: "error",
        title: "Archivo de Soporte Requerido",
        text: "Por favor, suba el archivo de soporte para continuar.",
      });
    }
    if (esDuplicado.value) {
      errorMesage.value.numerooperacion = "El número de operación ya existe";
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function subirArchivo() {
  if (id_path.value) {
    const res = await filesStore._uploadFile(id_path.value as unknown as File);
    // @ts-expect-error _uploadFile resolves to undefined
    if (res.success) {
      Swal.fire({
        icon: "success",
        title: "Archivo Subido",
        text: "El archivo se ha subido correctamente.",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error al Subir Archivo",
        text: "Hubo un problema al subir el archivo. Por favor, inténtelo nuevamente.",
      });
    }
  }
}
function calcularTotal() {
  const totalUSD = selected.value.reduce((acc: number, item) => {
    let valorFilaUSD = 0;

    // Evaluamos con item.symbol que es la propiedad real usada en tu vista
    const esFacturaSoles = item.symbol !== "USD" && item.symbol !== "$";

    const montoIngresado = parseFloat(String(item.montoparcial)) || 0;
    const saldoLocal = parseFloat(String(item.saldo_pendiente_local)) || 0;
    const saldoDolares = parseFloat(String(item.saldo_pendiente)) || 0;

    if (item.parcialflag) {
      if (esFacturaSoles) {
        // Regla de tres: (Monto en Soles / Saldo Total Soles) * Saldo Total Dólares
        if (saldoLocal > 0) {
          const porcentajePago = montoIngresado / saldoLocal;
          valorFilaUSD = saldoDolares * porcentajePago;
        }
      } else {
        // Si la factura ya es en dólares, el monto ingresado está en USD
        valorFilaUSD = montoIngresado;
      }
    } else {
      // Abono completo: toma directamente el equivalente en dólares de la fila
      valorFilaUSD = saldoDolares;
    }

    return acc + valorFilaUSD;
  }, 0);

  // Asigna el total convertido a dólares para el campo superior
  monto.value = totalUSD.toFixed(2);
}
function continuarGastoBancario() {
  if (!proveedor.value || selected.value.length == 0) {
    let text = "";
    text = !proveedor.value ? "Proveedor Requerido. <br>" : "";
    // text += !this.monto_local ? "Monto Local Requerido. <br>" : "";
    text +=
      selected.value.length == 0 ? "Seleccione Facturas a Pagar. <br>" : "";
    Swal.fire({
      icon: "error",
      title: `Aviso Importante`,
      html: text,
    });
    return;
  }
  pasos.value = 1;
  editable.value = true;
}
async function finalizarOperacion() {
  if (
    Number(totalGeneralAbonadoMonLocal.value) !== Number(monto_local.value)
  ) {
    Swal.fire({
      icon: "warning",
      title: "Discrepancia en los Montos",
      html: `
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 16px;">
                El registro no puede completarse porque los valores monetarios no coinciden.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; text-align: left;">
                <div style="flex: 1; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px;">
                    <span style="display: block; font-size: 11px; color: #adb5bd; text-transform: uppercase; font-weight: bold;">Registrado en Banco</span>
                    <span style="font-size: 15px; font-weight: bold; color: #495057;">${
                  symbol.value
                } ${Number(monto_local.value).toFixed(2)}</span>
                </div>
                <div style="flex: 1; background: #fff5f5; border: 1px solid #ffe3e3; border-radius: 8px; padding: 12px;">
                    <span style="display: block; font-size: 11px; color: #e03131; text-transform: uppercase; font-weight: bold;">Total a Pagar</span>
                    <span style="font-size: 15px; font-weight: bold; color: #c92a2a;">${
                  symbol.value
                } ${Number(totalGeneralAbonadoMonLocal.value).toFixed(
        2,
      )}</span>
                </div>
            </div>
        `,
      confirmButtonText: "Revisar y Corregir",
      confirmButtonColor: "#3085d6",
      buttonsStyling: true,
    });
    return;
  }
  const data = {
    symbol: symbol.value,
    id_branch: "",
    id_proveedor: proveedor.value,
    comentarios: comentarios.value,
    montogastobancario: montogastobancario.value,
    detalle: selected.value,
    fechaoperacion: fechaoperacion.value,
    id_moneda: id_cuenta.value.id_coins,
    id_cuentabancaria: id_cuenta.value.id,
    totaldolar: monto.value,
    tipocambio: tipocambio.value,
    totalmonedalocal: monto_local.value,
    conceptogastobancario: conceptogastobancario.value,
    numerooperacion: numerooperacion.value,
    id_soporte: id_path.value,
  };
  loading.value = true;
  // @ts-expect-error er is not defined
  await bankStore.setRegistroEgresos(data).catch(() => console.error(er));
  loading.value = false;
}
function fn_totalAbonado(item: DetalleEgreso) {
  if (!selected.value.includes(item)) {
    return 0;
  }
  let monto = 0;
  monto = parseFloat(String(item.montoparcial)) || 0;
  if (symbol.value == "USD") {
    if (item.symbol == "USD") {
      return `${item.symbol} ${monto.toFixed(2)}`;
    } else {
      return `${symbol.value} ${(
        monto / ((tipocambio.value ? tipocambio.value : 1) as number)
      ).toFixed(2)}`;
    }
  } else {
    if (item.symbol == "USD") {
      return `${symbol.value} ${(
        monto * ((tipocambio.value ? tipocambio.value : 1) as number)
      ).toFixed(2)}`;
    } else {
      return `${item.symbol} ${monto.toFixed(2)}`;
    }
  }
}
function buscarOperacionAlEscribir() {
  clearTimeout(timer.value as ReturnType<typeof setTimeout>);
  if (numerooperacion.value.length < 3) {
    operacionesSimilares.value = [];
    esDuplicado.value = false;
    return;
  }
  timer.value = setTimeout(async () => {
    const res = (await bankStore.validarEgresoNroOperacion({
      numerooperacion: numerooperacion.value,
    })) as OperacionSimilar[];

    operacionesSimilares.value = res;
    if (!res[0]!.estadoflag) {
      operacionesSimilares.value = [];
      return;
    }
    // CAMBIO CLAVE: Evaluamos toda la lista. Si CUALQUIERA es duplicado exacto, bloqueamos.
    esDuplicado.value = operacionesSimilares.value.some(
      (op) => op.es_duplicado_exacto === true,
    );

    // Opcional: Si es duplicado, inyectamos el error directamente en el v-text-field
    if (esDuplicado.value) {
      errorMesage.value.numerooperacion = "El número de operación ya existe";
    }
  }, 300);
}

watch(id_cuenta, (newVal, oldVal) => {
  if (newVal && newVal.id && (!oldVal || newVal.id !== oldVal.id)) {
    if (oldVal && oldVal.id && selected.value.length > 0) {
      selected.value = [];

      monto.value = 0;
      calcularTotal();
    }
    const id_coins = newVal.id_coins;
    const coins = rootStore.state.itemsCoinsList.find(
      (coin: { id: number }) => coin.id === id_coins,
    );
    symbol.value = coins ? coins.symbol : "USD";

    // this.calcularTotal();

    dialogLlenarMontoDepositadoBanco.value = true;
  }
});
watch(fechaoperacion, (newVal) => {
  if (newVal) {
    errorMesage.value.fechaoperacion = "";
  } else {
    errorMesage.value.fechaoperacion = "Fecha de Operación es requerida";
  }
});
watch(selected, () => {
  calcularTotal();
}, {
  deep: true, // Esto detecta cambios en las propiedades internas de los items
});

onMounted(async () => {
  bankStore.deudaAProveedor = [];
  rootStore.state.mainTitle = "BANCOS - NUEVA SALIDA";
  await Promise.all([
    rootStore.dispatch("cargarProveedores"),
    rootStore.dispatch("_getCoinsList"),
    bancosStore.getListBanksDetailsCargar(),
  ]);
});
</script>

<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col
          cols="12"
          md="4"
          class="pb-0"
        >
          <v-autocomplete
            variant="outlined"
            label="Proveedor"
            density="compact"
            :items="provedores"
            item-title="namelong"
            item-value="id"
            placeholder="Proveedor"
            v-model="proveedor"
            clearable
            @update:model-value="obtenerListado()"
            hide-details
            :error-messages="errorMesage.proveedor"
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="Object.keys(id_cuenta).length > 0"
        >
          <v-text-field
            label="Monto Debitado En Banco"
            variant="outlined"
            density="compact"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            :error-messages="errorMesage.monto_local"
            @update:model-value="
              monto_local
                ? (errorMesage.monto_local = '')
                : (errorMesage.monto_local =
                  'Monto de Depósito en banco es requerido')
            "
          />
        </v-col>

        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="mostrarTipoCambio"
        >
          <v-text-field
            variant="outlined"
            density="compact"
            disabled
            v-model="totalGeneralAbonadoMonLocal"
            type="number"
            :prefix="symbol"
            :label="`Total Factura Seleccionada (${symbol})`"
          />
        </v-col>

        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="Object.keys(id_cuenta).length > 0"
        >
          <v-text-field
            label="Total Factura Seleccionada"
            variant="outlined"
            density="compact"
            disabled
            v-model="monto"
            type="number"
            prefix="USD"
          />
        </v-col>

        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="mostrarTipoCambio"
        >
          <v-text-field
            label="Tipo Cambio"
            variant="outlined"
            density="compact"
            v-model="tipocambio"
            type="number"
            prefix="USD"
            hide-details
            disabled
          />
        </v-col>

        <v-col
          cols="12"
          v-if="proveedor"
          class="pt-0"
        >
          <v-tabs
            v-model="pasos"
            align-tabs="center"
            color="#000000"
            bg-color="#C8E6C9"
          >
            <v-tab key="detallesPago">
              Facturas
            </v-tab>
            <v-tab
              key="datosPrincipales"
              :disabled="!editable"
            >
              Detalles Bancarios
            </v-tab>
            <v-tab
              key="gastoBancario"
              :disabled="!editableGastoBancario"
            >
              Resumen y Comisión Bancario
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="pasos">
            <v-tabs-window-item key="detallesPago">
              <v-row class="mt-2">
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-autocomplete
                    :items="bancosStore.cuentas"
                    item-title="label"
                    item-value="id"
                    label="Cuenta de Salida de Banco"
                    v-model="id_cuenta"
                    return-object
                    variant="outlined"
                    density="compact"
                    :error-messages="errorMesage.id_cuenta"
                    @update:model-value="errorMesage.id_cuenta = null"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-text-field
                    label="Buscar Expediente"
                    v-model="searchTableDetalle"
                    style="max-width: 400px"
                    variant="outlined"
                    :disabled="itemsOrdenados.length == 0"
                    density="compact"
                    v-if="
                      id_cuenta &&
                        Object.keys(id_cuenta).length > 0 &&
                        !!id_cuenta.id
                    "
                  />
                </v-col>
              </v-row>
              <v-row class="mt-1">
                <v-col
                  cols="12"
                  class="pt-0"
                  v-if="mostrarDetalle"
                >
                  <div class="d-flex justify-center">
                    <v-alert
                      class="mt-0"
                      border="top"
                      type="info"
                      elevation="2"
                      density="compact"
                      width="450px"
                      color="purple"
                    >
                      <b>SELECCIONE UNA(S) FACTURA PARA CONTINUAR</b>
                    </v-alert>
                  </div>
                  <!-- @vue-expect-error the current-items handler parameter has no type -->
                  <v-data-table
                    :headers="headers"
                    :items="itemsOrdenados"
                    v-model="selected"
                    show-select
                    item-value="id"
                    return-object
                    @update:model-value="calcularTotal"
                    :search="searchTableDetalle"
                    @update:current-items="
                      (items) => (invoicesOnPage = items.map((i) => i.raw))
                    "
                  >
                    <template
                      #[`header.data-table-select`]="{
                        allSelected,
                        someSelected,
                        selectAll,
                      }"
                    >
                      <v-checkbox-btn
                        :model-value="allSelected"
                        :indeterminate="someSelected && !allSelected"
                        @update:model-value="
                          (value) => {
                            selectAll(value);
                            onSelectAll({ items: invoicesOnPage, value });
                          }
                        "
                      />
                    </template>
                    <template #body.append>
                      <tr
                        class="bg-grey-lighten-4 font-weight-bold"
                        v-if="symbol !== 'USD'"
                      >
                        <td
                          :colspan="headers.length"
                          class="text-right"
                        >
                          Total General Seleccionado {{ symbol }}:
                        </td>
                        <td class="text-left">
                          {{ symbol }}
                          {{ totalGeneralAbonadoMonLocalSeleccionado }}
                        </td>
                      </tr>
                      <tr class="bg-grey-lighten-4 font-weight-bold">
                        <td
                          :colspan="headers.length"
                          class="text-right"
                        >
                          Total General Seleccionado (USD):
                        </td>
                        <td class="text-left">
                          USD {{ totalGeneralAbonado }}
                        </td>
                      </tr>
                    </template>
                    <template
                      #[`item.data-table-select`]="{
                        item,
                        internalItem,
                        isSelected,
                        toggleSelect,
                      }"
                    >
                      <v-checkbox-btn
                        :model-value="isSelected(internalItem)"
                        :aria-label="`Seleccionar factura ${item.code_master}`"
                        @update:model-value="
                          (value) => {
                            toggleSelect(internalItem);
                            onItemSelected({ item, value });
                          }
                        "
                      />
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>
                    <template #[`item.action`]="{ item }">
                      <v-btn
                        variant="text"
                        icon
                        color="primary"
                        v-if="item.tipo_gasto == 'A'"
                        @click="abrirFactura(item)"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>
                    </template>
                    <template #[`item.parcialflag`]="{ item }">
                      <v-select
                        item-title="text"
                        :items="cboParcial"
                        v-model="item.parcialflag"
                        density="compact"
                        variant="outlined"
                        :disabled="!selected.includes(item)"
                        style="max-width: 200px"
                        hide-details
                      />
                    </template>
                    <template #[`item.montopagar`]="{ item }">
                      <!-- @vue-expect-error parseFloat gets a string or number -->
                      <v-text-field
                        hide-details
                        density="compact"
                        variant="outlined"
                        v-model="item.montoparcial"
                        :disabled="
                          !selected.includes(item) || !item.parcialflag
                        "
                        style="max-width: 120px"
                        :prefix="item.symbol"
                        :rules="[
                          (v) =>
                            !v ||
                            parseFloat(v) <=
                            parseFloat(item.saldo_pendiente_local) ||
                            'El monto no puede ser mayor al saldo',
                        ]"
                      />
                    </template>
                    <template #[`item.concepto`]="{ item, index }">
                      <v-text-field
                        v-model="item.concepto"
                        :id="`txtConcepto${index}`"
                        variant="outlined"
                        density="compact"
                        hide-details
                        style="max-width: 150px"
                        placeholder="Nuevo Concepto"
                        v-if="item.nuevoflag"
                      />
                    </template>
                    <template #[`item.saldo_pendiente`]="{ item }">
                      USD {{ item.saldo_pendiente }}
                    </template>
                    <template #[`item.saldo_pendiente_local`]="{ item }">
                      {{ item.symbol }} {{ item.saldo_pendiente_local }}
                    </template>
                    <template #[`item.saldo`]="{ item }">
                      <!-- @vue-expect-error subtracts string or number operands -->
                      {{ item.symbol }}
                      {{
                        parseFloat(
                          item.saldo_pendiente_local -
                            (item.montoparcial
                              ? item.montoparcial
                              : item.saldo_pendiente_local),
                        ).toFixed(2)
                      }}
                    </template>
                  </v-data-table>
                </v-col>
                <v-col
                  cols="12"
                  class="pt-1"
                  style="align-items: end; align-content: end; text-align: end"
                >
                  <v-btn
                    class="mx-1"
                    color="success"
                    @click="continuarGastoBancario()"
                    :disabled="
                      !(
                        id_cuenta &&
                        Object.keys(id_cuenta).length > 0 &&
                        !!id_cuenta.id
                      )
                    "
                  >
                    Continuar
                  </v-btn>
                </v-col>
              </v-row>
            </v-tabs-window-item>

            <v-tabs-window-item key="datosPrincipales">
              <v-row class="mt-1">
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-autocomplete
                    :items="bancosStore.cuentas"
                    item-title="label"
                    item-value="id"
                    label="Cuenta de Salida de Banco"
                    v-model="id_cuenta"
                    return-object
                    variant="outlined"
                    density="compact"
                    readonly
                    :error-messages="errorMesage.id_cuenta"
                    @update:model-value="errorMesage.id_cuenta = null"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-text-field
                    readonly
                    v-model="id_cuenta.banco"
                    label="Banco:"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-text-field
                    readonly
                    v-model="id_cuenta.cuenta"
                    label="N° Cuenta:"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-text-field
                    readonly
                    v-model="id_cuenta.cci"
                    label="CCI:"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <FormatFecha
                    :outlined="true"
                    :dense="true"
                    label="Fecha Operación"
                    v-model="fechaoperacion"
                    :error-messages="errorMesage.fechaoperacion"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-text-field
                    readonly
                    v-model="id_cuenta.moneda"
                    label="Moneda:"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <!-- @vue-expect-error the error message may be a boolean -->
                  <v-text-field
                    label="Número de Operación"
                    variant="outlined"
                    density="compact"
                    v-model="numerooperacion"
                    :error-messages="errorMesage.numerooperacion"
                    @update:model-value="
                      numerooperacion !== ''
                        ? ((errorMesage.numerooperacion = null),
                           buscarOperacionAlEscribir())
                        : ((errorMesage.numerooperacion =
                             'Número de Operación es requerido'),
                           (operacionesSimilares = []),
                           (esDuplicado = false))
                    "
                  />

                  <div
                    v-if="
                      operacionesSimilares.length > 0 &&
                        operacionesSimilares[0]!.id !== null
                    "
                  >
                    <p
                      v-if="esDuplicado"
                      class="text-red text-body-small font-weight-bold pl-2"
                    >
                      ⚠️ Ya existe un registro con este número exacto.
                    </p>

                    <div
                      v-else
                      class="pl-2"
                    >
                      <div class="d-flex flex-wrap gap-1 mt-1">
                        <v-chip
                          v-for="(item, index) in operacionesSimilares"
                          :key="index"
                          size="small"
                          class="mr-1 mb-1"
                        >
                          {{ item.numerooperacion }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-textarea
                    label="Comentarios"
                    rows="1"
                    variant="outlined"
                    density="compact"
                    auto-grow
                    v-model="comentarios"
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="py-1"
                >
                  <p class="my-1">
                    Soporte de Pago:
                  </p>
                  <ArrastraYSolarComponent @id-archivo-cargado="recibirId" />
                </v-col>
                <v-col
                  cols="12"
                  class="pt-1 pb-5"
                >
                  <v-spacer />
                  <v-btn
                    color="primary"
                    @click="continuarDetalles()"
                  >
                    Continue
                  </v-btn>
                  <v-btn
                    class="mx-1"
                    color="error"
                    @click="pasos = 0"
                  >
                    Cancel
                  </v-btn>
                </v-col>
              </v-row>
            </v-tabs-window-item>

            <v-tabs-window-item key="gastoBancario">
              <v-row class="mt-1">
                <v-col cols="12">
                  <v-data-table
                    :headers="headersPagosGastosBancario"
                    :items="selected"
                    v-model="selected"
                    item-value="id"
                    return-object
                  >
                    <template #body.append>
                      <tr
                        class="bg-grey-lighten-4 font-weight-bold"
                        v-if="symbol !== 'USD'"
                      >
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado {{ symbol }}:
                        </td>
                        <td class="text-left">
                          {{ symbol }}
                          {{ totalGeneralAbonadoMonLocalSeleccionado }}
                        </td>
                      </tr>
                      <tr class="bg-grey-lighten-4 font-weight-bold">
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado (USD):
                        </td>
                        <td class="text-left">
                          USD {{ totalGeneralAbonado }}
                        </td>
                      </tr>
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      {{ fn_totalAbonado(item) }}
                    </template>

                    <template #[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
                      }}
                    </template>
                    <template #[`item.saldo`]="{ item }">
                      <!-- @vue-expect-error subtracts string or number operands -->
                      {{ item.symbol }}
                      {{
                        parseFloat(
                          item.saldo_pendiente_local -
                            (item.montoparcial
                              ? item.montoparcial
                              : item.saldo_pendiente_local),
                        ).toFixed(2)
                      }}
                    </template>
                  </v-data-table>
                </v-col>

                <v-col
                  cols="12"
                  md="2"
                  offset="8"
                >
                  <v-text-field
                    variant="outlined"
                    density="compact"
                    label="Comisión Bancaria"
                    id="id"
                    v-model="conceptogastobancario"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="2"
                >
                  <v-text-field
                    variant="outlined"
                    density="compact"
                    label="Monto Gasto Bancario"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="montogastobancario"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="2"
                  offset="10"
                >
                  <v-text-field
                    variant="outlined"
                    density="compact"
                    label="Monto Total a Pagar"
                    id="id"
                    type="number"
                    :prefix="symbol"
                    v-model="totalGeneralAbonadoMonLocal"
                  />
                </v-col>
                <v-col cols="12">
                  <v-btn
                    class="mx-1"
                    color="success"
                    :loading="loading"
                    @click="finalizarOperacion()"
                  >
                    Finalizar Operación
                  </v-btn>
                </v-col>
              </v-row>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-container>
    <v-dialog
      v-model="dialogLlenarMontoDepositadoBanco"
      persistent
      max-width="35%"
    >
      <v-card class="pa-2">
        <v-card-title class="text-headline-medium pb-2">
          <v-icon
            start
            color="primary"
          >
            mdi-hand-coin
          </v-icon> Confirmar Pago
        </v-card-title>

        <v-card-text class="pt-2">
          <!-- Banner de advertencia adaptado para salida -->
          <v-alert
            border="start"
            border-color="warning"
            elevation="0"
            class="bg-amber-lighten-5 mb-4 rounded-lg"
          >
            <template #prepend>
              <v-icon
                size="36"
                color="amber-darken-2"
                class="mr-3"
              >
                mdi-alert
              </v-icon>
            </template>
            <div>
              <div
                class="text-body-medium font-weight-bold text-amber-darken-4 text-uppercase"
              >
                OBLIGATORIO PARA CONTINUAR
              </div>
              <div class="text-body-small font-weight-bold text-grey-darken-3">
                Ingresa el monto que salió del banco, según tu estado de cuenta.
              </div>
            </div>
          </v-alert>

          <v-text-field
            variant="outlined"
            label="Monto debitado en el banco"
            ref="txtMontoLocal"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            :error-messages="errorMesage.monto_local"
            :rules="[(v) => !!v || 'Este campo es obligatorio']"
            hide-details="auto"
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            color="error"
            @click="cancelarllenadoDeMonto()"
            variant="text"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmarDeposito"
          >
            CONTINUAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style></style>
