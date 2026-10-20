<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import axios from "@/api/http";
import swal from "sweetalert2";
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import BarraFiltro from "../BarraMostrarFiltro/BarraFiltro.vue";
import { useBalancesStore } from "@/stores/balances";
import { useBankStore } from "@/stores/bank";
import { useIngresosStore } from "@/stores/ingresos";
import { useSecuritysStore } from "@/stores/securitys";
import type {
  CuentaDestinoCliente,
  DatoIngresoCliente,
  FiltroRegistroIngreso,
  IngresoClienteEditable,
  RegistroIngreso,
} from "@/types/banks";
import type { TipoBalance } from "@/types/finanzas";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

const appStore = useAppStore();
const router = useRouter();
const bankStore = useBankStore();
const balancesStore = useBalancesStore();
const ingresosStore = useIngresosStore();
const securitysStore = useSecuritysStore();
const formInvoice = ref<{ validate: () => Promise<{ valid: boolean }> }>();
const registrosIngreso = computed(() => bankStore.list as unknown as RegistroIngreso[]);
let tiposubingresoFilter: TipoBalance[] | undefined;
// getListBanksDetailsCxC is not defined here, so calling it throws.
const getListBanksDetailsCxC = undefined as unknown as () => Promise<void>;

const EditarIngresoFlag = ref(false);
const Ingreso = ref<IngresoClienteEditable>({} as IngresoClienteEditable);
const search = ref("");
const headersCabecera = [
  { key: "urlarchivo", title: "Acción" },
  { key: "fechaoperacion", title: "Fecha Operación" }, // text,
  { key: "numerooperacion", title: "Nro Operación" }, // varchar,
  { key: "bancoingreso", title: "Banco de Origen" }, // varchar,
  { key: "nrocuenta", title: "Número de Cuenta Destino" }, // text,
  { key: "cliente", title: "Cliente" }, // text,
  { key: "totaldolar", title: "Total en Dólares" }, // numeric(19,4),
  { key: "tipocambio", title: "Tipo de Cambio" }, // numeric(19,4),
  {
    key: "totalmonedalocal",
    title: "Monto y Moneda que Ingresó al Banco",
  }, // numeric(19,4),
  // { value: "monedaregistro", text: "Moneda de Registro" }, // varchar,
  { key: "comentarioadmin", title: "Comentario del Administrador" }, // text,
  { key: "comentariousuario", title: "Comentario del Usuario" }, // text,
  // { value: "nombrearchivo", text: "Nombre del Archivo" }, // varchar,
  // varchar,
  // { value: detalle, text: "detalle" }, // json,
  // { value: comisionbancaria, text: "comisionbancaria" }, // json
];
const filtro = ref<FiltroRegistroIngreso>({
  id_branch: "",
  id_banco_origin: "",
  id_cuenta_destino: "",
  id_cliente: "",
  id_tipoingreso: "",
  id_subtipoingreso: "",
  nro_operacion: "",
  nro_expediente: "",
  monto_factura: "",
  fechadesde: "",
  fechahasta: "",
  operativo: "",
  administrativo: "",
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
const expanded = ref<string[]>([]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const detalles = computed(() => {
  if (Object.keys(Ingreso.value).length === 0) {
    return [];
  }

  return Ingreso.value.detalles.filter((v) => !!v && !v.anuladoflag);
});

async function ver(pago: RegistroIngreso) {
  console.log("pago", pago);
  router.push({
    name: "verPagosPorCliente",
    params: { id: pago.id },
  });
}
async function limpiarFiltro() {
  filtro.value = {
    id_branch: "",
    id_banco_origin: "",
    id_cuenta_destino: "",
    id_cliente: "",
    id_tipoingreso: "",
    id_subtipoingreso: "",
    nro_operacion: "",
    nro_expediente: "",
    monto_factura: "",
    fechadesde: moment().format("YYYY-01-01"),
    fechahasta: moment().endOf("month").format("YYYY-MM-DD"),
    operativo: "",
    administrativo: "",
  };
  appStore.spiner = true;
  await bankStore.getRegistroIngresos(filtro.value);
  appStore.spiner = false;
}
function confirmarEliminar(pago: RegistroIngreso) {
  swal
    .fire({
      icon: "warning",
      title: "Eliminar Registro",
      text: "¿Está seguro que quiere eliminar el registro?",
      showDenyButton: true,
      denyButtonColor: "#263238",
      denyButtonText: "Cancelar",
      confirmButtonText: "Si, Eliminar",
      confirmButtonColor: "red",
      showCloseButton: true,
    })
    .then((res) => {
      if (res.isConfirmed) {
        eliminar(pago);
      }
    });
}
async function eliminar(pago: RegistroIngreso) {
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
          // @ts-expect-error Swal is not defined in this scope
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
  await bankStore.eliminarRegistroIngresos(pago);
  await bankStore.getRegistroIngresos(filtro.value);
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
async function filtrar() {
  appStore.spiner = true;
  await bankStore.getRegistroIngresos(filtro.value);
  dialogFiltro.value = !dialogFiltro.value;
  appStore.spiner = false;
}
function nuevo() {
  router.push({ name: "registroPayForCliente" });
}
async function editar(item: RegistroIngreso) {
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
          // @ts-expect-error Swal is not defined in this scope
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
    params: { id: item.id },
  });
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
function verSoport(ruta: unknown) {
  window.open(ruta as string, "_blank");
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
async function ActualizarIngreso() {
  await ingresosStore.ActualizarCXC(Ingreso.value);
  appStore.spiner = true;
  await getListBanksDetailsCxC();
  appStore.spiner = false;
  EditarIngresoFlag.value = false;
}

watch(() => filtro.value.tipoingreso, () => {
  filtarSubIngreso();
});

onMounted(async () => {
  usuario.value = sessionUser().usuario as string;
  filtro.value.fechadesde = moment().format("YYYY-01-01");
  filtro.value.fechahasta = moment().endOf("month").format("YYYY-MM-DD");
  appStore.spiner = true;
  await bankStore.getRegistroIngresos(filtro.value);
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
  <v-card min-height="80vh">
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
        color="success"
        @click="nuevo"
        size="small"
        class="mx-1"
      >
        NUEVO INGRESO <v-icon size="small">
          mdi-plus
        </v-icon>
      </v-btn>
      <v-btn
        color="success"
        @click="exportar()"
        :loading="loading"
        size="small"
        class="mx-1"
      >
        EXCEL <v-icon size="small">
          mdi-file-excel
        </v-icon>
      </v-btn>
      <v-btn
        color="info"
        size="small"
        @click="dialogFiltro = !dialogFiltro"
        class="mx-1"
      >
        Filtrar <v-icon size="small">
          mdi-filter
        </v-icon>
      </v-btn>
      <v-btn
        color="red"
        size="small"
        variant="outlined"
        @click="limpiarFiltro"
        class="mx-1"
      >
        LIMPIAR <v-icon size="small">
          mdi-filter-remove
        </v-icon>
      </v-btn>
    </v-card-title>
    <v-data-table
      :search="search"
      :headers="headersCabecera"
      :items="registrosIngreso"
      v-model:expanded="expanded"
      show-expand
      expand-on-click
      item-value="id"
      disable-sort
    >
      <template #[`item.totalmonedalocal`]="{ item }">
        {{ item.monedaregistro }}
        {{ item.totalmonedalocal }}
      </template>
      <template #[`item.urlarchivo`]="{ item }">
        <div class="d-flex align-center">
          <v-btn
            variant="text"
            icon
            color=""
            @click="verSoport(item.urlarchivo)"
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
            color="orange"
            @click="editar(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            variant="text"
            size="small"
            icon
            color="red"
            @click="confirmarEliminar(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </template>
      <template #expanded-row="{ item }">
        <tr>
          <td colspan="1" />
          <td colspan="16">
            <v-table style="width: 100%">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Nro Factura</th>
                  <th>Nro Serie</th>
                  <th>Monto Ingresado (USD)</th>
                  <th>Monto Ingresado (M.L)</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(i, index) in item.detalle"
                  :key="index"
                >
                  <td>{{ i.code_master }}</td>
                  <td>{{ i.nro_factura }}</td>
                  <td>{{ i.nro_serie }}</td>
                  <td>{{ i.montodolar }}</td>
                  <td>{{ i.montomonedalocal }}</td>
                </tr>
              </tbody>
            </v-table><v-table
              style="width: 100%"
              v-if="item.comisionbancaria.length > 0"
            >
              <thead style="background: #e3f2fd">
                <tr>
                  <!-- <th>Fecha Registro</th> -->
                  <th>Comisión Bancaria</th>
                  <th>Monto(USD)</th>
                  <th>Monto (ML)</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="i in item.comisionbancaria"
                  :key="i.id"
                >
                  <td>{{ i.concepto }}</td>
                  <td>{{ i.montodolar }}</td>
                  <td>{{ i.monto }}</td>
                  <td>
                    <!-- <v-btn small color="warning" @click.native="verFactura(i)">
                      VER FACTURAS
                    </v-btn> -->
                  </td>
                </tr>
              </tbody>
            </v-table>
          </td>
        </tr>
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          variant="text"
          size="x-small"
          icon
          color="primary"
          @click="verSoport(item.urlarchivo)"
        >
          <v-icon>mdi-file-cloud-outline</v-icon>
        </v-btn>
        <v-btn
          variant="text"
          size="x-small"
          icon
          color="warning"
          @click="editar(item)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
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
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />
          <v-text-field
            label="Nro Expediente"
            v-model="filtro.nro_exp"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />
          <v-text-field
            type="number"
            label="Monto"
            v-model="filtro.monto"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
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
            @click="limpiarFiltro()"
          >
            Limpiar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-card>
</template>

<style></style>
