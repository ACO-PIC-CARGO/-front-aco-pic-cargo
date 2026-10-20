<script setup lang="ts">
import { computed, defineAsyncComponent, mergeProps, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useBancosStore } from "@/stores/bancos";
import { useBankStore } from "@/stores/bank";
import { useFilesStore } from "@/stores/files";
import { useSecuritysStore } from "@/stores/securitys";
import type {
  CuentaIngreso,
  DetalleIngresoRegistrado,
  ErroresRegistroIngreso,
  RegistroIngresoCliente,
} from "@/types/banks";

withDefaults(defineProps<{ verflag?: boolean }>(), { verflag: false });

const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
const bankStore = useBankStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const securitysStore = useSecuritysStore();
const clientes = computed(() => appStore.clientes);
//  opciones: () => import("@/components/comun/opcionesRegistro.vue"),
const FormatFecha = defineAsyncComponent(() => import("../comun/FormatFecha.vue"));
const ArrastraYSolarComponent = defineAsyncComponent(() =>
  import("../comun/ArrastraYSolarComponent.vue"));

const urlfile = ref<string | null>("");
const tipocambio = ref<number | string>(1);
const originalname = ref("");
const payPath = ref("");
const filename = ref("");
const comentarios = ref("");
const comentariosadmin = ref("");
const conceptogastobancario = ref("");
const montogastobancario = ref<number | string>(0);
const monto_local = ref<number | string>(0);
const snackbar = ref(false);
const pasos = ref(0);
const monto = ref<number | string>(0);
const loading = ref(false);
const nro_operacion = ref("");
const cliente = ref<number | null>(null);
const symbol = ref("USD");
const id_cuenta = ref<CuentaIngreso>({} as CuentaIngreso);
const id_banco_origen = ref<number | null>(null);
const fecha_operacion = ref<string | null>(null);
const id_path = ref<number | null>(null);
const selected = ref<DetalleIngresoRegistrado[]>([]);
const headers = [
  { title: "Monto a Abonado", key: "montopagar" },
  { title: "Expediente", key: "code_master" },
  { title: "Módulo Origen", key: "tipo" },
  {
    title: "Moneda y Monto Facturado",
    key: "montomonedalocal",
  },

  {
    title: "Monto Equivalente en Dólares",
    key: "montodolar",
  },

  { title: "Factura", key: "documentos" },
];
const headersPagosGastosBancario = [
  { title: "Expediente", key: "code_master" },
  { title: "Módulo Origen", key: "tipo" },
  {
    title: "Moneda y Monto Facturado",
    key: "montomonedalocal",
  },

  {
    title: "Monto Equivalente en Dólares",
    key: "montodolar",
  },

  { title: "Factura", key: "documentos" },
];
const errorMesage = ref<ErroresRegistroIngreso>({
  cliente: "",
  id_cuenta: "",
  fecha_operacion: "",
  nro_operacion: "",
});
const editable = ref(false);
const editableGastoBancario = ref(false);
const searchTableDetalle = ref("");
const cboParcial = [
  { text: "Abono Completo", value: false },
  { text: "Abono Parcial", value: true },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mostrarTipoCambio = computed(() => {
  if (editable.value) {
    if (symbol.value != "USD") {
      return true;
    }

    if (selected.value.some((v) => v.symbol != "USD")) {
      return true;
    }
  }
  return false;
  // return this.selected.some((v) => v.symbol != "USD");
});
const totalGeneralAbonado = computed(() => {
  return selected.value
    .reduce((acc: number, item) => {
      let monto = 0;
      monto = parseFloat(String(item.montoparcial)) || 0;
      // Convertimos a USD si no lo está

      return acc + monto;
    }, 0)
    .toFixed(2);
});
const itemsOrdenados = computed(() => {
  const items = [...bankStore.deudaAProveedor] as unknown as DetalleIngresoRegistrado[];
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
  const total = Number(monto.value || 0);
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
  await bankStore.eliminarRegistroIngresos({ id: route.params.id });
  router.push({
    name: "listBankCxC",
  });
}
function esImagen(url: string | null) {
  if (!url) return false;
  // Convierte a minúsculas y quita parámetros de consulta (?query=...) si los hay
  const limpiaUrl = url.split("?")[0]!.toLowerCase();
  // Verifica las extensiones de imagen más comunes
  return limpiaUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/) !== null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onItemSelected({ item, value }: { item: DetalleIngresoRegistrado; value: boolean }) {
  if (value) {
    // Si se selecciona, por defecto es Abono Completo (false) y carga el saldo
    item.parcialflag = false;
    item.montoparcial = item.total_mon_local;
  } else {
    // Si se deselecciona, vuelve a 0
    item.montoparcial = 0;
    item.parcialflag = false;
  }
  calcularTotal();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onSelectAll({ items, value }: { items: DetalleIngresoRegistrado[]; value: boolean }) {
  items.forEach((item) => {
    if (value) {
      item.parcialflag = false;
      item.montoparcial = item.total_mon_local;
    } else {
      item.montoparcial = 0;
      item.parcialflag = false;
    }
  });
  calcularTotal();
}
function verificarMontoCompleto(item: DetalleIngresoRegistrado) {
  // Si el combo cambia a "Abono Completo" (value: false)
  if (!item.parcialflag) {
    item.montoparcial = item.total_mon_local;
  }
  calcularTotal();
}
function recibirId(file: { id?: unknown }) {
  if (Object.keys(file).length > 0) {
    id_path.value = file.id as number;
  } else {
    id_path.value = null;
  }
}
function obtenerListado() {
  errorMesage.value.cliente = "";
  pasos.value = 0;
  editable.value = false;
  if (cliente.value) {
    bankStore.getDeudaDeClientePorSucursal(cliente.value);
  } else {
    bankStore.deudaAProveedor = [];
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarDetalles() {
  errorMesage.value = {
    cliente: "",
    id_cuenta: "",
    fecha_operacion: "",
    nro_operacion: "",
    monto_local: "",
  };

  if (
    id_banco_origen.value &&
    cliente.value &&
    Object.keys(id_cuenta.value).length > 0 &&
    fecha_operacion.value &&
    nro_operacion.value &&
    id_path.value &&
    monto_local.value
  ) {
    const hoy = new Date();
    const fechaOp = new Date(fecha_operacion.value);
    const diffMeses =
      (fechaOp.getFullYear() - hoy.getFullYear()) * 12 +
      (fechaOp.getMonth() - hoy.getMonth());

    if (Math.abs(diffMeses) < 1) {
      pasos.value = 1;
      editable.value = true;
    } else {
      Swal.fire({
        icon: "warning",
        title: "Fecha inusual",
        text: `La fecha seleccionada (${fecha_operacion.value}) tiene más de un mes de diferencia con la actual. ¿Es correcta?`,
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
    errorMesage.value.cliente = cliente.value ? "" : "Proveedor es requerido";
    errorMesage.value.monto_local = monto_local.value
      ? ""
      : "Monto de Depósito en banco es requerido";
    errorMesage.value.id_banco_origen = id_banco_origen.value
      ? ""
      : "Proveedor es requerido";
    errorMesage.value.id_cuenta =
      Object.keys(id_cuenta.value).length > 0 ? "" : "Cuenta es requerida";
    errorMesage.value.fecha_operacion = fecha_operacion.value
      ? ""
      : "Fecha de Operación es requerida";

    // CORRECCIÓN AQUÍ: Cambiado de false a un String de error
    errorMesage.value.nro_operacion = nro_operacion.value
      ? ""
      : "Número de Operación es requerido";
    if (!id_path.value) {
      Swal.fire({
        icon: "error",
        title: "Archivo de Soporte Requerido",
        text: "Por favor, suba el archivo de soporte para continuar.",
      });
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
  const total = selected.value.reduce((acc: number, item) => {
    let valorFila = 0;
    if (item.parcialflag) {
      const maximo = parseFloat(String((item.montoparcial as number) / (item.tipocambio as number))) || 0;
      const escrito = parseFloat(String((item.montoparcial as number) / (item.tipocambio as number))) || 0;

      valorFila = escrito > maximo ? maximo : escrito;
    } else {
      valorFila = parseFloat(String((item.montoparcial as number) / (item.tipocambio as number))) || 0;
    }
    return acc + valorFila;
  }, 0);

  monto.value = total.toFixed(2);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarGastoBancario() {
  pasos.value = 2;
  editableGastoBancario.value = true;
}
async function finalizarOperacion() {
  if (
    parseFloat(String(monto_local.value)).toFixed(2) !=
    parseFloat(String((monto.value as number) * (tipocambio.value as number))).toFixed(2)
  ) {
    Swal.fire({
      icon: "error",
      title: "Monto Local Incorrecto",
      text: `El monto local debe ser equivalente a ${symbol.value} ${monto_local.value}.`,
    });
    return false;
  }
  const data = {
    id: route.params.id,
    symbol: symbol.value,
    id_branch: "",
    id_cliente: cliente.value,
    id_banco_origen: id_banco_origen.value,
    id_cuentabancaria: id_cuenta.value.id,
    id_moneda: id_cuenta.value.id_coins,
    fecha_operacion: fecha_operacion.value,
    nro_operacion: nro_operacion.value,
    totaldolar: monto.value,
    tipocambio: tipocambio.value,
    comentarios: comentarios.value,
    totalmonedalocal: monto_local.value,
    comentariosadmin: comentariosadmin.value,
    conceptogastobancario: conceptogastobancario.value,
    montogastobancario: montogastobancario.value,
    detalle: selected.value,
    id_soporte: id_path.value,
  };

  loading.value = true;
  await bankStore.updateRegistroIgresos(data);
  loading.value = false;
  Swal.fire({
    icon: "success",
    title: "Operación Finalizada",
    text: "El pago se ha registrado correctamente.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
  }).then((result) => {
    if (result.isConfirmed) {
      router.push({
        name: "listBankCxC",
      });
    }
  });
}
function fn_totalAbonado(item: DetalleIngresoRegistrado) {
  if (!selected.value.includes(item)) {
    return 0;
  }
  let monto = 0;
  if (item.parcialflag) {
    monto = parseFloat(String(item.montoparcial)) || 0;
  } else {
    monto = parseFloat(String(item.total_mon_local)) || 0;
  }
  if (item.symbol == "USD") {
    return `${item.symbol} ${monto.toFixed(2)}`;
  } else {
    return `${symbol.value} ${(monto / (tipocambio.value as number)).toFixed(2)}`;
  }
}

watch(id_cuenta, (newVal) => {
  const id_coins = newVal.id_coins;
  const coins = appStore.itemsCoinsList.find(
    (coin: { id: number }) => coin.id === id_coins,
  );
  symbol.value = coins ? coins.symbol : "USD";
});
watch(fecha_operacion, (newVal) => {
  if (newVal) {
    errorMesage.value.fecha_operacion = "";
  } else {
    errorMesage.value.fecha_operacion = "Fecha de Operación es requerida";
  }
});
watch(selected, () => {
  calcularTotal();
}, {
  deep: true, // Esto detecta cambios en las propiedades internas de los items
});

onMounted(async () => {
  appStore.mainTitle = "BANCOS - VER INGRESO";
  appStore.spiner = true;
  // Desestructuramos el quinto elemento del array que devuelve el Promise.all
  const [, , , , data] = (await Promise.all([
    appStore.cargarClientes(),
    appStore._getCoinsList(),
    bancosStore.getListBanksDetailsCargar(),
    appStore._getBanksList(),
    bankStore.verRegistroIngresos({ id: route.params.id }), // <-- Entra al paralelo
  ])) as unknown as [unknown, unknown, unknown, unknown, RegistroIngresoCliente];

  // await Promise.all([
  //   this.cargarClientes(),
  //   this._getCoinsList(),
  //   this.getListBanksDetailsCargar(),
  //   this._getBanksList(),
  // ]);
  // let data = await this.verRegistroIngresos({ id: this.$route.params.id });
  appStore.spiner = false;
  cliente.value = data.cliente;
  urlfile.value = data.filename;
  id_cuenta.value =
    bancosStore.cuentas.find((c) => c.id === data.id_banco) ||
    ({} as CuentaIngreso);
  id_banco_origen.value = data.id_banco_origen;
  nro_operacion.value = data.nro_operacion;
  fecha_operacion.value = data.fecha_operacion;
  comentarios.value = data.comentarios;
  comentariosadmin.value = data.comentariosadmin;
  payPath.value = data.payPath;
  filename.value = data.filename;
  originalname.value = data.originalname;
  bankStore.deudaAProveedor = data.detalle as unknown as typeof bankStore.deudaAProveedor;
  selected.value = data.detalle;
  monto.value = data.totaldolar;
  console.log('totalmonedalocal',data.totalmonedalocal)
  monto_local.value = data.totalmonedalocal;
  tipocambio.value = data.tipocambio;
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
          md="2"
          class="pb-0"
        >
          Cliente:
          <v-autocomplete
            variant="outlined"
            density="compact"
            :items="clientes"
            item-title="namelong"
            item-value="id"
            placeholder="Clientes"
            v-model="cliente"
            clearable
            @update:model-value="obtenerListado()"
            hide-details
            :error-messages="errorMesage.cliente"
            id="cboProveedor"
            disabled
          />
        </v-col>
        <v-col
          cols="12"
          md="2"
          class="pb-0"
        >
          Monto Depositado En Banco:
          <!-- <v-icon @click="snackbar = true">mdi-information</v-icon> -->
          <v-text-field
            variant="outlined"
            :disabled="verflag"
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
        >
          Total Factura Seleccionada:
          <v-text-field
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
        <v-col cols="12">
          <v-btn
            color="success"
            class="mt-5 ml-3"
            v-if="verflag"
            @click="
              router.push({
                name: 'editarPagosPorCliente',
                params: { id: route.params.id },
              })
            "
          >
            Ir a Editar
          </v-btn>

          <v-btn
            color="red"
            class="mt-5 ml-3"
            v-if="verflag"
            @click="bankStore.imprimirComprobanteIngreso({ id: route.params.id })"
          >
            <v-icon class="mx-2">
              mdi-file-pdf-box
            </v-icon> Imprimir
          </v-btn>

          <v-btn
            class="mt-5 ml-3"
            color="success"
            v-if="!verflag"
            :loading="loading"
            @click="finalizarOperacion()"
          >
            Actualizar Operación
          </v-btn>

          <v-btn
            class="mt-5 mx-3"
            color="red"
            v-if="!verflag"
            :loading="loading"
            @click="confirmarEliminar()"
          >
            Eliminar Operación
          </v-btn>
        </v-col>
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
                    <template #[`item.parcialflag`]="{ item }">
                      <v-select
                        item-title="text"
                        :items="cboParcial"
                        v-model="item.parcialflag"
                        density="compact"
                        variant="outlined"
                        :disabled="!selected.includes(item)"
                        hide-details
                        @update:model-value="verificarMontoCompleto(item)"
                      />
                    </template>
                    <template #[`item.montopagar`]="{ item }">
                      <!-- @vue-expect-error parseFloat gets a string or number -->
                      <v-text-field
                        hide-details
                        density="compact"
                        variant="outlined"
                        v-model="item.montoparcial"
                        :disabled="verflag"
                        :prefix="symbol"
                        @update:model-value="calcularTotal"
                        :rules="[
                          (v) =>
                            !v ||
                            parseFloat(v) <= parseFloat(item.total_mon_local) ||
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
                    <template #[`item.montomonedalocal`]="{ item }">
                      {{ symbol }} {{ item.montomonedalocal }}
                    </template>
                    <template #[`item.montodolar`]="{ item }">
                      USD {{ item.montodolar }}
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
                  <v-select
                    :items="appStore.itemsDataBanksList"
                    v-model="id_banco_origen"
                    label="Banco Origen"
                    item-title="acronym"
                    item-value="id"
                    variant="outlined"
                    density="compact"
                    :error-messages="errorMesage.id_cuenta_origen"
                    @update:model-value="errorMesage.id_cuenta_origen = null"
                    :disabled="verflag"
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-autocomplete
                    :items="bancosStore.cuentas"
                    item-title="label"
                    item-value="id"
                    label="Cuenta de Ingreso de Banco"
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
                    v-model="fecha_operacion"
                    :error-messages="errorMesage.fecha_operacion"
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
                  <v-text-field
                    label="Número de Operación"
                    variant="outlined"
                    density="compact"
                    v-model="nro_operacion"
                    :error-messages="errorMesage.nro_operacion"
                    :disabled="verflag"
                    @update:model-value="
                      nro_operacion !== ''
                        ? (errorMesage.nro_operacion = null)
                        : (errorMesage.nro_operacion =
                          'Número de Operación es requerido')
                    "
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                  class="py-1"
                >
                  <v-textarea
                    label="Comentarios Usuario"
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
                  md="6"
                  class="py-1"
                >
                  <v-textarea
                    label="Comentarios Administrativos"
                    rows="1"
                    variant="outlined"
                    density="compact"
                    auto-grow
                    v-model="comentariosadmin"
                    :disabled="verflag"
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="py-1"
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

                              <!-- @vue-expect-error isHovering can be null -->
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
                        color="red"
                        icon
                        :href="urlfile"
                        target="_blank"
                      >
                        <v-icon
                          color="red"
                          size="50"
                        >
                          mdi-file-pdf-box
                        </v-icon>
                      </v-btn>
                    </template>
                  </div>
                  <ArrastraYSolarComponent
                    v-if="!urlfile && !verflag"
                    @id-archivo-cargado="recibirId"
                  />
                </v-col>
              </v-row>
            </v-tabs-window-item>

            <v-tabs-window-item key="gastoBancario">
              <v-row class="mt-1">
                <v-col cols="12">
                  <v-data-table
                    :headers="headersPagosGastosBancario"
                    :items="bankStore.deudaAProveedor"
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
                    <template #[`item.parcialflag`]="{ item }">
                      {{
                        item.parcialflag ? "Abono Parcial" : "Abono Completo"
                      }}
                    </template>
                    <template #[`item.montopagar`]="{ item }">
                      {{ item.montoparcial }}
                    </template>
                    <template #[`item.totalabonado`]="{ item }">
                      <!-- @vue-expect-error the table rows are not typed as the selected rows -->
                      {{ fn_totalAbonado(item) }}
                    </template>
                  </v-data-table>
                </v-col>

                <v-col
                  cols="2"
                  offset="7"
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
                <v-col cols="3">
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
                  cols="3"
                  offset="9"
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
                    Finalizar Operación
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
