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
import { useFilesStore } from "@/stores/files";
import { useIngresosStore } from "@/stores/ingresos";
import { useSecuritysStore } from "@/stores/securitys";
import type { CuentaBancariaPic } from "@/types/operaciones";
import type { TipoBalance } from "@/types/finanzas";
import type {
  DatoPagoProveedor,
  FacturasAsociadas,
  FiltroPagoProveedor,
  PagoEgresoFila,
  PagoProveedorEditable,
} from "@/types/banksProveedor";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

const appStore = useAppStore();
const router = useRouter();
const bankStore = useBankStore();
const balancesStore = useBalancesStore();
const filesStore = useFilesStore();
const ingresosStore = useIngresosStore();
const securitysStore = useSecuritysStore();
const formInvoice = ref<{ validate: () => Promise<{ valid: boolean }> }>();
let tipogastos: number | string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let tiposubgastosFilter: TipoBalance[] | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let dialogInvoice: boolean | undefined;
let dialogPayControlGasto: boolean | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let name_proveedor: string | undefined;

const registrosEgreso = computed(() => bankStore.list as unknown as PagoEgresoFila[]);
const lstFacturas = ref<FacturasAsociadas>([] as unknown as FacturasAsociadas);
const dialogFacturas = ref(false);
const loading = ref(false);
const search = ref("");
const EditarIngresoFlag = ref(false);
const Ingreso = ref<PagoProveedorEditable>({} as PagoProveedorEditable);
const headersCabecera = [
  { title: "Accion", key: "action" },
  { title: "Fecha Operacion", key: "fechaoperacion" },
  // { text: "Fecha Registro", value: "create_at" },
  { title: "Nro Operación	", key: "numerooperacion" },
  { title: "Cuenta Salida", key: "cuenta" },
  //{ text: "O/A	", value: "tipo" },
  //{ text: "Tipo Gasto	", value: "tipo_gasto" },
  //{ text: "Sub Tipo de Gasto", value: "subtipo_gasto" },
  { title: "Proveedor	", key: "proveedor" },
  { title: "Total en Dólares", key: "totaldolar" },
  { title: "Tipo de Cambio	", key: "tipocambio" },
  {
    title: "Monto y Moneda que Salió al Banco",
    key: "totalmonedalocal",
  },
  // { text: "Moneda	", value: "moneda" },
  { title: "Comentarios", key: "comentario" },
  // { text: "concepto	", value: "concepto" },
  // { text: "Nro Factura", value: "factura" },
  // { text: "Nro Serie", value: "serie" },
];
const expanded = ref<string[]>([]);
const dialog = ref(false);
// dialogInvoice: false,
// dialogPayControlGasto: false,
const dialogFiltro = ref(false);
const verflag = ref(false);
const dato = ref<DatoPagoProveedor>({
  id: "",
  id_proveedor: "",
  nro_operacion: "",
  monto: "",
  fecha: "",
  id_cuenta: "",
  soporte: "",
  id_path: "",
  usuario: "",
});
const cuentas = ref<CuentaBancariaPic[]>([]);
const payfile = ref<File | null>(null);
const usuario = ref<string | null>(null);
const filtro = ref<FiltroPagoProveedor>({
  id_branch: "",
  desde: "",
  hasta: "",
  expediente: "",
  nro_operacion: "",
  id_cuenta: "",
  id_proveedor: "",
  monto: "",
  id_moneda: "",
  nro_factura: "",
  nro_serie: "",
  tipogastos: "",
  tiposubgastos: "",
  operativo: true,
  administrativo: true,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const detalles = computed(() => {
  if (Object.keys(Ingreso.value).length === 0) {
    return [];
  }
  return Ingreso.value.detalle.filter((v) => !!v && !v.anuladoflag);
});

function nuevo() {
  filesStore.payPath = null;
  router.push({ name: "registroPayForProveedor" });
}
async function ver(pago: PagoEgresoFila) {
  console.log("pago", pago);
  router.push({
    name: "verPagosPorProveedor",
    params: { id: pago.id },
  });
}
function confirmarEliminar(pago: PagoEgresoFila) {
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
async function eliminar(pago: PagoEgresoFila) {
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
  await bankStore.eliminarRegistroEgresos(pago);
  await bankStore.getRegistroEgresos(filtro.value);
}
async function editar(pago: PagoEgresoFila) {
  console.log("pago", pago);
  router.push({
    name: "editarPagosPorProveedor",
    params: { id: pago.id },
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function ActualizarIngreso() {
  await ingresosStore.ActualizarCXP(Ingreso.value);
  appStore.spiner = true;
  // @ts-expect-error the filter argument is missing
  await bankStore.getRegistroEgresos();
  appStore.spiner = false;
  EditarIngresoFlag.value = false;
}
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
async function Limpiar() {
  filtro.value = {
    id_branch: "",
    desde: "",
    hasta: "",
    nro_operacion: "",
    expediente: "",
    id_cuenta: "",
    id_proveedor: "",
    monto: "",
    id_moneda: "",
    nro_factura: "",
    nro_serie: "",
    tipogastos: "",
    tiposubgastos: "",
    operativo: true,
    administrativo: true,
  };
  filtro.value.desde = moment().format("YYYY-01-01");
  filtro.value.hasta = moment().endOf("month").format("YYYY-MM-DD");

  appStore.spiner = true;
  await bankStore.getRegistroEgresos(filtro.value);
  appStore.spiner = false;
}
async function filtrar() {
  appStore.spiner = true;
  await bankStore.getRegistroEgresos(filtro.value);
  dialogFiltro.value = !dialogFiltro.value;
  appStore.spiner = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verInvoice(id: number, editar = false) {
  verflag.value = !editar;
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "ver_pago_invoice?id=" + id,

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
  dialogInvoice = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verPagosEgresos(id: number, editar = false) {
  verflag.value = !editar;
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "ver_pago_cgegreso?id=" + id,

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
  dialogPayControlGasto = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verPagosControlEgresos(item: PagoEgresoFila) {
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      "ver_pagoscontrol_egresos?id=" +
      item.id,

    headers: {
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      dato.value = response.data.data[0];
      name_proveedor = item.name_proveedor;
    })
    .catch(function (error) {
      console.error(error);
    });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actualizarInvoice() {
  if ((await formInvoice.value!.validate()).valid) {
    dato.value.usuario = usuario.value;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_pago_invoice",

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
            title: "AVISO",
            text: data.mensaje,
          })
          .then((result) => {
            if (result.isConfirmed) {
              payfile.value = null;
              obtenerListado();
              dialogInvoice = false;
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
async function actualizarCGEgreso() {
  if ((await formInvoice.value!.validate()).valid) {
    dato.value.usuario = usuario.value;
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "actualizar_pago_cgegreso",

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
              dialogPayControlGasto = false;
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
async function obtenerListado() {
  appStore.spiner = true;
  // @ts-expect-error the filter argument is missing
  await bankStore.getRegistroEgresos();
  dato.value = {
    id: "",
    id_proveedor: "",
    nro_operacion: "",
    monto: "",
    fecha: "",
    id_cuenta: "",
    soporte: "",
    id_path: "",
  };
  appStore.spiner = false;
}
function verSoport(ruta: unknown) {
  window.open(ruta as string, "_blank");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function verFactura(data: PagoEgresoFila) {
  const fac = await bankStore.verVacturas(data);
  lstFacturas.value = (fac!.data as FacturasAsociadas[])[0]!;
  dialogFacturas.value = true;
}
async function exportar() {
  // let vm = this;
  loading.value = true;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `exportar_listado_reporte_egresos?id_branch=${
        sessionBranchId()
      }&desde=${
        filtro.value.fechadesde ? filtro.value.fechadesde : ""
      }&hasta=${
        filtro.value.fechahasta ? filtro.value.fechahasta : ""
      }&nro_operacion=${
        filtro.value.nro_operacion ? filtro.value.nro_operacion : ""
      }&id_cuenta=${
        filtro.value.id_cuenta ? filtro.value.id_cuenta : ""
      }&id_proveedor=${
        filtro.value.id_proveedor ? filtro.value.id_proveedor : ""
      }&monto=${filtro.value.monto ? filtro.value.monto : ""}&id_moneda=${
        filtro.value.id_moneda ? filtro.value.id_moneda : ""
      }&nro_factura=${
        filtro.value.nro_factura ? filtro.value.nro_factura : ""
      }&nro_serie=${
        filtro.value.nro_serie ? filtro.value.nro_serie : ""
      }&nro_serie=${
        filtro.value.nro_serie ? filtro.value.nro_serie : ""
      }&tipogastos=${
        filtro.value.tipogastos ? filtro.value.tipogastos : ""
      }&tiposubgastos=${
        filtro.value.tiposubgastos ? filtro.value.tiposubgastos : ""
      }&operativo=${filtro.value.operativo}&administrativo=${
        filtro.value.administrativo
      }`,
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
      link.setAttribute("download", `${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
    })
    .catch(function (error) {
      console.error(error);
    });
  loading.value = false;
  // exportar_listado_reporte_pagos
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
function filtarSubGasto() {
  if (!!tipogastos) {
    tiposubgastosFilter =
      balancesStore.tiposubgastos.filter(
        (v) => v.id_gasto == filtro.value.tipogastos,
      );
  } else {
    tiposubgastosFilter = balancesStore.tiposubgastos;
  }
}
function mostrarComisionBancaria(table_comisionbancaria?: unknown[] | null) {
  const cantRegistros = table_comisionbancaria
    ? table_comisionbancaria.length
    : 0;
  return cantRegistros > 0;
}

watch(() => tipogastos, () => {
  filtarSubGasto();
});

onMounted(async () => {
  filtro.value.desde = moment().format("YYYY-01-01");
  filtro.value.hasta = moment().endOf("month").format("YYYY-MM-DD");
  usuario.value = sessionUser().usuario as string;

  appStore.spiner = true;
  await bankStore.getRegistroEgresos(filtro.value);
  appStore.spiner = false;
  Promise.all([
    getListBanksDetailsCargar(),
    balancesStore.getCargarTipoGastos(),
    balancesStore.getCargarTipoSubGastos(),
    appStore.cargarProveedores(),
    appStore._getBanksList(),
  ]).then(() => {
    // vm.cuentas = vm.$store.state.bank.list.map((item) => ({
    //   id: item.id,
    //   label: item.cuenta,
    // }));
  });
  appStore.drawer = false;
});
</script>

<template>
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
        class="mr-2"
        color="success"
        size="small"
        @click="nuevo"
      >
        NUEVO PAGO <v-icon size="small">
          mdi-plus
        </v-icon>
      </v-btn>
      <v-btn
        class="mr-2"
        color="success"
        size="small"
        @click="exportar()"
        :loading="loading"
      >
        EXCEL <v-icon size="small">
          mdi-file-excel
        </v-icon>
      </v-btn>
      <v-btn
        class="mr-2"
        color="info"
        size="small"
        @click="dialogFiltro = !dialogFiltro"
      >
        Filtrar <v-icon size="small">
          mdi-filter
        </v-icon>
      </v-btn>
      <v-btn
        size="small"
        color="default"
        @click="Limpiar"
      >
        <v-icon size="small">
          mdi-close
        </v-icon> Limpiar
      </v-btn>

      <!-- <v-btn class="mr-2" color="default" small @click="limpiar()">
        Limpiar <v-icon small>mdi-close</v-icon>
      </v-btn> -->
    </v-card-title>

    <v-data-table
      :search="search"
      :headers="headersCabecera"
      :items="registrosEgreso"
      v-model:expanded="expanded"
      show-expand
      expand-on-click
      item-value="id"
      density="compact"
      disable-sort
    >
      <template #[`item.totalmonedalocal`]="{ item }">
        {{ item.moneda }}
        {{ item.totalmonedalocal }}
      </template>
      <template #[`item.action`]="{ item }">
        <div class="d-flex align-center">
          <v-btn
            variant="text"
            icon
            color="default"
            @click="verSoport(item.ruta)"
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
          <td colspan="12">
            <v-table style="width: 100%">
              <thead style="background: #e3f2fd">
                <tr>
                  <!-- <th>Fecha Registro</th> -->
                  <th>O/A</th>
                  <th>Expediente</th>
                  <th>Factura</th>
                  <th>Serie</th>
                  <th>Monto (USD)</th>
                  <th>Monto</th>
                  <!-- <th>Nro Serie</th> -->
                  <!-- <th>Accion</th> -->
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="i in item.detalles"
                  :key="i.id"
                >
                  <td>{{ i.tipo }}</td>
                  <td>{{ i.code_master }}</td>
                  <td>{{ i.nro_factura }}</td>
                  <td>{{ i.nro_serie }}</td>
                  <td>{{ i.montodolar }}</td>
                  <td>{{ i.montomonedalocal }}</td>

                  <!--  <td>
                   <v-btn small color="warning" @click.native="verFactura(i)">
                      VER FACTURAS
                    </v-btn> 
                  </td>-->
                </tr>
              </tbody>
            </v-table>
            <v-table
              style="width: 100%"
              v-if="mostrarComisionBancaria(item.table_comisionbancaria)"
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
                  v-for="i in item.table_comisionbancaria"
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
      <!-- <template v-slot:[`item.action`]="{ item }">
        <v-btn x-small icon color="primary" @click="verSoport(item.soporte)">
          <v-icon>mdi-file-cloud-outline</v-icon>
        </v-btn>

        <v-btn
          x-small
          icon
          color="warning"
          @click.native="verPagosEgresos(item.id, true)"
          v-if="item.esinvoiceadmin == false"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template> -->
    </v-data-table>

    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="60%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          {{ verflag ? "Ver " : "Editar" }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialog = !dialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formEditar">
            <v-row>
              <v-col cols="12">
                <h2>{{ dato.name_proveedor }}</h2>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  label="Nro Operacion"
                  type="number"
                  v-model="dato.nro_operacion"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  type="date"
                  label="Fecha Operacion"
                  v-model="dato.fecha"
                  :rules="[(v) => !!v || 'Datos Requerido']"
                />
              </v-col>
            </v-row>

            <!-- -------------------------------------- -->
            <v-text-field
              label="Monto "
              v-model="dato.monto"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />

            <v-select
              :items="cuentas"
              v-model="dato.id_cuenta"
              label="Cuenta Bancaria"
              item-title="label"
              item-value="id"
              :rules="[(v) => !!v || 'Datos Requerido']"
            />

            <v-file-input
              v-model="payfile"
              label="Nuevo Soporte de Pago"
              show-size
              truncate-length="50"
              hide-details
              clearable
              @update:model-value="_uploadFile()"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            variant="text"
            @click="actualizarCGEgreso()"
          >
            Guardar
          </v-btn>
          <v-btn
            color="warning"
            variant="text"
            @click="dialogPayControlGasto = !dialogPayControlGasto"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
        <v-card-title primary-title>
          Filtrar Gastos
        </v-card-title>
        <v-card-text>
          <v-select
            :items="cuentas"
            v-model="filtro.id_cuenta"
            label="Cuenta Bancaria (PIC)"
            item-title="label"
            item-value="id"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />
          <v-autocomplete
            :items="appStore.provedores"
            v-model="filtro.id_proveedor"
            label="Proveedor"
            item-title="namelong"
            item-value="id"
            clearable
            variant="outlined"
            class="mb-2"
            density="compact"
            hide-details
          />

          <v-text-field
            clearable
            variant="outlined"
            class="mb-2"
            label="Nro Operacion"
            v-model="filtro.nro_operacion"
            density="compact"
            hide-details
          />

          <v-text-field
            clearable
            variant="outlined"
            class="mb-2"
            label="Nro Expediente"
            v-model="filtro.expediente"
            density="compact"
            hide-details
          />

          <v-text-field
            clearable
            variant="outlined"
            class="mb-2"
            type="number"
            label="Monto"
            v-model="filtro.monto"
            density="compact"
            hide-details
          />
          <FormatFecha
            :dense="true"
            :outlined="true"
            label="Fecha Desde"
            id="filtroDesde"
            v-model="filtro.desde"
          />
          <FormatFecha
            :dense="true"
            :outlined="true"
            label="Fecha Hasta"
            id="filtroHasta"
            v-model="filtro.hasta"
          />
          <!-- <v-checkbox
            outlined
            class="mb-2"
            v-model="filtro.operativo"
            label="Operativo"
            hide-details
            dense
          ></v-checkbox>
          <v-checkbox
            v-model="filtro.administrativo"
            label="Administrativo"
            hide-details
            dense
          ></v-checkbox> -->
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            size="small"
            @click="filtrar()"
          >
            Filtrar
          </v-btn>
          <v-btn
            color="red"
            size="small"
            @click="dialogFiltro = !dialogFiltro"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>

    <v-dialog
      v-model="dialogFacturas"
      width="30%"
    >
      <v-card class="py-5">
        <v-card-text>
          <v-textarea
            auto-grow
            v-model="lstFacturas.concepto"
            label="Concepto(s)"
            rows="1"
          />
          <v-textarea
            auto-grow
            v-model="lstFacturas.factura"
            label="Factura(s)"
            rows="1"
          />
          <v-textarea
            auto-grow
            v-model="lstFacturas.serie"
            label="Serie(s)"
            rows="1"
          />
          <!-- {{ lstFacturas }} -->
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style></style>
