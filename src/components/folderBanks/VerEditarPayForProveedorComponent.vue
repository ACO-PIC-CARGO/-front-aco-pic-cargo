<script setup lang="ts">
import { computed, defineAsyncComponent, mergeProps, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useBancosStore } from "@/stores/bancos";
import { useBankStore } from "@/stores/bank";
import { useFilesStore } from "@/stores/files";
import { useSecuritysStore } from "@/stores/securitys";
import type { CuentaIngreso } from "@/types/banks";
import type {
  DetalleEgreso,
  ErroresPagoProveedor,
  RegistroEgresoVer,
} from "@/types/banksProveedor";

withDefaults(defineProps<{ verflag?: boolean }>(), { verflag: false });

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const bankStore = useBankStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const securitysStore = useSecuritysStore();
const provedores = computed(() => appStore.provedores);
//  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
const FormatFecha = defineAsyncComponent(() => import("../comun/FormatFecha.vue"));
const ArrastraYSolarComponent = defineAsyncComponent(() =>
  import("../comun/ArrastraYSolarComponent.vue"));

const comentarios = ref("");
const conceptogastobancario = ref("");
const montogastobancario = ref<number | string>(0);
const monto_local = ref<number | string>(0);
const snackbar = ref(false);
const pasos = ref(0);
const monto = ref<number | string>(0);
const numerooperacion = ref("");
const proveedor = ref<number | null>(null);
const symbol = ref("USD");
const id_cuenta = ref<CuentaIngreso>({} as CuentaIngreso);
const fechaoperacion = ref<string | null>(null);
const tipocambiosVer = ref<number | string>(1);
const id_path = ref<number | null>(null);
const selected = ref<DetalleEgreso[]>([]);
const urlfile = ref<string | null>("");
const loading = ref(false);
const headers = [
  // { text: "Abono Completo o Parcial", value: "parcialflag" },
  { title: "Monto DDL", key: "montopagar" },
  // { text: "Fecha Facturación", value: "fecha" },
  { title: "Expediente", key: "code_master" },
  { title: "Procedencia", key: "tipo_gasto" },

  { title: "Moneda y Monto Facturado", key: "montomonedalocal" },
  { title: "Monto Equivalente en Dólares", key: "montodolar" },
  // { text: "Saldo", value: "saldo" },
  // { text: "Factura", value: "documentos" },
  { title: "Total Monto Abonado", key: "totalabonado" },
];
const headersPagosGastosBancario = [
  // { text: "Abono Completo o Parcial", value: "parcialflag" },
  { title: "Monto DDL", key: "montoparcial" },
  // { text: "Fecha Facturación", value: "fecha" },
  { title: "Expediente", key: "code_master" },
  { title: "Procedencia", key: "tipo_gasto" },

  { title: "Moneda y Monto Facturado", key: "montomonedalocal" },
  { title: "Monto Equivalente en Dólares", key: "montodolar" },
  // { text: "Saldo", value: "saldo" },
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
  const total = selected.value.reduce((acc: number, item) => {
    const monto = parseFloat(String(item.montoparcial)) || 0;

    return acc + monto;
  }, 0);
  return total.toFixed(2);
});
const mostrarTipoCambio = computed(() => {
  // if (this.editable) {
  if (symbol.value != "USD") {
    return true;
  }

  if (selected.value.some((v) => v.symbol != "USD")) {
    return true;
  }
  // }
  return false;
  // return this.selected.some((v) => v.symbol != "USD");
});
const tipocambio = computed(() => {
  return tipocambiosVer.value || 5;
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

const montoFinal = computed(() => {
  let gastoBancario = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gastoBancario = Number(montogastobancario.value || 0);
  const total = Number(monto_local.value || 0) ;
  return total.toFixed(4);
});

function confirmarEliminar() {
  Swal.fire({
    icon: "warning",
    title: "Eliminar Registro",
    text: "¿Está seguro que quiere eliminar el registro?",
    showDenyButton: true,
    denyButtonColor: "#263238",
    denyButtonText: "Cancelar",
    confirmButtonText: "Si, Eliminar",
    confirmButtonColor: "red",
    showCloseButton: true,
  }).then((res) => {
    if (res.isConfirmed) {
      eliminar();
    }
  });
}
async function eliminar() {
  let val = true;
  let msg = "";
  await Swal.fire({
    title: "Ingrese sus datos Administrador",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
      '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value.trim();
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value.trim();
      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }
      return { usuario: input1, clave: input2 };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) {
      // Usuario canceló
      val = false;
      msg = "Operación cancelada";
      return;
    }

    if (result.value) {
      const res = await securitysStore.validarUsuarioAdmin({
        usuario: result.value.usuario,
        clave: result.value.clave,
      });

      if (res && res.estadoflag) {
        val = true;
      } else {
        val = false;
        msg = res?.mensaje || "Credenciales incorrectas";
      }
    } else {
      val = false;
      msg = "Debe ingresar las credenciales";
    }
  });

  if (!val) {
    await Swal.fire({
      icon: "error",
      text: msg,
    });
    return false;
  }
  await bankStore.eliminarRegistroEgresos({ id: route.params.id });
  router.push({
    name: "listBankCxP",
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onItemSelected({ item, value }: { item: DetalleEgreso; value: boolean }) {
  if (value) {
    // Si se selecciona, por defecto es Abono Completo (false) y carga el saldo
    item.parcialflag = false;
    item.montoparcial = item.saldo_pendiente_local;
  } else {
    // Si se deselecciona, vuelve a 0
    item.montoparcial = 0;
    item.parcialflag = false;
  }
  // this.calcularTotal();
}
function esImagen(url: string | null) {
  if (!url) return false;
  // Convierte a minúsculas y quita parámetros de consulta (?query=...) si los hay
  const limpiaUrl = url.split("?")[0]!.toLowerCase();
  // Verifica las extensiones de imagen más comunes
  return limpiaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) !== null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // this.calcularTotal();
}
function recibirId(file: { id?: unknown }) {
  console.log("Archivo recibido en el componente padre:", file);
  if (Object.keys(file).length > 0) {
    id_path.value = file.id as number;
  } else {
    id_path.value = null;
  }
  console.log("ID del archivo recibido:", id_path.value);
  // this.payfile = file.archivo;

  // this.msgfile = "Archivo procesado y vinculado correctamente.";
  // this.errfile = "";
}
function obtenerListado() {
  errorMesage.value.proveedor = "";
  pasos.value = 0;
  editable.value = false;
  if (proveedor.value) {
    bankStore.getDeudaAProveedorPorSucursal(proveedor.value);
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarDetalles() {
  errorMesage.value = {
    proveedor: "",
    id_cuenta: "",
    fechaoperacion: "",
    numerooperacion: "",
  };
  if (
    proveedor.value &&
    Object.keys(id_cuenta.value).length > 0 &&
    fechaoperacion.value &&
    numerooperacion.value
  ) {
    console.log("Datos principales completos. ID Path:", id_path.value);
    if (id_path.value) {
      pasos.value = 1;
      editable.value = true;
    } else {
      Swal.fire({
        icon: "question",
        title: "¿Continuar sin soporte de pago?",
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "No, revisar",
      }).then((result) => {
        if (result.isConfirmed) {
          pasos.value = 1;
          editable.value = true;
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
// calcularTotal() {
//   let total = this.selected.reduce((acc, item) => {
//     let valorFila = 0;
//     if (item.parcialflag) {
//       let maximo = parseFloat(item.montodolar) || 0;
//       let escrito = parseFloat(item.montodolar) || 0;

//       valorFila = escrito > maximo ? maximo : escrito;
//     } else {
//       valorFila = parseFloat(item.montodolar) || 0;
//     }
//     return acc + valorFila;
//   }, 0);

//   this.monto = total.toFixed(2);
// },
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarGastoBancario() {
  if (!monto_local.value) {
    Swal.fire({
      icon: "error",
      title: "Monto Local Requerido",
      text: "Por favor, ingrese el monto depositado en banco para continuar.",
    });
    return;
  }
  pasos.value = 2;
  editableGastoBancario.value = true;
}
async function finalizarOperacion() {
  if (
    parseFloat(String(monto_local.value)).toFixed(0) !=
    parseFloat(String((monto.value as number) * (tipocambio.value as number))).toFixed(0)
  ) {
    Swal.fire({
      icon: "error",
      title: "Monto Local Incorrecto",
      text: `El monto local debe ser equivalente a ${symbol.value} ${monto.value}.`,
    });
    return false;
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
    id: route.params.id,
  };
  loading.value = true;
  await bankStore.updateRegistroEgresos(data);
  loading.value = false;
  Swal.fire({
    icon: "success",
    title: "Operación Actualizada",
    text: "El pago se ha actualizado correctamente.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
  }).then((result) => {
    if (result.isConfirmed) {
      router.push({
        name: "listBankCxP",
      });
    }
  });
}
function fn_totalAbonado(item: DetalleEgreso) {
  return parseFloat(String(item.montomonedalocal)).toFixed(2);
}
function recalcularTotal() {
  monto_local.value = selected.value.reduce((suma: number, element) => {
    return suma + parseFloat(String(element.montoparcial));
  }, 0);
  tipocambiosVer.value = parseFloat(String((monto_local.value as number) / (monto.value as number))).toFixed(
    4,
  );
}

watch(id_cuenta, (newVal) => {
  const id_coins = newVal.id_coins;
  const coins = appStore.itemsCoinsList.find(
    (coin: { id: number }) => coin.id === id_coins,
  );
  symbol.value = coins ? coins.symbol : "USD";
});
watch(fechaoperacion, (newVal) => {
  if (newVal) {
    errorMesage.value.fechaoperacion = "";
  } else {
    errorMesage.value.fechaoperacion = "Fecha de Operación es requerida";
  }
});
watch(selected, () => {
  // this.calcularTotal();
}, {
  deep: true, // Esto detecta cambios en las propiedades internas de los items
});

onMounted(async () => {
  appStore.mainTitle = "BANCOS - VER SALIDA";
  appStore.spiner = true;
  await Promise.all([
    appStore.cargarProveedores(),
    appStore._getCoinsList(),
    bancosStore.getListBanksDetailsCargar(),
  ]);
  const data = (await bankStore.verRegistroEgresos({ id: route.params.id })) as unknown as RegistroEgresoVer;
  appStore.spiner = false;
  proveedor.value = data.id_proveedor;
  id_cuenta.value =
    bancosStore.cuentas.find(
      (c) => c.id === data.id_cuentabancaria,
    ) || ({} as CuentaIngreso);
  fechaoperacion.value = data.fechaoperacion;
  numerooperacion.value = data.numerooperacion;
  comentarios.value = data.comentario;
  tipocambiosVer.value = data.tipocambio;
  monto.value = data.totaldolar;
  monto_local.value = data.totalmonedalocal;
  urlfile.value = data.urlfile;
  bankStore.deudaAProveedor = data.detalles as unknown as typeof bankStore.deudaAProveedor;
  selected.value = data.detalles;
  id_path.value = data.id_soporte;
  conceptogastobancario.value =
    data.comisionbancaria.length > 0 ? data.comisionbancaria[0]!.concepto : "";
  montogastobancario.value =
    data.comisionbancaria.length > 0 ? data.comisionbancaria[0]!.monto : 0;
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
          Proveedor:
          <v-autocomplete
            variant="outlined"
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
            disabled
            id="cboProveedor"
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
        >
          Monto Debitado en el banco:
          <!-- <v-icon @click="snackbar = true">mdi-information</v-icon> -->
          <v-text-field
            variant="outlined"
            density="compact"
            v-model="monto_local"
            type="number"
            :prefix="symbol"
            hide-details
            :disabled="verflag"
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
        >
          Total Factura Seleccionada:
          <v-text-field
            variant="outlined"
            density="compact"
            disabled
            v-model="monto"
            type="number"
            prefix="USD"
            hide-details
          />
        </v-col>

        <v-col
          cols="12"
          md="2"
          class="pb-0"
          v-if="mostrarTipoCambio"
        >
          Tipo Cambio:
          <v-text-field
            variant="outlined"
            density="compact"
            v-model="tipocambio"
            type="number"
            prefix="USD"
            hide-details
            disabled
          />
        </v-col>
      </v-row>
      <v-row>
        <v-btn
          v-if="verflag"
          color="success"
          class="mt-5 ml-3"
          @click="
            $router.push({
              name: 'editarPagosPorProveedor',
              params: { id: route.params.id },
            })
          "
        >
          Ir a Editar
        </v-btn>

        <v-btn
          v-if="verflag"
          color="red"
          class="mt-5 ml-3"
          @click="bankStore.imprimirComprobanteEgreso({ id: route.params.id })"
        >
          <v-icon class="mx-2">
            mdi-file-pdf-box
          </v-icon> Imprimir
        </v-btn>

        <v-btn
          v-if="!verflag"
          class="mt-5 ml-3"
          color="success"
          :loading="loading"
          @click="finalizarOperacion()"
        >
          Actualizar Operación
        </v-btn>

        <v-btn
          v-if="!verflag"
          class="mt-5"
          color="red"
          :loading="loading"
          @click="confirmarEliminar()"
        >
          Eliminar Operación
        </v-btn>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-tabs
            v-model="pasos"
            align-tabs="center"
            color="#000000"
            bg-color="#C8E6C9"
          >
            <v-tab key="detallesPago">
              Detalles de Pago
            </v-tab>
            <v-tab key="datosPrincipales">
              Datos Principales
            </v-tab>
            <v-tab key="gastoBancario">
              Resumen y Comisión Bancario
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="pasos">
            <v-tabs-window-item key="detallesPago">
              <v-row class="mt-1">
                <v-col cols="12">
                  <!-- show-select -->
                  <!-- @input="calcularTotal" -->

                  <v-data-table
                    :headers="headers"
                    :items="itemsOrdenados"
                    v-model="selected"
                    item-value="id"
                    return-object
                    :search="searchTableDetalle"
                  >
                    <template #body.append>
                      <tr class="bg-grey-lighten-4 font-weight-bold">
                        <td
                          :colspan="headers.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado ({{ symbol }}):
                        </td>
                        <td class="text-left">
                          {{ symbol }} {{ totalGeneralAbonado }}
                        </td>
                      </tr>
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      {{ symbol }} {{ fn_totalAbonado(item) }}
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
                      <v-text-field
                        hide-details
                        density="compact"
                        variant="outlined"
                        v-model="item.montoparcial"
                        :disabled="verflag"
                        style="max-width: 120px"
                        :prefix="item.symbol"
                        type="number"
                        @update:model-value="recalcularTotal"
                      />
                    </template>
                    <template #[`item.concepto`]="{ item, index }">
                      <v-text-field
                        v-model="item.concepto"
                        :id="`txtConcepto${index}`"
                        variant="outlined"
                        density="compact"
                        hide-details
                        :disabled="verflag"
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
                    :error-messages="errorMesage.id_cuenta"
                    @update:model-value="errorMesage.id_cuenta = null"
                    :disabled="verflag"
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
                    :disabled="verflag"
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
                    :disabled="verflag"
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
                    :disabled="verflag"
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
                    :verflag="verflag"
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
                    :disabled="verflag"
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
                        ? (errorMesage.numerooperacion = null)
                        : (errorMesage.numerooperacion =
                          'Número de Operación es requerido')
                    "
                    :disabled="verflag"
                  />
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
                    :disabled="verflag"
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="pt-1"
                >
                  <p class="my-1">
                    Soporte de Pago:
                    <v-btn
                      color="error"
                      size="small"
                      class="mx-1"
                      @click="urlfile = null"
                      v-if="!verflag && urlfile"
                    >
                      Eliminar Soporte de Pago
                    </v-btn>
                  </p>
                  <div
                    v-if="urlfile"
                    class="d-inline-block"
                  >
                    <!-- CASO 1: SI ES IMAGEN (Miniatura + Visualizador al hacer clic) -->
                    <template v-if="esImagen(urlfile)">
                      <v-dialog max-width="800px">
                        <template #activator="{ props }">
                          <v-hover v-slot="{ isHovering, props: hoverProps }">
                            <div
                              v-bind="mergeProps(props, hoverProps)"
                              class="d-inline-block rounded-circle elevation-2 position-relative cursor-zoom-in"
                              :class="{ 'white--overlay': isHovering }"
                            >
                              <v-avatar
                                size="120"
                                class="flex-shrink-0"
                              >
                                <v-img
                                  :src="urlfile"
                                  alt="Miniatura"
                                >
                                  <template #placeholder>
                                    <v-row
                                      class="fill-height ma-0 align-center justify-center"
                                    >
                                      <v-progress-circular
                                        indeterminate
                                        color="info"
                                        size="20"
                                      />
                                    </v-row>
                                  </template>
                                </v-img>
                              </v-avatar>

                              <!-- @vue-expect-error isHovering may be null -->
                              <v-overlay
                                contained
                                :model-value="isHovering"
                                scrim="white"
                                opacity="0.6"
                                class="rounded-circle align-center justify-center"
                                z-index="1"
                              >
                                <v-icon
                                  color="grey-darken-2"
                                  size="24"
                                >
                                  mdi-magnify
                                </v-icon>
                              </v-overlay>
                            </div>
                          </v-hover>
                        </template>

                        <v-card
                          flat
                          color="transparent"
                          class="text-center"
                        >
                          <v-img
                            :src="urlfile"
                            max-height="85vh"
                          />
                        </v-card>
                      </v-dialog>
                    </template>

                    <!-- CASO 2: SI NO ES IMAGEN (Tu botón original para PDF/otros archivos) -->
                    <template v-else>
                      <v-btn
                        variant="text"
                        color="info"
                        icon
                        :href="urlfile"
                        target="_blank"
                      >
                        <v-icon
                          color="info"
                          size="large"
                        >
                          mdi-file-pdf-box
                        </v-icon>
                      </v-btn>
                    </template>
                  </div>
                  <ArrastraYSolarComponent
                    v-else
                    @id-archivo-cargado="recibirId"
                  />
                </v-col>
                <!-- <v-col cols="12" class="pt-1 pb-5">
                  <v-spacer></v-spacer>
                  <v-btn color="primary" @click="continuarDetalles()">
                    Continue
                  </v-btn>
                  <v-btn text> Cancel </v-btn>
                </v-col> -->
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
                      <tr class="bg-grey-lighten-4 font-weight-bold">
                        <td
                          :colspan="headersPagosGastosBancario.length - 1"
                          class="text-right"
                        >
                          Total General Seleccionado ({{ symbol }}):
                        </td>
                        <td class="text-left">
                          {{ symbol }} {{ totalGeneralAbonado }}
                        </td>
                      </tr>
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      {{ symbol }} {{ fn_totalAbonado(item) }}
                    </template>
                    <template #[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
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
                    :disabled="verflag"
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
                    :disabled="verflag"
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
                    v-model="montoFinal"
                    disabled
                  />
                </v-col>
                <!-- <v-col cols="12">
                  <v-btn
                    class="mx-1"
                    color="success"
                    :loading="loading"
                    @click="finalizarOperacion()"
                  >
                    Actualizar Operación
                  </v-btn>
                </v-col> -->
              </v-row>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-col>
      </v-row>
    </v-container>
    <v-snackbar v-model="snackbar">
      Monto en moneda {{ symbol }} para realizar el pago. El tipo de cambio se
      calculará automáticamente al ingresar el monto en moneda local.
      <template #actions>
        <v-btn
          color="red"
          variant="text"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<style scoped>
.cursor-zoom-in {
  cursor: zoom-in !important;
}

/* Necesario para que v-overlay absolute funcione dentro de v-avatar */
.position-relative {
  position: relative !important;
}
</style>
