<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import moment from "moment";
import ProgressBar from "@/components/comun/ProgressBar.vue";
import TableDinamica from "@/components/comun/TableDinamica.vue";
import FlujoPrePostComponet from "@/components/comun/TablaDinamicaFlujoPrePostMes.vue";
import { useBalancesStore } from "@/stores/balances";
import { useEntitiesStore } from "@/stores/entities";
import { useProyeccionesStore } from "@/stores/proyecciones";
import type { CabeceraBalance, FilaBalance, MesBalance, ValorCelda } from "@/types/estadoGanancias";
import type { FiltroDetalleGanancia, FiltroDetalleGastos, TipoBalance } from "@/types/finanzas";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const router = useRouter();
const balancesStore = useBalancesStore();
const proyeccionesStore = useProyeccionesStore();
const entitiesStore = useEntitiesStore();
const frmCompare = useTemplateRef("frmCompare");

const tab = ref("");
const filtar = ref(false);
const dialogComparar = ref(false);
const id_month = ref(moment().format("MM"));
const tipofiltro = ref<number | null>(null);
const tipoingreso = ref<string | number>("");
const tiposubingreso = ref<string | number>("");
const nro_expediente = ref<string | number>("");
const tipogastos = ref<string | number>("");
const tiposubgastos = ref<string | number>("");
const proveedor = ref<string | number>("");
const monto = ref<string | number>("");
const tiposubingresoFilter = ref<TipoBalance[]>([]);
const tiposubgastosFilter = ref<TipoBalance[]>([]);
const dialog = ref(false);
const progress = ref(0);
const years = ref<number[]>([]);
const siAplicaFlag = ref(false);
let headersDetailsGananciaFiltro = undefined as unknown as CabeceraBalance[];
let headersDetailsGastosFiltro = undefined as unknown as CabeceraBalance[];
const months: MesBalance[] = [
  { text: "ENERO", value: "01" },
  { text: "FEBRERO", value: "02" },
  { text: "MARZO", value: "03" },
  { text: "ABRIL", value: "04" },
  { text: "MAYO", value: "05" },
  { text: "JUNIO", value: "06" },
  { text: "JULIO", value: "07" },
  { text: "AGOSTO", value: "08" },
  { text: "SEPTIEMBRE", value: "09" },
  { text: "OCTUBRE", value: "10" },
  { text: "NOVIEMBRE", value: "11" },
  { text: "DICIEMBRE", value: "12" },
];
const year = ref(new Date().getFullYear());
const month = ref<string[]>([]);
const itemsGanancia = ref<FilaBalance[]>([]);
const itemsGastos = ref<FilaBalance[]>([]);
const itemsResumen = ref<FilaBalance[]>([]);
const itemsResumenGastoxTipoGasto = ref<FilaBalance[]>([]);
const itemsResumenGananciaxTipoIngreso = ref<FilaBalance[]>([]);
const itemsGananciaFiltro = ref<FilaBalance[]>([]);
const itemsGastosFiltro = ref<FilaBalance[]>([]);
const headersDetailsGanancia = ref<CabeceraBalance[]>([
  { title: "Expediente", key: "exp", headerProps: { class: "header" }, sortable: false },
  {
    title: "Cliente / Cant. House",
    key: "cliente",
    headerProps: { class: "header" },
    sortable: false,
  },
]);
const headersDetailsGastos = ref<CabeceraBalance[]>([
  {
    title: "Gastos",
    key: "gasto_description",
    headerProps: { class: "header" },
    sortable: false,
  },
  {
    title: "SubGasto",
    key: "subgasto_description",
    headerProps: { class: "header" },
    sortable: false,
  },
  {
    title: "Proveedor",
    key: "proveedor",
    headerProps: { class: "header" },
    sortable: false,
  },
  {
    title: "Concepto",
    key: "concepto",
    headerProps: { class: "header" },
    sortable: false,
  },
]);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toggleExpand(tipo: number) {
  switch (tipo) {
    case 1:
      siAplicaFlag.value = !siAplicaFlag.value;
      break;

    default:
      break;
  }
}
function obtenerAnios() {
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= 2010; i--) {
    years.value.push(i);
  }
}
async function ListBalanaceGanancia() {
  if (month.value.length == 0) {
    month.value = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];
  }
  const meses = month.value.join();
  const data = {
    year: year.value,
    month: meses,
    tipoingreso: "",
    tiposubingreso: "",
    nro_expediente: "",
    monto: "",
    tipogastos: "",
    tiposubgastos: "",
    proveedor: "",
  };

  dialog.value = true;
  itemsGanancia.value = [];
  itemsResumen.value = [];
  itemsGastos.value = [];
  headersDetailsGanancia.value = [
    { title: "Expediente", key: "exp", headerProps: { class: "header" }, sortable: false },
    {
      title: "Cliente / Cant. House",
      key: "cliente",
      headerProps: { class: "header" },
      sortable: false,
    },
  ];
  headersDetailsGastos.value = [
    {
      title: "Gastos",
      key: "gasto_description",
      headerProps: { class: "header" },
      sortable: false,
    },
    {
      title: "SubGasto",
      key: "subgasto_description",
      headerProps: { class: "header" },
      sortable: false,
    },
    {
      title: "Proveedor",
      key: "proveedor",
      headerProps: { class: "header" },
      sortable: false,
    },
    {
      title: "Concepto",
      key: "concepto",
      headerProps: { class: "header" },
      sortable: false,
    },
  ];
  //
  generarCabeceras();
  await balancesStore.getResumenBalanaceGanancia(data);
  progress.value = 15;
  await balancesStore.getListBalanaceGanancia(data);
  progress.value = 30;
  await balancesStore.getListBalanaceGastos(data);
  progress.value = 45;
  await balancesStore.getResumenBalanaceGastos(data);
  progress.value = 60;
  await balancesStore.resumenIngresoTipoIngreso(data);
  progress.value = 75;
  await balancesStore.getResumenGastosxTipoGasto(data);
  progress.value = 90;

  await balancesStore.getFlujoPrePostMes(data);

  // vm.flujopreproflag = true;

  progress.value = 100;
  generarGananciaDetalles();
  generarGastosDetalles();
  generarBalanceGanancia();
  generarBalanceGastos();
  generarBalanceTotales();
  geneararGastosTipoGasto();
  geneararGastosTipoIngreso();
  tab.value = "resumen";
  setTimeout(() => {
    dialog.value = false;
    progress.value = 0;
  }, 1000);
}
function generarBalanceGanancia() {
  const resumen: FilaBalance = {};
  resumen.description = " Ganancia Operativa + Capacitaciones";
  balancesStore.resumenGanancia.forEach((element) => {
    switch (element.mes) {
      case "01":
        resumen.enero = element.monto;
        break;
      case "02":
        resumen.febrero = element.monto;
        break;
      case "03":
        resumen.marzo = element.monto;
        break;
      case "04":
        resumen.abril = element.monto;
        break;
      case "05":
        resumen.mayo = element.monto;
        break;
      case "06":
        resumen.junio = element.monto;
        break;
      case "07":
        resumen.julio = element.monto;
        break;
      case "08":
        resumen.agosto = element.monto;
        break;
      case "09":
        resumen.septiembre = element.monto;
        break;
      case "10":
        resumen.octubre = element.monto;
        break;
      case "11":
        resumen.noviembre = element.monto;
        break;
      case "12":
        resumen.diciembre = element.monto;
        break;

      default:
        break;
    }
  });

  itemsResumen.value.push(resumen);
}
function generarBalanceGastos() {
  const resumen: FilaBalance = {};
  resumen.description = "Gastos Administrativos";
  balancesStore.resumenGastos.forEach((element) => {
    switch (element.mes) {
      case "01":
        resumen.enero = element.monto;
        break;
      case "02":
        resumen.febrero = element.monto;
        break;
      case "03":
        resumen.marzo = element.monto;
        break;
      case "04":
        resumen.abril = element.monto;
        break;
      case "05":
        resumen.mayo = element.monto;
        break;
      case "06":
        resumen.junio = element.monto;
        break;
      case "07":
        resumen.julio = element.monto;
        break;
      case "08":
        resumen.agosto = element.monto;
        break;
      case "09":
        resumen.septiembre = element.monto;
        break;
      case "10":
        resumen.octubre = element.monto;
        break;
      case "11":
        resumen.noviembre = element.monto;
        break;
      case "12":
        resumen.diciembre = element.monto;
        break;

      default:
        break;
    }
  });

  itemsResumen.value.push(resumen);
}
function generarBalanceTotales() {
  const ganancias = itemsResumen.value[0]!;
  const perdidas = itemsResumen.value[1]!;
  const totalPorMes: FilaBalance = {};

  for (const mes in ganancias) {
    if (ganancias.hasOwnProperty(mes)) {
      // Verificar que el mes también esté en el objeto de pérdidas
      if (!perdidas.hasOwnProperty(mes)) {
        throw new Error(`No se encontró el mes '${mes}' en las pérdidas`);
      }

      // Convertir los valores de ganancia y pérdida a números
      const ganancia = parseFloat(ganancias[mes] as string);
      const perdida = parseFloat(perdidas[mes] as string);

      // Calcular el total por mes restando la pérdida de la ganancia
      const total = ganancia - perdida;

      // Almacenar el total en el objeto totalPorMes
      totalPorMes[mes] = parseFloat(String(total)).toFixed(2);
    }
  }
  totalPorMes.description = "Utilidad";
  itemsResumen.value.push(totalPorMes);
}
function generarGananciaDetalles() {
  const montosPorMes: FilaBalance = {};
  let mes: string | undefined;
  montosPorMes.exp = "TOTALES";

  for (
    let i = 0;
    i < balancesStore.listaGanancia.length;
    i++
  ) {
    const elemento = balancesStore.listaGanancia[i]!;

    switch (elemento.mes) {
      case "01":
        mes = "enero";
        break;
      case "02":
        mes = "febrero";
        break;
      case "03":
        mes = "marzo";
        break;
      case "04":
        mes = "abril";
        break;
      case "05":
        mes = "mayo";
        break;
      case "06":
        mes = "junio";
        break;
      case "07":
        mes = "julio";
        break;
      case "08":
        mes = "agosto";
        break;
      case "09":
        mes = "septiembre";
        break;
      case "10":
        mes = "octubre";
        break;
      case "11":
        mes = "noviembre";
        break;
      case "12":
        mes = "diciembre";
        break;

      default:
        break;
    }
    const ganancia = parseFloat(elemento.ganancia as string).toFixed(2);
    if (montosPorMes.hasOwnProperty(mes as string)) {
      montosPorMes[mes as string] = parseFloat(
        String(
          parseFloat(
            String(
              parseFloat((montosPorMes[mes as string] ? montosPorMes[mes as string] : 0) as string) +
                parseFloat(ganancia)
            )
          )
        )
      ).toFixed(2);
    } else {
      montosPorMes[mes as string] = parseFloat(
        parseFloat(ganancia).toFixed(2)
      ).toFixed(2);
    }
  }

  itemsGanancia.value.push(montosPorMes);

  //   -------------------------------
  balancesStore.listaGanancia.forEach((element) => {
    switch (element.mes) {
      case "01":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          enero: element.ganancia ? element.ganancia : 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "02":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          febrero: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "03":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          marzo: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "04":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          abril: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "05":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          mayo: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "06":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          junio: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "07":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          julio: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "08":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          agosto: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,

          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "09":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          septiembre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,

          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "10":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          octubre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,

          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "11":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          noviembre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,

          diciembre: 0.0,
        });
        break;
      case "12":
        itemsGanancia.value.push({
          exp: element.nro_master,
          cliente: element.cliente,
          diciembre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;

      default:
        break;
    }
  });
}
function generarGastosDetalles() {
  const montosPorMes: FilaBalance = {};
  montosPorMes.exp = "DETALLE DE GASTOS OPERATIVA";
  let mes = "";
  for (let i = 0; i < balancesStore.listaGastos.length; i++) {
    const elemento = balancesStore.listaGastos[i]!;

    switch (elemento.mes) {
      case "01":
        mes = "enero";
        break;
      case "02":
        mes = "febrero";
        break;
      case "03":
        mes = "marzo";
        break;
      case "04":
        mes = "abril";
        break;
      case "05":
        mes = "mayo";
        break;
      case "06":
        mes = "junio";
        break;
      case "07":
        mes = "julio";
        break;
      case "08":
        mes = "agosto";
        break;
      case "09":
        mes = "septiembre";
        break;
      case "10":
        mes = "octubre";
        break;
      case "11":
        mes = "noviembre";
        break;
      case "12":
        mes = "diciembre";
        break;

      default:
        break;
    }
    const monto = parseFloat(elemento.monto as string).toFixed(2);
    if (montosPorMes.hasOwnProperty(mes)) {
      montosPorMes[mes] = parseFloat(
        parseFloat(
          String(
            parseFloat((montosPorMes[mes] ? montosPorMes[mes] : 0) as string) +
              parseFloat(monto)
          )
        ).toFixed(2)
      );
    } else {
      montosPorMes[mes] = parseFloat(monto).toFixed(2);
    }
  }
  montosPorMes.gasto_description = "TOTALES";

  itemsGastos.value.push(montosPorMes);

  //   -------------------------------
  balancesStore.listaGastos.forEach((element) => {
    switch (element.mes) {
      case "01":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          enero: element.monto ? element.monto : 0,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          diciembre: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "02":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          febrero: element.monto,
          enero: 0.0,
          diciembre: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "03":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          marzo: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          diciembre: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "04":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          abril: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          diciembre: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "05":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          mayo: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          diciembre: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "06":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          junio: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          diciembre: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "07":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          julio: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          diciembre: 0.0,

          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "08":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          agosto: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          diciembre: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "09":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          septiembre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          diciembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "10":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          octubre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          diciembre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "11":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          noviembre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "12":
        itemsGastos.value.push({
          proveedor: element.proveedor,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          diciembre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;

      default:
        break;
    }
  });
}
function geneararGastosTipoIngreso() {
  const ingreso = balancesStore.resumenTipoIngreso;

  const ingresoDetalle: FilaBalance[] = [];
  let data = {
    tipo_ingreso: null,
    enero: 0,
    febrero: 0,
    marzo: 0,
    abril: 0,
    mayo: 0,
    junio: 0,
    julio: 0,
    agosto: 0,
    septiembre: 0,
    octubre: 0,
    noviembre: 0,
    diciembre: 0,
  } as unknown as FilaBalance[];

  ingreso.forEach((element) => {
    data = ingresoDetalle.filter(
      (v) =>
        v.tipo_ingreso == element.tipo_ingreso && v.aplica == element.aplica
    );

    if (data.length > 0) {
      switch (element.mes) {
        case "01":
          data[0]!.enero = element.monto;
          break;
        case "02":
          data[0]!.febrero = element.monto;
          break;
        case "03":
          data[0]!.marzo = element.monto;
          break;
        case "04":
          data[0]!.abril = element.monto;
          break;
        case "05":
          data[0]!.mayo = element.monto;
          break;
        case "06":
          data[0]!.junio = element.monto;
          break;
        case "07":
          data[0]!.julio = element.monto;
          break;
        case "08":
          data[0]!.agosto = element.monto;
          break;
        case "09":
          data[0]!.septiembre = element.monto;
          break;
        case "10":
          data[0]!.octubre = element.monto;
          break;
        case "11":
          data[0]!.noviembre = element.monto;
          break;
        case "12":
          data[0]!.diciembre = element.monto;
          break;

        default:
          break;
      }
    } else {
      const fila = data as unknown as FilaBalance;
      fila.tipo_ingreso = element.tipo_ingreso;
      fila.aplica = element.aplica;
      switch (element.mes) {
        case "01":
          fila.enero = element.monto;
          break;
        case "02":
          fila.febrero = element.monto;
          break;
        case "03":
          fila.marzo = element.monto;
          break;
        case "04":
          fila.abril = element.monto;
          break;
        case "05":
          fila.mayo = element.monto;
          break;
        case "06":
          fila.junio = element.monto;
          break;
        case "07":
          fila.julio = element.monto;
          break;
        case "08":
          fila.agosto = element.monto;
          break;
        case "09":
          fila.septiembre = element.monto;
          break;
        case "10":
          fila.octubre = element.monto;
          break;
        case "11":
          fila.noviembre = element.monto;
          break;
        case "12":
          fila.diciembre = element.monto;
          break;

        default:
          break;
      }

      ingresoDetalle.push(fila);
    }
  });

  itemsResumenGananciaxTipoIngreso.value = ingresoDetalle;
}
function geneararGastosTipoGasto() {
  const gastosDetalle: FilaBalance[] = [];
  let data = {
    gasto_code: null,
    gasto_description: null,
    enero: 0,
    febrero: 0,
    marzo: 0,
    abril: 0,
    mayo: 0,
    junio: 0,
    julio: 0,
    agosto: 0,
    septiembre: 0,
    octubre: 0,
    noviembre: 0,
    diciembre: 0,
  } as unknown as FilaBalance[];
  const gastos = balancesStore.resumenTipoGasto;

  gastos.forEach((element) => {
    data = gastosDetalle.filter(
      (v) =>
        v.gasto_code == element.gasto_code && v.aplica == element.aplica
    );
    if (data.length > 0) {
      switch (element.mes) {
        case "01":
          data[0]!.enero = element.monto;
          break;
        case "02":
          data[0]!.febrero = element.monto;
          break;
        case "03":
          data[0]!.marzo = element.monto;
          break;
        case "04":
          data[0]!.abril = element.monto;
          break;
        case "05":
          data[0]!.mayo = element.monto;
          break;
        case "06":
          data[0]!.junio = element.monto;
          break;
        case "07":
          data[0]!.julio = element.monto;
          break;
        case "08":
          data[0]!.agosto = element.monto;
          break;
        case "09":
          data[0]!.septiembre = element.monto;
          break;
        case "10":
          data[0]!.octubre = element.monto;
          break;
        case "11":
          data[0]!.noviembre = element.monto;
          break;
        case "12":
          data[0]!.diciembre = element.monto;
          break;

        default:
          break;
      }
    } else {
      const fila = data as unknown as FilaBalance;
      fila.gasto_code = element.gasto_code;
      fila.gasto_description = element.gasto_description;
      fila.aplica = element.aplica;
      switch (element.mes) {
        case "01":
          fila.enero = element.monto;
          break;
        case "02":
          fila.febrero = element.monto;
          break;
        case "03":
          fila.marzo = element.monto;
          break;
        case "04":
          fila.abril = element.monto;
          break;
        case "05":
          fila.mayo = element.monto;
          break;
        case "06":
          fila.junio = element.monto;
          break;
        case "07":
          fila.julio = element.monto;
          break;
        case "08":
          fila.agosto = element.monto;
          break;
        case "09":
          fila.septiembre = element.monto;
          break;
        case "10":
          fila.octubre = element.monto;
          break;
        case "11":
          fila.noviembre = element.monto;
          break;
        case "12":
          fila.diciembre = element.monto;
          break;

        default:
          break;
      }
      gastosDetalle.push(fila);
    }
  });
  itemsResumenGastoxTipoGasto.value = gastosDetalle;
}
function generarCabeceras() {
  if (month.value.includes("01")) {
    headersDetailsGanancia.value.push({
      title: "Enero",
      key: "enero",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Enero",
      key: "enero",
      sortable: false,
    });
  }
  if (month.value.includes("02")) {
    headersDetailsGanancia.value.push({
      title: "Febrero",
      key: "febrero",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Febrero",
      key: "febrero",
      sortable: false,
    });
  }
  if (month.value.includes("03")) {
    headersDetailsGanancia.value.push({
      title: "Marzo",
      key: "marzo",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Marzo",
      key: "marzo",
      sortable: false,
    });
  }
  if (month.value.includes("04")) {
    headersDetailsGanancia.value.push({
      title: "Abril",
      key: "abril",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Abril",
      key: "abril",
      sortable: false,
    });
  }
  if (month.value.includes("05")) {
    headersDetailsGanancia.value.push({
      title: "Mayo",
      key: "mayo",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Mayo",
      key: "mayo",
      sortable: false,
    });
  }
  if (month.value.includes("06")) {
    headersDetailsGanancia.value.push({
      title: "Junio",
      key: "junio",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Junio",
      key: "junio",
      sortable: false,
    });
  }
  if (month.value.includes("07")) {
    headersDetailsGanancia.value.push({
      title: "Julio",
      key: "julio",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Julio",
      key: "julio",
      sortable: false,
    });
  }
  if (month.value.includes("08")) {
    headersDetailsGanancia.value.push({
      title: "Agosto",
      key: "agosto",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Agosto",
      key: "agosto",
      sortable: false,
    });
  }
  if (month.value.includes("09")) {
    headersDetailsGanancia.value.push({
      title: "Septiembre",
      key: "septiembre",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Septiembre",
      key: "septiembre",
      sortable: false,
    });
  }
  if (month.value.includes("10")) {
    headersDetailsGanancia.value.push({
      title: "Octubre",
      key: "octubre",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Octubre",
      key: "octubre",
      sortable: false,
    });
  }
  if (month.value.includes("11")) {
    headersDetailsGanancia.value.push({
      title: "Noviembre",
      key: "noviembre",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Noviembre",
      key: "noviembre",
      sortable: false,
    });
  }
  if (month.value.includes("12")) {
    headersDetailsGanancia.value.push({
      title: "Diciembre",
      key: "diciembre",
      sortable: false,
    });
    headersDetailsGastos.value.push({
      title: "Diciembre",
      key: "diciembre",
      sortable: false,
    });
  }
}
function generarCabecerasFiltro() {
  if (month.value.includes("01")) {
    headersDetailsGananciaFiltro.push({
      title: "Enero",
      key: "enero",
    });
    headersDetailsGastosFiltro.push({
      title: "Enero",
      key: "enero",
    });
  }
  if (month.value.includes("02")) {
    headersDetailsGananciaFiltro.push({
      title: "Febrero",
      key: "febrero",
    });
    headersDetailsGastosFiltro.push({
      title: "Febrero",
      key: "febrero",
    });
  }
  if (month.value.includes("03")) {
    headersDetailsGananciaFiltro.push({
      title: "Marzo",
      key: "marzo",
    });
    headersDetailsGastosFiltro.push({
      title: "Marzo",
      key: "marzo",
    });
  }
  if (month.value.includes("04")) {
    headersDetailsGananciaFiltro.push({
      title: "Abril",
      key: "abril",
    });
    headersDetailsGastosFiltro.push({
      title: "Abril",
      key: "abril",
    });
  }
  if (month.value.includes("05")) {
    headersDetailsGananciaFiltro.push({
      title: "Mayo",
      key: "mayo",
    });
    headersDetailsGastosFiltro.push({
      title: "Mayo",
      key: "mayo",
    });
  }
  if (month.value.includes("06")) {
    headersDetailsGananciaFiltro.push({
      title: "Junio",
      key: "junio",
    });
    headersDetailsGastosFiltro.push({
      title: "Junio",
      key: "junio",
    });
  }
  if (month.value.includes("07")) {
    headersDetailsGananciaFiltro.push({
      title: "Julio",
      key: "julio",
    });
    headersDetailsGastosFiltro.push({
      title: "Julio",
      key: "julio",
    });
  }
  if (month.value.includes("08")) {
    headersDetailsGananciaFiltro.push({
      title: "Agosto",
      key: "agosto",
    });
    headersDetailsGastosFiltro.push({
      title: "Agosto",
      key: "agosto",
    });
  }
  if (month.value.includes("09")) {
    headersDetailsGananciaFiltro.push({
      title: "Septiembre",
      key: "septiembre",
    });
    headersDetailsGastosFiltro.push({
      title: "Septiembre",
      key: "septiembre",
    });
  }
  if (month.value.includes("10")) {
    headersDetailsGananciaFiltro.push({
      title: "Octubre",
      key: "octubre",
    });
    headersDetailsGastosFiltro.push({
      title: "Octubre",
      key: "octubre",
    });
  }
  if (month.value.includes("11")) {
    headersDetailsGananciaFiltro.push({
      title: "Noviembre",
      key: "noviembre",
    });
    headersDetailsGastosFiltro.push({
      title: "Noviembre",
      key: "noviembre",
    });
  }
  if (month.value.includes("12")) {
    headersDetailsGananciaFiltro.push({
      title: "Diciembre",
      key: "diciembre",
    });
    headersDetailsGastosFiltro.push({
      title: "Diciembre",
      key: "diciembre",
    });
  }
}
async function exportar() {
  rootStore.state.spiner = true;
  await balancesStore.exportarBalanceGanancia({ year: year.value, month: month.value as unknown as string });
  rootStore.state.spiner = false;
}
function filtarSubIngreso() {
  if (!!tipoingreso.value) {
    tiposubingresoFilter.value =
      balancesStore.tiposubingreso.filter(
        (v) => v.id_ingreso == tipoingreso.value
      );
  } else {
    tiposubingresoFilter.value = balancesStore.tiposubingreso;
  }
}
function filtarSubGasto() {
  if (!!tipogastos.value) {
    tiposubgastosFilter.value =
      balancesStore.tiposubgastos.filter(
        (v) => v.id_gasto == tipogastos.value
      );
  } else {
    tiposubgastosFilter.value = balancesStore.tiposubgastos;
  }
}
async function filtrar() {
  dialog.value = true;
  if (month.value.length == 0) {
    month.value = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];
  }
  let data = {};
  const meses = month.value.join();
  headersDetailsGananciaFiltro = [
    { title: "Editar", key: "editar", headerProps: { class: "header" } },
    { title: "Expediente", key: "exp", headerProps: { class: "header" } },
    {
      title: "Cliente / Cant. House",
      key: "cliente",
      headerProps: { class: "header" },
    },
  ];
  progress.value = 10;
  headersDetailsGastosFiltro = [
    { title: "Editar", key: "editar", headerProps: { class: "header" } },
    {
      title: "Gastos",
      key: "gasto_description",
      headerProps: { class: "header" },
    },
    {
      title: "SubGasto",
      key: "subgasto_description",
      headerProps: { class: "header" },
    },
    {
      title: "Proveedor",
      key: "proveedor",
      headerProps: { class: "header" },
    },
    {
      title: "Concepto",
      key: "concepto",
      headerProps: { class: "header" },
    },
  ];
  progress.value = 20;
  generarCabecerasFiltro();
  progress.value = 30;
  switch (tipofiltro.value) {
    case 1:
      data = {
        year: year.value,
        month: meses,
        tipoingreso: tipoingreso.value === 0 ? "0" : tipoingreso.value || "",
        tiposubingreso:
          tiposubingreso.value === 0 ? "0" : tiposubingreso.value || "",
        nro_expediente:
          nro_expediente.value === 0 ? "0" : nro_expediente.value || "",
        monto: monto.value === 0 ? "0" : monto.value || "",
      };

      progress.value = 40;
      await balancesStore.getListBalanaceGananciaFiltro(data as FiltroDetalleGanancia);
      progress.value = 70;
      generarGananciaDetallesFiltro();

      break;
    case 2:
      data = {
        year: year.value,
        month: meses,
        tipogastos: tipogastos.value === 0 ? "0" : tipogastos.value || "",
        tiposubgastos:
          tiposubgastos.value === 0 ? "0" : tiposubgastos.value || "",
        proveedor: proveedor.value === 0 ? "0" : proveedor.value || "",
        monto: monto.value === 0 ? "0" : monto.value || "",
      };
      progress.value = 40;
      await balancesStore.getListBalanaceGastosFiltro(data as FiltroDetalleGastos);
      progress.value = 70;
      generarGastosDetallesFiltro();

      break;

    default:
      break;
  }
  filtar.value = false;
  progress.value = 100;
  setTimeout(() => {
    tab.value = "filtro";
    dialog.value = false;
  }, 1000);
}
function generarGananciaDetallesFiltro() {
  itemsGananciaFiltro.value = [];
  //   -------------------------------
  balancesStore.listaGananciaFiltro.forEach((element) => {
    switch (element.mes) {
      case "01":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          editarflag: element.editarflag,
          isoperativo: element.isoperativo,
          id: element.id,
          cliente: element.cliente,
          enero: element.ganancia ? element.ganancia : 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "02":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          febrero: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "03":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          marzo: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "04":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          abril: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "05":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          mayo: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "06":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          junio: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "07":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          julio: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "08":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          agosto: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,

          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "09":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          septiembre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,

          octubre: 0.0,
          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "10":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          octubre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,

          noviembre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "11":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          noviembre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,

          diciembre: 0.0,
        });
        break;
      case "12":
        itemsGananciaFiltro.value.push({
          exp: element.nro_master,
          isoperativo: element.isoperativo,
          editarflag: element.editarflag,
          id: element.id,
          cliente: element.cliente,
          diciembre: element.ganancia ? element.ganancia : 0.0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;

      default:
        break;
    }
  });
}
function generarGastosDetallesFiltro() {
  itemsGastosFiltro.value = [];
  balancesStore.listaGastosFiltro.forEach((element) => {
    switch (element.mes) {
      case "01":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          editarflag: element.editarflag,
          enero: element.monto ? element.monto : 0,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          diciembre: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "02":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          febrero: element.monto,
          enero: 0.0,
          diciembre: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "03":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          marzo: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          diciembre: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "04":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          abril: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          diciembre: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "05":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          mayo: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          diciembre: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "06":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          junio: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          diciembre: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "07":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          julio: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          diciembre: 0.0,

          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "08":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          agosto: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          diciembre: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "09":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          septiembre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          diciembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "10":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          octubre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          diciembre: 0.0,
          noviembre: 0.0,
        });
        break;
      case "11":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          noviembre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          diciembre: 0.0,
        });
        break;
      case "12":
        itemsGastosFiltro.value.push({
          proveedor: element.proveedor,
          id: element.id,
          concepto: element.concepto,
          gasto_description: element.gasto_description,
          subgasto_description: element.subgasto_description,
          editarflag: element.editarflag,
          diciembre: element.monto ? element.monto : 0,
          enero: 0.0,
          febrero: 0.0,
          marzo: 0.0,
          abril: 0.0,
          mayo: 0.0,
          junio: 0.0,
          julio: 0.0,
          agosto: 0.0,
          septiembre: 0.0,
          octubre: 0.0,
          noviembre: 0.0,
        });
        break;

      default:
        break;
    }
  });
}
function redirectEditarGanancia(id: ValorCelda, isoperativo: ValorCelda) {
  if (isoperativo) {
    const ruta = router.resolve({
      name: "editControlGasto",
      params: {
        code_master: id as string,
        id_branch: sessionBranchId(),
      },
    });

    window.open(ruta.href, "_blank");
  } else {
    const ruta = router.resolve({
      name: "EditAccountPaysCxC",
      params: { id: id as string },
    });

    window.open(ruta.href, "_blank");
  }
}
function redirectViewGanancia(id: ValorCelda, isoperativo: ValorCelda) {
  if (isoperativo) {
    const ruta = router.resolve({
      name: "editControlGasto",
      params: {
        code_master: id as string,
        id_branch: sessionBranchId(),
      },
    });

    window.open(ruta.href, "_blank");
  } else {
    const ruta = router.resolve({
      name: "viewAccountPaysCxC",
      params: { id: id as string },
    });

    window.open(ruta.href, "_blank");
  }
}
function redirectGasto(id: ValorCelda) {
  const ruta = router.resolve({
    name: "viewAccountPays",
    params: { id: id as string },
  });

  window.open(ruta.href, "_blank");
}
async function comparar() {
  if ((await frmCompare.value!.validate()).valid) {
    await balancesStore.getComparativo({
      month: id_month.value,
      year: year.value,
    });
  }
  dialogComparar.value = false;
  tab.value = "compare";
}

