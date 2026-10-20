<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import axios from "@/api/http";
import moment from "moment";
import { useIngresosStore } from "@/stores/ingresos";
import { useSubingresoStore } from "@/stores/subingreso";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { sessionBranchId } from "@/utils/sesion";
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
const pricingStore = usePricingStore();
const enterprisesStore = useEnterprisesStore();
const subingresoStore = useSubingresoStore();
const ingresosStore = useIngresosStore();
const clientes = computed(() => appStore.clientes);
const frmComentario = useTemplateRef("frmComentario");

const moneda = ref("");
const offcanvas = ref(false);
const proveedorOp = ref<number[] | string>("");
const llegadaOp = ref("");
const fechaOp = ref("");
const exportandopdf = ref(false);
const nro_expediente = ref("");
const ingreso = ref<number[] | string>("");
const subingreso = ref<number[] | string>("");
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
    title: "NO LLLEGADAS",
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
async function exportarPDF() {
  Swal.fire({
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
          `exportarPDFCXC?id_branch=${
            sessionBranchId()
          }&id_proveedor=${
            proveedorOp.value ? proveedorOp.value : ""
          }&llegada=${llegadaOp.value ? llegadaOp.value : ""}&desde=&hasta=${
            fechaOp.value ? fechaOp.value : ""
          }&nro_expediente=${
            nro_expediente.value ? nro_expediente.value : ""
          }&tipo_reporte=${
            tipoReportePDF ? tipoReportePDF : ""
          }&id_ingreso=${ingreso.value ? ingreso.value : ""}&id_subingreso=${
            subingreso.value ? subingreso.value : ""
          }`,
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
          link.setAttribute("download", `Reporte CxC - ${Date.now()}.pdf`);
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
async function _getDebsToPay() {
  appStore.spiner = true;
  dataList.value = false;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `getReporteCXC?id_branch=${
        sessionBranchId()
      }&id_cliente=${
        filtroOp.value.proveedorOp ? filtroOp.value.proveedorOp : ""
      }&llegadaflag=${
        filtroOp.value.llegadaOp ? filtroOp.value.llegadaOp : ""
      }&fechahasta=${
        filtroOp.value.fechaOp ? filtroOp.value.fechaOp : ""
      }&nro_expediente=${nro_expediente.value}`,
    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsCpp.value = response.data.data ? response.data.data : [];
      dataList.value = true;
      calcularTotalOperativo({
        data: response.data.data ? response.data.data : [],
      });
    })
    .catch(function (error) {
      console.error(error);
    });
  appStore.spiner = false;
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
    url: import.meta.env.VITE_URL_MAIN + "getReportAccountsFilter",

    headers: {

      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      itemsCpp.value = response.data.data;
      dataList.value = true;
      //
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getInvoiceAdminCxCAdmin() {
  appStore.spiner = true;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `getReporteCXCAdmin?id_branch=${
        sessionBranchId()
      }&id_cliente=${
        filtroOp.value.proveedorOp ? filtroOp.value.proveedorOp : ""
      }&llegadaflag=${
        filtroOp.value.llegadaOp ? filtroOp.value.llegadaOp : ""
      }&fechahasta=${
        filtroOp.value.fechaOp ? filtroOp.value.fechaOp : ""
      }&nro_expediente=${nro_expediente.value}&id_ingreso=${
        ingreso.value ? ingreso.value : ""
      }&id_subingreso=${subingreso.value ? subingreso.value : ""}`,

    headers: {

      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      //vm.dialogListInvoince = true;

      itemsCxcAdmin.value = response.data.data;
      setTimeout(() => {
        calcularTotalAdministrativo({ data: response.data.data });
      }, 100);
    })
    .catch(function (error) {
      console.error(error);
    });
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
  offcanvas.value = false;
}
async function limpiar() {
  filtroOp.value = {
    proveedorOp: "",
    llegadaOp: "",
    fechaOp: "",
  };
  await _getDebsToPay();
  await _getInvoiceAdminCxCAdmin();
  proveedorOp.value = "";
  llegadaOp.value = "";
  fechaOp.value = "";
  offcanvas.value = false;
}
function calcularTotalAdministrativo({ data }: { data: ClienteCxcAdmin[] }) {
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
          totalMontoDolares += parseFloat(element2.total_pagar);
          IgvDolares += parseFloat(element2.igv);
          totalDolares +=
            parseFloat(element2.total_pagar) + parseFloat(element2.igv);
        } else {
          totalMontoSoles += parseFloat(element2.total_pagar);
          IgvSoles += parseFloat(element2.igv);
          totalSoles +=
            parseFloat(element2.total_pagar) + parseFloat(element2.igv);
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
    }
  );
  appStore.spiner = false;
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
  const url = item.url_documento;
  axios({
    url,
    method: "GET",
    responseType: "blob",
  })
    .then((response) => {
      const urlArchivo = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = urlArchivo;
      link.setAttribute(
        "download",
        `FACTURA Nro - ${item.nro_factura}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => {
      console.error("Error al descargar el archivo:", error);
    });
}
async function exportar() {
  exportando.value = true;
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `reportcxcexcel?id_branch=${
        sessionBranchId()
      }&id_cliente=${
        filtroOp.value.proveedorOp ? filtroOp.value.proveedorOp : ""
      }&llegadaflag=${
        filtroOp.value.llegadaOp ? filtroOp.value.llegadaOp : ""
      }&fechahasta=${
        filtroOp.value.fechaOp ? filtroOp.value.fechaOp : ""
      }&nro_expediente=${nro_expediente.value}&nombre_impuesto=${
        enterprisesStore.impuesto.nombre_impuesto
      }&moneda=${moneda.value}&id_ingreso=${
        ingreso.value ? ingreso.value : ""
      }&id_subingreso=${subingreso.value ? subingreso.value : ""}`,

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
      link.setAttribute(
        "download",
        `Reporte Cuentas por Cobrar ${moment().format(
          "DD-MM-YYYY hh:mm:ss"
        )}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
    })
    .catch(function (error) {
      console.error(error);
    });

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

  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `listarComentariosCXC?id_cliente=${dataCXC.value.id_consigner}`,
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

        if (dataCXC.value.esoperativo) {
          lstComentarios.value = comentarios.filter((v: RegistroComentario) => !!v.esoperativo);
        } else if (dataCXC.value.esadministrativo) {
          lstComentarios.value = comentarios.filter(
            (v: RegistroComentario) => !!v.esadministrativo
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
      url: import.meta.env.VITE_URL_MAIN + `insertarComentarioCXC`,
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

onMounted(async () => {
  moneda.value = JSON.parse(
    sessionStorage.getItem("dataBranch") as string
  )[0].moneda[0].acronym;
  // console.log(moneda);
  await pricingStore.getModulesEntities();
  await _getDebsToPay();
  await _getInvoiceAdminCxCAdmin();
  await enterprisesStore.obtenerImpuestoXEmpresa();
  appStore.drawer = false;
  await appStore.cargarClientes();
  await ingresosStore.cargarIngreso();
  await subingresoStore.GetListSubIngreso();
});
</script>

<template>
  <div>
    <v-card elevation="0">
      <v-card-title class="d-flex align-center flex-wrap">
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
          :headers="headersdbp"
          :items="itemsCpp"
          :search="search"
          v-model:expanded="expanded"
          item-value="id_consigner"
          show-expand
          expand-on-click
        >
          <template #[`item.nameconsigner`]="{ item }">
            <div class="d-flex">
              <div>{{ item.nameconsigner }}</div>
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
                      <td>
                        {{ child.nro_master }}
                        <v-icon
                          v-if="child.operativa == 1"
                          @click="editControl(child)"
                        >
                          mdi-eye
                        </v-icon>
                      </td>
                      <td>
                        {{ child.nameconsigner }}
                      </td>
                      <td>
                        {{ child.fecha_disponibilidad }}
                      </td>
                      <td>{{ child.symbol }} {{ child.total_pagar }}</td>

                      <td>
                        {{ child.llegada == 1 ? "LLEGADA" : "NO LLEGADA" }}
                      </td>
                      <td>{{ child.fechadevencimiento }}</td>
                      <td>{{ child.diasatraso }}</td>
                      <td>{{ child.estatus }}</td>
                    </tr>
                  </tbody>
                </v-table>
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
          :search="search"
          v-model:expanded="expandeda"
          item-value="nameconsigner"
          return-object
          show-expand
          @click:row="(event: Event, { item }: { item: ClienteCxcAdmin }) => clickRowa(item, event)"
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
                      <td>{{ child.nameconsigner }}</td>
                      <td>{{ child.concepto }}</td>
                      <td>{{ child.symbol }} {{ child.monto }}</td>

                      <td>{{ child.symbol }} {{ child.total_pagar }}</td>
                    </tr>
                  </tbody>
                </v-table>
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
      width="70%"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Estados/Comentarios de la CxC - {{ dataCXC.nameconsigner }}
          <v-spacer />
          <template v-if="dataCXC.esoperativo">
            <v-btn
              rounded
              size="small"
              color="primary"
              @click="agregarComentarioOp"
            >
              Nuevo Comentario
            </v-btn>
          </template>
          <template v-else-if="dataCXC.esadministrativo">
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
              <!-- @vue-expect-error the model starts as an empty string -->
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
              <!-- @vue-expect-error the model starts as an empty string -->
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
              <!-- @vue-expect-error the model starts as an empty string -->
              <v-autocomplete
                clearable
                v-model="subingreso"
                label="Sub Ingresos"
                :items="subingresoStore.lstSubIngreso"
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
