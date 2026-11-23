<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useDisplay } from "vuetify";
import { useAppStore } from "@/stores/app";
import { usePermissions } from "@/composables/usePermissions";
import Swal from "sweetalert2";
import moment from "moment";
import "@/styles/accounts-report-headers.css";
import { useIngresosStore } from "@/stores/ingresos";
import { useBalancesStore } from "@/stores/balances";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { hasFailed, request } from "@/utils/request";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { downloadExcel, downloadPdf } from "@/utils/pdfDownload";
import { adminReceivableTotals, downloadExternalFile, receivableQuery } from "@/utils/accountsReports";
import SolicitudReporteDialog from "./SolicitudReporteDialog.vue";
import { useSolicitudReporteAcciones } from "@/composables/useSolicitudReporteAcciones";
import SolicitudAmarradaChip from "./SolicitudAmarradaChip.vue";
import type { EntidadSolicitudReporte, ExpedienteSolicitudReporte } from "@/types/solicitudReporte";
import type {
  ClienteCxc,
  ClienteCxcAdmin,
  ComentarioCxc,
  ContextoComentarioCxc,
  FacturaCxc,
  RegistroComentario,
  TotalAdministrativo,
  TotalOperativo,
} from "@/types/requests";

const appStore = useAppStore();
// celular / tablet: la tabla operativa en tarjetas (escritorio sin cambios)
const { smAndDown } = useDisplay();
const { can } = usePermissions();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const balancesStore = useBalancesStore();
const ingresosStore = useIngresosStore();
const clientes = computed(() => appStore.clientes);
const frmComentario = useTemplateRef("frmComentario");

const moneda = ref("");
const offcanvas = ref(false);
const proveedorOp = ref<number[]>([]);
const llegadaOp = ref("");
const fechaOp = ref("");
const exportandopdf = ref(false);
const nro_expediente = ref("");
const ingreso = ref<number[]>([]);
const subingreso = ref<number[]>([]);
const filtroOp = ref<{ proveedorOp: number[] | string; llegadaOp: string; fechaOp: string }>({
  proveedorOp: "",
  llegadaOp: "",
  fechaOp: "",
});
const filtroAd = ref<{ proveedorAd: string | undefined; llegadaAd: string; fechaAd: string }>({
  proveedorAd: "",
  llegadaAd: "",
  fechaAd: "",
});
const itemsCpp = ref<ClienteCxc[]>([]);
const search = ref("");
const expanded = ref([]);
const expandeda = ref<ClienteCxcAdmin[]>([]);
const date = ref(["", ""]);
const radio = ref<number | string>(1);
const exportando = ref(false);
const radiopdf = ref("");
const dialogPdf = ref(false);
const dataList = ref(false);
const cabTotalOperativo = [
  {
    title: "Operativo",
    key: "moneda",
  },
  {
    title: "Llegados",
    key: "llegada",
  },
  {
    title: "No Llegado",
    key: "no_llegada",
  },
  {
    title: "Total",
    key: "total",
  },
];
const totalOperativo = ref<TotalOperativo[]>([]);
const cabTotalAdministrativo = [
  {
    title: "Administrativo",
    key: "moneda",
  },
  {
    title: "Monto",
    key: "monto",
  },
  {
    title: "IGV",
    key: "igv",
  },
  {
    title: "Total",
    key: "total",
  },
];
const totalAdministrativo = ref<TotalAdministrativo[]>([]);
const headersdbp = [
  {
    title: "Cliente",
    align: "start" as const,
    sortable: true,
    key: "nameconsigner",
    headerProps: { class: "hProveedor" },
  },

  {
    title: "LLEGADA",
    key: "total_llegada",
    headerProps: { class: "hLlegada" },
    sortable: false,
  },
  {
    title: "NO LLEGADAS",
    key: "total_no_llegada",
    headerProps: { class: "hNoLlegada" },
    sortable: false,
  },
  {
    title: "GENERAL",
    key: "total_pagar_llegada",
    headerProps: { class: "hGeneral" },
    sortable: false,
  },

  { title: "", key: "data-table-expand" },
];
const headersdbpa = [
  {
    title: "Cliente",
    key: "nameconsigner",
  },

  {
    title: "Total",
    key: "total_pagar",
  },
];
const itemsCxcAdmin = ref<ClienteCxcAdmin[]>([]);
const loadingBotonGuardarComentario = ref(false);
const loadingDataTableComentarios = ref(false);
const dialogComentarios = ref(false);
const dialogNuevoComentario = ref(false);
const headersLstComentarios = [
  { title: "Fecha", key: "fecha", width: "15%" },
  { title: "Ejecutivo", key: "ejecutivo", width: "30%" },
  { title: "Comentario", key: "comentario", width: "55%" },
];
const comentario = ref<ComentarioCxc>({
  fecha: moment().format("YYYY-MM-DD"),
  id_ejecutivo: JSON.parse(sessionStorage.getItem("dataUser") as string)
    ? JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id
    : "",
  ejecutivo: JSON.parse(sessionStorage.getItem("dataUser") as string)
    ? JSON.parse(sessionStorage.getItem("dataUser") as string)[0].nombrecompleto
    : "",
  texto: "",
  esoperativo: false,
  esadministrativo: false,
});
const dataCXC = ref<ContextoComentarioCxc>({});
const lstComentarios = ref<RegistroComentario[]>([]);
// "Solicitar Cobro": una solicitud con varios expedientes del cliente
const dialogSolicitud = ref(false);
const entidadSolicitud = ref<EntidadSolicitudReporte | null>(null);
const amarrados = ref<ExpedienteSolicitudReporte[]>([]);

