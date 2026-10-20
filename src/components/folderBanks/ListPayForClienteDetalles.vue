<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import swal from "sweetalert2";
import moment from "moment";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
import BarraFiltro from "../BarraMostrarFiltro/BarraFiltro.vue";
import { useBalancesStore } from "@/stores/balances";
import { useIngresosStore } from "@/stores/ingresos";
import { useSecuritysStore } from "@/stores/securitys";
import type {
  CuentaDestinoCliente,
  DatoIngresoCliente,
  FiltroIngresoCliente,
  IngresoCliente,
  IngresoClienteEditable,
} from "@/types/banks";
import type { TipoBalance } from "@/types/finanzas";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

const appStore = useAppStore();
const router = useRouter();
const balancesStore = useBalancesStore();
const ingresosStore = useIngresosStore();
const securitysStore = useSecuritysStore();
const formInvoice = ref<{ validate: () => Promise<{ valid: boolean }> }>();
let tiposubingresoFilter: TipoBalance[] | undefined;

const EditarIngresoFlag = ref(false);
const Ingreso = ref<IngresoClienteEditable>({} as IngresoClienteEditable);
const search = ref("");
const listado = ref<IngresoCliente[]>([]);
const dataList = ref(false);
const headersCabecera = [
  { title: "Accion", key: "action" },
  { title: "Fecha Operacion", key: "fecha_pago" },
  // { text: "Fecha Registro",value: "fecha_creacion",filterable: false,with: "5%",},
  { title: "Nro Operación	", key: "nro_operacion" },
  // { text: "Banco Origen", value: "banco" },
  { title: "Cuenta Destino (PIC)", key: "cuenta_destino" },
  { title: "O/A	", key: "tipo" },
  { title: "Tipo de Pago", key: "tipo_gasto", with: "5%" },
  { title: "Tipo Ingreso", key: "tipo_ingreso", with: "5%" },
  { title: "Sub Tipo de ingreso", key: "subtipo_ingreso" },
  { title: "Cliente	", key: "name_consigner" },
  { title: "Monto	", key: "monto" },
  { title: "Moneda	", key: "moneda_simbolo", with: "5%" },
  {
    title: "Monto Ingresado al Banco	",
    key: "monto_destino",
    with: "5%",
  },
  {
    title: "Moneda Ingresado al Banco	",
    key: "moneda_destino",
    with: "5%",
  },
  { title: "Tipo de Cambio	", key: "tipocambio", with: "5%" },
  // { text: "Concepto	", value: "concepto", with: "20%" },
  { title: "Nro Factura", key: "factura", with: "5%" },
  { title: "Nro Serie", key: "serie", with: "5%" },
];
const filtro = ref<FiltroIngresoCliente>({
  id_branch: "",
  nro_operacion: "",
  monto: "",
  fechadesde: "",
  fechahasta: "",
  factura: "",
  serie: "",
  id_banco: "",
  id_cuenta: "",
  id_consigner: "",
  id_coin: "",
  tipoingreso: "",
  tiposubingreso: "",
  operativo: true,
  administrativo: true,
});
const payfile = ref<File | null>(null);
const dato = ref<DatoIngresoCliente>({
  id: "",
  id_proveedor: "",
  nro_operacion: "",
  monto: "",
  fecha: "",
  id_banco_origen: "",
  id_cuenta_pic: "",
  soporte: "",
  id_path: "",
});
const dialogInvoice = ref(false);
const dialogPayDebsClient = ref(false);
const verflag = ref(false);
const cuentas = ref<CuentaDestinoCliente[]>([]);
const loading = ref(false);
const dialogFiltro = ref(false);
const usuario = ref<string | null>(null);
const expanded = ref<IngresoCliente[]>([]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const detalles = computed(() => {
  if (Object.keys(Ingreso.value).length === 0) {
    return [];
  }

  return Ingreso.value.detalles.filter((v) => !!v && !v.anuladoflag);
});

async function ver(pago: IngresoCliente) {
  router.push({
    name: "verPagosPorCliente",
    params: { id: pago.id_pago },
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _uploadFile() {
  if (payfile.value) {
    const data = new FormData();
    data.append("name", "Prueba");
    data.append("file", payfile.value);

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios(config)
      .then(function (response) {
        Ingreso.value.id_path = JSON.stringify(response.data.data[0].insertid);
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
async function limpiar() {
  filtro.value = {
    id_branch: "",
    nro_operacion: "",
    monto: "",
    fechadesde: "",
    fechahasta: "",
    factura: "",
    serie: "",
    id_banco: "",
    id_coin: "",
    id_consigner: "",
    tipoingreso: "",
    tiposubingreso: "",
    operativo: true,
    administrativo: true,
    nro_exp: "",
  };
  appStore.spiner = true;
  await getListBanksDetailsCxC();
  dialogFiltro.value = !dialogFiltro.value;
  appStore.spiner = false;
}
async function filtrar() {
  appStore.spiner = true;
  await getListBanksDetailsCxC();
  dialogFiltro.value = !dialogFiltro.value;
  appStore.spiner = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nuevo() {
  router.push({ name: "registroPayForCliente" });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirPDF(url: string) {
  window.open(url, "_blank");
}
async function getListBanksDetailsCargar() {
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getListBanksDetailsCargar",
    params: {
      id_branch: sessionBranchId(),
    },
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      cuentas.value = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function verSoport(ruta: string) {
  window.open(ruta, "_blank");
}
async function getListBanksDetailsCxC() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `getListarPayForCustomerDetalle?id_branch=${
        sessionBranchId()
      }&nro_operacion=${
        filtro.value.nro_operacion ? filtro.value.nro_operacion : ""
      }&monto=${filtro.value.monto ? filtro.value.monto : ""}&fechadesde=${
        filtro.value.fechadesde ? filtro.value.fechadesde : ""
      }&fechahasta=${
        filtro.value.fechahasta ? filtro.value.fechahasta : ""
      }&factura=${filtro.value.factura ? filtro.value.factura : ""}&serie=${
        filtro.value.serie ? filtro.value.serie : ""
      }&id_banco=${
        filtro.value.id_banco ? filtro.value.id_banco : ""
      }&id_coin=${
        filtro.value.id_coin ? filtro.value.id_coin : ""
      }&id_consigner=${
        filtro.value.id_consigner ? filtro.value.id_consigner : ""
      }&id_tipoingreso=${
        filtro.value.tipoingreso ? filtro.value.tipoingreso : ""
      }&id_tiposubingreso=${
        filtro.value.tiposubingreso ? filtro.value.tiposubingreso : ""
      }&operativo=${filtro.value.operativo}&administrativo=${
        filtro.value.administrativo
      }&nro_exp=${filtro.value.nro_exp ? filtro.value.nro_exp : ""}`,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      const data = response.data;
      if (data.estadoflag) {
        listado.value = data.data.map((element: IngresoCliente, index: number) => ({
          ...element,
          index,
        }));
        dataList.value = true;
      } else {
        listado.value = [];
        Swal.fire({
          icon: "error",
          text: data.mensaje,
        });
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verInvoice(id: number, editar = false) {
  verflag.value = !editar;
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "ver_ingresos_invoice?id=" + id,

    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      const data = response.data;
      if (data.estadoflag == true) {
        dato.value = data.data[0];
      }
    })
    .catch(function (error) {
      console.error(error);
    });
  dialogInvoice.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verPagosEgresos(id: number, editar = false) {
  verflag.value = !editar;
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "ver_ingresos_debscliente?id=" + id,

    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      const data = response.data;
      if (data.estadoflag == true) {
        dato.value = data.data[0];
      }
    })
    .catch(function (error) {
      console.error(error);
    });
  dialogPayDebsClient.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actualizarInvoice() {
  if ((await formInvoice.value!.validate()).valid) {
    dato.value.usuario = usuario.value;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_ingreso_invoice",

      headers: {
        "Content-Type": "application/json",
      },
      data: dato.value,
    };
    await axios(config)
      .then(function (response) {
        const data = response.data.data[0];
        swal
          .fire({
            text: data.mensaje,
          })
          .then((result) => {
            if (result.isConfirmed) {
              payfile.value = null;
              obtenerListado();
              dialogInvoice.value = false;
            }
          });
        // if (data.estadoflag == true) {
        // }
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actualizarDebs() {
  if ((await formInvoice.value!.validate()).valid) {
    dato.value.usuario = usuario.value;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_ingreso_debscliente",

      headers: {
        "Content-Type": "application/json",
      },
      data: dato.value,
    };
    await axios(config)
      .then(function (response) {
        const data = response.data.data[0];
        swal
          .fire({
            text: data.mensaje,
          })
          .then((result) => {
            if (result.isConfirmed) {
              payfile.value = null;
              obtenerListado();
              dialogPayDebsClient.value = false;
            }
          });
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function exportar() {
  // let vm = this;
  loading.value = true;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `exportar_listado_reporte_ingresos?id_branch=${
        sessionBranchId()
      }&nro_operacion=${
        filtro.value.nro_operacion ? filtro.value.nro_operacion : ""
      }&monto=${filtro.value.monto ? filtro.value.monto : ""}&fechadesde=${
        filtro.value.fechadesde ? filtro.value.fechadesde : ""
      }&fechahasta=${
        filtro.value.fechahasta ? filtro.value.fechahasta : ""
      }&factura=${filtro.value.factura ? filtro.value.factura : ""}&serie=${
        filtro.value.serie ? filtro.value.serie : ""
      }&id_banco=${
        filtro.value.id_banco ? filtro.value.id_banco : ""
      }&id_coin=${
        filtro.value.id_coin ? filtro.value.id_coin : ""
      }&id_consigner=${
        filtro.value.id_consigner ? filtro.value.id_consigner : ""
      }&id_tipoingreso=${
        filtro.value.tipoingreso ? filtro.value.tipoingreso : ""
      }&id_tiposubingreso=${
        filtro.value.tiposubingreso ? filtro.value.tiposubingreso : ""
      }&operativo=${filtro.value.operativo}&administrativo=${
        filtro.value.administrativo
      }&nro_exp=${filtro.value.nro_exp ? filtro.value.nro_exp : ""}`,
    responseType: "blob" as const,
    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Reporte Bancos - Ingresos ${moment().format(
          "DD_MM_YYYY_h_mm_ss",
        )} .xlsx`,
      );
      document.body.appendChild(link);
      link.click();
    })
    .catch(function (error) {
      console.error(error);
    });
  loading.value = false;
  // exportar_listado_reporte_pagos
}
async function obtenerListado() {
  appStore.spiner = true;
  await getListBanksDetailsCxC();
  dato.value = {
    id: "",
    id_proveedor: "",
    nro_operacion: "",
    monto: "",
    fecha: "",
    id_banco_origen: "",
    id_cuenta_pic: "",
    soporte: "",
    id_path: "",
  };
  appStore.spiner = false;
}
function filtarSubIngreso() {
  if (!!filtro.value.tipoingreso) {
    tiposubingresoFilter =
      balancesStore.tiposubingreso.filter(
        (v) => v.id_ingreso == filtro.value.tipoingreso,
      );
  } else {
    tiposubingresoFilter = balancesStore.tiposubingreso;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clickRow(item: IngresoCliente, event: { isExpanded?: boolean }) {
  if (event.isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function ActualizarIngreso() {
  await ingresosStore.ActualizarCXC(Ingreso.value);
  appStore.spiner = true;
  await getListBanksDetailsCxC();
  appStore.spiner = false;
  EditarIngresoFlag.value = false;
}
async function editar(item: IngresoCliente) {
  let val = true;
  let msg = "";
  payfile.value = null;
  Ingreso.value.id_path = null;
  await swal
    .fire({
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
    })
    .then(async (result) => {
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
    await swal.fire({
      icon: "error",
      text: msg,
    });
    return false;
  }

  router.push({
    name: "editarPagosPorCliente",
    params: { id: item.id_pago },
  });
}

watch(() => filtro.value.tipoingreso, () => {
  filtarSubIngreso();
});

onMounted(async () => {
  usuario.value = sessionUser().usuario as string;
  filtro.value.fechadesde = moment().format("YYYY-01-01");
  filtro.value.fechahasta = moment().endOf("month").format("YYYY-MM-DD");
  appStore.spiner = true;
  await getListBanksDetailsCxC();
  appStore.spiner = false;

  await Promise.all([
    balancesStore.getCargarTipoIngreso(),
    appStore._getBanksList(),
    balancesStore.getCargarTipoSubIngreso(),
    filtarSubIngreso(),
    getListBanksDetailsCargar(),
    appStore.cargarClientes(),
    appStore._getCoinsList(),
  ]);
  appStore.drawer = false;
});
</script>

<template>
  <v-container fluid>
    <v-card
      min-height="80vh"
      elevation="0"
    >
      <BarraFiltro
        :filtro="filtro"
        :cuentas="cuentas"
      />
      <v-card-title class="pt-0 d-flex align-center flex-wrap">
        <v-text-field
          class="mx-2"
          hide-details
          density="compact"
          id="id"
          variant="outlined"
          placeholder="Buscar..."
          append-inner-icon="mdi-text-search"
          v-model="search"
          label="Buscar"
        />
        <v-spacer />
        <v-btn
          color="info"
          variant="text"
          @click="dialogFiltro = !dialogFiltro"
          class="mx-1"
        >
          Filtrar <v-icon>mdi-filter</v-icon>
        </v-btn>
      </v-card-title>
      <v-data-table
        :search="search"
        :headers="headersCabecera"
        :items="listado"
        item-value="index"
        disable-sort
        density="compact"
      >
        <template #expanded-row="{ item }">
          <tr>
            <td colspan="1" />
            <td colspan="16">
              <v-table style="width: 100%">
                <thead>
                  <tr>
                    <th>Banco Origen</th>
                    <th>Cuenta Destino (PIC)</th>
                    <!-- <th>O/A</th> -->
                    <th>Tipo Ingreso</th>
                    <th>Sub Tipo de ingreso</th>
                    <th>Monto</th>
                    <th>Moneda</th>
                    <th>Monto Ingresado</th>
                    <th>Moneda Ingresado</th>
                    <th>Tipo de Cambio</th>
                    <th>concepto</th>
                    <th>Nro Factura</th>
                    <th>Nro Serie</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(i, index) in item.detalles"
                    :key="index"
                  >
                    <td>{{ i.banco }}</td>
                    <td>{{ i.cuenta_destino }}</td>
                    <!-- <td>{{ i.tipo }}</td> -->
                    <!-- <td>{{ i.tipo_gasto }}</td>  -->
                    <td>{{ i.tipo_ingreso }}</td>
                    <td>{{ i.subtipo_ingreso }}</td>
                    <td>{{ i.monto }}</td>
                    <td>{{ i.moneda_simbolo }}</td>
                    <td>{{ i.monto_destino }}</td>
                    <td>{{ i.moneda_destino }}</td>
                    <td>{{ i.tipocambio }}</td>
                    <td>{{ i.concepto }}</td>
                    <td>{{ i.factura }}</td>
                    <td>{{ i.serie }}</td>
                    <td>{{ i.action }}</td>
                  </tr>
                </tbody>
              </v-table>
            </td>
          </tr>
        </template>
        <template #[`item.tipocambio`]="{ item }">
          {{ item.tipocambio ? parseFloat(item.tipocambio).toFixed(2) : 0 }}
        </template>
        <template #[`item.monto_destino`]="{ item }">
          {{
            item.monto_destino ? parseFloat(item.monto_destino).toFixed(2) : 0
          }}
        </template>
        <template #[`item.concepto`]="{ item }">
          <ol>
            <li
              v-for="(subItem, index) in (item.concepto || '').split(',')"
              :key="index"
            >
              {{ subItem.trim() }}
            </li>
          </ol>
        </template>
        <template #[`item.action`]="{ item }">
          <div class="d-flex align-center">
            <v-btn
              variant="text"
              size="small"
              icon
              color="red"
              @click="verSoport(item.soporte)"
            >
              <v-icon>mdi-file</v-icon>
            </v-btn>

            <v-btn
              variant="text"
              size="small"
              icon
              color="info"
              @click="ver(item)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>

            <v-btn
              variant="text"
              size="small"
              icon
              color="warning"
              @click="editar(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <v-navigation-drawer
        permanent
        temporary
        location="right"
        width="20%"
        v-if="dialogFiltro"
      >
        <v-card
          height="100%"
          elevation="5"
        >
          <v-card-title
            class="d-flex align-center flex-wrap"
            primary-title
          >
            Filtrar Ingresos
            <v-spacer />
            <v-btn
              variant="text"
              icon
              color="default"
              @click="dialogFiltro = !dialogFiltro"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-select
              :items="appStore.itemsDataBanksList"
              v-model="filtro.id_banco"
              label="Banco Origen"
              item-title="acronym"
              item-value="id"
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
            />
            <v-select
              :items="cuentas"
              v-model="filtro.id_cuenta"
              label="Cuenta Bancaria Destino (PIC)"
              item-title="label"
              item-value="id"
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
            />
            <v-autocomplete
              :items="appStore.clientes"
              v-model="filtro.id_consigner"
              label="Consignatario"
              item-title="namelong"
              item-value="id"
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
            />
            <v-autocomplete
              label="Tipo de Ingreso"
              :items="balancesStore.tipoingreso"
              v-model="filtro.tipoingreso"
              auto-select-first
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
              item-title="description"
              item-value="id"
            />

            <v-autocomplete
              label="Subtipo de Ingreso"
              :items="tiposubingresoFilter"
              v-model="filtro.tiposubingreso"
              auto-select-first
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
              item-title="description"
              item-value="id"
            />

            <v-text-field
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
              label="Nro Operacion"
              v-model="filtro.nro_operacion"
            />
            <v-text-field
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
              label="Nro Expediente"
              v-model="filtro.nro_exp"
            />
            <v-text-field
              clearable
              variant="outlined"
              class="mb-2"
              density="compact"
              hide-details
              type="number"
              label="Monto"
              v-model="filtro.monto"
            />
            <FormatFecha
              :dense="true"
              :outlined="true"
              label="Fecha Desde"
              id="filtroDesde"
              v-model="filtro.fechadesde"
            />
            <FormatFecha
              :dense="true"
              :outlined="true"
              label="Fecha Hasta"
              id="filtroHasta"
              v-model="filtro.fechahasta"
            />
            <!-- <v-checkbox
              v-model="filtro.operativo"
              
              label="Operativo"
            ></v-checkbox>
            <v-checkbox
              v-model="filtro.administrativo"
              
              label="Administrativo"
            ></v-checkbox> -->
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="success"
              @click="filtrar()"
            >
              Aceptar
            </v-btn>
            <v-btn
              color="error"
              @click="limpiar()"
            >
              Limpiar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-navigation-drawer>
    </v-card>
  </v-container>
</template>

<style></style>
