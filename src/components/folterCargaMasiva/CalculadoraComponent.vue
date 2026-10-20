<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useAppStore } from "@/stores/app";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { readSheet as readXlsFile } from "read-excel-file/browser";
import type { Row } from "read-excel-file/browser";
import exportXlsFile from "export-from-json";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { useMonedasStore } from "@/stores/monedas";
import type { ApiResponse } from "@/types/api";
import type { Pais } from "@/types/catalogos";
import type {
  FilaCargaFlete,
  FormRegistroFlete,
  MensajeCalculadora,
  OpcionRegistroFlete,
  PuertoCalculadora,
  ValidacionCarga,
} from "@/types/calculadora";

const calculadorasStore = useCalculadorasStore();
const appStore = useAppStore();
const monedasStore = useMonedasStore();
const undeclaredAppState = appStore as typeof appStore & {
  calculadora: { contendedorCalc: unknown[]; navieraCalc: unknown[] };
  moneda: { moneda: unknown[] };
};

// The form starts every single selection as an empty array.
const sinSeleccion = () => [] as unknown as OpcionRegistroFlete;
const formularioVacio = (): FormRegistroFlete => ({
  paisOrigen: sinSeleccion(),
  puertoOrigen: [],
  paisDestino: sinSeleccion(),
  puertoDestino: [],
  volumen_minimo: 0,
  volumen_hasta: 0,
  volumen_max: 0,
  costo_minimo: 0,
  costo: 0,
  tt_aprox: 0,
  moneda: sinSeleccion(),
  symbol: "",
  recargos: "",
  servicio: "DIRECTO",
  frecuencia: "",
  recargps: "",
  agente: "PIER17",
  desde: null,
  hasta: null,
  contenedor: sinSeleccion(),
  naviera: sinSeleccion(),
  cortes: "",
  carrier_tt: 0,
});

const tipo = ref("lcl");
const tipoSelected = ref("lcl");
const excel = ref<File | null>(null);
const count = ref(0);
const subir = ref(false);
const procesando = ref(false);
const procesando2 = ref(false);
const sucursales = ref<(number | string)[] | null>(null);
const registrarFlag = ref(false);
const offcanvas = ref(false);
const importacionflag = ref("true");
const symbol = ref("");
const headerLCL = [
  { title: "PAIS ORIGEN", key: "pais_origen", sortable: false },
  { title: "PUERTO ORIGEN", key: "puerto_origen", sortable: false },
  { title: "PAIS DESTINO", key: "pais_destino", sortable: false },
  { title: "PUERTO DESTINO", key: "puerto_destino", sortable: false },
  { title: "VOL MIN", key: "volumen_minimo", sortable: false },
  { title: "VOL DESDE", key: "volumen_desde", sortable: false },
  { title: "VOL HASTA", key: "volumen_hasta", sortable: false },
  { title: "COSTO MINIMO", key: "costo_minimo", sortable: false },
  { title: "COSTO", key: "costo", sortable: false },
  { title: "MONEDA", key: "moneda", sortable: false },
  { title: "SERVICIO", key: "servicio", sortable: false },
  { title: "FRECUENCA", key: "frecuencia", sortable: false },
  { title: "TT APROX", key: "tt_aprox", sortable: false },
  { title: "RECARGOS", key: "recargos", sortable: false },
  { title: "AGENTE", key: "agente", sortable: false },
  { title: "VIGENCIA DESDE", key: "vigencia_desde", sortable: false },
  { title: "VIGENCIA HASTA", key: "vigencia_hasta", sortable: false },
];
const headerFCL = [
  { title: "PAÍS ORIGEN", key: "pais_origen", sortable: false },
  { title: "PUERTO ORIGEN", key: "puerto_origen", sortable: false },
  { title: "PAÍS DESTINO", key: "pais_destino", sortable: false },
  { title: "PUERTO DESTINO", key: "puerto_destino", sortable: false },
  { title: "TIPO CONTENEDOR", key: "Tipo_contenedor", sortable: false },
  { title: "COSTO", key: "costo", sortable: false },
  { title: "MONEDA", key: "moneda", sortable: false },
  { title: "NAVIERA", key: "Naviera", sortable: false },
  { title: "DESDE", key: "vigencia_desde", sortable: false },
  { title: "HASTA", key: "vigencia_hasta", sortable: false },
];
const headerAereo = [
  { title: "PAÍS DESTINO", key: "pais_origen", sortable: false },
  { title: "PUERTO DESTINO", key: "puerto_origen", sortable: false },
  { title: "PAÍS DESTINO", key: "pais_destino", sortable: false },
  { title: "PUERTO DESTINO", key: "puerto_destino", sortable: false },
  { title: "VOL. MÍNIMO", key: "volumen_minimo", sortable: false },
  { title: "VOL. DESDE", key: "volumen_desde", sortable: false },
  { title: "VOL. HASTA", key: "volumen_hasta", sortable: false },
  { title: "COSTO MÍNIMO", key: "costo_minimo", sortable: false },
  { title: "COSTO ", key: "costo", sortable: false },
  { title: "MONEDA", key: "moneda", sortable: false },
  { title: "SERVICIO", key: "servicio", sortable: false },
  { title: "FRECUENCIA", key: "frecuencia", sortable: false },
  { title: "CORTES", key: "cortes", sortable: false },
  { title: "CARRIER TT", key: "carrier_tt", sortable: false },
  { title: "AGENTE", key: "agente", sortable: false },
  { title: "DESDE", key: "vigencia_desde", sortable: false },
  { title: "HASTA", key: "vigencia_hasta", sortable: false },
];
const itemsLCL = ref<FilaCargaFlete[]>([]);
const itemsFCL = ref<FilaCargaFlete[]>([]);
const itemsAereo = ref<FilaCargaFlete[]>([]);
const procesarflag = ref(false);
const puertosOrigen = ref<PuertoCalculadora[]>([]);
const puertosDestino = ref<PuertoCalculadora[]>([]);
const frecuencias = [
  { value: "SEMANAL", text: "SEMANAL" },
  { value: "QUINCENAL", text: "QUINCENAL" },
  { value: "MENSUAL", text: "MENSUAL" },
  { value: "INDEFINIDO", text: "INDEFINIDO" },
];
const datosFormulario = ref<FormRegistroFlete>(formularioVacio());
// Never declared, so it always reads undefined.
const moneda = undefined as OpcionRegistroFlete | undefined;