function abrirSolicitudCobro(item: ClienteCxc) {
  entidadSolicitud.value = { id: item.id_consigner, nombre: item.nameconsigner };
  dialogSolicitud.value = true;
}
// expedientes del reporte que ya están en una solicitud de cobro (se pintan en el detalle)
// ver / editar / eliminar la solicitud del reporte (editar y eliminar con clave de administrador)
const accionesSolicitud = useSolicitudReporteAcciones("cobro", () => cargarAmarrados());

async function cargarAmarrados() {
  const answer = await request<ExpedienteSolicitudReporte>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_reporte_expedientes",
  });
  amarrados.value = answer.estadoflag ? answer.data : [];
}
// el detalle del reporte es por house: se pintan todas sus solicitudes (una por correlativo)
function amarradoCobro(detalle: ClienteCxc["details"][number]) {
  if (detalle.operativa != 1 || !detalle.id_house) return [];
  return amarrados.value.filter((a) => Number(a.id_house) === Number(detalle.id_house));
}

let proveedorAd: string | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dateRange = computed(() => {
  return date.value.join(" ~ ");
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function viewPDF() {
  dialogPdf.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _cleanFilter() {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  (date.value = ["", ""]), (radio.value = "");
}
function editControl(control: ClienteCxc["details"][number]) {

  window.open(
    `/home/folderBilling/editControlGastos/view/${control.id_control}/${control.id_branch}`,
    "Instructivo",
    "width=1593,height=1293",
    // @ts-expect-error window.open takes three arguments
    "menubar=no",
    "location=no",
    "resizable=no"
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sumField(key: string) {
  // sum data in give key (property)

  return itemsCpp.value.reduce((a, b) => a + parseFloat(String(b[key as keyof ClienteCxc] || 0)), 0);
}
function currentFilters() {
  return receivableQuery({
    clients: filtroOp.value.proveedorOp,
    arrival: filtroOp.value.llegadaOp,
    to: filtroOp.value.fechaOp,
    file: nro_expediente.value,
    incomes: ingreso.value,
    subIncomes: subingreso.value,
  });
}
async function exportarPDF() {
  const res = await Swal.fire({
    icon: "question",
    title: "¿Cómo deseas generar el PDF del reporte?",
    text: "Elige cómo deseas generar el PDF del reporte de cuentas por cobrar:",
    showConfirmButton: true,
    confirmButtonText: "Generar",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    allowOutsideClick: false,
    input: "radio",
    inputOptions: {
      1: "Generar PDF por Fecha de Vencimiento",
      2: "Generar PDF por Cliente",
    },
    inputValidator: (value) => {
      if (!value) {
        return "Elige una opción para generar el PDF.";
      }
    },
  });
  if (!res.isConfirmed) return;
  exportandopdf.value = true;
  await downloadPdf(
    {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "exportarPDFCXC",
      params: { ...currentFilters(), tipo_reporte: res.value },
    },
    `Reporte CxC - ${Date.now()}.pdf`,
  );
  exportandopdf.value = false;
}
async function _getDebsToPay() {
  appStore.spiner = true;
  dataList.value = false;
  const answer = await request<ClienteCxc>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getReporteCXC",
    params: currentFilters(),
  });
  if (hasFailed(answer)) showRejectedResponse(answer);
  itemsCpp.value = answer.data;
  dataList.value = true;
  calcularTotalOperativo({ data: answer.data });
  appStore.spiner = false;
}
async function _getInvoiceAdminCxCAdmin() {
  appStore.spiner = true;
  const answer = await request<ClienteCxcAdmin>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "getReporteCXCAdmin",
    params: currentFilters(),
  });
  if (hasFailed(answer)) showRejectedResponse(answer);
  itemsCxcAdmin.value = answer.data;
  totalAdministrativo.value = adminReceivableTotals(answer.data, moneda.value);
  appStore.spiner = false;
}
function calcularTotalOperativo({ data }: { data: ClienteCxc[] }) {
  totalOperativo.value = [];
  let totalNoLlegadaDolares = 0;
  let totalLlegadaDolares = 0;
  let totalDolares = 0;

  let totalLlegadaSoles = 0;
  let totalNoLlegadaSoles = 0;
  let totalSoles = 0;
  if (data) {
    data.forEach((element) => {
      element.details.forEach((element2) => {
        if (element2.symbol == "USD") {
          if (element2.llegada == 0) {
            totalNoLlegadaDolares += parseFloat(element2.total_pagar);
            totalDolares += parseFloat(element2.total_pagar);
          }
          if (element2.llegada == 1) {
            totalLlegadaDolares += parseFloat(element2.total_pagar);
            totalDolares += parseFloat(element2.total_pagar);
          }
        } else {
          if (element2.llegada == 0) {
            totalNoLlegadaSoles += parseFloat(element2.total_pagar);
            totalSoles += parseFloat(element2.total_pagar);
          }
          if (element2.llegada == 1) {
            totalLlegadaSoles += parseFloat(element2.total_pagar);
            totalSoles += parseFloat(element2.total_pagar);
          }
        }
      });
    });
  }
  totalOperativo.value.push(
    {
      moneda: "USD",
      llegada: parseFloat(String(totalLlegadaDolares)).toFixed(2),
      no_llegada: parseFloat(String(totalNoLlegadaDolares)).toFixed(2),
      total: parseFloat(String(totalDolares)).toFixed(2),
    },
    {
      moneda: moneda.value,
      llegada: parseFloat(String(totalLlegadaSoles)).toFixed(2),
      no_llegada: parseFloat(String(totalNoLlegadaSoles)).toFixed(2),
      total: parseFloat(String(totalSoles)).toFixed(2),
    }
  );
}
function clickRowa(item: ClienteCxcAdmin, event: Event & { isExpandeda?: boolean }) {
  if (event.isExpandeda) {
    const index = expandeda.value.findIndex((i) => i === item);
    expandeda.value.splice(index, 1);
  } else {
    expandeda.value.push(item);
  }
}
async function filtrar() {
  filtroOp.value.proveedorOp = proveedorOp.value;
  filtroOp.value.llegadaOp = llegadaOp.value;
  filtroOp.value.fechaOp = fechaOp.value;
  filtroAd.value.proveedorAd = proveedorAd;
  await _getDebsToPay();
  await _getInvoiceAdminCxCAdmin();
  await cargarAmarrados();
  offcanvas.value = false;
}
async function limpiar() {
  filtroOp.value = {
    proveedorOp: "",
    llegadaOp: "",
    fechaOp: "",
  };
  proveedorOp.value = [];
  llegadaOp.value = "";
  fechaOp.value = "";
  nro_expediente.value = "";
  ingreso.value = [];
  subingreso.value = [];
  await _getDebsToPay();
  await _getInvoiceAdminCxCAdmin();
  offcanvas.value = false;
}
async function descargarArchivos() {
  if (
    filtroOp.value.proveedorOp.length > 0 &&
    filtroOp.value.proveedorOp.length <= 5
  ) {
    Swal.fire({
      icon: "question",
      title: "Factura",
      text: "¿Desea también descargar, las facturas asociadas a estos clientes",
      confirmButtonText: "Descargar Facturas",
      showDenyButton: true,
      denyButtonText: "No descargar Factura",
      showCancelButton: false,
      cancelButtonText: "Cerrar",
    }).then(async (res) => {
      if (res.isConfirmed) {
        await download();
        await exportar();
      }
      if (res.isDenied) {
        await exportar();
      }
    });
  } else {
    await exportar();
  }
}
async function download() {
  itemsCpp.value.forEach((cxc) => {
    cxc.details.forEach((detail) => {
      if (detail.facturas.length > 0) {
        detail.facturas.forEach(async (factura) => {
          await downloadFactura(factura);
        });
      }
    });
  });
}
async function downloadFactura(item: FacturaCxc) {
  await downloadExternalFile(item.url_documento, `FACTURA Nro - ${item.nro_factura}.pdf`);
}
async function exportar() {
  exportando.value = true;
  await downloadExcel(
    {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "reportcxcexcel",
      params: { ...currentFilters(), nombre_impuesto: enterprisesStore.impuesto.nombre_impuesto, moneda: moneda.value },
    },
    `Reporte Cuentas por Cobrar ${moment().format("DD-MM-YYYY hh-mm-ss")}.xlsx`,
  );
  exportando.value = false;
}
async function mostrarComentariosOp(data: Partial<ClienteCxc> = {}) {
  dataCXC.value = {
    ...data,
    esoperativo: true,
    esadministrativo: false,
  };
  dialogComentarios.value = !dialogComentarios.value;

  await getComentarios();
}
function agregarComentarioOp() {
  comentario.value = {
    ...comentario.value,
    id_cliente: dataCXC.value.id_consigner ? dataCXC.value.id_consigner : null,
    esoperativo: true,
    esadministrativo: false,
  };

  dialogNuevoComentario.value = !dialogNuevoComentario.value;
}
async function mostrarComentariosAdmin(data: Partial<ClienteCxcAdmin> = {}) {
  dataCXC.value = {
    ...data,
    esoperativo: false,
    esadministrativo: true,
  };
  dialogComentarios.value = !dialogComentarios.value;

  await getComentarios();
}
function agregarComentarioAdmin() {
  comentario.value = {
    ...comentario.value,
    id_cliente: dataCXC.value.id_consigner ? dataCXC.value.id_consigner : null,
    esoperativo: false,
    esadministrativo: true,
  };

  dialogNuevoComentario.value = !dialogNuevoComentario.value;
}
async function getComentarios() {
  lstComentarios.value = [];
  loadingDataTableComentarios.value = true;
  const answer = await request<RegistroComentario>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "listarComentariosCXC",
    params: { id_cliente: dataCXC.value.id_consigner },
  });
  if (hasFailed(answer)) showRejectedResponse(answer);
  lstComentarios.value = answer.data.filter((v) => (dataCXC.value.esoperativo ? !!v.esoperativo : !!v.esadministrativo));
  loadingDataTableComentarios.value = false;
}
async function guardarComentario() {
  if (!(await frmComentario.value!.validate()).valid) return;
  loadingBotonGuardarComentario.value = true;
  const answer = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "insertarComentarioCXC",
    data: {
      id_cliente: comentario.value.id_cliente,
      texto: comentario.value.texto,
      esoperativo: comentario.value.esoperativo,
      esadministrativo: comentario.value.esadministrativo,
    },
  });
  loadingBotonGuardarComentario.value = false;
  if (!answer.estadoflag) {
    showRejectedResponse(answer);
    return;
  }
  Swal.fire({ icon: "success", text: answer.mensaje });
  dialogNuevoComentario.value = false;
  comentario.value.texto = "";
  await getComentarios();
}

