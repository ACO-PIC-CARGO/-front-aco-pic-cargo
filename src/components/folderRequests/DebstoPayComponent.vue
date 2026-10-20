<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, useTemplateRef } from "vue";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import moment from "moment";
import { useGastosStore } from "@/stores/gastos";
import { useSubgastoStore } from "@/stores/subgasto";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { useProgramacionesStore } from "@/stores/programaciones";
import { sessionBranchId } from "@/utils/sesion";
import type {
  ComentarioCxp,
  ContextoComentarioCxp,
  CuentaPagarAdmin,
  CuentaPagarProveedor,
  DetalleCxp,
  DetalleCxpAdmin,
  ProgramacionPago,
  RegistroComentario,
  TotalAdministrativo,
  TotalOperativo,
} from "@/types/requests";

const rootStore = useStore();
const programacionesStore = useProgramacionesStore();
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const subgastoStore = useSubgastoStore();
const gastosStore = useGastosStore();
const provedores = computed(() => rootStore.state.provedores);
const frmComentario = useTemplateRef("frmComentario");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const newProgrammedPayment = defineAsyncComponent(() =>
  import("../ProgrammedPayment/newProgrammedPayment.vue"));

const moneda = ref("");
const gasto = ref<number[] | string>("");
const subgasto = ref<number[] | string>("");
const nuevaFechaFlag = ref(false);
const nameProveedor = ref("");
const proveedorOp = ref<number[] | string>("");
const llegadaOp = ref("");
const fechaOp = ref("");
const nro_expediente = ref("");
const dialogNuevoPago = ref(false);
const overlay = ref(false);
const itemsCpp = ref<CuentaPagarProveedor[]>([]);
const itemsCppa = ref<CuentaPagarAdmin[]>([]);
const search = ref("");
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
const cabTotalAdministrativo = ref([
  {
    title: "Administrativo",
    key: "moneda",
  },
  {
    title: "Nonto",
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
]);
const offcanvas = ref(false);
const totalAdministrativo = ref<TotalAdministrativo[]>([]);
const expanded = ref([]);
const expandeda = ref<CuentaPagarAdmin[]>([]);
const date = ref(["", ""]);
const value = ref(0);
const radio = ref<number | string>(1);
const radiopdf = ref<number | string>("");
const dialogPdf = ref(false);
const exportando = ref(false);
const exportandopdf = ref(false);
const dataList = ref(false);
const details = ref<(DetalleCxp | DetalleCxpAdmin)[]>([]);
const fechaNuevaProgramacion = ref(moment(new Date()).format("YYYY-MM-DD"));
const headersdbp = [
  {
    title: "PROVEEDOR OPERATIVO",
    align: "start" as const,
    sortable: true,
    key: "nameproveedor",
    headerProps: { class: "hProveedor" },
  },

  {
    title: "LLEGADAS",
    key: "restante_llegada",
    headerProps: { class: "hLlegada" },
    sortable: false,
  },

  {
    title: "NO LLEGADAS",
    key: "restante_no_llegada",
    headerProps: { class: "hNoLlegada" },
    sortable: false,
  },

  {
    title: "GENERAL",
    key: "restante_pagar",
    headerProps: { class: "hGeneral" },
    sortable: false,
  },
  { title: "", key: "data-table-expand" },
];
const headersdbpa = [
  {
    title: "Proveedor",
    align: "start" as const,
    sortable: false,
    key: "nameconsigner",
  },

  {
    title: "Pendiente por Pagar",
    key: "pendiente_pago",
  },

  { title: "", key: "data-table-expand" },
];
const headerProgramacion = ref([
  { title: "Expediente", key: "nro_master" },
  { title: "Consignatario", key: "nameconsigner" },
  { title: "Fecha Disponibilidad", key: "fecha_disponibilidad" },
  { title: "Moneda", key: "symbol" },
  { title: "Monto Pagar", key: "total_pagar" },
]);
const tipo = ref<number | string | null>("");
const selected = ref<(DetalleCxp | DetalleCxpAdmin)[]>([]);
const programend_id = ref<number | null | undefined>(null);
const loadingBotonGuardarComentario = ref(false);
const loadingDataTableComentarios = ref(false);
const dialogComentarios = ref(false);
const dialogNuevoComentario = ref(false);
const headersLstComentarios = [
  { title: "Fecha", key: "fecha", width: "15%" },
  { title: "Ejecutivo", key: "ejecutivo", width: "30%" },
  { title: "Comentario", key: "comentario", width: "55%" },
];
const comentario = ref<ComentarioCxp>({
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
const dataCXP = ref<ContextoComentarioCxp>({});
const lstComentarios = ref<RegistroComentario[]>([]);

const dateRange = computed(() => {
  return date.value.join(" ~ ");
});

function nuevaFecha({ item = null, tipo = null }: { item?: CuentaPagarProveedor | CuentaPagarAdmin | null; tipo?: number | null }) {
  Swal.fire({
    icon: "question",
    title:
      "¿Deseas agregar el pago a una programación que ya existe o crear una nueva?",
    confirmButtonText: "Agregar a una programación que ya existe",
    denyButtonText: `Crear una Programación Nueva`,
    showDenyButton: true,
    showCancelButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      programar({ item, tipo });
      nuevaFechaFlag.value = false;
    }
    if (result.isDenied) {
      programend_id.value = 0;
      nuevaFechaFlag.value = true;
      programar({ item, tipo });
    }
  });
  // enviarProgramacion
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function viewPDF() {
  dialogPdf.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _cleanFilter() {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  (date.value = ["", ""]), (radio.value = "");
}
function editControl(control: DetalleCxp) {
  window.open(
    `/home/folderBilling/editControlGastos/view/${control.id}/${control.id_branch}`,
    "Instructivo",
    "width=1593,height=1293",
    // @ts-expect-error window.open takes three arguments
    "menubar=no",
    "location=no",
    "resizable=no",
  );
}
function sumField(key: string) {
  return itemsCpp.value.reduce((a, b) => a + parseFloat(String(b[key as keyof CuentaPagarProveedor] || 0)), 0);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sumFieldA(key: string) {
  return itemsCppa.value.reduce((a, b) => a + parseFloat(String(b[key as keyof CuentaPagarAdmin] || 0)), 0);
}
function clickRowa(item: CuentaPagarAdmin, event: Event & { isExpandeda?: boolean }) {
  if (event.isExpandeda) {
    const index = expandeda.value.findIndex((i) => i === item);
    expandeda.value.splice(index, 1);
  } else {
    expandeda.value.push(item);
  }
}
async function _exportPdf() {
  Swal.fire({
    icon: "info",
    title: "Generando PDF",
    text: "Espere... ",
  });

  let statusLetra: string | undefined;
  if (radio.value == "") {
    statusLetra = "Todos";
  } else if (radio.value == 1) {
    statusLetra = "Vencidas";
  } else if (radio.value == 0) {
    statusLetra = "No Vencidas";
  }

  const data = {
    itemsCpp: itemsCpp.value,
    total_pagar: Intl.NumberFormat().format(
      sumField("total_pagar").toFixed(2) as unknown as number,
    ),
    total_pagado: Intl.NumberFormat().format(
      sumField("total_pagado").toFixed(2) as unknown as number,
    ),
    total_restante: Intl.NumberFormat().format(
      sumField("restante_pagar").toFixed(2) as unknown as number,
    ),
    total_pagar_llegada: Intl.NumberFormat().format(
      sumField("total_pagar_llegada").toFixed(2) as unknown as number,
    ),
    total_pagado_llegada: Intl.NumberFormat().format(
      sumField("total_pagado_llegada").toFixed(2) as unknown as number,
    ),
    total_restante_llegada: Intl.NumberFormat().format(
      sumField("restante_llegada").toFixed(2) as unknown as number,
    ),
    total_pagar_no_llegada: Intl.NumberFormat().format(
      sumField("total_pagar_no_llegada").toFixed(2) as unknown as number,
    ),
    total_pagado_no_llegada: Intl.NumberFormat().format(
      sumField("total_pagado_no_llegado").toFixed(2) as unknown as number,
    ),
    total_restante_no_llegada: Intl.NumberFormat().format(
      sumField("restante_pagar_no_llegada").toFixed(2) as unknown as number,
    ),
    fecha: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .substr(0, 10),
    dateRange: dateRange.value,
    status: statusLetra,
    totalOperativo: totalOperativo.value,
    totalAdministrativo: totalAdministrativo.value,
  };

  let urlLong: string | undefined;
  if (radiopdf.value == 1) {
    urlLong = "pdfcxp";
  } else if (radiopdf.value == 2) {
    urlLong = "pdfcxpD";
  }
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + (urlLong as string),

    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      Swal.fire({
        icon: "success",
        title: "PDF Generado",
        text: "El PDF se descargará automaticamente",
      });

      dialogPdf.value = false;
      window.open(
        import.meta.env.VITE_URL_MAIN + response.data.path,
        "_blank",
      );
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getDebsToPay() {
  overlay.value = true;
  itemsCpp.value = [];
  setInterval(() => {
    value.value = value.value + 3;
  }, 1000);
  dataList.value = false;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `getReporteCXP?id_branch=${
        sessionBranchId()
      }&id_proveedor=${proveedorOp.value ? proveedorOp.value : ""}&llegada=${
        llegadaOp.value ? llegadaOp.value : ""
      }&desde=&hasta=${fechaOp.value ? fechaOp.value : ""}&nro_expediente=${
        nro_expediente.value
      }`,

    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsCpp.value = response.data.data;
      dataList.value = true;
      calcularTotalOperativo({ data: response.data.data });
    })
    .catch(function (error) {
      console.error(error);
    });
  overlay.value = false;
}
async function _getDebsToPayAdmin() {
  overlay.value = true;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `getDebsToPayAdmin?id_branch=${
        sessionBranchId()
      }&id_proveedor=${proveedorOp.value ? proveedorOp.value : ""}&llegada=${
        llegadaOp.value ? llegadaOp.value : ""
      }&desde=&hasta=${fechaOp.value ? fechaOp.value : ""}&nro_expediente=${
        nro_expediente.value
      }&id_gasto=${gasto.value ? gasto.value : ""}&id_subgasto=${
        subgasto.value ? subgasto.value : ""
      }`,
    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsCppa.value = response.data.data;
      rootStore.state.drawer = false;
      setTimeout(() => {
        calcularTotalAdministrativo({ data: response.data.data });
      }, 100);
    })
    .catch(function (error) {
      console.error(error);
    });
  overlay.value = false;
  offcanvas.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _getDebsToPayFilter() {
  dataList.value = false;

  const data = {
    date_begin: date.value[0],
    date_end: date.value[1],
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "getDebsToPayFilter",

    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      itemsCpp.value = response.data.data;
      dataList.value = true;
      rootStore.state.drawer = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function calcularTotalOperativo({ data }: { data: CuentaPagarProveedor[] }) {
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
    },
  );
}
function calcularTotalAdministrativo({ data }: { data: CuentaPagarAdmin[] }) {
  totalAdministrativo.value = [];
  let totalMontoDolares = 0;
  let IgvDolares = 0;
  let totalDolares = 0;

  let totalMontoSoles = 0;
  let IgvSoles = 0;
  let totalSoles = 0;
  if (data) {
    data.forEach((element) => {
      element.details.forEach((element2) => {
        if (element2.symbol == "USD") {
          totalMontoDolares += parseFloat(element2.monto);
          IgvDolares += parseFloat(element2.igv);
          totalDolares += parseFloat(element2.total);
        } else {
          totalMontoSoles += parseFloat(element2.monto);
          IgvSoles += parseFloat(element2.igv);
          totalSoles += parseFloat(element2.total);
        }
      });
    });
  }
  totalAdministrativo.value.push(
    {
      moneda: "USD",
      monto: parseFloat(String(totalMontoDolares)).toFixed(2),
      igv: parseFloat(String(IgvDolares)).toFixed(2),
      total: parseFloat(String(totalDolares)).toFixed(2),
    },
    {
      moneda: moneda.value,
      monto: parseFloat(String(totalMontoSoles)).toFixed(2),
      igv: parseFloat(String(IgvSoles)).toFixed(2),
      total: parseFloat(String(totalSoles)).toFixed(2),
    },
  );
  rootStore.state.spiner = false;
}
function programar({ item = null, tipo: tipoPago = 1 }: { item?: CuentaPagarProveedor | CuentaPagarAdmin | null; tipo?: number | null }) {
  selected.value = [];
  tipo.value = tipoPago;
  let index = 0;
  switch (tipoPago) {
    case 1:
      headerProgramacion.value = [
        { title: "Expediente", key: "nro_master" },
        { title: "Consignatario", key: "nameconsigner" },
        { title: "Fecha Disponibilidad", key: "fecha_disponibilidad" },
        { title: "Moneda", key: "symbol" },
        { title: "Monto Pagar", key: "total_pagar" },
      ];
      nameProveedor.value = (item as CuentaPagarProveedor).nameproveedor;
      details.value = item!.details.filter((v) => v.programado == 0);

      details.value.forEach((element) => {
        element.index = index;
        index++;
      });
      break;
    case 2:
      headerProgramacion.value = [
        { title: "Consignatario", key: "nameconsigner" },
        { title: "Fecha Registro", key: "fecha" },
        { title: "Moneda", key: "symbol" },
        { title: "Monto Pagar", key: "monto" },
      ];
      nameProveedor.value = (item as CuentaPagarAdmin).nameconsigner;
      details.value = item!.details.filter((v) => v.programado == 1);
      details.value.forEach((element) => {
        element.index = index;
        index++;
      });
    default:
      break;
  }
  dialogNuevoPago.value = true;
}
async function enviarProgramacion() {
  const data = {
    id: programend_id.value,
    tipo: tipo.value,
    fecha: fechaNuevaProgramacion.value,
    details: selected.value,
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setProgrammedPayment",
    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      Swal.fire({
        icon: "info",
        title: "Aviso",
        text: response.data.mensaje,
      }).then((result) => {
        if (result.isConfirmed) {
          limpiar();
          dialogNuevoPago.value = false;
        }
      });
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function filtrar() {
  rootStore.state.spiner = true;
  await _getDebsToPay();
  await _getDebsToPayAdmin();
  rootStore.state.spiner = false;
  offcanvas.value = false;
}
async function limpiar() {
  rootStore.state.spiner = true;
  proveedorOp.value = "";
  llegadaOp.value = "";
  fechaOp.value = "";
  nro_expediente.value = "";
  await _getDebsToPay();
  await _getDebsToPayAdmin();
  rootStore.state.spiner = false;
  offcanvas.value = false;
}
async function exportar() {
  exportando.value = true;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `reportcxpexcel?id_branch=${
        sessionBranchId()
      }&id_proveedor=${proveedorOp.value ? proveedorOp.value : ""}&llegada=${
        llegadaOp.value ? llegadaOp.value : ""
      }&desde=&hasta=${fechaOp.value ? fechaOp.value : ""}&nro_expediente=${
        nro_expediente.value
      }&nombre_impuesto=${
        enterprisesStore.impuesto.nombre_impuesto
      }&moneda=${moneda.value}&id_gasto=${
        gasto.value ? gasto.value : ""
      }&id_subgasto=${subgasto.value ? subgasto.value : ""}`,

    responseType: "blob" as const,
    headers: {

      "Content-Type": "blob",
    },
  };
  await axios(config)
    .then(function (response) {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte CxP - ${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
    })
    .catch(function (error) {
      console.error(error);
    });
  exportando.value = false;
  // exportar_listado_reporte_pagos
}
async function exportarPDF() {
  Swal.fire({
    icon: "question",
    title: "¿Cómo deseas generar el PDF del reporte?",
    text: "Elige cómo deseas generar el PDF del reporte de cuentas por pagar:",
    showConfirmButton: true,
    confirmButtonText: "Generar",
    showDenyButton: true,
    denyButtonText: "Cancelar",
    allowOutsideClick: false,
    input: "radio",
    inputOptions: {
      1: "Generar PDF por Fecha de Vencimiento",
      2: "Generar PDF por Proveedor",
    },
    inputValidator: (value) => {
      if (!value) {
        return "Debe seleccionar una opción";
      }
    },
  }).then(async (res) => {
    if (res.isConfirmed) {
      const tipoReportePDF = res.value;

      exportandopdf.value = true;

      const config = {
        method: "get",
        url:
          import.meta.env.VITE_URL_MAIN +
          `exportarPDFCXP?id_branch=${
            sessionBranchId()
          }&id_proveedor=${
            proveedorOp.value ? proveedorOp.value : ""
          }&llegada=${llegadaOp.value ? llegadaOp.value : ""}&desde=&hasta=${
            fechaOp.value ? fechaOp.value : ""
          }&nro_expediente=${nro_expediente.value}&tipo_reporte=${
            tipoReportePDF ? tipoReportePDF : ""
          }&nombre_impuesto=${
            enterprisesStore.impuesto.nombre_impuesto
          }&id_gasto=${gasto.value ? gasto.value : ""}&id_subgasto=${
            subgasto.value ? subgasto.value : ""
          }`,
        responseType: "blob" as const,
        headers: {

          "Content-Type": "blob",
        },
      };

      await axios(config)
        .then(function (response) {
          // console.log(response)

          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `Reporte CxP - ${Date.now()}.pdf`);
          document.body.appendChild(link);
          link.click();
        })
        .catch(function (error) {
          console.error(error);
        });

      exportandopdf.value = false;
    }
  });
}
async function mostrarComentariosOp(data: Partial<CuentaPagarProveedor> = {}) {
  dataCXP.value = {
    ...data,
    proveedor: data.nameproveedor ? data.nameproveedor : "",
    esoperativo: true,
    esadministrativo: false,
  };
  dialogComentarios.value = !dialogComentarios.value;

  await getComentarios();
}
function agregarComentarioOp() {
  comentario.value = {
    ...comentario.value,
    id_proveedor: dataCXP.value.id ? dataCXP.value.id : null,
    esoperativo: true,
    esadministrativo: false,
  };

  dialogNuevoComentario.value = !dialogNuevoComentario.value;
}
async function mostrarComentariosAdmin(data: Partial<CuentaPagarAdmin> = {}) {
  dataCXP.value = {
    ...data,
    id: data.id_proveedor ? data.id_proveedor : null,
    proveedor: data.nameconsigner ? data.nameconsigner : "",
    esoperativo: false,
    esadministrativo: true,
  };
  dialogComentarios.value = !dialogComentarios.value;

  await getComentarios();
}
function agregarComentarioAdmin() {
  comentario.value = {
    ...comentario.value,
    id_proveedor: dataCXP.value.id ? dataCXP.value.id : null,
    esoperativo: false,
    esadministrativo: true,
  };

  dialogNuevoComentario.value = !dialogNuevoComentario.value;
}
async function getComentarios() {
  lstComentarios.value = [];
  loadingDataTableComentarios.value = true;

  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `listarComentariosCXP?id_proveedor=${dataCXP.value.id}`,
    headers: {

      "Content-Type": "application/json",
    },
  };

  await axios(config).then(function (response) {
    sessionStorage.setItem("auth-token", response.data.token);

    if (response.data.status == "401") {
      Swal.fire({
        icon: "error",
        text: response.data.mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      }).then((resSwal) => {
        if (resSwal.isConfirmed) {
          // @ts-expect-error router is not defined in this scope
          router.push({ name: "Login" });
          setTimeout(() => {
            window.location.reload();
          }, 10);
        }
      });
    } else {
      if (response.data.estadoflag) {
        const comentarios = response.data.data;

        if (dataCXP.value.esoperativo) {
          lstComentarios.value = comentarios.filter((v: RegistroComentario) => !!v.esoperativo);
        } else if (dataCXP.value.esadministrativo) {
          lstComentarios.value = comentarios.filter(
            (v: RegistroComentario) => !!v.esadministrativo,
          );
        }
      } else {
        lstComentarios.value = [];
      }
    }
  });

  loadingDataTableComentarios.value = false;
}
async function guardarComentario() {
  if ((await frmComentario.value!.validate()).valid) {
    loadingBotonGuardarComentario.value = true;

    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `insertarComentarioCXP`,
      headers: {

        "Content-Type": "application/json",
      },
      data: comentario.value,
    };

    await axios(config).then(async function (response) {
      sessionStorage.setItem("auth-token", response.data.token);

      if (response.data.estadoflag) {
        Swal.fire({
          icon: "success",
          text: response.data.mensaje,
        });

        await getComentarios();
      } else {
        Swal.fire({
          icon: "error",
          text: response.data.mensaje,
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        }).then((resSwal) => {
          if (resSwal.isConfirmed && response.data.status == "401") {
            // @ts-expect-error router is not defined in this scope
            router.push({ name: "Login" });
            setTimeout(() => {
              window.location.reload();
            }, 10);
          }
        });
      }
    });

    loadingBotonGuardarComentario.value = false;
    dialogNuevoComentario.value = !dialogNuevoComentario.value;

    comentario.value.texto = "";
  }
}
// async limpiar() {
//   this.$store.state.spiner = true;
//   this.tipo == 1
//     ? await this._getDebsToPay()
//     : await this._getDebsToPayAdmin();
//   this.$store.state.spiner = false;
// },

onMounted(async () => {
  moneda.value = JSON.parse(
    sessionStorage.getItem("dataBranch") as string,
  )[0].moneda[0].acronym;
  offcanvas.value = false;
  rootStore.state.spiner = true;
  cabTotalAdministrativo.value[2]!.title =
    enterprisesStore.impuesto.nombre_impuesto as string;
  await Promise.all([
    _getDebsToPay(),
    _getDebsToPayAdmin(),
    pricingStore.getModulesEntities(),
    rootStore.dispatch("cargarProveedores"),
    gastosStore.cargarGasto(),
    enterprisesStore.obtenerImpuestoXEmpresa(),
    subgastoStore.GetListSubGasto(),
  ]);

  rootStore.state.spiner = false;
  programend_id.value = (
    (programacionesStore.listProgramacion as ProgramacionPago[]).filter(
      (v) => v.programend_select == true,
    )[0] || ({} as ProgramacionPago)
  ).programend_id;
});
</script>

<template>
  <v-container fluid>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
        <h3>REPORTE DE CUENTAS POR PAGAR</h3>
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
          @click="exportar"
          :loading="exportando"
          size="small"
          variant="plain"
        >
          <v-icon>mdi-file-excel</v-icon> EXCEL
        </v-btn>
        <v-btn
          class="ml-5"
          color="red"
          :loading="exportandopdf"
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
            cols="6"
            class="px-10"
          >
            <h5>TOTAL OPERATIVO</h5>
            <v-data-table
              :headers="cabTotalOperativo"
              :items="totalOperativo"
              hide-default-footer
            />
          </v-col>
          <v-col
            cols="6"
            class="px-10"
          >
            <h5>TOTAL ADMINISTRATIVO</h5>
            <v-data-table
              :headers="cabTotalAdministrativo"
              :items="totalAdministrativo"
              hide-default-footer
            />
          </v-col>
        </v-row>

        <v-data-table
          v-if="dataList"
          :headers="headersdbp"
          :items="itemsCpp"
          :search="search"
          v-model:expanded="expanded"
          item-value="nameproveedor"
          show-expand
          expand-on-click
        >
          <template #[`item.nameproveedor`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameproveedor }}</div>
              <v-btn
                size="small"
                color="primary"
                class="ml-auto"
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
          </template>

          <template #expanded-row="{ item }">
            <tr>
              <td colspan="11">
                <v-table style="width: 100%">
                  <thead>
                    <tr style="background: #fff1cf">
                      <th>Expediente</th>
                      <th>Correlativo Factura</th>
                      <th>Correlativo Programación</th>
                      <th>Cliente</th>
                      <th>Facturas</th>
                      <th>Fecha Disponibilidad</th>
                      <th>Total a Pagar</th>
                      <th>Status</th>
                      <!-- <th>Pagado Cliente</th> -->
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style="background: #fff1cf"
                      v-for="(child, index) of item.details"
                      :key="index"
                    >
                      <td>
                        {{ child.nro_master }}
                        <v-icon
                          v-if="child.controlgastoegreso == 1"
                          @click="editControl(child)"
                        >
                          mdi-eye
                        </v-icon>

                        <v-icon
                          v-if="child.programado == 0"
                          @click="
                            nuevaFecha({
                              item: item,
                              tipo: 1,
                            })
                          "
                        >
                          mdi-clock-outline
                        </v-icon>
                      </td>
                      <td>
                        {{ child.code_correlativo }}
                      </td>
                      <td>
                        {{ child.programado_correlativo }}
                      </td>
                      <td>
                        {{ child.nameconsigner }}
                      </td>
                      <td>
                        {{ child.expedientes }}
                      </td>
                      <td>
                        {{ child.fecha_disponibilidad }}
                      </td>
                      <td>
                        {{ child.symbol }}
                        {{ parseFloat(child.total_pagar).toFixed(2) }}
                      </td>
                      <td>
                        {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                      </td>
                      <!-- <td>
                        {{ child.pagado == 1 ? "SI" : "NO" }}
                      </td> -->
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
        </v-data-table>

        <v-card-title primary-title>
          REPORTE DE CUENTAS POR PAGAR ADMINISTRATIVAS
        </v-card-title>

        <!-- @vue-expect-error expanded is typed by the item key but holds the items -->
        <v-data-table
          :search="search"
          :headers="headersdbpa"
          :items="itemsCppa"
          v-model:expanded="expandeda"
          item-value="nameconsigner"
          return-object
          show-expand
          @click:row="(event: Event, { item }: { item: CuentaPagarAdmin }) => clickRowa(item, event)"
        >
          <template #[`item.nameconsigner`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameconsigner }}</div>
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
                <v-table style="width: 100%">
                  <thead>
                    <tr style="background: #fff1cf">
                      <th>Acción</th>
                      <th>Factura</th>
                      <th>Fecha Registro</th>
                      <th>Monto</th>
                      <th>
                        {{ enterprisesStore.impuesto.nombre_impuesto }}
                      </th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style="background: #fff1cf"
                      v-for="child of item.details"
                      :key="child.id"
                    >
                      <td>
                        <v-icon
                          v-if="child.programado"
                          @click="nuevaFecha({ item: item, tipo: 2 })"
                        >
                          mdi-clock-outline
                        </v-icon>
                      </td>
                      <td>
                        {{ child.nro_factura }}
                      </td>
                      <td>{{ child.fecha }}</td>
                      <td>{{ child.symbol }} {{ child.monto }}</td>
                      <td>{{ child.symbol }} {{ child.igv }}</td>
                      <td>{{ child.symbol }} {{ child.total }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!--COMENTARIOS-->
    <v-dialog
      v-model="dialogComentarios"
      persistent
      width="70%"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Estados/Comentarios de la CxP - {{ dataCXP.proveedor }}
          <v-spacer />
          <template v-if="dataCXP.esoperativo">
            <v-btn
              rounded
              size="small"
              color="primary"
              @click="agregarComentarioOp"
            >
              Nuevo Comentario
            </v-btn>
          </template>
          <template v-else-if="dataCXP.esadministrativo">
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
            class="elevation-1"
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
      width="50%"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Registro de Estado/Comentario de la CxP - {{ dataCXP.proveedor }}
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

    <v-dialog
      v-model="dialogNuevoPago"
      scrollable
      persistent
      max-width="70%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Programación de Pago del Proveedor {{ nameProveedor }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogNuevoPago = !dialogNuevoPago"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              cols="3"
              v-if="!nuevaFechaFlag"
            >
              <v-autocomplete
                :items="
                  (programacionesStore.listProgramacion as ProgramacionPago[]).filter(
                    (v) => v.programend_id != 0,
                  )
                "
                item-title="programend_fecha"
                item-value="programend_id"
                v-model="programend_id"
              />
            </v-col>

            <v-col
              cols="3"
              v-if="nuevaFechaFlag"
            >
              <v-text-field
                type="date"
                v-model="fechaNuevaProgramacion"
              />
            </v-col>
            <v-col cols="3">
              <v-spacer />
              <v-btn
                color="success"
                @click="enviarProgramacion()"
                :disabled="selected.length == 0"
              >
                Programar
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-data-table
                v-model="selected"
                :headers="headerProgramacion"
                :items="details"
                item-value="index"
                return-object
                show-select
                class="elevation-0"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="offcanvas"
      v-if="offcanvas"
      absolute
      location="right"

      width="20%"
    >
      <v-card>
        <v-card-title primary-title>
          FILTRO PAGOS
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <!-- @vue-expect-error the model starts as an empty string -->
              <v-autocomplete
                clearable
                v-model="proveedorOp"
                label="Proveedores"
                :items="provedores"
                item-title="namelong"
                item-value="id"
                multiple
                chips
                variant="outlined"
                density="compact"
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
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <!-- @vue-expect-error the model starts as an empty string -->
              <v-autocomplete
                clearable
                v-model="gasto"
                label="Gasto"
                :items="gastosStore.list"
                item-title="description"
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
              <!-- @vue-expect-error the model starts as an empty string -->
              <v-autocomplete
                clearable
                v-model="subgasto"
                label="Sub Gasto"
                :items="subgastoStore.lstSubGasto"
                item-title="description"
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
                label="Fecha Hasta"
                type="date"
                v-model="fechaOp"
                clearable
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col
              cols="12"
              class="py-0 my-0"
            >
              <p class="py-0 my-0">
                Estado:
              </p>
              <v-radio-group
                density="compact"
                v-model="llegadaOp"
                inline
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
  </v-container>
</template>

<style lang="scss">
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up),
.v-data-table > .v-table__wrapper tbody tr.v-data-table__tr:has(> .v-data-table__td--expanded-row .mdi-chevron-up) + tr {
  background: #ffccab;
}

.hProveedor {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #a8aee5;
}
.hNoLlegada {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #c3fbef;
}
.hLlegada {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #fbc3c3;
}
.hGeneral {
  font-size: 18px;
  text-align: center;
  font: bold;
  background: #e9e9e9;
}
</style>
