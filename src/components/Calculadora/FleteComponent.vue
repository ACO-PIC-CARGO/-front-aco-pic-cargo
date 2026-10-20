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
import { usePricingStore } from "@/stores/pricing";
import type { ApiResponse } from "@/types/api";
import type {
  FilaCargaFlete,
  FormRegistroFlete,
  MensajeCalculadora,
  OpcionRegistroFlete,
  PuertoCalculadora,
  ValidacionCarga,
} from "@/types/calculadora";

const props = withDefaults(defineProps<{ type?: string; idModality?: number }>(), {
  type: "FCL",
  idModality: 1,
});

const calculadorasStore = useCalculadorasStore();
const appStore = useAppStore();
const undeclaredAppState = appStore as typeof appStore & {
  calculadora: { contendedorCalc: unknown[]; navieraCalc: unknown[] };
  moneda: { moneda: unknown[] };
};
const pricingStore = usePricingStore();

// The old form starts every single selection as an empty array.
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

const tipoSelected = ref("LCL");
const excel = ref<File | null>(null);
const count = ref(0);
const subir = ref(false);
const procesando = ref(false);
const procesando2 = ref(false);
const procesando3 = false;
const sucursales = ref<(number | string)[] | null>(null);
const registrarFlag = ref(false);
const offcanvas = ref(false);
const importacionflag = ref("true");
const symbol = ref("");
const macroLCL =
  "https://api.agentedecargaonline.com/uploads/MACRO_CARLOS_AGOSTO_2026_08_11_11_43_00.xlsm";
