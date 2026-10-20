<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import axios from '@/api/http';
import moment from "moment";
import Swal from "sweetalert2";
import ArrastraYSolarComponent from "../comun/ArrastraYSolarComponent.vue";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import type { ApiResponse } from "@/types/api";
import type { CuentaBancariaPago, PagoPendienteProveedor } from "@/types/billing";
import { sessionBranchId } from "@/utils/sesion";

defineProps<{ limpar?: boolean }>();
const emit = defineEmits<{ cancelar: []; cerrarModal: [value: boolean] }>();

const rootStore = useStore();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();
const provedores = computed(() => rootStore.state.provedores);

const msgNroOperacion = ref("");
const comentarios = ref<string | null>("");
const id_coins = ref(1);
const montoMonExt = ref<number | string>(0.0);
const acronym = ref("USD");
const dialog = ref(false);
const loadingPago = ref(false);
const headersParcial = [
  { title: "Concepto", key: "concepto" },
  { title: "Total Operaciones (USD)", key: "total_op" },
  { title: "Moneda Cuenta Banco", key: "acronym" },
  { title: "Total Cuenta Banco", key: "totalopcuentabanco" },
] as const;
const detalles = ref<PagoPendienteProveedor["details"]>([]);
const lstPagos = ref<PagoPendienteProveedor[]>([]);
const payfile = ref<unknown>([]);
const cuentas = ref<CuentaBancariaPago[]>([]);
const selected = ref<PagoPendienteProveedor[]>([]);
const selectedParcial = ref<PagoPendienteProveedor["details"]>([]);
const totalDeuda = ref(0);
const totalMonto = ref<number | string>(0);
const tab = ref<string | number | null>(null);
const step2 = ref(true);
const boolFile = ref(false);
const id_cuenta = ref<CuentaBancariaPago>("" as unknown as CuentaBancariaPago);
const nro_operacion = ref<string | null>("");
const search = ref("");
const payPath = ref<number | string>(0);
const date = ref("");
const dataList = ref(false);
const cabPagos = [
  // {
  //   text: "Expediente",
  //   value: "nro_master",
  //   shortable: false,
  // },

  {
    title: "Master",
    key: "code_master",
    shortable: false,
  },
  { title: "Factura/ Proforma", key: "expedientes" },
  {
    title: "Procedencia",
    key: "procedencia",
    shortable: false,
  },
  { title: "Monto (USD)", key: "monto_dolar" },
  {
    title: "Monto Factura",
    key: "monto_banco",
    shortable: false,
  },
  {
    title: "Tipo Cambio",
    key: "tipo_cambio",
  },

  {
    title: "Moneda Pagar",
    key: "item_moneda",
  },
  {
    title: "Monto Pagar",
    key: "parcial",
    shortable: false,
  },
] as const;
const msgfile = ref<string | null>("");
const errfile = ref<string | null>("");
const proveedor = ref<number | string | null>("");
let itemParcial: PagoPendienteProveedor;
const loadingTable = ref(false);