watch(tipoingreso, () => {
  filtarSubIngreso();
});
watch(tipogastos, () => {
  filtarSubGasto();
});
watch(month, () => {
  const { length } = month.value;
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  length == 1
    ? (id_month.value = month.value[0]!)
    : (id_month.value = moment().format("MM"));
});

onMounted(async () => {
  rootStore.state.spiner = true;
  await Promise.all([
    rootStore.dispatch("cargarProveedores"),
    balancesStore.getCargarTipoIngreso(),
    balancesStore.getCargarTipoGastos(),
    balancesStore.getCargarTipoSubIngreso(),
    balancesStore.getCargarTipoSubGastos(),
    proyeccionesStore.getProyeccionAprobada(),
    entitiesStore.CargarPersona(),
  ]);
  tiposubingresoFilter.value = balancesStore.tiposubingreso;
  tiposubgastosFilter.value = balancesStore.tiposubgastos;
  obtenerAnios();
  rootStore.state.spiner = false;
});
</script>

<template fluid>
  <v-container fluid>
    <v-dialog
      v-model="dialog"
      persistent
      width="30%"
      transition="dialog-transition"
      transparent
    >
      <v-card>
        <ProgressBar
          :progress="progress"
          height="30vh"
        />
      </v-card>
    </v-dialog>
    <!--  -->
    <v-dialog
      v-model="dialogComparar"
      persistent
      max-width="50%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          SE REALIZARÁ LA COMPARACIÓN ENTRE REPORTE DE GANANCIAS
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogComparar = !dialogComparar"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmCompare">
            <v-col>
              <v-autocomplete
                item-title="text"
                :items="months"
                v-model="id_month"
                label="MES"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
            </v-col>
            <v-col>
              <v-autocomplete
                item-title="text"
                :items="years"
                item-value="value"
                v-model="year"
                label="AÑO"
              />
            </v-col>
            <v-col>
              <v-alert
                border="start"
                border-color="deep-purple-accent-4"
                color="surface"
                elevation="2"
              >
                <p>VERSUS</p>
                PROYECCIÓN DE GASTOS
                {{ proyeccionesStore.proyeccionaprobada }}
              </v-alert>
            </v-col>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            @click="comparar"
          >
            Comparar
          </v-btn>
          <v-btn
            size="small"
            color="red"
            @click="dialogComparar = !dialogComparar"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="filtar"
      location="right"
      temporary
      width="20%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar Detalle
        </v-list-item-title>
      </v-list-item>

      <v-divider />
      <v-list
        density="compact"
        nav
      >
        <v-radio-group
          v-model="tipofiltro"
          inline
        >
          <v-radio
            label="Ingreso"
            :value="1"
          />
          <v-radio
            label="Gasto"
            color="red"
            :value="2"
          />
        </v-radio-group>
      </v-list>
      <v-divider />
      <v-list
        density="compact"
        nav
      >
        <v-row v-if="tipofiltro == 1">
          <v-col cols="12">
            <v-autocomplete
              label="Tipo de Ingreso"
              :items="balancesStore.tipoingreso"
              v-model="tipoingreso"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            />
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              label="Subtipo de Ingreso"
              :items="tiposubingresoFilter"
              v-model="tiposubingreso"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Expediente"
              v-model="nro_expediente"
              clearable
              density="compact"
              step="1"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Monto"
              v-model="monto"
              clearable
              density="compact"
              step="0.01"
            />
          </v-col>
        </v-row>
        <v-row v-if="tipofiltro == 2">
          <v-col cols="12">
            <v-autocomplete
              label="Tipo de Gasto"
              :items="balancesStore.tipogastos"
              v-model="tipogastos"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            />
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              label="Subtipo de Gasto"
              :items="tiposubgastosFilter"
              v-model="tiposubgastos"
              auto-select-first
              clearable
              density="compact"
              item-title="description"
              item-value="id"
            />
          </v-col>
          <v-col cols="12">
            <v-autocomplete
              label="Proveedor"
              :items="rootStore.state.provedores"
              v-model="proveedor"
              auto-select-first
              clearable
              density="compact"
              item-title="namelong"
              item-value="id"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Monto"
              v-model="monto"
              clearable
              density="compact"
              step="0.01"
            />
          </v-col>
        </v-row>
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn
          size="small"
          color="success"
          :disabled="!tipofiltro"
          @click="filtrar()"
        >
          Aceptar
        </v-btn>
        <v-btn
          size="small"
          color="red"
          @click="filtar = !filtar"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-navigation-drawer>
    <!--  -->
    <v-card>
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              item-title="text"
              :items="months"
              v-model="month"
              label="Mes(s)"
              auto-select-first
              chips
              multiple
              closable-chips
              density="compact"
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
          >
            <v-autocomplete
              item-title="text"
              :items="years"
              item-value="value"
              v-model="year"
              label="Año"
              density="compact"
            />
          </v-col>

          <v-spacer vertical />
          <v-col
            cols="12"
            md="4"
          >
            <v-btn
              class="mx-1"
              size="small"
              color="#0500EE"
              @click="ListBalanaceGanancia()"
            >
              Generar
            </v-btn>
            <v-btn
              class="mx-1"
              size="small"
              color="success"
              @click="exportar()"
            >
              Exportar
            </v-btn>
            <v-btn
              class="mx-1"
              size="small"
              color="#00789D"
              @click="filtar = !filtar"
            >
              Filtrar
            </v-btn>
            <v-btn
              class="mx-1"
              size="small"
              color="#FF6D00"
              @click="dialogComparar = !dialogComparar"
            >
              Comparar
            </v-btn>
          </v-col>
        </v-row>
        <v-tabs
          v-model="tab"
          align-tabs="center"
          stacked
        >
          <v-tab
            value="resumen"
            prepend-icon="mdi-all-inclusive"
            :disabled="itemsResumen.length == 0"
          >
            Resumen
          </v-tab>

          <v-tab
            value="filtro"
            prepend-icon="mdi-filter-multiple"
            :disabled="
              itemsGananciaFiltro.length == 0 && itemsGastosFiltro.length == 0
            "
          >
            Filtro
          </v-tab>
          <v-tab
            value="compare"
            prepend-icon="mdi-compare-horizontal"
            :disabled="balancesStore.comparativo.length == 0"
          >
            Comparación
          </v-tab>
        </v-tabs>
        <!--  -->
        <v-tabs-window
          v-model="tab"
          class="mt-5"
        >
          <v-tabs-window-item
            value="resumen"
            v-if="itemsResumen.length > 0"
          >
            <v-card flat>
              <v-row>
                <v-col cols="12">
                  <center><h2>Ganancia</h2></center>
                </v-col>
                <v-col cols="12">
                  <v-table>
                    <thead>
                      <tr>
                        <th>Descripcion</th>
                        <th v-if="month.includes('01')">
                          Enero
                        </th>
                        <th v-if="month.includes('02')">
                          Febrero
                        </th>
                        <th v-if="month.includes('03')">
                          Marzo
                        </th>
                        <th v-if="month.includes('04')">
                          Abril
                        </th>
                        <th v-if="month.includes('05')">
                          Mayo
                        </th>
                        <th v-if="month.includes('06')">
                          Junio
                        </th>
                        <th v-if="month.includes('07')">
                          Julio
                        </th>
                        <th v-if="month.includes('08')">
                          Agosto
                        </th>
                        <th v-if="month.includes('09')">
                          Septiembre
                        </th>
                        <th v-if="month.includes('10')">
                          Octubre
                        </th>
                        <th v-if="month.includes('11')">
                          Noviembre
                        </th>
                        <th v-if="month.includes('12')">
                          Diciembre
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(element, index) in itemsResumen"
                        :key="index"
                      >
                        <td>{{ element.description }}</td>
                        <td v-if="month.includes('01')">
                          {{ element.enero }}
                        </td>
                        <td v-if="month.includes('02')">
                          {{ element.febrero }}
                        </td>
                        <td v-if="month.includes('03')">
                          {{ element.marzo }}
                        </td>
                        <td v-if="month.includes('04')">
                          {{ element.abril }}
                        </td>
                        <td v-if="month.includes('05')">
                          {{ element.mayo }}
                        </td>
                        <td v-if="month.includes('06')">
                          {{ element.junio }}
                        </td>
                        <td v-if="month.includes('07')">
                          {{ element.julio }}
                        </td>
                        <td v-if="month.includes('08')">
                          {{ element.agosto }}
                        </td>
                        <td v-if="month.includes('09')">
                          {{ element.septiembre }}
                        </td>
                        <td v-if="month.includes('10')">
                          {{ element.octubre }}
                        </td>
                        <td v-if="month.includes('11')">
                          {{ element.noviembre }}
                        </td>
                        <td v-if="month.includes('12')">
                          {{ element.diciembre }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-col>
                <v-col cols="12">
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-siaplican">
                        <h2>Conceptos que SI aplican</h2>
                        <template #actions>
                          <v-icon color="#000000">
                            mdi-currency-usd
                          </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-table class="myTable">
                          <thead class="headerTable">
                            <tr>
                              <th class="headerTable">
                                Descripcion
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('01')"
                              >
                                Enero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('02')"
                              >
                                Febrero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('03')"
                              >
                                Marzo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('04')"
                              >
                                Abril
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('05')"
                              >
                                Mayo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('06')"
                              >
                                Junio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('07')"
                              >
                                Julio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('08')"
                              >
                                Agosto
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('09')"
                              >
                                Septiembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('10')"
                              >
                                Octubre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('11')"
                              >
                                Noviembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('12')"
                              >
                                Diciembre
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr class="totalStyle">
                              <td>Totales</td>
                              <td v-if="month.includes('01')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.enero) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.enero as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.enero) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.enero as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.febrero) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.febrero as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.febrero) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.febrero as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.marzo) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.marzo as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.marzo) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.marzo as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.abril) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.abril as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.abril) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.abril as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.mayo) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.mayo as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.mayo) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.mayo as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.junio) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.junio as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.junio) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.junio as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.julio) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.julio as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.julio) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.julio as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.agosto) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.agosto as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.agosto) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.agosto as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.septiembre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.septiembre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.septiembre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.septiembre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.octubre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.octubre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.octubre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.octubre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.noviembre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.noviembre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.noviembre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.noviembre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !!v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.diciembre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.diciembre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !!v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.diciembre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.diciembre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                            </tr>
                            <!-- @vue-expect-error key is an object, not a string or number -->
                            <tr
                              v-for="element in itemsResumenGananciaxTipoIngreso.filter(
                                (v) => !!v.aplica
                              )"
                              :key="element"
                              class="colorIngreso"
                            >
                              <td>{{ element.tipo_ingreso }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>

                            <!-- @vue-expect-error key is an object, not a string or number -->
                            <tr
                              v-for="element in itemsResumenGastoxTipoGasto.filter(
                                (v) => !!v.aplica
                              )"
                              :key="element"
                              class="colorEgreso"
                            >
                              <td>{{ element.gasto_description }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>
                <v-col
                  cols="12"
                  v-if="balancesStore.flujoprepostmes.length > 0"
                >
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-flujoprepost">
                        <h2>Fluje de Dinero</h2>
                        <template #actions>
                          <v-icon color="#fff">
                            mdi-cash-100
                          </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <FlujoPrePostComponet
                          :month="month"
                          :year="year"
                        />
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>

                <v-col cols="12">
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-noaplican">
                        <h2>Conceptos que NO aplican</h2>
                        <template #actions>
                          <v-icon color="#ffffff">
                            mdi-currency-usd-off
                          </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-table class="myTable">
                          <thead>
                            <tr class="headerTable">
                              <th class="headerTable">
                                Descripcion
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('01')"
                              >
                                Enero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('02')"
                              >
                                Febrero
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('03')"
                              >
                                Marzo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('04')"
                              >
                                Abril
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('05')"
                              >
                                Mayo
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('06')"
                              >
                                Junio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('07')"
                              >
                                Julio
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('08')"
                              >
                                Agosto
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('09')"
                              >
                                Septiembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('10')"
                              >
                                Octubre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('11')"
                              >
                                Noviembre
                              </th>
                              <th
                                class="headerTable"
                                v-if="month.includes('12')"
                              >
                                Diciembre
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr class="totalStyle">
                              <td>Totales</td>
                              <td v-if="month.includes('01')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.enero) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.enero as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.enero) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.enero as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.febrero) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.febrero as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.febrero) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.febrero as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.marzo) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.marzo as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.marzo) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.marzo as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.abril) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.abril as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.abril) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.abril as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.mayo) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.mayo as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.mayo) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.mayo as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.junio) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.junio as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.junio) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.junio as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.julio) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.julio as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.julio) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.julio as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.agosto) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.agosto as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.agosto) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.agosto as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.septiembre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.septiembre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.septiembre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.septiembre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.octubre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.octubre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.octubre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.octubre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.noviembre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.noviembre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.noviembre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.noviembre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{
                                  parseFloat(String(
                                    parseFloat(String(
                                      itemsResumenGananciaxTipoIngreso
                                        .filter((v) => !v.aplica)
                                        .reduce((sum, item) => {
                                          if (item.diciembre) {
                                            return (
                                              parseFloat(String(sum)) +
                                              parseFloat(item.diciembre as string)
                                            );
                                          }
                                          return sum;
                                        }, 0)
                                    )) -
                                      parseFloat(String(
                                        itemsResumenGastoxTipoGasto
                                          .filter((v) => !v.aplica)
                                          .reduce((sum, item) => {
                                            if (item.diciembre) {
                                              return (
                                                parseFloat(String(sum)) +
                                                parseFloat(item.diciembre as string)
                                              );
                                            }
                                            return sum;
                                          }, 0)
                                      ))
                                  )).toFixed(2)
                                }}
                              </td>
                            </tr>
                            <!-- @vue-expect-error key is an object, not a string or number -->
                            <tr
                              v-for="element in itemsResumenGananciaxTipoIngreso.filter(
                                (v) => !v.aplica
                              )"
                              :key="element"
                              class="colorIngreso"
                            >
                              <td>{{ element.tipo_ingreso }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>

                            <!-- @vue-expect-error key is an object, not a string or number -->
                            <tr
                              v-for="element in itemsResumenGastoxTipoGasto.filter(
                                (v) => !v.aplica
                              )"
                              :key="element"
                              class="colorEgreso"
                            >
                              <td>{{ element.gasto_description }}</td>
                              <td v-if="month.includes('01')">
                                {{ element.enero ? element.enero : 0 }}
                              </td>
                              <td v-if="month.includes('02')">
                                {{ element.febrero ? element.febrero : 0 }}
                              </td>
                              <td v-if="month.includes('03')">
                                {{ element.marzo ? element.marzo : 0 }}
                              </td>
                              <td v-if="month.includes('04')">
                                {{ element.abril ? element.abril : 0 }}
                              </td>
                              <td v-if="month.includes('05')">
                                {{ element.mayo ? element.mayo : 0 }}
                              </td>
                              <td v-if="month.includes('06')">
                                {{ element.junio ? element.junio : 0 }}
                              </td>
                              <td v-if="month.includes('07')">
                                {{ element.julio ? element.julio : 0 }}
                              </td>
                              <td v-if="month.includes('08')">
                                {{ element.agosto ? element.agosto : 0 }}
                              </td>
                              <td v-if="month.includes('09')">
                                {{
                                  element.septiembre ? element.septiembre : 0
                                }}
                              </td>
                              <td v-if="month.includes('10')">
                                {{ element.octubre ? element.octubre : 0 }}
                              </td>
                              <td v-if="month.includes('11')">
                                {{ element.noviembre ? element.noviembre : 0 }}
                              </td>
                              <td v-if="month.includes('12')">
                                {{ element.diciembre ? element.diciembre : 0 }}
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>
                <v-col cols="12">
                  <v-expansion-panels variant="popout">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="t-info">
                        <h2>Resumen Detallado</h2>
                        <template #actions>
                          <v-icon color="#000000">
                            mdi-alert-circle
                          </v-icon>
                        </template>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-data-table
                          :headers="headersDetailsGanancia"
                          :items="itemsGanancia"
                          width="100%"
                          sticky-header
                        />

                        <v-data-table
                          :headers="headersDetailsGastos"
                          :items="itemsGastos"
                          width="100%"
                        />
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-col>

                <!--  -->
              </v-row>
            </v-card>
          </v-tabs-window-item>
          <v-tabs-window-item
            value="filtro"
            v-if="
              itemsGananciaFiltro.length > 0 || itemsGastosFiltro.length > 0
            "
          >
            <v-card flat>
              <center>
                <h3>
                  RESUMEN DETALLADO {{ tipofiltro == 1 ? "INGRESO" : "EGRESO" }}
                </h3>
              </center>
              <v-card-text>
                <v-data-table
                  v-if="tipofiltro == 1"
                  :headers="headersDetailsGananciaFiltro"
                  :items="itemsGananciaFiltro"
                  width="100%"
                  sticky-header
                >
                  <template #[`item.editar`]="{ item }">
                    <v-icon
                      v-if="
                        item.isoperativo ||
                          (!item.isoperativo && item.editarflag)
                      "
                      color="orange-darken-2"
                      class="mr-2"
                      @click="redirectEditarGanancia(item.id, item.isoperativo)"
                    >
                      mdi-pencil
                    </v-icon>
                    <v-icon
                      v-if="!item.isoperativo && !item.editarflag"
                      color="blue-grey-darken-2"
                      class="mr-2"
                      @click="redirectViewGanancia(item.id, item.isoperativo)"
                    >
                      mdi-eye
                    </v-icon>
                  </template>
                </v-data-table>

                <v-data-table
                  v-if="tipofiltro == 2"
                  :headers="headersDetailsGastosFiltro"
                  :items="itemsGastosFiltro"
                  width="100%"
                >
                  <template #[`item.editar`]="{ item }">
                    <v-icon
                      color="blue-grey-darken-2"
                      class="mr-2"
                      @click="redirectGasto(item.id)"
                    >
                      mdi-eye
                    </v-icon>
                    <v-icon
                      v-if="item.editarflag"
                      color="orange-darken-2"
                      class="mr-2"
                      @click="redirectGasto(item.id)"
                    >
                      mdi-pencil
                    </v-icon>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
          <v-tabs-window-item
            value="compare"
            v-if="balancesStore.comparativo.length > 0"
          >
            <TableDinamica
              :items="balancesStore.comparativo"
              :mes="
                id_month
                  ? months.filter((v) => v.value == id_month)[0]!.text
                  : ''
              "
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.header {
  font-weight: bold;
}
/* .headerTable {
  color: #fff !important;
  background-color: #900c3f;
} */
.colorIngreso {
  background-color: #c5ec92;
}
.colorEgreso {
  background-color: #a7d2f9;
}
.totalStyle {
  background-color: #000;
  color: #fff !important;
}
.myTable tbody tr:hover {
  background-color: inherit !important;
  color: #000 !important;
}
.myTable .headerTable {
  color: #fff !important;
  background-color: #900c3f !important;
}
.t-siaplican {
  color: #000 !important;
  background-color: #9effa3;
}
.t-noaplican {
  color: #ffffff !important;
  background-color: #ff9797;
}
.t-info {
  color: #000 !important;
  background-color: #b1b1b1;
}
.t-flujoprepost {
  color: #fff !important;
  background-color: #0d47a1;
}
</style>