const headerLCL = [
  // { text: "PAIS ORIGEN", value: "pais_origen", sortable: false },
  { title: "Pais Origen", key: "pais_origen", sortable: false },
  { title: "Puerto Origen", key: "puerto_origen", sortable: false },
  {
    title: "Puerto Origen Según Sistema",
    key: "puerto_origen_sistema",
    sortable: false,
  },
  { title: "Pais Origen", key: "pais_destino", sortable: false },
  { title: "Puertos Origen", key: "puerto_destino", sortable: false },
  {
    title: "Puertos Origen Según Sistema",
    key: "puerto_destino_sistema",
    sortable: false,
  },
  { title: "0.1 a 5 cbm	", key: "flete_0_5", sortable: false },
  { title: "5.01 a 10 cbm	", key: "flete_5_10", sortable: false },
  { title: "10.01 a 15 cbm", key: "flete_10_15", sortable: false },
  { title: "Moneda", key: "moneda", sortable: false },
  { title: "Vigencia", key: "vigencia", sortable: false },
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
// Never declared in the old component, so it always reads undefined.
const moneda = undefined as OpcionRegistroFlete | undefined;

// async guardarDatos() {
//   let data = {};
//   if (this.itemsAereo.length > 0) {
//     if (
//       this.itemsAereo.some(
//         (v) =>
//           v.id_pais_destino == "" ||
//           v.id_pais_destino == null ||
//           v.id_pais_origen == "" ||
//           v.id_pais_origen == null,
//       )
//     ) {
//       Swal.fire({ icon: "warning", text: "Falta Completar Datos" });
//       return;
//     }
//     data = {
//       costos: this.itemsAereo,
//       shipment: "Aereo",
//       id_modality: 1,
//     };
//   }
//   if (this.itemsFCL.length > 0) {
//     if (
//       this.itemsFCL.some(
//         (v) =>
//           v.id_pais_destino == "" ||
//           v.id_pais_destino == null ||
//           v.id_pais_origen == "" ||
//           v.id_pais_origen == null,
//       )
//     ) {
//       Swal.fire({ icon: "warning", text: "Falta Completar Datos" });
//       return;
//     }
//     data = {
//       costos: this.itemsFCL,
//       shipment: "FCL",
//       id_modality: 1,
//     };
//   }
//   if (this.itemsLCL.length > 0) {
//     if (
//       this.itemsLCL.some(
//         (v) =>
//           v.id_pais_destino == "" ||
//           v.id_pais_destino == null ||
//           v.id_pais_origen == "" ||
//           v.id_pais_origen == null,
//       )
//     ) {
//       Swal.fire({ icon: "warning", text: "Falta Completar Datos" });
//       return;
//     }
//     data = {
//       costos: this.itemsLCL,
//       shipment: "LCL",
//       id_modality: 1,
//     };
//   }
//   this.postGuardarCostos(data);
// },
async function guardarDatos() {
  let data = {};

  // Validación para Aéreo
  if (itemsAereo.value.length > 0) {
    if (
      itemsAereo.value.some(
        (v) =>
          v.id_pais_destino == "" ||
          v.id_pais_destino == null ||
          v.id_pais_origen == "" ||
          v.id_pais_origen == null ||
          // Nuevas validaciones de puertos agregadas aquí:
          v.puerto_origen == "" ||
          v.puerto_origen == null ||
          v.puerto_destino == "" ||
          v.puerto_destino == null,
      )
    ) {
      Swal.fire({
        icon: "warning",
        text: "Falta Completar Datos (País o Puerto)",
      });
      return;
    }
    data = {
      costos: itemsAereo.value,
      shipment: "Aereo",
      id_modality: 1,
    };
  }

  // Validación para FCL
  if (itemsFCL.value.length > 0) {
    if (
      itemsFCL.value.some(
        (v) =>
          v.id_pais_destino == "" ||
          v.id_pais_destino == null ||
          v.id_pais_origen == "" ||
          v.id_pais_origen == null ||
          // Nuevas validaciones de puertos agregadas aquí:
          v.puerto_origen == "" ||
          v.puerto_origen == null ||
          v.puerto_destino == "" ||
          v.puerto_destino == null,
      )
    ) {
      Swal.fire({
        icon: "warning",
        text: "Falta Completar Datos (País o Puerto)",
      });
      return;
    }
    data = {
      costos: itemsFCL.value,
      shipment: "FCL",
      id_modality: 1,
    };
  }

  // Validación para LCL
  if (itemsLCL.value.length > 0) {
    const puerto_origen = itemsLCL.value.map((v) => {
      return v.puerto_origen;
    });
    const puerto_destino = itemsLCL.value.map((v) => {
      return v.puerto_destino;
    });
    console.log("puerto_origen", puerto_origen);
    console.log("puerto_destino", puerto_destino);
    const listBeginPorts = pricingStore.listPortBegin.map(
      (p): unknown => p.puerto,
    );
    const listEndPorts = pricingStore.listPortEnd.map(
      (p): unknown => p.puerto,
    );
    console.log("listBeginPorts", listBeginPorts);
    console.log("listEndPorts", listEndPorts);
    // 3. Validas si alguno de los puertos extraídos NO se encuentra en el listado del store
    const origenInvalido = puerto_origen.some(
      (puerto) => !listBeginPorts.includes(puerto),
    );
    const destinoInvalido = puerto_destino.some(
      (puerto) => !listEndPorts.includes(puerto),
    );
    console.log("origenInvalido", origenInvalido);
    console.log("destinoInvalido", destinoInvalido);
    if (
      itemsLCL.value.some(
        (v) =>
          v.id_pais_destino == "" ||
          v.id_pais_destino == null ||
          v.id_pais_origen == "" ||
          v.id_pais_origen == null ||
          // Nuevas validaciones de puertos agregadas aquí:
          v.puerto_origen == "" ||
          v.puerto_origen == null ||
          v.puerto_destino == "" ||
          v.puerto_destino == null,
      ) ||
      origenInvalido ||
      destinoInvalido
    ) {
      Swal.fire({
        icon: "warning",
        text: "Falta Completar Datos (País o Puerto)",
      });
      return;
    }
    data = {
      costos: itemsLCL.value,
      shipment: "LCL",
      id_modality: 1,
    };
  }

  calculadorasStore.postGuardarCostos(data);
}

async function procesarExcel() {
  const file = document.getElementById("excel") as HTMLInputElement;
  const validacionFormato = await validarCabecerasExcel(file.files![0]!);

  if (validacionFormato == true) {
    switch (props.type) {
      case "LCL":
        readXlsFile(file.files![0]!).then((rows) => {
          procesarLCL(rows);
        });
        break;
      case "FCL":
        readXlsFile(file.files![0]!).then((rows) => {
          procesarFCL(rows);
        });
        break;
      case "AEREO":
        readXlsFile(file.files![0]!).then((rows) => {
          procesarAereo(rows);
        });
        break;

      default:
        break;
    }
  }
}
function exportarMacro() {
  if (props.type == "LCL") {
    const link = document.createElement("a");
    link.href = macroLCL;
    // Forzamos el nombre con el que se va a descargar
    link.setAttribute("download", "MACRO_CARLOS.xlsm");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
function exportarFormato() {
  procesando2.value = true;
  let data: Record<string, string>[] = [];
  let fileName = "";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const exportType = exportXlsFile.types.xls;
  let url = `${import.meta.env.VITE_URL_MAIN}uploads/`;
  switch (props.type) {
    case "LCL":
      url += `FORMATO_LCL_CARGA_FELTE.xlsx`;
      window.open(url, "blank");
      procesando2.value = false;
      break;
    case "FCL":
      data = [
        {
          pais_origen: "",
          puerto_origen: "",
          pais_destino: "",
          puerto_destino: "",
          contenedor_20_C: "",
          contenedor_40_st: "",
          contenedor_40_hc: "",
          contenedor_40_nor: "",
          vigencia_hasta: "",
        },
      ];
      url += `FormatoFCL.xlsx`;
      window.open(url, "blank");
      procesando2.value = false;
      break;
    case "AEREO":
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fileName = "FORMATO AÉREO";

      break;

    default:
      break;
  }
  setTimeout(() => {
    // exportXlsFile({ data, fileName, exportType });
    // this.procesando2 = false;
  }, 800);
}
async function procesarLCL(rows: Row[]) {
  procesando.value = true;
  const datos: FilaCargaFlete[] = [];
  for (let index = 0; index < rows.length; index++) {
    if (index > 0) {
      datos.push({
        pais_origen: rows[index]![0],
        puerto_origen: rows[index]![1] ? (rows[index]![1] as string).toUpperCase() : null,
        pais_destino: rows[index]![2],
        puerto_destino: rows[index]![3]
          ? (rows[index]![3] as string).toUpperCase()
          : null,
        flete_0_5: rows[index]![4],
        flete_5_10: rows[index]![5],
        flete_10_15: rows[index]![6],
        moneda: rows[index]![7],
        // vigencia: moment(rows[index][8]).format("YYYY-MM-DD"),
        vigencia: moment.utc(rows[index]![8] as moment.MomentInput).format("YYYY-MM-DD")
      });
    }
  }
  // empezar a validar los datos
  const datosValidar: FilaCargaFlete[] = [];

  datos.map(function (element) {
    datosValidar.push(element);
  });
  const val = await calculadorasStore.GetCotValLCL(datosValidar);
  itemsLCL.value = val;
  // // empezar a validar los datos

  // let pais_origen2 = [];
  // let puerto_origen2 = [];
  // let pais_destino2 = [];
  // let puerto_destino2 = [];
  // let volumen_minimo2 = [];
  // let volumen_desde2 = [];
  // let volumen_hasta2 = [];
  // let costo_minimo2 = [];
  // let costo2 = [];
  // let moneda2 = [];
  // let servicio2 = [];
  // let frecuencia2 = [];
  // let tt_aprox2 = [];
  // let recargos2 = [];
  // let agente2 = [];
  // let vigencia_desde2 = [];
  // let vigencia_hasta2 = [];

  // datos.forEach((element) => {
  //   pais_origen2.push(element.pais_origen);
  //   puerto_origen2.push(element.puerto_origen);
  //   pais_destino2.push(element.pais_destino);
  //   puerto_destino2.push(element.puerto_destino);
  //   volumen_minimo2.push(element.volumen_minimo);
  //   volumen_desde2.push(element.volumen_desde);
  //   volumen_hasta2.push(element.volumen_hasta);
  //   costo_minimo2.push(element.costo_minimo);
  //   costo2.push(element.costo);
  //   moneda2.push(element.moneda);
  //   servicio2.push(element.servicio);
  //   frecuencia2.push(element.frecuencia);
  //   tt_aprox2.push(element.tt_aprox);
  //   recargos2.push(element.recargos);
  //   agente2.push(element.agente);
  //   vigencia_desde2.push(
  //     moment(element.vigencia_desde).format("YYYY-MM-DD")
  //   );
  //   vigencia_hasta2.push(
  //     moment(element.vigencia_hasta).format("YYYY-MM-DD")
  //   );
  // });
  // //  AXIOS
  // var headers = {
  //
  //   "Content-Type": "application/json",
  // };
  // var data = {
  //   id_branch: JSON.parse(sessionStorage.getItem("branch")),
  //   pais_origen: pais_origen2,
  //   puerto_origen: puerto_origen2,
  //   pais_destino: pais_destino2,
  //   puerto_destino: puerto_destino2,
  //   volumen_minimo: volumen_minimo2,
  //   volumen_desde: volumen_desde2,
  //   volumen_hasta: volumen_hasta2,
  //   costo_minimo: costo_minimo2,
  //   costo: costo2,
  //   moneda: moneda2,
  //   servicio: servicio2,
  //   frecuencia: frecuencia2,
  //   tt_aprox: tt_aprox2,
  //   recargos: recargos2,
  //   agente: agente2,
  //   vigencia_desde: vigencia_desde2,
  //   vigencia_hasta: vigencia_hasta2,
  // };
  // var config = {
  //   method: "post",
  //   url: import.meta.env.VITE_URL_MAIN + `validar_registros_lcl`,
  //   headers: headers,
  //   data: data,
  // };

  // let response = await axios(config).then((response) => {
  //   return response.data;
  // });

  // if (response.estadoflag == true) {
  //   vm.subir = true;
  //   datosValidar.map(function (element) {
  //     vm.itemsLCL.push(element);
  //   });
  // } else {
  //   let text =
  //     response.permiso == false
  //       ? "EXISTEN DATOS POR CORREGIR. NO SE CARGARÁN LOS DATOS."
  //       : " ";
  //   Swal.fire({
  //     title: `OJO ATENCION  LEER BIEN. .${text}`,
  //     icon: "error",
  //     width: "80%",
  //     scrollbarPadding: true,
  //     html: `<div style="font-size: 1.5rem">${response.mensaje}</div>`,
  //     showDenyButton: true,
  //     confirmButtonText: "Aceptar",
  //     denyButtonText: `Corregir Errores`,
  //   }).then((result) => {
  //     /* Read more about isConfirmed, isDenied below */
  //     if (result.isConfirmed) {
  //       datosValidar.map(function (element) {
  //         vm.itemsLCL.push(element);
  //       });
  //       vm.subir = true;
  //     } else if (result.isDenied) {
  //       Swal.fire(
  //         "No se cargaron los REGISTROS procese un nuevo documento.",
  //         "",
  //         "info"
  //       );
  //     }
  //   });
  // }

  procesando.value = false;
}
async function procesarFCL(rows: Row[]) {
  procesando.value = true;
  const datos: FilaCargaFlete[] = [];

  for (let index = 0; index < rows.length; index++) {
    if (index > 0) {
      datos.push({
        pais_origen: rows[index]![0],
        puerto_origen: rows[index]![1],
        pais_destino: rows[index]![2],
        puerto_destino: rows[index]![3],
        contenedor_20_C: rows[index]![4],
        contenedor_40_st: rows[index]![5],
        contenedor_40_hc: rows[index]![6],
        contenedor_40_nor: rows[index]![7],
        vigencia_hasta: rows[index]![8],
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
  const contenedor_20_C2: unknown[] = [];
  const contenedor_40_st2: unknown[] = [];
  const contenedor_40_hc2: unknown[] = [];
  const contenedor_40_nor2: unknown[] = [];
  const vigencia_hasta2: unknown[] = [];

  datos.forEach((element) => {
    pais_origen2.push(element.pais_origen);
    puerto_origen2.push(element.puerto_origen);
    pais_destino2.push(element.pais_destino);
    puerto_destino2.push(element.puerto_destino);
    contenedor_20_C2.push(element.contenedor_20_C);
    contenedor_40_st2.push(element.contenedor_40_st);
    contenedor_40_hc2.push(element.contenedor_40_hc);
    contenedor_40_nor2.push(element.contenedor_40_nor);
    vigencia_hasta2.push(
      moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"),
    );
  });
  const headers = {
    "Content-Type": "application/json",
  };
  const data = {
    id_branch: JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch,
    pais_origen: pais_origen2,
    puerto_origen: puerto_origen2,
    pais_destino: pais_destino2,
    puerto_destino: puerto_destino2,
    contenedor_20_C: contenedor_20_C2,
    contenedor_40_st: contenedor_40_st2,
    contenedor_40_hc: contenedor_40_hc2,
    contenedor_40_nor: contenedor_40_nor2,
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
          "info",
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
    vigencia_desde2.push(
      moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"),
    );
    vigencia_hasta2.push(
      moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"),
    );
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
          "info",
        );
      }
    });
  }

  procesando.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function change() {
  if (tipoSelected.value != props.type) {
    Swal.fire({
      icon: "info",
      title: "Advertencia",
      showDenyButton: true,
      denyButtonText: `Regresar`,
      text: `Va a cambiar de ${
        tipoSelected.value == "LCL"
          ? "LCL"
          : tipoSelected.value == "FCL"
          ? "FLC"
          : "AÉRO"
      } a ${
        props.type == "LCL" ? "LCL" : props.type == "FCL" ? "FLC" : "AÉRO"
      }. Perderá todos los datos procesados. ¿Desea seguro continuar.?`,
      confirmButtonText: "Continuar",
    }).then((result) => {
      if (result.isConfirmed) {
        tipoSelected.value = props.type;
        procesarflag.value = false;
        subir.value = false;
        itemsLCL.value = [];
        itemsFCL.value = [];
        itemsAereo.value = [];
        excel.value = null;
      }
      if (result.isDenied) {
        /* eslint-disable vue/no-mutating-props */
        // @ts-expect-error Kept: writes the read-only type prop
        props.type = tipoSelected.value;
        /* eslint-enable vue/no-mutating-props */
      }
    });
  }
}
async function validarCabecerasExcel(data: File) {
  let count = 0;
  let validacion = true as boolean;
  const headerLCL = [
    { name: "pais_origen" },
    { name: "puerto_origen" },
    { name: "pais_destino" },
    { name: "puerto_destino" },
    { name: "flete_0_5" },
    { name: "flete_5_10" },
    { name: "flete_10_15" },
    { name: "moneda" },
    { name: "vigencia" },
  ];
  const headerFCL = [
    { name: "pais_origen" },
    { name: "puerto_origen" },
    { name: "pais_destino" },
    { name: "puerto_destino" },
    { name: "contenedor_20_C" },
    { name: "contenedor_40_st" },
    { name: "contenedor_40_hc" },
    { name: "contenedor_40_nor" },
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
  switch (props.type) {
    case "LCL":
      datosExcel.forEach((element) => {
        count = headerLCL.filter((v) => v.name == element).length;
        if (count == 0) {
          validacion = false;
        }
      });
      break;
    case "FCL":
      datosExcel.forEach((element) => {
        count = headerFCL.filter((v) => v.name == element).length;
        if (count == 0) {
          validacion = false;
        }
      });
      break;
    case "AEREO":
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
      text: "El archivo seleccionado, no coincide con el type seleccionado.",
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
  if (props.type == "LCL") {
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
      vigencia_desde.push(
        moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"),
      );
      vigencia_hasta.push(
        moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"),
      );
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
  if (props.type == "FCL") {
    itemsFCL.value.forEach((element) => {
      Tipo_contenedor.push(element.Tipo_contenedor);
      costo.push(element.costo);
      moneda.push(element.moneda);
      Naviera.push(element.Naviera);
      pais_origen.push(element.pais_origen);
      puerto_origen.push(element.puerto_origen);
      pais_destino.push(element.pais_destino);
      puerto_destino.push(element.puerto_destino);
      vigencia_desde.push(
        moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"),
      );
      vigencia_hasta.push(
        moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"),
      );
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
  if (props.type == "AEREO") {
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
        vigencia_desde.push(
          moment(element.vigencia_desde as moment.MomentInput).format("YYYY-MM-DD"),
        );
      vigencia_hasta.push(
        moment(element.vigencia_hasta as moment.MomentInput).format("YYYY-MM-DD"),
      );
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
  tipoSelected.value = "LCL";
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
      type: "M",
    });
  }
}
async function cargarPuertoOrigen() {
  puertosOrigen.value = [];
  if (datosFormulario.value.paisOrigen) {
    puertosOrigen.value = await calculadorasStore.CargarPuertoPorTipoPorPais({
      id_pais: datosFormulario.value.paisOrigen.pais_id,
      type: "M",
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
  if (props.type == "LCL") {
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
          vigencia_desde: moment(datosFormulario.value.vigencia_desde).format(
            "YYYY-MM-DD",
          ),
          vigencia_hasta: moment(datosFormulario.value.vigencia_hasta).format(
            "YYYY-MM-DD",
          ),
        });
      });
    });
  }
  if (props.type == "FCL") {
    datosFormulario.value.puertoOrigen.forEach((ePortOrigin) => {
      datosFormulario.value.puertoDestino.forEach((ePortDestino) => {
        itemsFCL.value.push({
          pais_origen: datosFormulario.value.paisOrigen.pais_descripcion,
          puerto_origen: ePortOrigin.puerto_descripcion,
          pais_destino: datosFormulario.value.paisDestino.pais_descripcion,
          puerto_destino: ePortDestino.puerto_descripcion,
          Tipo_contenedor:
            datosFormulario.value.contenedor.contenedores_nombre,
          costo: datosFormulario.value.costo,
          moneda: datosFormulario.value.moneda.moneda_descripcion,
          Naviera: datosFormulario.value.naviera.navieras_nombre,
          vigencia_desde: moment(datosFormulario.value.vigencia_desde).format(
            "YYYY-MM-DD",
          ),
          vigencia_hasta: moment(datosFormulario.value.vigencia_hasta).format(
            "YYYY-MM-DD",
          ),
        });
      });
    });
  }
  if (props.type == "AEREO") {
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
          vigencia_desde: moment(datosFormulario.value.vigencia_desde).format(
            "YYYY-MM-DD",
          ),
          vigencia_hasta: moment(datosFormulario.value.vigencia_hasta).format(
            "YYYY-MM-DD",
          ),
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
  const maritimo = ["LCL", "FCL"];
  appStore.spiner = true;
  Promise.all([
    appStore._getPais(),
    pricingStore.getPortBegin({
      id_transport: maritimo.includes(props.type) ? 1 : 2,
      limit: -1,
    }),
    pricingStore.getPortEnd({
      id_transport: maritimo.includes(props.type) ? 1 : 2,
      limit: -1,
    }),
  ]);
  // await this.CargarMoneda();
  // await this.CargarSucursal();
  // await this.CargarnavieraCalc();
  // await this.CargarcontendedorCalc();

  appStore.spiner = false;
});

watch(excel, () => {
  // @ts-expect-error Kept: never true, an array literal is a new object
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
  <v-container
    class="elevation-5 px-2"
    fluid
  >
    <v-row>
      <v-col>
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
      <v-col>
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
          color="info"
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
          color="#1D6F42"
          :loading="procesando3"
          class="mx-1"
          size="small"
          @click="exportarMacro()"
        >
          Descargar Macro
        </v-btn>
        <!-- <v-btn
          color="default"
          class="mx-1"
          small
          @click="offcanvas = !offcanvas"
        >
          Nuevo Registro
        </v-btn> -->
        <!-- @vue-expect-error Kept: compares the air item list with 0 -->
        <v-btn
          color="success"
          class="mx-1"
          size="small"
          @click="guardarDatos"
          :disabled="
            itemsLCL.length == 0 && itemsFCL.length == 0 && itemsAereo == 0
          "
        >
          Guardar
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        class="mt-2"
        v-if="type == 'LCL'"
      >
        <v-data-table
          :headers="headerLCL"
          :items="itemsLCL"
          class="elevation-1"
          item-value="id"
          density="compact"
          :items-per-page="10"
        >
          <template #[`item.puerto_origen_sistema`]="{ item }">
            <v-autocomplete
              :items="
                pricingStore.listPortBegin.filter(
                  (v) => v.id_pais == item.id_pais_origen,
                )
              "
              v-model="item.puerto_origen"
              item-value="puerto"
              item-title="puerto"
            >
              <template #selection="{ item: port, internalItem }">
                <span
                  v-if="typeof port === 'object'"
                  class="v-autocomplete__selection-text"
                >{{ internalItem.title }}</span>
              </template>
            </v-autocomplete>
          </template>
          <template #[`item.puerto_destino_sistema`]="{ item }">
            <v-autocomplete
              :items="
                pricingStore.listPortEnd.filter(
                  (v) => v.id_pais == item.id_pais_destino,
                )
              "
              v-model="item.puerto_destino"
              item-value="puerto"
              item-title="puerto"
            >
              <template #selection="{ item: port, internalItem }">
                <span
                  v-if="typeof port === 'object'"
                  class="v-autocomplete__selection-text"
                >{{ internalItem.title }}</span>
              </template>
            </v-autocomplete>
          </template>
          <template #[`item.pais_origen`]="{ item }">
            <v-autocomplete
              :items="appStore.itemsPais"
              item-value="id"
              item-title="name"
              v-model="item.id_pais_origen"
            />
          </template>
          <template #[`item.pais_destino`]="{ item }">
            <v-autocomplete
              :items="appStore.itemsPais"
              item-value="id"
              item-title="name"
              v-model="item.id_pais_destino"
            />
          </template>
        </v-data-table>
      </v-col>
      <v-col
        cols="12"
        class="mt-2"
        v-if="type == 'FCL'"
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
        v-if="type == 'AEREO'"
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
          {{ type == "LCL" ? "LCL" : type == "FCL" ? "FCL" : "Aéreo" }}
        </v-card-title>

        <v-card-actions class="mt-5">
          <v-row>
            <!-- PAIS ORIGEN -->
            <v-col cols="12">
              <v-autocomplete
                :items="appStore.itemsPais as unknown as OpcionRegistroFlete[]"
                v-model="datosFormulario.paisOrigen"
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
                :items="appStore.itemsPais as unknown as OpcionRegistroFlete[]"
                v-model="datosFormulario.paisDestino"
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
              v-if="type == 'FCL'"
            >
              <v-autocomplete
                :items="undeclaredAppState.calculadora.contendedorCalc"
                v-model="datosFormulario.contenedor"
                item-title="contenedores_nombre"
                label="Tipo de Contenedor"
                placeholder="Seleccione un type Contenedor"
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
              v-if="type != 'FCL'"
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
              v-if="type != 'FCL'"
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
              v-if="type != 'FCL'"
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
              v-if="type != 'FCL'"
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
              v-if="type != 'FCL'"
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
              v-if="type != 'FCL'"
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
              v-if="type == 'LCL'"
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
              v-if="type == 'LCL'"
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
              v-if="type != 'FCL'"
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
              v-if="type == 'FCL'"
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
              v-if="type == 'AEREO'"
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
              v-if="type == 'AEREO'"
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