// "_uploadFile",
function calcularTotales() {
  let mondolar = 0;
  let monex = 0;
  let mon_ex = 0;
  selected.value.forEach(async (element) => {
    if (element.tipo == "CG") {
      mon_ex = 0;
      await element.details.forEach((element2) => {
        if (!!element2.pagar) {
          element.tipocambio = parseFloat(element2.tipocambio).toFixed(2);
          mon_ex =
            parseFloat(String(mon_ex)) + parseFloat(element2.totalopcuentabanco);
          mondolar = parseFloat(String(mondolar)) + parseFloat(element2.total_op);
          monex =
            parseFloat(String(monex)) + parseFloat(element2.totalopcuentabanco);
        }
        id_coins.value = element2
          ? rootStore.state.itemsCoinsList.filter(
              (v: { id: number; acronym: string }) => v.acronym == element2.acronym,
            )[0].id
          : 1;
      });
      element.monto_mon_ex = mon_ex;
    } else {
      element.monto_mon_ex = element.monto_mon_ex
        ? element.monto_mon_ex
        : element.monto_banco;

      monex += parseFloat(String(element.monto_mon_ex));
      // if (
      //   !element.monto_mon_ex ||
      //   typeof element.monto_mon_ex == "undefined"
      // ) {
      //   element.monto_mon_ex = parseFloat(
      //     element.monto_dolar * element.tipocambio
      //   ).toFixed(2);
      //   monex += parseFloat(
      //     element.monto_mon_ex ? element.monto_mon_ex : 0.0
      //   );
      // } else {
      //   element.monto_mon_ex = parseFloat(
      //     parseFloat(element.monto_dolar) * parseFloat(element.tipocambio)
      //   ).toFixed(2);
      //   monex = parseFloat(
      //     parseFloat(element.monto_dolar) * parseFloat(element.tipocambio)
      //   ).toFixed(2);
      // }
    }

    acronym.value = rootStore.state.itemsCoinsList.filter(
      (v: { id: number; acronym: string }) => v.id == id_coins.value,
    )[0].acronym;
  });

  montoMonExt.value = parseFloat(String(monex)).toFixed(2);
  calcularTotalesInput();
  acronym.value = rootStore.state.itemsCoinsList.filter(
    (v: { id: number; acronym: string }) => v.id == id_coins.value,
  )[0].acronym;
}
async function calcularTotalesInput() {
  let monex = 0;
  await selected.value.forEach((element) => {
    element.errorEx = "";
    if (
      parseFloat(String(element.monto_mon_ex)) >
      parseFloat(
        String(parseFloat(element.monto_banco) * parseFloat(String(element.tipocambio))),
      )
    ) {
      element.errorEx =
        "El monto no puede ser mayor que el monto como deuda";
    } else {
      monex = parseFloat(String(monex)) + parseFloat(String(element.monto_mon_ex));
    }
  });
}
async function listarPagosXControlGasto() {
  loadingTable.value = true;
  lstPagos.value = [];
  nro_operacion.value = null;
  payfile.value = null;
  msgfile.value = null;
  errfile.value = null;
  id_cuenta.value = "" as unknown as CuentaBancariaPago;
  comentarios.value = null;
  if (!!proveedor.value) {
    var config = {
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        "listPagoControlGastoXProveedor/" +
        proveedor.value,
      headers: {
       
        "Content-Type": "application/json",
      },
    };
    await axios<ApiResponse<PagoPendienteProveedor[]>>(config)
      .then(function (response) {
        let res = response.data;

        if (typeof res.data != "undefined") {
          let data = response.data.data;
          data.forEach((element) => {
            element.tipocambio = element.tipocambio
              ? element.tipocambio
              : 1;
          });
          let index = 0;
          data.forEach((element) => {
            element.index = index;
            index++;
          });
          lstPagos.value = data;
          loadingTable.value = false;
        } else {
          lstPagos.value = [];
          loadingTable.value = false;
          Swal.fire({
            icon: "info",
            title: "AVISO IMPORTANTE",
            text: response.data.mensaje,
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    dataList.value = true;
  } else {
    lstPagos.value = [];
    loadingTable.value = false;
    tab.value = 1;
    payfile.value = [];
  }
}
function calcularMontoPagar() {
  if (lstPagos.value.length > 0) {
    let monto = lstPagos.value
      .filter((v) => v.pagar == true)
      .map((item) => item.monto)
      .reduce((a, b) => parseFloat(String(a)) + parseFloat(b as string), parseFloat(String(0)));
    totalMonto.value = parseFloat(String(monto)).toFixed(2);
  } else {
    totalMonto.value = 0;
  }
}
function guardarMontoParciales() {
  let a: number | null = null;

  itemParcial.details.forEach((element) => {
    a = selectedParcial.value.filter((v) => v.id == element.id).length;
    if (a == 1) {
      element.pagar = true;
    } else {
      element.pagar = false;
    }
  });

  calcularTotales();
  dialog.value = false;
}
async function getListBanksDetailsCargar() {
  var config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
    params: {
      id_branch: sessionBranchId(),
    },
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios<ApiResponse<CuentaBancariaPago[]>>(config)
    .then(function (response) {
      let data = response.data.data;

      cuentas.value = data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function continuar() {
  // if (this.validar()) {
  step2.value = false;
  tab.value = "ref2";
  // }
}
function _uploadFile() {
  msgfile.value = "";
  errfile.value = "";
  if (payfile.value) {
    var data = new FormData();
    data.append("name", "Prueba");
    data.append("file", payfile.value as Blob);

    var config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios<ApiResponse<{ insertid: number }[]>>(config)
      .then(function (response) {
        boolFile.value = true;
        payPath.value = JSON.stringify(response.data.data[0]!.insertid);
        msgfile.value = "Archivo Cargado correctamente.";
      })
      .catch(function (error) {
        errfile.value =
          "Ocurrió un problmea conuníquese con el administrador del sistema";
        console.error(error);
      });
  }
}
async function registrarPago() {
  if (
    filesStore.payPath == 0 ||
    !filesStore.payPath
  ) {
    Swal.fire({
      icon: "warning",
      title: "Soporte de Pago",
      text: "SE SUGIERE GUARDAR EL SOPORTE DE PAGO POR FAVOR ANEXARLO",
      confirmButtonText: "Continuar, sin soporte",
      cancelButtonText: "Cancelar",
      showDenyButton: false,
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      cancelButtonColor: "#B71C1C",
    }).then((res) => {
      if (res.isConfirmed) {
        pagar();
      }
    });
    return false;
  }
  pagar();
}
async function pagar() {
  loadingPago.value = true;
  let isaprobacion = selected.value.map((element) => {
    return element.isaprobacion;
  });
  let iscontrolgasto = selected.value.map((element) => {
    return element.iscontrolgasto;
  });
  let isprogramado = selected.value.map((element) => {
    return element.isprogramado;
  });
  let id = selected.value.map((element) => {
    return element.id;
  });
  let monto = selected.value.map((element) => {
    return element.monto_mon_ex;
  });

  let tipo = selected.value.map((element) => {
    return element.tipo;
  });
  let id_concepto: number[] = [];
  selected.value
    .filter((v) => v.iscontrolgasto == true)
    .forEach((element) => {
      element.details.forEach((detalle) => {
        if (detalle.pagar == true) {
          id_concepto.push(detalle.id);
        }
      });
    });

  let data = {
    isaprobacion: isaprobacion,
    iscontrolgasto: iscontrolgasto,
    isprogramado: isprogramado,
    id: id,
    monto: monto,
    id_concepto: id_concepto,
    id_path: filesStore.payPath,
    id_cuenta: id_cuenta.value.id,
    fecha: date.value,
    nro_operacion: nro_operacion.value,
    id_proveedor: proveedor.value,
    id_user: (JSON.parse(sessionStorage.getItem("dataUser") as string) as { id_user: number }[])[0]!.id_user,
    tipocambio: selected.value.map((element) => {
      return element.tipocambio;
    }),
    id_coins: id_coins.value,
    comentarios: comentarios.value,
    tipo: tipo,
    id_correlativo: selected.value.map((element) => {
      return element.id_correlativo ? element.id_correlativo : null;
    }),
  };

  var config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "registro_pago_detalles",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios<ApiResponse<{ msg: string }> & { statusBol?: boolean }>(config)
    .then(function (response) {
      filesStore.payPath = null;
      if (response.data.statusBol) {
        Swal.fire({
          icon: "success",
          title: "AVISO",
          text: response.data.data.msg,
        });

        rootStore.state.actualizar = !rootStore.state.actualizar;
      }
    })
    .catch(function (error) {
      console.error(error);
    });
  loadingPago.value = false;
  emit("cerrarModal", true);
}
async function limpiarFormulario() {
  proveedor.value = null;
  lstPagos.value = [];
  payfile.value = [];
  cuentas.value = [];
  selected.value = [];
  totalDeuda.value = 0;
  totalMonto.value = 0;
  tab.value = null;
  step2.value = true;
  boolFile.value = false;
  id_cuenta.value = "" as unknown as CuentaBancariaPago;
  nro_operacion.value = "";
  search.value = "";
  payPath.value = 0;
  date.value = moment(new Date()).format("YYYY-MM-DD");
  await rootStore.dispatch("cargarProveedores");

  await getListBanksDetailsCargar();
}
function generarPagoParcial(item: PagoPendienteProveedor) {
  itemParcial = item;
  selectedParcial.value = item.details.filter((v) => v.pagar == true);
  detalles.value = item.details;
  dialog.value = true;
}
function obtenerMontoPagar() {
  totalMonto.value = 0;
  let monto = 0;
  selected.value.forEach((element) => {
    if (element.iscontrolgasto == true) {
      element.details.forEach((detalles) => {
        if (detalles.pagar) {
          monto += parseFloat(detalles.total_op);
        }
      });
    } else {
      monto += parseFloat(element.monto_actual);
    }
  });
  totalMonto.value = parseFloat(String(monto)).toFixed(2);
}
async function ValidaNroOp() {
  msgNroOperacion.value = "";
  rootStore.state.spiner = true;
  await bancosStore.getValidaNroOp(nro_operacion.value as string);
  if (!!bancosStore.validacionBanco!.estadoflag) {
    msgNroOperacion.value = bancosStore.validacionBanco!.mensaje;
    document.getElementById("nro_operacion")!.focus();
  } else {
    msgNroOperacion.value = "";
  }

  rootStore.state.spiner = false;
}
function moverSeleccionadoAlInicio() {
  const listaPagos = rootStore.state.listPagosXProveedorCxP;

  const seleccionadosIds = new Set(selected.value.map((item) => item.id));

  listaPagos.sort((a: { id: number }, b: { id: number }) => {
    const aSeleccionado = seleccionadosIds.has(a.id);
    const bSeleccionado = seleccionadosIds.has(b.id);

    if (aSeleccionado && !bSeleccionado) return -1;
    if (!aSeleccionado && bSeleccionado) return 1;
    return 0;
  });
}
function recibirId(file: { id: unknown; archivo: unknown; inserid?: number }) {
  console.log(file);
  payPath.value = file.inserid as number;
  payfile.value = file.archivo;

  msgfile.value = "Archivo procesado y vinculado correctamente.";
  errfile.value = "";
}

watch(selected, (newVal, oldVal) => {
  calcularTotales();
  if (newVal.length > oldVal.length) {
    nextTick(() => {
      moverSeleccionadoAlInicio();
    });
  }
});

onMounted(async () => {
  await rootStore.dispatch("cargarProveedores");
  await getListBanksDetailsCargar();
});
</script>

<template>
  <v-card>
    <v-card-title primary-title>
      <v-row>
        <v-autocomplete
          :items="provedores"
          label="Proveedores"
          v-model="proveedor"
          item-value="id"
          item-title="namelong"
          style="font-size: 20pt"
          clearable
          @update:model-value="listarPagosXControlGasto()"
        >
        </v-autocomplete>
        <v-spacer></v-spacer>
      </v-row>
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="3">
          <v-text-field
            style="font-size: 20pt"
            label="Monto en que va a salir del banco"
            v-model="montoMonExt"
            readonly
            :prefix="acronym"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-tabs color="#A43542" slider-color="primary" fixed-tabs v-model="tab">
        <v-tab value="ref1">STEP 1</v-tab>
        <v-tab value="ref2" v-if="selected.length > 0">STEP 2</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="ref1" class="mt-5">
          <v-card-text>
            <v-row>
              <v-col cols="3">
                <v-text-field label="Buscar..." v-model="search"></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-btn
                  v-if="selected.length > 0"
                  color="green-darken-4"
                  @click="continuar()"
                  >Continuar</v-btn
                >
              </v-col>
            </v-row>

            <v-data-table
              :headers="cabPagos"
              :items="lstPagos"
              item-value="index"
              return-object
              :search="search"
              :loading="loadingTable"
              show-select
              v-model="selected"
            >
              <template v-slot:[`item.item_moneda`]="{ item }">
                <v-autocomplete
                  :items="rootStore.state.itemsCoinsList"
                  v-model="id_coins"
                  item-title="acronym"
                  item-value="id"
                  label="Moneda"
                  v-on:blur="calcularTotales()"
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                  v-if="item.tipo == 'A'"
                ></v-autocomplete>
                <p v-else>
                  {{ acronym }}
                </p>
              </template>
              <!--  -->
              <template v-slot:[`item.tipo_cambio`]="{ item }">
                <v-text-field
                  v-model="item.tipocambio"
                  type="number"
                  step="0.01"
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                  v-on:blur="calcularTotales()"
                ></v-text-field>
              </template>
              <!--  -->
              <template v-slot:[`item.parcial`]="{ item }">
                <v-btn variant="text"
                  v-if="item.tipo == 'CG'"
                  size="small"
                  icon
                  color="primary"
                  @click="generarPagoParcial(item)"
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                >
                  <v-icon v-if="item.iscontrolgasto == true">
                    mdi-credit-card-off-outline
                  </v-icon>
                </v-btn>
                <v-text-field
                  :disabled="
                    selected.filter((v) => v.id == item.id).length == 0
                  "
                  v-else
                  :prefix="acronym"
                  type="number"
                  v-model="item.monto_mon_ex"
                  v-on:update:model-value="calcularTotales()"
                  v-on:blur="calcularTotales()"
                  :error-messages="item.errorEx"
                ></v-text-field>
              </template>
            </v-data-table>
          </v-card-text>
        </v-tabs-window-item>
        <v-tabs-window-item value="ref2">
          <v-card-text>
            <v-row class="mt-5">
              <v-col cols="3">
                <v-text-field
                  v-model="nro_operacion"
                  label="N° de Operación"
                  v-on:blur="ValidaNroOp()"
                  :error-messages="msgNroOperacion"
                  id="nro_operacion"
                ></v-text-field>
              </v-col>
              <v-col cols="3" md="3">
                <v-text-field
                  type="date"
                  v-model="date"
                  label="Fecha "
                ></v-text-field>
              </v-col>
              <v-col md="6" cols="6"> </v-col>

              <v-col md="4" cols="4">
                <v-autocomplete
                  :items="cuentas"
                  item-title="label"
                  item-value="id"
                  label="CUENTA BANCARIA"
                  v-model="id_cuenta"
                  return-object
                ></v-autocomplete>
              </v-col>
              <v-col md="4" cols="4">
                <v-text-field
                  readonly
                  v-model="id_cuenta.banco"
                  label="Banco:"
                ></v-text-field>
              </v-col>
              <v-col md="4" cols="4">
                <v-text-field
                  readonly
                  v-model="id_cuenta.moneda"
                  label="Moneda:"
                ></v-text-field>
              </v-col>
              <v-col md="4" cols="4"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cuenta"
                  label="N° Cuenta:"
                ></v-text-field
              ></v-col>
              <v-col md="4" cols="4"
                ><v-text-field
                  readonly
                  v-model="id_cuenta.cci"
                  label="CCI:"
                ></v-text-field
              ></v-col>
              <v-col md="4" cols="4"
                ><v-text-field
                  v-model="comentarios"
                  label="Comentarios"
                  placeholder="Comentarios......"
                ></v-text-field
              ></v-col>
              <v-col md="12" cols="12">
                <ArrastraYSolarComponent @idArchivoCargado="recibirId" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="success"
              @click="registrarPago()"
              :disabled="!id_cuenta"
              :loading="loadingPago"
            >
              PROCESAR PAGO
            </v-btn>
            <v-btn color="red" @click="$emit('cancelar')">Cancelar</v-btn>
          </v-card-actions>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
    <!-- ---------------------------------------------- -->
    <v-dialog
      v-model="dialog"
      :overlay="false"
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> Realizar Pago Parcial </v-card-title>
        <v-card-text>
          <v-data-table
            show-select
            v-model="selectedParcial"
            :headers="headersParcial"
            :items="detalles"
            class="elevation-1"
            item-value="id"
            return-object
          >
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" color="green" @click="guardarMontoParciales()"
            >Aceptar</v-btn
          >
          <v-btn color="red" @click="dialog = !dialog">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style></style>