//   ...mapState(["$store.state.itemsPais", "$store.state.moneda.moneda", "$store.state.calculadora.navieraCalc", "$store.state.calculadora.contendedorCalc"]),
async function procesarExcel() {
  const file = document.getElementById("excel") as HTMLInputElement;
  const validacionFormato = await validarCabecerasExcel(file.files![0]!);

  if (validacionFormato == true) {
    switch (tipo.value) {
      case "lcl":
        readXlsFile(file.files![0]!).then((rows) => {
          procesarLCL(rows);
        });
        break;
      case "fcl":
        readXlsFile(file.files![0]!).then((rows) => {
          procesarFCL(rows);
        });
        break;
      case "aereo":
        readXlsFile(file.files![0]!).then((rows) => {
          procesarAereo(rows);
        });
        break;

      default:
        break;
    }
  }
}
function exportarFormato() {
  procesando2.value = true;
  let data: Record<string, string>[] = [];
  let fileName = "";
  const exportType = exportXlsFile.types.xls;
  switch (tipo.value) {
    case "lcl":
      data = [
        {
          Continente: "",
          pais_origen: "",
          puerto_origen: "",
          pais_destino: "",
          puerto_destino: "",
          volumen_minimo: "",
          volumen_desde: "",
          volumen_hasta: "",
          costo_minimo: "",
          costo: "",
          moneda: "",
          servicio: "",
          frecuencia: "",
          cortes: "",
          carrier_tt: "",
          agente: "",
          vigencia_desde: "",
          vigencia_hasta: "",
        },
      ];
      fileName = "FORMATO LCL";

      break;
    case "fcl":
      data = [
        {
          Continente: "",
          pais_origen: "",
          puerto_origen: "",
          pais_destino: "",
          puerto_destino: "",
          Tipo_contenedor: "",
          costo: "",
          moneda: "",
          Naviera: "",
          vigencia_desde: "",
          vigencia_hasta: "",
        },
      ];
      fileName = "FORMATO FCL";

      break;
    case "aereo":
      data = [
        {
          Continente: "",
          pais_origen: "",
          puerto_origen: "",
          pais_destino: "",
          puerto_destino: "",
          volumen_minimo: "",
          volumen_desde: "",
          volumen_hasta: "",
          costo_minimo: "",
          costo: "",
          moneda: "",
          servicio: "",
          frecuencia: "",
          cortes: "",
          carrier_tt: "",
          agente: "",
          vigencia_desde: "",
          vigencia_hasta: "",
        },
      ];
      fileName = "FORMATO AÉREO";

      break;

    default:
      break;
  }
  setTimeout(() => {
    exportXlsFile({ data, fileName, exportType });
    procesando2.value = false;
  }, 800);
}
async function procesarLCL(rows: Row[]) {
  procesando.value = true;
  const datos: FilaCargaFlete[] = [];
  for (let index = 0; index < rows.length; index++) {
    if (index > 0) {
      datos.push({
        Continente: rows[index]![0],
        pais_origen: rows[index]![1],
        puerto_origen: rows[index]![2],
        pais_destino: rows[index]![3],
        puerto_destino: rows[index]![4],
        volumen_minimo: rows[index]![5],
        volumen_desde: rows[index]![6],
        volumen_hasta: rows[index]![7],
        costo_minimo: rows[index]![8],
        costo: rows[index]![9],
        moneda: rows[index]![10],
        servicio: rows[index]![11],
        frecuencia: rows[index]![12],
        tt_aprox: rows[index]![13],
        recargos: rows[index]![14],
        agente: rows[index]![15],
        vigencia_desde: moment(rows[index]![16] as moment.MomentInput).format("YYYY-MM-DD"),
        vigencia_hasta: moment(rows[index]![17] as moment.MomentInput).format("YYYY-MM-DD"),
      });
    }
  }
  // empezar a validar los datos
  const datosValidar: FilaCargaFlete[] = [];

  datos.map(function (element) {
    datosValidar.push(element);
  });

  // empezar a validar los datos

  const pais_origen2: unknown[] = [];
  const puerto_origen2: unknown[] = [];
  const pais_destino2: unknown[] = [];
  const puerto_destino2: unknown[] = [];
  const volumen_minimo2: unknown[] = [];
  const volumen_desde2: unknown[] = [];
  const volumen_hasta2: unknown[] = [];
  const costo_minimo2: unknown[] = [];
  const costo2: unknown[] = [];
  const moneda2: unknown[] = [];
  const servicio2: unknown[] = [];
  const frecuencia2: unknown[] = [];
  const tt_aprox2: unknown[] = [];
  const recargos2: unknown[] = [];
  const agente2: unknown[] = [];
  const vigencia_desde2: unknown[] = [];
  const vigencia_hasta2: unknown[] = [];

  datos.forEach((element) => {
    pais_origen2.push(element.pais_origen);
    puerto_origen2.push(element.puerto_origen);
    pais_destino2.push(element.pais_destino);
    puerto_destino2.push(element.puerto_destino);
    volumen_minimo2.push(element.volumen_minimo);
    volumen_desde2.push(element.volumen_desde);
    volumen_hasta2.push(element.volumen_hasta);
    costo_minimo2.push(element.costo_minimo);
    costo2.push(element.costo);
    moneda2.push(element.moneda);
    servicio2.push(element.servicio);
    frecuencia2.push(element.frecuencia);
    tt_aprox2.push(element.tt_aprox);
    recargos2.push(element.recargos);
    agente2.push(element.agente);
    vigencia_desde2.push(moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"));
    vigencia_hasta2.push(moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"));
  });
  //  AXIOS
  const headers = {
    "Content-Type": "application/json",
  };
  const data = {
    id_branch: JSON.parse(sessionStorage.getItem("branch") as string),
    pais_origen: pais_origen2,
    puerto_origen: puerto_origen2,
    pais_destino: pais_destino2,
    puerto_destino: puerto_destino2,
    volumen_minimo: volumen_minimo2,
    volumen_desde: volumen_desde2,
    volumen_hasta: volumen_hasta2,
    costo_minimo: costo_minimo2,
    costo: costo2,
    moneda: moneda2,
    servicio: servicio2,
    frecuencia: frecuencia2,
    tt_aprox: tt_aprox2,
    recargos: recargos2,
    agente: agente2,
    vigencia_desde: vigencia_desde2,
    vigencia_hasta: vigencia_hasta2,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + `validar_registros_lcl`,
    headers: headers,
    data: data,
  };

  const response = await axios<ValidacionCarga>(config).then((response) => {
    return response.data;
  });

  if (response.estadoflag == true) {
    subir.value = true;
    datosValidar.map(function (element) {
      itemsLCL.value.push(element);
    });
  } else {
    const text =
      response.permiso == false
        ? "EXISTEN DATOS POR CORREGIR. NO SE CARGARÁN LOS DATOS."
        : " ";
    Swal.fire({
      title: `OJO ATENCION  LEER BIEN. .${text}`,
      icon: "error",
      width: "80%",
      scrollbarPadding: true,
      html: `<div style="font-size: 1.5rem">${response.mensaje}</div>`,
      showDenyButton: true,
      confirmButtonText: "Aceptar",
      denyButtonText: `Corregir Errores`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        datosValidar.map(function (element) {
          itemsLCL.value.push(element);
        });
        subir.value = true;
      } else if (result.isDenied) {
        Swal.fire(
          "No se cargaron los REGISTROS procese un nuevo documento.",
          "",
          "info"
        );
      }
    });
  }

  procesando.value = false;
}
async function procesarFCL(rows: Row[]) {
  procesando.value = true;
  const datos: FilaCargaFlete[] = [];

  for (let index = 0; index < rows.length; index++) {
    if (index > 0) {
      datos.push({
        Continente: rows[index]![0],
        pais_origen: rows[index]![1],
        puerto_origen: rows[index]![2],
        pais_destino: rows[index]![3],
        puerto_destino: rows[index]![4],
        Tipo_contenedor: rows[index]![5],
        costo: rows[index]![6],
        moneda: rows[index]![7],
        Naviera: rows[index]![8],
        vigencia_desde: moment(rows[index]![9] as moment.MomentInput).format("YYYY-MM-DD"),
        vigencia_hasta: moment(rows[index]![10] as moment.MomentInput).format("YYYY-MM-DD"),
      });
    }
  }

  // empezar a validar los datos
  const datosValidar: FilaCargaFlete[] = [];

  datos.map(function (element) {
    datosValidar.push(element);
  });
  // empezar a validar los datos
  const pais_origen2: unknown[] = [];
  const puerto_origen2: unknown[] = [];
  const pais_destino2: unknown[] = [];
  const puerto_destino2: unknown[] = [];
  const Tipo_contenedor2: unknown[] = [];
  const moneda2: unknown[] = [];
  const Naviera2: unknown[] = [];
  const vigencia_desde2: unknown[] = [];
  const vigencia_hasta2: unknown[] = [];

  datos.forEach((element) => {
    pais_origen2.push(element.pais_origen);
    puerto_origen2.push(element.puerto_origen);
    pais_destino2.push(element.pais_destino);
    puerto_destino2.push(element.puerto_destino);
    Tipo_contenedor2.push(element.Tipo_contenedor);
    moneda2.push(element.moneda);
    Naviera2.push(element.Naviera);
    vigencia_desde2.push(moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"));
    vigencia_hasta2.push(moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"));
  });
  const headers = {
    "Content-Type": "application/json",
  };
  const data = {
    id_branch: JSON.parse(sessionStorage.getItem("branch") as string),
    pais_origen: pais_origen2,
    puerto_origen: puerto_origen2,
    pais_destino: pais_destino2,
    puerto_destino: puerto_destino2,
    Tipo_contenedor: Tipo_contenedor2,
    moneda: moneda2,
    Naviera: Naviera2,
    vigencia_desde: vigencia_desde2,
    vigencia_hasta: vigencia_hasta2,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + `validar_registros_fcl`,
    headers: headers,
    data: data,
  };

  const response = await axios<ValidacionCarga>(config).then((response) => {
    return response.data;
  });

  if (response.estadoflag == true) {
    subir.value = true;

    datosValidar.map(function (element) {
      itemsFCL.value.push(element);
    });
  } else {
    const text =
      response.permiso == false
        ? "EXISTEN DATOS POR CORREGIR. NO SE CARGARÁN LOS DATOS."
        : " ";
    Swal.fire({
      title: `OJO ATENCION  LEER BIEN. .${text}`,
      icon: "error",
      width: "80%",
      scrollbarPadding: true,
      html: `<div style="font-size: 1.5rem">${response.mensaje}</div>`,
      showDenyButton: true,
      confirmButtonText: "Aceptar",
      denyButtonText: `Corregir Errores`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        if (response.permiso == false) {
          subir.value = response.permiso;
        } else {
          datosValidar.map(function (element) {
            itemsFCL.value.push(element);
            subir.value = response.permiso!;
          });
        }
      } else if (result.isDenied) {
        Swal.fire(
          "No se cargaron los REGISTROS procese un nuevo documento.",
          "",
          "info"
        );
      }
    });
  }

  procesando.value = false;
}

async function procesarAereo(rows: Row[]) {
  procesando.value = true;
  const datos: FilaCargaFlete[] = [];

  for (let index = 0; index < rows.length; index++) {
    if (index > 0) {
      datos.push({
        Continente: rows[index]![0],
        pais_origen: rows[index]![1],
        puerto_origen: rows[index]![2],
        pais_destino: rows[index]![3],
        puerto_destino: rows[index]![4],
        volumen_minimo: rows[index]![5],
        volumen_desde: rows[index]![6],
        volumen_hasta: rows[index]![7],
        costo_minimo: rows[index]![8],
        costo: rows[index]![9],
        moneda: rows[index]![10],
        servicio: rows[index]![11],
        frecuencia: rows[index]![12],
        cortes: rows[index]![13],
        carrier_tt: rows[index]![14],
        agente: rows[index]![15],
        vigencia_desde: moment(rows[index]![16] as moment.MomentInput).format("YYYY-MM-DD"),
        vigencia_hasta: moment(rows[index]![17] as moment.MomentInput).format("YYYY-MM-DD"),
      });
    }
  }

  // empezar a validar los datos
  const datosValidar: FilaCargaFlete[] = [];

  datos.map(function (element) {
    datosValidar.push(element);
  });
  // empezar a validar los datos
  const pais_origen2: unknown[] = [];
  const puerto_origen2: unknown[] = [];
  const pais_destino2: unknown[] = [];
  const puerto_destino2: unknown[] = [];
  // let volumen_minimo2 = [];
  // let volumen_desde2 = [];
  // let volumen_hasta2 = [];
  // let costo_minimo2 = [];
  // let costo2 = [];
  const moneda2: unknown[] = [];
  const servicio2: unknown[] = [];
  const frecuencia2: unknown[] = [];
  // let cortes2 = [];
  // let carrier_tt2 = [];
  const agente2: unknown[] = [];
  const vigencia_desde2: unknown[] = [];
  const vigencia_hasta2: unknown[] = [];

  datos.forEach((element) => {
    pais_origen2.push(element.pais_origen);
    puerto_origen2.push(element.puerto_origen);
    pais_destino2.push(element.pais_destino);
    puerto_destino2.push(element.puerto_destino);
    moneda2.push(element.moneda);
    servicio2.push(element.servicio);
    frecuencia2.push(element.frecuencia);
    agente2.push(element.agente);
    vigencia_desde2.push(moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"));
    vigencia_hasta2.push(moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"));
  });
  const headers = {
    "Content-Type": "application/json",
  };
  const data = {
    id_branch: JSON.parse(sessionStorage.getItem("branch") as string),
    pais_origen: pais_origen2,
    puerto_origen: puerto_origen2,
    pais_destino: pais_destino2,
    puerto_destino: puerto_destino2,
    moneda: moneda2,
    servicio: servicio2,
    frecuencia: frecuencia2,
    agente: agente2,
    vigencia_desde: vigencia_desde2,
    vigencia_hasta: vigencia_hasta2,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + `validar_registros_aereo`,
    headers: headers,
    data: data,
  };

  const response = await axios<ValidacionCarga>(config).then((response) => {
    return response.data;
  });

  if (response.estadoflag == true) {
    subir.value = true;
    datosValidar.map(function (element) {
      itemsAereo.value.push(element);
    });
  } else {
    const text =
      response.permiso == false
        ? "EXISTEN DATOS POR CORREGIR."
        : " Sino desea cargar los datos y procesar un nuevo documento presione Cancelar.";
    Swal.fire({
      title: `OJO ATENCION  LEER BIEN. .${text}`,
      icon: "error",
      width: "80%",
      scrollbarPadding: true,
      html: response.mensaje,
      showDenyButton: true,
      confirmButtonText: "Aceptar",
      denyButtonText: `Cancelar`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        if (response.permiso == false) {
          subir.value = response.permiso;
        } else {
          datosValidar.map(function (element) {
            itemsAereo.value.push(element);
            subir.value = response.permiso!;
          });
        }
      } else if (result.isDenied) {
        Swal.fire(
          "No se cargaron los REGISTROS procese un nuevo documento.",
          "",
          "info"
        );
      }
    });
  }

  procesando.value = false;
}
function change() {
  if (tipoSelected.value != tipo.value) {
    Swal.fire({
      icon: "info",
      title: "Advertencia",
      showDenyButton: true,
      denyButtonText: `Regresar`,
      text: `Va a cambiar de ${
        tipoSelected.value == "lcl"
          ? "LCL"
          : tipoSelected.value == "fcl"
          ? "FLC"
          : "AÉRO"
      } a ${
        tipo.value == "lcl" ? "LCL" : tipo.value == "fcl" ? "FLC" : "AÉRO"
      }. Perderá todos los datos procesados. ¿Desea seguro continuar.?`,
      confirmButtonText: "Continuar",
    }).then((result) => {
      if (result.isConfirmed) {
        tipoSelected.value = tipo.value;
        procesarflag.value = false;
        subir.value = false;
        itemsLCL.value = [];
        itemsFCL.value = [];
        itemsAereo.value = [];
        excel.value = null;
      }
      if (result.isDenied) {
        tipo.value = tipoSelected.value;
      }
    });
  }
}
async function validarCabecerasExcel(data: File) {
  let count = 0;
  let validacion = true as boolean;
  const headerLCL = [
    { name: "Continente" },
    { name: "pais_origen" },
    { name: "puerto_origen" },
    { name: "pais_destino" },
    { name: "puerto_destino" },
    { name: "volumen_minimo" },
    { name: "volumen_desde" },
    { name: "volumen_hasta" },
    { name: "costo_minimo" },
    { name: "costo" },
    { name: "moneda" },
    { name: "servicio" },
    { name: "frecuencia" },
    { name: "tt_aprox" },
    { name: "recargos" },
    { name: "agente" },
    { name: "vigencia_desde" },
    { name: "vigencia_hasta" },
  ];
  const headerFCL = [
    { name: "Continente" },
    { name: "pais_origen" },
    { name: "puerto_origen" },
    { name: "pais_destino" },
    { name: "puerto_destino" },
    { name: "Tipo_contenedor" },
    { name: "costo" },
    { name: "moneda" },
    { name: "Naviera" },
    { name: "vigencia_desde" },
    { name: "vigencia_hasta" },
  ];
  const headerAereo = [
    { name: "CONTINENTE" },
    { name: "pais_origen" },
    { name: "puerto_origen" },
    { name: "pais_destino" },
    { name: "puerto_destino" },
    { name: "volumen_minimo" },
    { name: "volumen_desde" },
    { name: "volumen_hasta" },
    { name: "costo_minimo" },
    { name: "costo" },
    { name: "moneda" },
    { name: "servicio" },
    { name: "frecuencia" },
    { name: "cortes" },
    { name: "carrier_tt" },
    { name: "agente" },
    { name: "vigencia_desde" },
    { name: "vigencia_hasta" },
  ];
  const datosExcel = await readXlsFile(data).then((rows) => {
    return rows[0]!;
  });
  switch (tipo.value) {
    case "lcl":
      datosExcel.forEach((element) => {
        count = headerLCL.filter((v) => v.name == element).length;
        if (count == 0) {
          validacion = false;
        }
      });
      break;
    case "fcl":
      datosExcel.forEach((element) => {
        count = headerFCL.filter((v) => v.name == element).length;
        if (count == 0) {
          validacion = false;
        }
      });
      break;
    case "aereo":
      datosExcel.forEach((element) => {
        count = headerAereo.filter((v) => v.name == element).length;

        if (count == 0) {
          validacion = false;
        }
      });
      break;

    default:
      break;
  }
  if (validacion == false) {
    Swal.fire({
      icon: "warning",
      text: "El archivo seleccionado, no coincide con el tipo seleccionado.",
    });
  }
  return validacion;
}

async function registrar() {
  procesando.value = true;
  let sucursal = "";
  sucursales.value!.map((item) => {
    if (sucursal) {
      sucursal += "," + item;
    } else {
      sucursal += item;
    }
  });
  let config: AxiosRequestConfig | null = null;
  const pais_origen: unknown[] = [];
  const puerto_origen: unknown[] = [];
  const pais_destino: unknown[] = [];
  const puerto_destino: unknown[] = [];
  const volumen_minimo: unknown[] = [];
  const volumen_desde: unknown[] = [];
  const volumen_hasta: unknown[] = [];
  const costo_minimo: unknown[] = [];
  const costo: unknown[] = [];
  const moneda: unknown[] = [];
  const servicio: unknown[] = [];
  const frecuencia: unknown[] = [];
  const tt_aprox: unknown[] = [];
  const recargos: unknown[] = [];
  const agente: unknown[] = [];
  const vigencia_desde: unknown[] = [];
  const vigencia_hasta: unknown[] = [];
  const Tipo_contenedor: unknown[] = [];
  const Naviera: unknown[] = [];
  const cortes: unknown[] = [];
  const carrier_tt: unknown[] = [];
  let data: Record<string, unknown> | null = null;
  let response: AxiosResponse<ApiResponse<MensajeCalculadora[]>> | null = null;
  const headers = {
    "Content-Type": "application/json",
  };
  if (tipo.value == "lcl") {
    itemsLCL.value.forEach((element) => {
      pais_origen.push(element.pais_origen);
      puerto_origen.push(element.puerto_origen);
      pais_destino.push(element.pais_destino);
      puerto_destino.push(element.puerto_destino);
      volumen_minimo.push(element.volumen_minimo);
      volumen_desde.push(element.volumen_desde);
      volumen_hasta.push(element.volumen_hasta);
      costo_minimo.push(element.costo_minimo);
      costo.push(element.costo);
      moneda.push(element.moneda);
      servicio.push(element.servicio);
      frecuencia.push(element.frecuencia);
      tt_aprox.push(element.tt_aprox);
      recargos.push(element.recargos);
      agente.push(element.agente);
      vigencia_desde.push(moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"));
      vigencia_hasta.push(moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"));
    });
    data = {
      id_branch: JSON.parse(sessionStorage.getItem("branch") as string),
      pais_origen: pais_origen,
      puerto_origen: puerto_origen,
      pais_destino: pais_destino,
      puerto_destino: puerto_destino,
      volumen_minimo: volumen_minimo,
      volumen_desde: volumen_desde,
      volumen_hasta: volumen_hasta,
      costo_minimo: costo_minimo,
      costo: costo,
      moneda: moneda,
      servicio: servicio,
      frecuencia: frecuencia,
      tt_aprox: tt_aprox,
      recargos: recargos,
      agente: agente,
      vigencia_desde: vigencia_desde,
      vigencia_hasta: vigencia_hasta,
      importarcionflag: importacionflag.value == "true" ? true : false,
      sucursal: sucursal,
    };

    config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_carga_masiva_lcl`,
      headers: headers,
      data: data,
    };
    response = await axios<ApiResponse<MensajeCalculadora[]>>(config);
    if (response.data.estadoflag == true) {
      Swal.fire({
        icon: "success",
        title: response.data.data[0]!.mensaje,
      });
    }
  }
  if (tipo.value == "fcl") {
    itemsFCL.value.forEach((element) => {
      Tipo_contenedor.push(element.Tipo_contenedor);
      costo.push(element.costo);
      moneda.push(element.moneda);
      Naviera.push(element.Naviera);
      pais_origen.push(element.pais_origen);
      puerto_origen.push(element.puerto_origen);
      pais_destino.push(element.pais_destino);
      puerto_destino.push(element.puerto_destino);
      vigencia_desde.push(moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"));
      vigencia_hasta.push(moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"));
    });
    data = {
      id_branch: JSON.parse(sessionStorage.getItem("branch") as string),
      Tipo_contenedor: Tipo_contenedor,
      costo: costo,
      moneda: moneda,
      Naviera: Naviera,
      pais_origen: pais_origen,
      puerto_origen: puerto_origen,
      pais_destino: pais_destino,
      puerto_destino: puerto_destino,
      vigencia_desde: vigencia_desde,
      vigencia_hasta: vigencia_hasta,
      importarcionflag: importacionflag.value == "true" ? true : false,
      sucursal: sucursal,
    };
    config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_carga_masiva_fcl`,
      headers: headers,
      data: data,
    };
    response = await axios<ApiResponse<MensajeCalculadora[]>>(config);

    if (response.data.estadoflag == true) {
      Swal.fire({
        icon: "success",
        title: response.data.data[0]!.mensaje,
      });
    }
  }
  if (tipo.value == "aereo") {
    itemsAereo.value.forEach((element) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      pais_origen.push(element.pais_origen),
        puerto_origen.push(element.puerto_origen),
        pais_destino.push(element.pais_destino),
        puerto_destino.push(element.puerto_destino),
        volumen_minimo.push(element.volumen_minimo),
        volumen_desde.push(element.volumen_desde),
        volumen_hasta.push(element.volumen_hasta),
        costo_minimo.push(element.costo_minimo),
        costo.push(element.costo),
        moneda.push(element.moneda),
        servicio.push(element.servicio),
        frecuencia.push(element.frecuencia),
        cortes.push(element.cortes),
        carrier_tt.push(element.carrier_tt),
        agente.push(element.agente),
        vigencia_hasta.push(element.vigencia_hasta),
        vigencia_desde.push(moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"));
      vigencia_hasta.push(moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"));
    });
    data = {
      id_branch: JSON.parse(sessionStorage.getItem("branch") as string),
      pais_origen: pais_origen,
      puerto_origen: puerto_origen,
      pais_destino: pais_destino,
      puerto_destino: puerto_destino,
      volumen_minimo: volumen_minimo,
      volumen_desde: volumen_desde,
      volumen_hasta: volumen_hasta,
      costo_minimo: costo_minimo,
      costo: costo,
      moneda: moneda,
      servicio: servicio,
      frecuencia: frecuencia,
      cortes: cortes,
      carrier_tt: carrier_tt,
      agente: agente,
      vigencia_hasta: vigencia_hasta,
      vigencia_desde: vigencia_desde,
      importarcionflag: importacionflag.value == "true" ? true : false,
      sucursal: sucursal,
    };
    config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_carga_masiva_aereo`,
      headers: headers,
      data: data,
    };
    response = await axios<ApiResponse<MensajeCalculadora[]>>(config);
    if (response.data.estadoflag == true) {
      Swal.fire({
        icon: "success",
        title: response.data.data[0]!.mensaje,
      });
    }
  }
  procesando.value = false;
  registrarFlag.value = false;
  limpiarData();
}
function limpiarData() {
  tipo.value = "lcl";
  tipoSelected.value = "lcl";
  excel.value = null;
  count.value = 0;
  subir.value = false;
  procesando.value = false;
  procesando2.value = false;
  sucursales.value = null;
  registrarFlag.value = false;
  importacionflag.value = "true";
  itemsLCL.value = [];
  itemsFCL.value = [];
  itemsAereo.value = [];
  procesarflag.value = false;
}
async function cargarPuertoDestino() {
  puertosDestino.value = [];
  if (datosFormulario.value.paisDestino) {
    puertosDestino.value = await calculadorasStore.CargarPuertoPorTipoPorPais({
      id_pais: datosFormulario.value.paisDestino.pais_id,
      tipo: "M",
    });
  }
}
async function cargarPuertoOrigen() {
  puertosOrigen.value = [];
  if (datosFormulario.value.paisOrigen) {
    puertosOrigen.value = await calculadorasStore.CargarPuertoPorTipoPorPais({
      id_pais: datosFormulario.value.paisOrigen.pais_id,
      tipo: "M",
    });
  }
}
function obtenerSimbol() {
  symbol.value = "";
  if (moneda) {
    symbol.value = moneda.moneda_symbol!;
  }
}
function anadirRegistros() {
  if (tipo.value == "lcl") {
    datosFormulario.value.puertoOrigen.forEach((ePortOrigin) => {
      datosFormulario.value.puertoDestino.forEach((ePortDestino) => {
        itemsLCL.value.push({
          pais_origen: datosFormulario.value.paisOrigen.pais_descripcion,
          puerto_origen: ePortOrigin.puerto_descripcion,
          pais_destino: datosFormulario.value.paisDestino.pais_descripcion,
          puerto_destino: ePortDestino.puerto_descripcion,
          volumen_minimo: datosFormulario.value.volumen_minimo,
          volumen_desde: datosFormulario.value.volumen_desde,
          volumen_hasta: datosFormulario.value.volumen_hasta,
          costo_minimo: datosFormulario.value.costo_minimo,
          costo: datosFormulario.value.costo,
          moneda: datosFormulario.value.moneda.moneda_descripcion,
          servicio: datosFormulario.value.servicio,
          frecuencia: datosFormulario.value.frecuencia,
          tt_aprox: datosFormulario.value.tt_aprox,
          recargos: datosFormulario.value.recargos,
          agente: datosFormulario.value.agente,
          vigencia_desde: moment(datosFormulario.value.vigencia_desde).format("YYYY-MM-DD"),
          vigencia_hasta: moment(datosFormulario.value.vigencia_hasta).format("YYYY-MM-DD"),
        });
      });
    });
  }
  if (tipo.value == "fcl") {
    datosFormulario.value.puertoOrigen.forEach((ePortOrigin) => {
      datosFormulario.value.puertoDestino.forEach((ePortDestino) => {
        itemsFCL.value.push({
          pais_origen: datosFormulario.value.paisOrigen.pais_descripcion,
          puerto_origen: ePortOrigin.puerto_descripcion,
          pais_destino: datosFormulario.value.paisDestino.pais_descripcion,
          puerto_destino: ePortDestino.puerto_descripcion,
          Tipo_contenedor: datosFormulario.value.contenedor.contenedores_nombre,
          costo: datosFormulario.value.costo,
          moneda: datosFormulario.value.moneda.moneda_descripcion,
          Naviera: datosFormulario.value.naviera.navieras_nombre,
          vigencia_desde: moment(datosFormulario.value.vigencia_desde).format("YYYY-MM-DD"),
          vigencia_hasta: moment(datosFormulario.value.vigencia_hasta).format("YYYY-MM-DD"),
        });
      });
    });
  }
  if (tipo.value == "aereo") {
    datosFormulario.value.puertoOrigen.forEach((ePortOrigin) => {
      datosFormulario.value.puertoDestino.forEach((ePortDestino) => {
        itemsAereo.value.push({
          pais_origen: datosFormulario.value.paisOrigen.pais_descripcion,
          puerto_origen: ePortOrigin.puerto_descripcion,
          pais_destino: datosFormulario.value.paisDestino.pais_descripcion,
          puerto_destino: ePortDestino.puerto_descripcion,
          volumen_minimo: datosFormulario.value.volumen_minimo,
          volumen_desde: datosFormulario.value.volumen_desde,
          volumen_hasta: datosFormulario.value.volumen_hasta,
          costo_minimo: datosFormulario.value.costo_minimo,
          costo: datosFormulario.value.costo,
          moneda: datosFormulario.value.moneda.moneda_descripcion,
          servicio: datosFormulario.value.servicio,
          frecuencia: datosFormulario.value.frecuencia,
          cortes: datosFormulario.value.cortes,
          carrier_tt: datosFormulario.value.carrier_tt,
          agente: datosFormulario.value.agente,
          vigencia_desde: moment(datosFormulario.value.vigencia_desde).format("YYYY-MM-DD"),
          vigencia_hasta: moment(datosFormulario.value.vigencia_hasta).format("YYYY-MM-DD"),
        });
      });
    });
    offcanvas.value = false;
  }
  limpiarNuevoRegistro();
  offcanvas.value = false;
  subir.value = true;
}
function limpiarNuevoRegistro() {
  datosFormulario.value = formularioVacio();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validar() {
  // var vm = this
  // if () {
  // }
}
onMounted(async () => {
  appStore.spiner = true;
  await appStore._getPais();
  await monedasStore.CargarMoneda();
  await calculadorasStore.CargarSucursal();
  await calculadorasStore.CargarnavieraCalc();
  await calculadorasStore.CargarcontendedorCalc();

  appStore.spiner = false;
});

watch(excel, () => {
  // @ts-expect-error never true, an array literal is a new object
  if (excel.value == null || excel.value == []) {
    procesarflag.value = false;
    itemsLCL.value = [];
    itemsFCL.value = [];
    itemsAereo.value = [];
  } else {
    procesarflag.value = true;
  }
});
</script>

<template
  fluid
  class=""
>
  <v-container class="elevation-5 px-2">
    <v-row>
      <v-col cols="12">
        <label for=""> Seleccione una opción: </label>
      </v-col>
      <v-col cols="4">
        <v-radio-group
          v-model="tipo"
          inline
          hide-details
          density="compact"
          :click="change()"
        >
          <v-radio
            label="LCL"
            value="lcl"
          />
          <v-radio
            label="FCL"
            value="fcl"
          />
          <v-radio
            label="AÉREO"
            value="aereo"
          />
        </v-radio-group>
      </v-col>
      <v-col cols="4">
        <v-file-input
          show-size
          density="compact"
          v-model="excel"
          label="Excel"
          placeholder="Seleccione un archivo"
          id="excel"
          hide-details
          @click:clear="subir = false"
          @update:model-value="subir = false"
          @click="subir = false"
        />
      </v-col>
      <v-col cols="4">
        <v-btn
          color="warning"
          @click="procesarExcel()"
          :loading="procesando"
          v-if="!subir"
          class="mx-1"
          size="small"
          :disabled="!procesarflag"
        >
          Procesar
        </v-btn>
        <v-btn
          color="success"
          :loading="procesando"
          v-if="subir"
          class="mx-1"
          size="small"
          @click="registrarFlag = true"
        >
          REGISTRAR
        </v-btn>
        <v-btn
          color="info"
          :loading="procesando2"
          class="mx-1"
          size="small"
          @click="exportarFormato()"
        >
          Descargar Formato
        </v-btn>
        <v-btn
          color="default"
          class="mx-1"
          size="small"
          @click="offcanvas = !offcanvas"
        >
          Nuevo Registro
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        class="mt-2"
        v-if="tipo == 'lcl'"
      >
        <v-data-table
          :headers="headerLCL"
          :items="itemsLCL"
          class="elevation-1"
          item-value="id"
          density="compact"
          :items-per-page="10"
        />
      </v-col>
      <v-col
        cols="12"
        class="mt-2"
        v-if="tipo == 'fcl'"
      >
        <v-data-table
          :headers="headerFCL"
          :items="itemsFCL"
          class="elevation-1"
          item-value="id"
          density="compact"
          :items-per-page="10"
        />
      </v-col>
      <v-col
        cols="12"
        class="mt-2"
        v-if="tipo == 'aereo'"
      >
        <v-data-table
          :headers="headerAereo"
          :items="itemsAereo"
          class="elevation-1"
          item-value="id"
          density="compact"
          :items-per-page="10"
        />
      </v-col>
    </v-row>
    <v-dialog
      v-model="registrarFlag"
      max-width="50%"
      transition="dialog-transition"
      persistent
    >
      <v-card>
        <v-card-title primary-title>
          REGISTRO DE TARIFAS
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="calculadorasStore.listSucursal"
            item-value="paises_id"
            item-title="paises_nombre"
            label="Sucursal(s)"
            multiple
            placeholder="Selecciones un(as) sucursal(es)"
            v-model="sucursales"
            chips
            clearable
            closable-chips
          />
          <v-radio-group
            v-model="importacionflag"
            inline
            hide-details
            density="compact"
          >
            <v-radio
              label="Importación"
              value="true"
            />
            <v-radio
              label="Exportación"
              value="false"
            />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            :loading="procesando"
            @click="registrar()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="warning"
            @click="registrarFlag = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-if="offcanvas"
      v-model="offcanvas"
      temporary
      location="right"
      width="28%"
      class="px-2"
    >
      <v-card elevation="5">
        <v-card-title primary-title>
          Nuevo Registro
          {{ tipo == "lcl" ? "LCL" : tipo == "fcl" ? "FCL" : "Aéreo" }}
        </v-card-title>

        <v-card-actions class="mt-5">
          <v-row>
            <!-- PAIS ORIGEN -->
            <v-col cols="12">
              <v-autocomplete
                :items="appStore.itemsPais"
                v-model="datosFormulario.paisOrigen as unknown as Pais"
                item-title="pais_descripcion"
                label="País de Origen"
                placeholder="Seleccione un país"
                clearable
                density="compact"
                return-object
                hide-details
                hide-selected
                hide-no-data
                @update:model-value="cargarPuertoOrigen"
                prepend-icon="mdi-ferry"
              />
            </v-col>
            <!-- PUERTO ORIGEN -->
            <v-col cols="12">
              <v-autocomplete
                :items="puertosOrigen"
                v-model="datosFormulario.puertoOrigen"
                item-title="puerto_descripcion"
                label="Puerto de Origen"
                placeholder="Seleccione un puerto"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                multiple
                density="compact"
                closable-chips
                chips
                prepend-icon="mdi-ferry"
              />
            </v-col>
            <!-- PAIS DESTINO -->
            <v-col cols="12">
              <v-autocomplete
                :items="appStore.itemsPais"
                v-model="datosFormulario.paisDestino as unknown as Pais"
                item-title="pais_descripcion"
                label="País de Destino"
                placeholder="Seleccione un país"
                clearable
                return-object
                hide-details
                density="compact"
                @update:model-value="cargarPuertoDestino"
                prepend-icon="mdi-import"
              />
            </v-col>
            <!-- PUERTO DSTINO -->
            <v-col cols="12">
              <v-autocomplete
                :items="puertosDestino"
                v-model="datosFormulario.puertoDestino"
                item-title="puerto_descripcion"
                label="Puerto de Destino"
                placeholder="Seleccione un puerto"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                multiple
                density="compact"
                prepend-icon="mdi-import"
                closable-chips
                chips
              />
            </v-col>
            <!-- CONTENEDOR -->
            <v-col
              cols="12"
              v-if="tipo == 'fcl'"
            >
              <v-autocomplete
                :items="undeclaredAppState.calculadora.contendedorCalc"
                v-model="datosFormulario.contenedor"
                item-title="contenedores_nombre"
                label="Tipo de Contenedor"
                placeholder="Seleccione un tipo Contenedor"
                clearable
                density="compact"
                return-object
                hide-details
                hide-selected
                hide-no-data
                prepend-icon="mdi-truck-cargo-container"
              />
            </v-col>
            <!-- MONTO MÍNIMO -->
            <v-col
              cols="4"
              v-if="tipo != 'fcl'"
            >
              <v-text-field
                label="Volumen Mínimo"
                v-model="datosFormulario.volumen_minimo"
                step="0.01"
                type="number"
                suffix="m3"
                density="compact"
              />
            </v-col>
            <!-- VOLUMEN DESDE -->
            <v-col
              cols="4"
              v-if="tipo != 'fcl'"
            >
              <v-text-field
                label="Volumen Desde"
                v-model="datosFormulario.volumen_desde"
                step="0.01"
                type="number"
                suffix="m3"
                density="compact"
              />
            </v-col>
            <!-- VOLUMEN HASTA -->
            <v-col
              cols="4"
              v-if="tipo != 'fcl'"
            >
              <v-text-field
                label="Volumen Hasta"
                v-model="datosFormulario.volumen_hasta"
                step="0.01"
                type="number"
                suffix="m3"
                density="compact"
              />
            </v-col>

            <!-- MONEDA -->
            <v-col cols="4">
              <v-autocomplete
                :items="undeclaredAppState.moneda.moneda"
                v-model="datosFormulario.moneda"
                item-title="moneda_descripcion"
                label="Moneda"
                placeholder="Seleccione una moneda"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                density="compact"
                @update:model-value="obtenerSimbol()"
              />
            </v-col>
            <!-- COSTO MÍNIMO -->
            <v-col
              cols="4"
              v-if="tipo != 'fcl'"
            >
              <v-text-field
                label="Costo mínimo"
                v-model="datosFormulario.costo_minimo"
                step="0.01"
                type="number"
                :prefix="symbol"
                density="compact"
              />
            </v-col>

            <!-- COSTO -->
            <v-col cols="4">
              <v-text-field
                label="Costo"
                v-model="datosFormulario.costo"
                step="0.01"
                type="number"
                :prefix="symbol"
                density="compact"
              />
            </v-col>
            <!-- SERVICIO -->
            <v-col
              cols="6"
              v-if="tipo != 'fcl'"
            >
              <v-text-field
                label="SERVICIO/ VÍA/ TRANSBORDO"
                v-model="datosFormulario.servicio"
                density="compact"
              />
            </v-col>
            <!-- FRECUENCIA -->
            <v-col
              cols="6"
              v-if="tipo != 'fcl'"
            >
              <v-autocomplete
                item-title="text"
                :items="frecuencias"
                v-model="datosFormulario.frecuencia"
                label="Frecuencia"
                placeholder="Seleccione una frecuencia"
                clearable
                hide-details
                hide-selected
                hide-no-data
                density="compact"
              />
            </v-col>
            <!--  TT APROX -->
            <v-col
              cols="6"
              v-if="tipo == 'lcl'"
            >
              <v-text-field
                label="T.T APROX"
                v-model="datosFormulario.tt_aprox"
                step="0.01"
                type="number"
                density="compact"
              />
            </v-col>
            <!-- RECARGOS -->
            <v-col
              cols="6"
              v-if="tipo == 'lcl'"
            >
              <v-text-field
                label="Recargos"
                v-model="datosFormulario.recargps"
                density="compact"
              />
            </v-col>
            <!-- AGENTES -->
            <v-col
              cols="12"
              v-if="tipo != 'fcl'"
            >
              <v-text-field
                label="Agente"
                v-model="datosFormulario.agente"
                density="compact"
              />
            </v-col>
            <!-- NAVIERA -->
            <v-col
              cols="12"
              v-if="tipo == 'fcl'"
            >
              <v-autocomplete
                :items="undeclaredAppState.calculadora.navieraCalc"
                v-model="datosFormulario.naviera"
                item-title="navieras_nombre"
                label="Naviera"
                placeholder="Seleccione un Naviera"
                clearable
                return-object
                hide-details
                hide-selected
                hide-no-data
                density="compact"
                prepend-icon="mdi-shipping-pallet"
              />
            </v-col>
            <!-- CORTES -->
            <v-col
              cols="6"
              v-if="tipo == 'aereo'"
            >
              <v-text-field
                label="Cortes"
                v-model="datosFormulario.cortes"
                density="compact"
              />
            </v-col>
            <!--  CARRIER TT  -->
            <v-col
              cols="6"
              v-if="tipo == 'aereo'"
            >
              <v-text-field
                label="Carrier T.T "
                v-model="datosFormulario.carrier_tt"
                step="0.01"
                type="number"
                density="compact"
              />
            </v-col>
            <!-- FECHA DE VALIDEZ -->
            <v-col cols="12">
              <label for="">VALIDEZ</label>
            </v-col>
            <!-- DEDE -->
            <v-col cols="6">
              <v-text-field
                label="Desde"
                v-model="datosFormulario.vigencia_desde"
                density="compact"
                type="date"
              />
            </v-col>
            <!-- HASTA -->
            <v-col cols="6">
              <v-text-field
                label="Hasta"
                v-model="datosFormulario.vigencia_hasta"
                density="compact"
                type="date"
              />
            </v-col>
          </v-row>
        </v-card-actions>
        <v-card-actions>
          <div class="flex-grow-1 text-right">
            <v-btn
              class="mx-1"
              variant="text"
              color="success"
              @click="anadirRegistros()"
            >
              Agregar
            </v-btn>
            <v-btn
              class="mx-1"
              variant="text"
              color="red"
              @click="offcanvas = false"
            >
              Cancelar
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