onMounted(async () => {
  moneda.value = JSON.parse(
    sessionStorage.getItem("dataBranch") as string
  )[0].moneda[0].acronym;
  // console.log(moneda);
  await pricingStore.getModulesEntities();
  await _getDebsToPay();
  await _getInvoiceAdminCxCAdmin();
  await cargarAmarrados();
  await enterprisesStore.obtenerImpuestoXEmpresa();
  appStore.drawer = false;
  await appStore.cargarClientes();
  await ingresosStore.cargarIngreso();
  await balancesStore.getCargarTipoSubIngreso();
});
</script>

<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap cuentas-titulo">
        <h3>REPORTE DE CUENTAS POR COBRAR</h3>
        <v-spacer />
        <v-btn
          class="ml-5"
          color="primary"
          elevation="0"
          size="small"
          variant="plain"
          @click="offcanvas = !offcanvas"
        >
          <v-icon>mdi-filter-multiple</v-icon> FILTRAR
        </v-btn>
        <v-btn
          color="#1D6F42"
          class="mx-1"
          v-if="can('accountsreceivable', 'EXPORTAR')"
          @click="descargarArchivos()"
          :loading="exportando"
          size="small"
          variant="plain"
        >
          <v-icon>mdi-file-excel</v-icon>
          EXCEL
        </v-btn>
        <v-btn
          class="ml-5"
          color="red"
          :loading="exportandopdf"
          v-if="can('accountsreceivable', 'EXPORTAR')"
          @click="exportarPDF()"
          elevation="0"
          size="small"
          variant="plain"
        >
          <v-icon>mdi-file-pdf-box</v-icon> PDF
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            md="6"
            class="px-2 px-md-10"
          >
            <h5>TOTAL OPERATIVO</h5>
            <v-data-table
              :headers="cabTotalOperativo"
              :items="totalOperativo"
              hide-default-footer
              no-data-text="Aún no hay totales operativos."
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
            class="px-2 px-md-10"
          >
            <h5>TOTAL ADMINISTRATIVO</h5>
            <v-data-table
              :headers="cabTotalAdministrativo"
              :items="totalAdministrativo"
              hide-default-footer
              no-data-text="Aún no hay totales administrativos."
            />
          </v-col>
        </v-row>
        <v-data-table
          :headers="headersdbp"
          :items="itemsCpp"
          :mobile="smAndDown"
          :search="search"
          no-data-text="No hay cuentas por cobrar operativas con estos filtros. Cambia o limpia los filtros."
          v-model:expanded="expanded"
          item-value="id_consigner"
          show-expand
          expand-on-click
        >
          <template #[`item.nameconsigner`]="{ item }">
            <div class="d-flex align-center flex-wrap ga-2 cuentas-celda">
              <div class="cuentas-nombre">
                {{ item.nameconsigner }}
              </div>
              <div class="ml-auto d-flex align-center flex-wrap ga-2 cuentas-acciones">
                <!-- Solicitar Cobro: mismo botón que "Solicitar" de Control de Gastos > Costos -->
                <v-btn
                  v-if="can('accountsreceivable', 'NUEVO')"
                  size="small"
                  variant="flat"
                  color="primary"
                  prepend-icon="mdi-send-outline"
                  class="solreq__btn"
                  @click.stop="abrirSolicitudCobro(item)"
                >
                  Solicitar Cobro
                </v-btn>
                <v-btn
                  size="small"
                  color="primary"
                  @click.stop="mostrarComentariosOp(item)"
                >
                  <v-icon
                    size="small"
                    class="mr-1"
                  >
                    mdi-comment
                  </v-icon> Comentarios
                </v-btn>
              </div>
            </div>
          </template>

          <template #expanded-row="{ item }">
            <tr>
              <td colspan="11">
                <div class="cuentas-detalle">
                  <v-table
                    class="cuentas-tabla"
                    style="width: 100%"
                  >
                    <thead>
                      <tr style="background: #fff1cf">
                        <th>Expediente</th>
                        <th>Cliente</th>
                        <th>Fecha Disponibilidad</th>
                        <th>Total a Cobrar</th>
                        <th>Status</th>
                        <th>Fecha de Vencimiento</th>
                        <th>Días de atraso</th>
                        <th>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style="background: #fff1cf"
                        v-for="child of item.details"
                        :key="child.id"
                      >
                        <td data-label="Expediente">
                          {{ child.nro_master }}
                          <v-icon
                            v-if="child.operativa == 1"
                            @click="editControl(child)"
                          >
                            mdi-eye
                          </v-icon>
                          <!-- expediente amarrado a una solicitud de cobro -->
                          <SolicitudAmarradaChip
                            v-for="sol in amarradoCobro(child)"
                            :key="sol.id_solicitud + '-' + (sol.id_correlativo ?? 0)"
                            :solicitud="sol"
                            tipo="cobro"
                            :eliminando="accionesSolicitud.eliminando.value === sol.id_solicitud"
                            @ver="accionesSolicitud.ver(sol, { id: Number(sol.id_cliente ?? item.id_consigner), nombre: item.nameconsigner })"
                            @editar="accionesSolicitud.editar(sol, { id: Number(sol.id_cliente ?? item.id_consigner), nombre: item.nameconsigner })"
                            @eliminar="accionesSolicitud.eliminar(sol)"
                          />
                        </td>
                        <td data-label="Cliente">
                          {{ child.nameconsigner }}
                        </td>
                        <td data-label="Fecha Disponibilidad">
                          {{ child.fecha_disponibilidad }}
                        </td>
                        <td data-label="Total a Cobrar">
                          {{ child.symbol }} {{ child.total_pagar }}
                        </td>

                        <td data-label="Status">
                          {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                        </td>
                        <td data-label="Fecha de Vencimiento">
                          {{ child.fechadevencimiento }}
                        </td>
                        <td data-label="Días de atraso">
                          {{ child.diasatraso }}
                        </td>
                        <td data-label="Estatus">
                          {{ child.estatus }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-text>
        <h3>REPORTE DE CUENTAS POR COBRAR ADMINISTRATIVAS</h3>

        <!-- @vue-expect-error expanded is typed by the item key but holds the items -->
        <v-data-table
          :headers="headersdbpa"
          :items="itemsCxcAdmin"
          :mobile="smAndDown"
          :search="search"
          no-data-text="No hay cuentas por cobrar administrativas con estos filtros. Cambia o limpia los filtros."
          v-model:expanded="expandeda"
          item-value="nameconsigner"
          return-object
          show-expand
          @click:row="(event: Event, { item }: { item: ClienteCxcAdmin }) => clickRowa(item, event)"
        >
          <template #[`item.nameconsigner`]="{ item }">
            <div class="d-flex align-center flex-wrap ga-2 cuentas-celda">
              <div class="cuentas-nombre">
                {{ item.nameconsigner }}
              </div>
              <v-btn
                size="small"
                color="primary"
                class="ml-auto"
                @click.stop="mostrarComentariosAdmin(item)"
              >
                <v-icon
                  size="small"
                  class="mr-1"
                >
                  mdi-comment
                </v-icon> Comentarios
              </v-btn>
            </div>
          </template>

          <template #expanded-row="{ item }">
            <tr>
              <td colspan="11">
                <div class="cuentas-detalle">
                  <v-table
                    class="cuentas-tabla"
                    style="width: 100%"
                  >
                    <thead>
                      <tr style="background: #fff1cf">
                        <!-- <th>Acción</th> -->
                        <!-- <th>Factura</th> -->
                        <th>Cliente</th>
                        <th>Documento</th>
                        <th>Monto Inicial</th>

                        <th>Deuda Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        style="background: #fff1cf"
                        v-for="child of item.details"
                        :key="child.id"
                      >
                        <!-- <td>
                          <v-icon
                            @click="
                              programar({
                                id: child.id,
                                tipo: 0,
                              })
                            "
                            >mdi-clock-outline</v-icon
                          >
                        </td> -->
                        <td data-label="Cliente">
                          {{ child.nameconsigner }}
                        </td>
                        <td data-label="Documento">
                          {{ child.concepto }}
                        </td>
                        <td data-label="Monto Inicial">
                          {{ child.symbol }} {{ child.monto }}
                        </td>

                        <td data-label="Deuda Actual">
                          {{ child.symbol }} {{ child.total_pagar }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog
      max-width="400"
      v-model="dialogPdf"
    >
      <v-card>
        <v-card-title> Opción de PDF </v-card-title>
        <v-card-text>
          <v-radio-group v-model="radiopdf">
            <v-radio
              value="1"
              label="Reporte Simple"
            />
            <v-radio
              value="2"
              label="Reporte Detallado"
            />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <!-- @vue-expect-error _exportPdf is not defined -->
          <v-btn
            v-if="radiopdf != ''"
            color="primary"
            @click="_exportPdf()"
            variant="outlined"
          >
            EXPORTAR
          </v-btn>
          <v-spacer />
          <v-btn
            color="red"
            @click="dialogPdf = false"
            variant="outlined"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!--COMENTARIOS-->
    <v-dialog
      v-model="dialogComentarios"
      persistent
      :width="smAndDown ? undefined : '70%'"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap cuentas-titulo">
          Estados/Comentarios de la CxC - {{ dataCXC.nameconsigner }}
          <v-spacer />
          <template v-if="dataCXC.esoperativo && can('accountsreceivable', 'NUEVO')">
            <v-btn
              rounded
              size="small"
              color="primary"
              @click="agregarComentarioOp"
            >
              Nuevo Comentario
            </v-btn>
          </template>
          <template v-else-if="dataCXC.esadministrativo && can('accountsreceivable', 'NUEVO')">
            <v-btn
              rounded
              size="small"
              color="primary"
              @click="agregarComentarioAdmin"
            >
              Nuevo Comentario
            </v-btn>
          </template>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersLstComentarios"
            :items="lstComentarios"
            :mobile="smAndDown"
            class="elevation-1"
            no-data-text="Este cliente aún no tiene comentarios. Agrega el primero con Nuevo Comentario."
            :loading="loadingDataTableComentarios"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="error"
            @click="dialogComentarios = !dialogComentarios"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!--NUEVO COMENTARIO-->
    <v-dialog
      v-model="dialogNuevoComentario"
      persistent
      :width="smAndDown ? undefined : '50%'"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap cuentas-titulo">
          Registro de Estado/Comentario de la CxC - {{ dataCXC.nameconsigner }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogNuevoComentario = !dialogNuevoComentario"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmComentario">
            <v-text-field
              density="compact"
              label="Fecha"
              v-model="comentario.fecha"
              type="date"
              readonly
            />
            <v-autocomplete
              density="compact"
              label="Ejecutivo"
              :items="pricingStore.listEjecutivo"
              item-title="name"
              item-value="id_entitie"
              v-model="comentario.id_ejecutivo"
              :rules="[(v) => !!v || 'Dato requerido']"
              readonly
            />
            <v-textarea
              density="compact"
              label="Estado/Comentario"
              v-model="comentario.texto"
              rows="4"
              auto-grow
              :rules="[(v) => !!v || 'Dato requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            @click="guardarComentario"
            :loading="loadingBotonGuardarComentario"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SolicitudReporteDialog
      v-model="dialogSolicitud"
      tipo="cobro"
      :entidad="entidadSolicitud"
      @guardado="cargarAmarrados"
    />
    <!-- ver / editar una solicitud registrada desde el reporte -->
    <SolicitudReporteDialog
      v-model="accionesSolicitud.abierto.value"
      tipo="cobro"
      :entidad="accionesSolicitud.entidad.value"
      :solicitud="accionesSolicitud.solicitud.value"
      :modo="accionesSolicitud.modo.value"
      :autorizacion="accionesSolicitud.autorizacion.value"
      @guardado="cargarAmarrados"
    />

    <v-navigation-drawer
      v-model="offcanvas"
      v-if="offcanvas"
      absolute
      location="right"

      width="20%"
    >
      <v-card elevation="0">
        <h1 class="mx-2 mt-2">
          FILTRO PAGOS
        </h1>
        <v-card-text>
          <v-row>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <v-autocomplete
                clearable
                v-model="proveedorOp"
                label="Clientes"
                :items="clientes"
                item-title="namelong"
                item-value="id"
                multiple
                chips
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <v-text-field
                name="name"
                label="Nro Expediente"
                v-model="nro_expediente"
                clearable
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <v-autocomplete
                clearable
                v-model="ingreso"
                label="Ingresos"
                :items="ingresosStore.list"
                item-title="descripcion"
                item-value="id"
                multiple
                chips
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <v-autocomplete
                clearable
                v-model="subingreso"
                label="Sub Ingresos"
                :items="balancesStore.tiposubingreso.filter((v) => v.id != 0)"
                item-title="description"
                item-value="id"
                multiple
                chips
                density="compact"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                label="Fecha Hasta"
                type="date"
                v-model="fechaOp"
                clearable
                variant="outlined"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <p>Estado:</p>
              <v-radio-group
                v-model="llegadaOp"
                density="compact"
                inline
                variant="outlined"
                class="py-0 my-0"
              >
                <v-radio
                  label="Llegada"
                  value="1"
                />

                <v-radio
                  label="No llegada"
                  value="0"
                />
              </v-radio-group>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-actions>
          <v-btn
            color="success"
            @click="filtrar"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="error"
            @click="limpiar"
          >
            Limpiar
          </v-btn>
          <v-btn
            color="info"
            @click="offcanvas = !offcanvas"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </div>
</template>

<style lang="scss">
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up),
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up) + tr {
  background: #ffccab;
}

.swal2-radio {
  display: flex;
  flex-direction: column !important;
  align-items: flex-start !important;
}
</style>

<style lang="scss" scoped>
/* "Solicitar Cobro": mismo estilo que el botón "Solicitar" de Control de Gastos > Costos */
.cuentas-acciones :deep(.solreq__btn) {
  flex-shrink: 0;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
/* celular / tablet: cada fila del detalle expandido es una tarjeta "etiqueta: valor" (en la web sigue la tabla) */
@media (max-width: 959.98px) {
  .cuentas-detalle {
    width: 0;
    min-width: 100%;
  }
  .cuentas-tabla :deep(thead) {
    display: none;
  }
  .cuentas-tabla :deep(table),
  .cuentas-tabla :deep(tbody) {
    display: block;
    width: 100%;
  }
  .cuentas-tabla :deep(tbody tr) {
    display: block;
    margin: 8px 0;
    padding: 4px 12px;
    border: 1px solid #f1d59b;
    border-radius: 10px;
    background: #fff7e3 !important;
  }
  .cuentas-tabla :deep(tbody td) {
    display: block;
    height: auto !important;
    min-height: 34px;
    padding: 7px 0 !important;
    border-bottom: 1px dashed #efd9a8 !important;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .cuentas-tabla :deep(tbody td:last-child) {
    border-bottom: 0 !important;
  }
  .cuentas-tabla :deep(tbody td[data-label])::before {
    content: attr(data-label);
    float: left;
    max-width: 48%;
    margin-right: 12px;
    color: #6b5a33;
    font-weight: 600;
    text-align: left;
  }
  .cuentas-tabla :deep(tbody td)::after {
    content: "";
    display: block;
    clear: both;
  }
}
/* títulos largos (reporte y comentarios): bajan de línea en vez de cortarse */
.cuentas-titulo {
  row-gap: 4px;
  white-space: normal;
  overflow-wrap: anywhere;
}
@media (max-width: 599.98px) {
  .cuentas-titulo h3 {
    flex: 1 1 100%;
    font-size: 1.05rem;
  }
  .cuentas-titulo :deep(.v-btn.ml-5) {
    margin-left: 0 !important;
  }
}
/* celular / tablet (tabla en tarjetas): el nombre y los botones bajan de línea sin salirse */
.cuentas-celda {
  min-width: 0;
  max-width: 100%;
}
:deep(.v-data-table__tr--mobile .v-data-table__td-value):has(.cuentas-celda) {
  min-width: 0;
  max-width: 65%;
}
:deep(.v-data-table__tr--mobile) .cuentas-celda {
  justify-content: flex-end;
  text-align: right;
}
:deep(.v-data-table__tr--mobile) .cuentas-nombre {
  flex: 1 1 100%;
  overflow-wrap: anywhere;
}
</style>
