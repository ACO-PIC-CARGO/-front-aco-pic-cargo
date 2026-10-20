<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import GuardarUrlPricing from "../comun/GuardarUrlPricing.vue";
import { useSecuritysStore } from "@/stores/securitys";
import { usePricingStore } from "@/stores/pricing";
import { sessionBranchId, sessionUser, sessionUserIdOrEmpty } from "@/utils/sesion";
import type { ApiResponse } from "@/types/api";
import type { RegistroConUrlCarpeta } from "@/types/archivos";
import type {
  CotizacionListado,
  FormNotaLlamada,
  HouseDisponible,
  HouseListado,
} from "@/types/cotizacion";
import type { UsuarioSesion } from "@/types/sesion";

withDefaults(
  defineProps<{ filtrosSeleccionados?: Record<string, unknown> }>(),
  { filtrosSeleccionados: () => ({}) },
);

const router = useRouter();
const rootStore = useStore();
const pricingStore = usePricingStore();
const securitysStore = useSecuritysStore();

const typingTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const dialogUrl = ref(false);
const search = ref("");
const masterEditar = ref<RegistroConUrlCarpeta>({});
const url_folderonedrive = ref<string | null>(null);
const lstPricing = ref(true);
const id_status = ref<number | string | null>(null);
const comentario = ref("");
const dialogRegistroNotaLlamada = ref(false);
const expanded = ref<CotizacionListado[]>([]);
const singleExpand = true;
const loading = ref(false);
const loading2 = ref(false);
const loading3 = ref(false);
const dialog = ref(false);
const fromData = ref<FormNotaLlamada>({
  date: moment().format("YYYY-MM-DD"),
  descripcion: "",
  identities: sessionUserIdOrEmpty(),
});
const aprobarflag = ref(false);
const modalEnlazarHouse = ref(false);
const housesDisponibles = ref<HouseDisponible[]>([]);
const loadingHouses = ref(false);
const quoteSeleccionada = ref<CotizacionListado | null>(null);
const headersHouses = [
  { title: "Código House", key: "codigo" },
  { title: "Master", key: "master" },
  { title: "Cliente", key: "cliente" },
  { title: "Origen", key: "origen" },
  { title: "Destino", key: "destino" },
  { title: "Acciones", key: "actions", sortable: false },
] as const;
const cabCotizaciones = [
  // {
  //   value: "acciones",
  //   text: "",
  //   align: "center",
  //   groupable: true,
  //   estado: true,
  // },
  {
    key: "created",
    title: "FECHA CREACIÓN",
    align: "center",
    groupable: true,
    estado: true,
    dataType: "Date",
  },
  // {
  //   value: "recibidocotizacion",
  //   text: "RECIBIDO COTIZACION EN PRICING",
  //   align: "center",
  //   groupable: true,
  //   estado: true,
  // },
  // {
  //   value: "enviadocliente",
  //   text: "ENVIADO AL CLIENTE",
  //   align: "center",
  //   groupable: true,
  //   estado: true,
  // },
  {
    key: "status",
    title: "ESTATUS",
    align: "center",
    groupable: true,
    estado: true,
  },

  {
    key: "codigo",
    title: "NÚMERO DE COTIZACIÓN",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "pricing",
    title: "EJECUTIVO PRICING",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "ejecutivo_ventas",
    title: "EJECUTIVO VENTAS",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "nombres",
    title: "CLIENTE",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "telefono",
    title: "TÉLEFONO",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "sentido",
    title: "SENTIDO",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "tipo_de_carga",
    title: "T. C.",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "incoterms",
    title: "INCOTERMS",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "origen",
    title: "ORIGEN",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "destino",
    title: "DESTINO",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "marketing",
    title: "MARKETING",
    align: "center",
    groupable: true,
    estado: true,
  },
  {
    key: "fechaemisionpdf",
    title: "FECHA ENVIADO A CLIENTE",
    align: "center",
  },
] as const;
// filtro: {
//   idmarketing: null,
//   idstatus: null,
//   identities: null,
//   idmodality: null,
//   idshipment: null,
//   idincoterm: null,
//   fechainicio: null,
//   fechafin: null,
//   estado: "activo",
// },
const quote = ref<CotizacionListado | null>(null);
const id_master_recibidocotizacion = ref<number | string>("");
const id_master_enviadocliente = ref<number | string>("");
const fecha_enviocliente = ref("");
const nuevoexpediente = ref(true);
const id_exp = ref<number | string>("");
let fecha_validez: string | undefined;
const frmEstado = useTemplateRef("frmEstado");
const detallenota = useTemplateRef("detallenota");
const frmAprobar = useTemplateRef("frmAprobar");

function mostrarBoton(item: CotizacionListado) {
  if (item.statusmain == 0) {
    return false;
  }
  const aprobado = ([true, 1, "true", "1", "si", "sí", "yes"] as unknown[]).includes(
    typeof item.aprobadoflag === "string"
      ? item.aprobadoflag.trim().toLowerCase()
      : item.aprobadoflag,
  );
  if (aprobado) {
    return false;
  }
  return true;
}
function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) return "";

  return moment(fecha).format("YYYY-MMM-DD").toUpperCase();
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function cambiarPagina() {
  rootStore.state.spiner = true;
  await pricingStore.getListQuote();
  rootStore.state.spiner = false;
}
async function limpiar() {
  rootStore.state.spiner = true;
  pricingStore.filtro = {
    fechainicio: moment().format("YYYY-01-01"),
    fechadesde: moment().format("YYYY-01-01"),
    fechafin: moment().endOf("month").format("YYYY-MM-DD"),
    tipopdf: 1,
  };

  pricingStore.filtro.estado = true;
  await pricingStore.getListQuote();

  pricingStore.filtrarQuoteFlag = false;
  pricingStore.filtro.estado = true;
  rootStore.state.spiner = false;
}
function displayMarketing(item: CotizacionListado) {
  // Prefer server-provided friendly name if present
  if (item.marketing) return item.marketing;
  const id = item.id_marketing || item.idmarketing || item.idMarketing;
  if (!id) return "";
  const m = (pricingStore.listMarketing || []).find(
    (v) => String(v.id) === String(id),
  );
  return m ? m.name : "";
}
function esItemAprobado(item: CotizacionListado) {
  // Verificar por aprobadoflag
  if (item.aprobadoflag === true) return true;

  const statusName = (item.status || "").toString().toUpperCase().trim();
  if (statusName === "APROBADO" || statusName === "APROBADA") return true;

  return false;
}
function esUsuarioAdmin() {
  try {
    const dataUser = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
    if (dataUser && dataUser[0]) {
      const userEmail = dataUser[0].user || dataUser[0].usuario || "";
      return userEmail.toLowerCase() === "cmrg1979a@gmail.com";
    }
  } catch (e) {
    console.error("Error al verificar usuario admin:", e);
  }
  return false;
}
function handleEditar(item: CotizacionListado) {
  if (esItemAprobado(item)) {
    if (esUsuarioAdmin()) {
      ira("editQuote", item.id);
    } else {
      iraAprobado(item.id);
    }
  } else {
    ira("editQuote", item.id);
  }
}
async function iraAprobado(id: number | undefined) {
  let val = false;
  let msg = "";

  await Swal.fire({
    title: "Ingrese sus datos Administrador",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
      '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    focusConfirm: false,
    didOpen: () => {
      // Aquí forzamos el foco manualmente
      document.getElementById("swal-input1")!.focus();
    },
    preConfirm: () => {
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value;
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value;

      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }

      return {
        usuario: input1,
        clave: input2,
      };
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      const res = await securitysStore.validarUsuarioAdmin(result.value);
      val = res!.estadoflag === true;
      msg = res!.mensaje;
    }
  });

  if (!val) {
    if (msg) {
      await Swal.fire({ icon: "error", text: msg });
    }
    return;
  }
  router.push({
    name: "editQuote",
    params: {
      id: id,
    },
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fecha(fecha: string) {
  moment.locale("es");
  const newFecha = moment(fecha).format("YYYY-MMM-DD HH:mm");
  return newFecha;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clickRow(item: CotizacionListado, event: { isExpanded: boolean }) {
  if (event.isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
function toggleRow(item: CotizacionListado) {
  const isExpanded = expanded.value.includes(item);
  if (isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function to_direct({ url }: { url: string }) {
  window.open(url, "_blank");
}
function abrirCaperta(item: CotizacionListado) {
  console.log("item:", item);
  masterEditar.value = { ...item } as RegistroConUrlCarpeta;
  url_folderonedrive.value = "";
  dialogUrl.value = true;
  // window.open(url, "_blank");
}
async function cerrarDialog() {
  console.log("llegó");
  dialogUrl.value = false;
  rootStore.state.spiner = true;
  await pricingStore.getListQuote();
  rootStore.state.spiner = false;
}
function rangoFechaSuperaUnMes(inicio: string | null | undefined, fin: string | null | undefined) {
  const fechaInicio = moment(inicio);
  const fechaFin = moment(fin);
  return (
    fechaInicio.isValid() &&
    fechaFin.isValid() &&
    fechaFin.isAfter(fechaInicio.clone().add(1, "month"), "day")
  );
}
async function reporteListado() {
  const f = pricingStore.filtro;
  const rangoCreacionExcedido = rangoFechaSuperaUnMes(
    f.fechainicio,
    f.fechafin,
  );
  const rangoEmisionExcedido = rangoFechaSuperaUnMes(
    f.fechaemisiondesde,
    f.fechaemisionhasta,
  );

  if (rangoCreacionExcedido || rangoEmisionExcedido) {
    const rangoExcedido =
      rangoCreacionExcedido && rangoEmisionExcedido
        ? "Los rangos de creación y emisión"
        : rangoCreacionExcedido
          ? "El rango de creación"
          : "El rango de emisión";
    await Swal.fire({
      icon: "warning",
      title: "No se puede generar el reporte",
      html: `<strong>${rangoExcedido} supera el máximo permitido.</strong><br>Selecciona un periodo de hasta <strong>1 mes</strong> para continuar.`,
      confirmButtonText: "Revisar fechas",
    });
    return;
  }

  loading2.value = true;
  const filtroSeleccionado: Record<string, string | undefined> = {};
  const store = pricingStore;

  if (f.fechainicio) filtroSeleccionado["Creación De:"] = f.fechainicio;
  if (f.fechafin) filtroSeleccionado["Creación Hasta:"] = f.fechafin;
  if (f.fechaemisiondesde)
    filtroSeleccionado["Fecha de Envío De:"] = f.fechaemisiondesde;
  if (f.fechaemisionhasta)
    filtroSeleccionado["Fecha de Envío Hasta:"] = f.fechaemisionhasta;

  if (f.id_marketing) {
    filtroSeleccionado.Marketing = store.listMarketing.find(
      (v) => v.id == f.id_marketing,
    )?.name;
  }
  if (f.id_status) {
    filtroSeleccionado["Estado Cotización"] = store.listQuoteStatus.find(
      (v) => v.id == f.id_status,
    )?.name;
  }
  if (f.id_pricing) {
    filtroSeleccionado["Ejecutivo Pricing"] = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_pricing,
    )?.name;
  }
  if (f.id_entities && !(f.tipopdf === 2 || (f.tipopdf as unknown) == "2")) {
    filtroSeleccionado["Ejecutivo Venta"] = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_entities,
    )?.name;
  }
  if (f.id_modality) {
    filtroSeleccionado.Modalidad = store.listModality.find(
      (v) => v.id == f.id_modality,
    )?.name;
  }
  if (f.id_shipment) {
    filtroSeleccionado["Tipo Carga"] = store.listShipment.find(
      (v) => v.id == f.id_shipment,
    )?.embarque;
  }
  if (f.id_incoterm) {
    filtroSeleccionado.Incoterms = store.listIncoterms.find(
      (v) => v.id == f.id_incoterm,
    )?.name;
  }

  const filtroCabecera: Record<string, string | undefined> = {};

  if (f.id_marketing) {
    filtroCabecera.Marketing = store.listMarketing.find(
      (v) => v.id == f.id_marketing,
    )?.name;
  }
  if (f.id_status) {
    filtroCabecera.QuoteStatus = store.listQuoteStatus.find(
      (v) => v.id == f.id_status,
    )?.name;
  }
  if (f.id_pricing) {
    filtroCabecera.Pricing = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_pricing,
    )?.name;
  }
  if (f.id_entities && !(f.tipopdf === 2 || (f.tipopdf as unknown) == '2')) {
    filtroCabecera.Ejecutivo = store.listEjecutivo.find(
      (v) => v.id_entitie == f.id_entities,
    )?.name;
  }
  if (f.id_modality) {
    filtroCabecera.Modalidad = store.listModality.find(
      (v) => v.id == f.id_modality,
    )?.name;
  }
  if (f.id_shipment) {
    filtroCabecera.Shipment = store.listShipment.find(
      (v) => v.id == f.id_shipment,
    )?.embarque;
  }
  if (f.id_incoterm) {
    filtroCabecera.Incoterms = store.listIncoterms.find(
      (v) => v.id == f.id_incoterm,
    )?.name;
  }
  if (f.id_cliente) {
    filtroCabecera.Cliente = rootStore.state.clientes.find(
      (v: { id: number | string; namelong: string }) => v.id == f.id_cliente,
    )?.namelong;
  }

  await pricingStore.imprimiReporteListado({
    filtroSeleccionado: filtroSeleccionado,
    filtroCabecera: filtroCabecera,
  }).catch((e) => {
    console.error(e);
  });
  loading2.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function excelListadoQuote() {
  loading3.value = true;
  await pricingStore.exportarExcelListadoQuote().catch((e) => {
    console.error(e);
  });
  loading3.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function imprimirListMercadeo() {
  loading.value = true;
  await pricingStore.imprimirMercadeo().catch((e) => {
    console.error(e);
  });
  loading.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModal(selected: CotizacionListado) {
  quote.value = selected;
  id_master_recibidocotizacion.value = selected.id_master_recibidocotizacion!;
  id_master_enviadocliente.value = selected.id_master_enviadocliente!;
  fecha_enviocliente.value = selected.fecha_enviocliente!;
  dialog.value = true;
}
async function updateQuoteRecibidoEnviado() {
  if ((await frmEstado.value!.validate()).valid) {
    rootStore.state.spiner = true;
    const data = {
      id: quote.value!.id,
      id_master_recibidocotizacion: id_master_recibidocotizacion.value,
      id_master_enviadocliente: id_master_enviadocliente.value,
      fecha_enviocliente: fecha_enviocliente.value,
      id_status: id_status.value,
      comentario: comentario.value,
      id_pricing: sessionUser().id,
    };
    await pricingStore.actualizarQuoteRecibidoEnviado(data);
    await pricingStore.getListQuote();
    dialog.value = false;
    rootStore.state.spiner = false;
    frmEstado.value!.reset();
  }
}
function registrarLlamada(item: CotizacionListado) {
  fromData.value = {
    date: moment().format("YYYY-MM-DD"),
    descripcion: "",
    identities: sessionUserIdOrEmpty(),
  };
  pricingStore.id = item.id!;
  id_status.value = item.statusquote!;
  dialogRegistroNotaLlamada.value = true;
}
async function guardarNota() {
  if ((await detallenota.value!.validate()).valid) {
    dialogRegistroNotaLlamada.value = false;
    rootStore.state.spiner = true;

    const data = {
      id_quote: pricingStore.id,
      id_operador: fromData.value.identities,
      comentario: fromData.value.descripcion,
      fecha: fromData.value.date,
      id_status: id_status.value,
    };

    await pricingStore.guardarNotaQuote(data).catch((err) => {
      console.log(err);
    });
    await pricingStore.getListQuote().catch((err) => {
      console.log(err);
    });

    rootStore.state.spiner = false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalAprobar({ item: item }: { item: CotizacionListado }) {
  quote.value = item;
  nuevoexpediente.value = true;
  id_exp.value = "";
  Swal.fire({
    icon: "question",
    iconColor: "red",
    text: "¿Desea crear un nuevo expediente o seleccionar uno registrado?",
    showConfirmButton: true,
    confirmButtonText: "CREAR NUEVO EXPEDIENTE",
    showDenyButton: true,
    denyButtonText: "SELECCIONAR EXPEDIENTE",
    showCancelButton: true,
    cancelButtonText: "CERRAR",
    allowOutsideClick: false,
  }).then(async (res) => {
    if (res.isConfirmed) {
      Swal.fire({
        icon: "warning",
        title: "Fecha de Validez de la Cotización",
        html: '<input type="date" id="swal-input1" class="swal2-input">',
        allowOutsideClick: false,
        confirmButtonText: "ACEPTAR",
        showCancelButton: true,
        cancelButtonText: "CANCELAR",
        preConfirm: () => {
          const dateInput = (document.getElementById("swal-input1") as HTMLInputElement).value;
          if (!dateInput) {
            Swal.showValidationMessage("La fecha de validez es requerida");
          } else {
            const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
            const currentDate = moment(); // Obtiene la fecha actual

            if (selectedDate.isSameOrBefore(currentDate)) {
              Swal.showValidationMessage(
                "La fecha debe ser mayor que la fecha actual",
              );
            } else {
              return dateInput;
            }
          }
        },
      }).then(async (res) => {
        fecha_validez = res.value;
        if (res.isConfirmed) {
          Swal.fire({
            icon: "info",
            title: "Aprobando Cotizacion",
            timerProgressBar: true,
            allowOutsideClick: false,
            timer: null as unknown as number,
            didOpen: () => {
              Swal.showLoading();
            },
          });
          await pricingStore.aprobarCotizacion({
            id_quote: quote.value!.id,
            nuevoexpediente: true,
            id_exp: id_exp.value,
            fecha_validez: fecha_validez,
          });
          rootStore.state.spiner = true;
          await pricingStore.getListQuote();
          rootStore.state.spiner = false;
        }
      });
    }
    if (res.isDenied) {
      nuevoexpediente.value = false;
      aprobarflag.value = true;
    }
  });
}

async function aprobar() {
  if ((await frmAprobar.value!.validate()).valid) {
    Swal.fire({
      icon: "info",
      title: "Aprobando Cotizacion",
      timerProgressBar: true,
      allowOutsideClick: false,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await pricingStore.aprobarCotizacion({
      id_quote: quote.value!.id,
      nuevoexpediente: nuevoexpediente.value,
      id_exp: id_exp.value,
      fecha_validez: fecha_validez,
    });
    rootStore.state.spiner = true;
    await pricingStore.getListQuote();
    aprobarflag.value = false;
    rootStore.state.spiner = false;
  }
}

function ira(ruta: string, id: number | undefined) {
  router.push({
    name: ruta,
    params: {
      id: id,
    },
  });
  // setTimeout(() => {
  //   window.location.reload();
  // }, 100);
}

async function eliminar(id: number | undefined, codigo: string | undefined) {
  Swal.fire({
    title: "ADVERTENCIA",
    text: "DESEA ELIMINAR LA COTIZACIÓN CON CÓDIGO: " + codigo,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ACEPTAR",
    cancelButtonText: "CANCELAR",
    reverseButtons: false,
  }).then(async (result) => {
    if (result.isConfirmed) {
      pricingStore.eliminarRegistro(id!);
      Swal.fire(
        "ELIMINADO!",
        "COTIZACIÓN " + codigo + " ELIMINADA CON ÉXITO",
        "success",
      );
      lstPricing.value = false;
      await pricingStore.getListQuote().catch((err) => {
        console.log(err);
      });
      lstPricing.value = true;
    }
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function abrirModalEnlazarHouse(selected: CotizacionListado) {
  quoteSeleccionada.value = selected;
  modalEnlazarHouse.value = true;
  loadingHouses.value = true;
  try {
    const id_branch = sessionBranchId();
    const response = await axios.get<ApiResponse<HouseListado[]>>(
      import.meta.env.VITE_URL_MAIN + "listado_houses",
      {
        params: {
          id_branch,
        },
        headers: {},
      },
    );
    console.log("✅ Houses disponibles:", response.data);
    const allHouses = response.data.data || [];
    const housesFiltrados = allHouses.filter(
      (house) =>
        !house.id_cot || house.id_cot === 0 || house.id_cot === "0",
    );

    // Mapear los campos del backend a los que espera el frontend
    housesDisponibles.value = housesFiltrados.map((house) => ({
      id: house.id,
      codigo: house.code_house || house.code_master || "N/A",
      master: house.nro_house || house.nro_hbl || "N/A",
      cliente: house.nameconsigner || "Sin cliente",
      origen: house.nameportbegin || "N/A",
      destino: house.nameportend || "N/A",
    }));
    sessionStorage.setItem("auth-token", response.data.token!);
  } catch (error) {
    console.error("❌ Error al cargar houses:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar los Houses disponibles",
    });
  } finally {
    loadingHouses.value = false;
  }
}
async function enlazarHouse(house: HouseDisponible) {
  const result = await Swal.fire({
    title: "¿Confirmar enlace?",
    text: `¿Desea enlazar el House ${house.codigo} a la cotización ${quoteSeleccionada.value!.codigo}?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, enlazar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await axios.post<ApiResponse & { statusBol?: boolean }>(
      import.meta.env.VITE_URL_MAIN + "link_house_quote",
      {
        id_house: house.id,
        id_quote: quoteSeleccionada.value!.id,
      },
      {
        headers: {},
      },
    );

    sessionStorage.setItem("auth-token", response.data.token!);

    if (response.data.statusBol) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "House enlazado exitosamente a la cotización",
      });
      modalEnlazarHouse.value = false;
      // Recargar la lista de houses disponibles si se quiere seguir enlazando
      // this.abrirModalEnlazarHouse(this.quoteSeleccionada);
    }
  } catch (error) {
    console.error("❌ Error al enlazar house:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo enlazar el House a la cotización",
    });
  }
}

watch(
  () => pricingStore.search,
  async () => {
    if (typingTimer.value) {
      clearTimeout(typingTimer.value);
    }
    typingTimer.value = setTimeout(async () => {
      rootStore.state.spiner = true;
      await pricingStore.getListQuote();
      rootStore.state.spiner = false;
    }, 500);
  },
);

onMounted(async () => {
  rootStore.state.mainTitle = "LISTADO DE COTIZACIONES";
  // await this.getListQuote();

  // await this.cargarMaster({
  //   idsentido: "",
  //   idtipocarga: "",
  //   idincoterms: "",
  // });
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <!-- <v-col cols="12" class="py-1">
        <span>Filtros Seleccionado:</span>
      </v-col> -->

      <v-col
        cols="12"
        class="mt-3 clsFiltro"
      >
        <v-row>
          <v-col
            cols="6"
            class="py-1"
          >
            <v-row>
              <v-col
                cols="4"
                class="clsFechaPor"
              >
                <v-text-field
                  model-value="Fecha Creación"
                  label="Fecha Por"
                  readonly
                  hide-details
                  density="compact"
                  variant="outlined"
                  prepend-icon="mdi-calendar-month"
                />
              </v-col>

              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :model-value="
                    formatearFecha(pricingStore.filtro.fechainicio)
                  "
                  density="compact"
                  readonly
                  hide-details
                  variant="outlined"
                  label="Desde"
                  id="frmFechaDesde"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :model-value="formatearFecha(pricingStore.filtro.fechafin)"
                  density="compact"
                  readonly
                  hide-details
                  variant="outlined"
                  label="Hasta"
                />
              </v-col>
            </v-row>
          </v-col>
          <v-col
            cols="6"
            class="py-1"
            v-if="
              pricingStore.filtro.fechaemisiondesde ||
                pricingStore.filtro.fechaemisionhasta
            "
          >
            <v-row>
              <v-col
                cols="4"
                class="clsFechaPor"
              >
                <v-text-field
                  model-value="Fecha Envíado"
                  label="Fecha Por"
                  readonly
                  hide-details
                  variant="outlined"
                  density="compact"
                  prepend-icon="mdi-calendar-month"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :model-value="
                    formatearFecha(
                      pricingStore.filtro.fechaemisiondesde,
                    )
                  "
                  density="compact"
                  readonly
                  hide-details
                  variant="outlined"
                  label="Desde"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  prepend-inner-icon="mdi-calendar-month"
                  :model-value="
                    formatearFecha(
                      pricingStore.filtro.fechaemisionhasta,
                    )
                  "
                  density="compact"
                  readonly
                  hide-details
                  variant="outlined"
                  label="Hasta"
                />
              </v-col>
            </v-row>
          </v-col>

          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_marketing"
          >
            <v-autocomplete
              :items="pricingStore.listMarketing"
              label="Tipo de Marketing"
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id"
              v-model="pricingStore.filtro.id_marketing"
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_status"
          >
            <v-autocomplete
              auto-select-first
              :items="pricingStore.listQuoteStatus"
              label="Estado de la Cotización"
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id"
              v-model="pricingStore.filtro.id_status"
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_pricing"
          >
            <v-autocomplete
              :items="pricingStore.listEjecutivo"
              label="Pricing."
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id_entitie"
              v-model="pricingStore.filtro.id_pricing"
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_entities"
          >
            <v-autocomplete
              :items="pricingStore.listEjecutivo"
              label="Ejecutivo."
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id_entitie"
              v-model="pricingStore.filtro.id_entities"
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_modality"
          >
            <v-autocomplete
              :items="pricingStore.listModality"
              label="Sentido"
              v-model="pricingStore.filtro.id_modality"
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id"
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_shipment"
          >
            <v-autocomplete
              :items="pricingStore.listShipment"
              label="Tipo Embarque"
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="embarque"
              item-value="id"
              v-model="pricingStore.filtro.id_shipment"
            />
          </v-col>
          <v-col
            cols="12"
            md="2"
            class="py-1"
            v-if="pricingStore.filtro.id_incoterm"
          >
            <v-autocomplete
              :items="pricingStore.listIncoterms"
              label="Incoterm"
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id"
              v-model="pricingStore.filtro.id_incoterm"
            />
          </v-col>
        </v-row>
      </v-col>

      <v-col
        cols="12"
        lg="4"
        xl="4"
      >
        <v-text-field
          placeholder="Buscar..."
          label="Buscar"
          v-model="search"
          append-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          messages=" "
        >
          <template #message>
            <span v-if="search">
              <v-icon color="orange">mdi-file-alert</v-icon> Este filtro no se
              usará para el exportar en pdf
            </span>
          </template>
        </v-text-field>
      </v-col>
      <v-col
        cols="12"
        lg="8"
        xl="8"
      >
        <div class="text-right">
          <v-btn
            color="red"
            @click="reporteListado()"
            class="mx-1 my-1"
            :loading="loading2"
            :disabled="loading2"
            size="small"
          >
            <v-icon>mdi-file-pdf-box</v-icon> REPORTE
          </v-btn>
          <!-- <v-btn
            color="teal-darken-4"
            @click="excelListadoQuote()"
            class="mx-1 my-1"
            :loading="loading3"
            :disabled="loading3"
            size="small"
          >
            <v-icon>mdi-file-excel</v-icon> REPORTE
          </v-btn> -->
          <!-- <v-btn
            color="red"
            @click="imprimirListMercadeo()"
            class="mx-1 my-1"
            :loading="loading"
            :disabled="loading"
            size="small"
          >
            <v-icon>mdi-file-pdf-box</v-icon> MERCADEO
          </v-btn> -->
          <v-btn
            color="info"
            @click="
              pricingStore.filtrarQuoteFlag =
                !pricingStore.filtrarQuoteFlag
            "
            class="mx-1 my-1"
            size="small"
          >
            <v-icon>mdi-filter</v-icon>
            Filtrar
          </v-btn>

          <v-btn
            color="default"
            class="mx-1 my-1"
            size="small"
            @click="limpiar()"
          >
            <v-icon class="mx-1">
              mdi-filter-remove
            </v-icon>
            Limpiar
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <!-- @vue-expect-error return-object makes the expanded model hold rows, the typing says string ids -->
    <v-data-table
      :search="search"
      :headers="cabCotizaciones"
      :items="pricingStore.listQuotes"
      :expand-strategy="singleExpand ? 'single' : 'multiple'"
      v-model:expanded="expanded"
      item-value="rowId"
      return-object
      show-expand
      class="elevation-1"
      disable-sort
    >
      <template #item="{ item, internalItem, isExpanded, toggleExpand }">
        <tr
          :key="item.rowId"
          :class="[
            item.aprobadoflag || item.status_code == 4
              ? 't-green-approved'
              : item.status_code == 3 ||
                (item.status &&
                  item.status
                    .toString()
                    .toLowerCase()
                    .includes('COTIZANDO SEGURO'))
                ? 't-red'
                : item.status_code == 5
                  ? 't-green'
                  : 't-black',
            isExpanded(internalItem) ? 'filaActivda' : '',
          ]"
        >
          <!-- <td></td> -->
          <td>
            <v-btn-toggle>
              <!-- <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    icon
                    x-small
                    v-on="on"
                    v-bind="attrs"
                    @click="abrirModal(item)"
                  >
                    ssss
                  </v-btn>
                </template>
                <span>Ver</span>
              </v-tooltip> -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                    v-bind="props"
                   
                    @click="ira('verQuote', item.id)"
                    aria-label="Ver cotización"
                  >
                    <v-icon
                      color="#4A148C"
                      size="small"
                      readonly
                      hide-details
                    >
                      mdi-eye
                    </v-icon>
                  </v-btn>
                </template>
                <span>Ver</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    size="x-small"
                    icon
                    v-bind="props"
                   
                    @click="handleEditar(item)"
                    aria-label="Editar cotización"
                    v-if="item.statusmain != 0"
                  >
                    <v-icon
                      color="#FB9514"
                      size="small"
                      readonly
                      hide-details
                    >
                      mdi-pencil
                    </v-icon>
                  </v-btn>
                </template>
                <span>Editar</span>
              </v-tooltip>

              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                   
                    v-bind="props"
                    size="x-small"
                    @click="registrarLlamada(item)"
                    v-if="item.statusmain != 0"
                  >
                    <v-icon
                      color="#1A237E"
                      size="small"
                      readonly
                      hide-details
                    >
                      mdi-phone-plus
                    </v-icon>
                  </v-btn>
                </template>
                <span>Actualizar Registro Llamada</span>
              </v-tooltip>
              <!--  -->
            </v-btn-toggle>
            <v-btn-toggle>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    @click="abrirCaperta(item)"
                  >
                    <v-icon
                      color="#FFAB00"
                      size="small"
                      readonly
                      hide-details
                    >
                      mdi-folder
                    </v-icon>
                  </v-btn>
                </template>
                <span>Abrir Carpeta cotización</span>
              </v-tooltip>
              <!--  -->

              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    @click="toggleRow(item)"
                    v-if="mostrarBoton(item)"
                  >
                    <v-icon
                      color="#263238"
                      size="small"
                      readonly
                      hide-details
                    >
                      mdi-phone
                    </v-icon>
                  </v-btn>
                </template>
                <span>Historial llamada</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    @click="eliminar(item.id, item.codigo)"
                    v-if="mostrarBoton(item)"
                  >
                    <v-icon
                      color="#A43542"
                      size="small"
                      readonly
                      hide-details
                    >
                      mdi-delete
                    </v-icon>
                  </v-btn>
                </template>
                <span>Eliminar</span>
              </v-tooltip>
            </v-btn-toggle>
          </td>
          <!-- <td @click="toggleExpand(internalItem)">{{ item.recibidocotizacion }}</td> -->
          <!-- <td @click="toggleExpand(internalItem)">{{ item.enviadocliente }}</td> -->
          <td @click="toggleExpand(internalItem)">
            {{ item.created }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.status }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.codigo }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.pricing }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.ejecutivo_ventas }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.nombres }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.telefono }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.sentido }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.tipo_de_carga }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.incoterms }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.origen }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.destino }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ displayMarketing(item) }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.fechaemisionpdf }}

            <!-- <span
              v-for="(val, index) in item.details"
              :key="index"
              style="
                font-size: 1rem;
                font-style: italic;
                text-transform: capitalize;
              "
            >
              "{{ val.notes }}"
            </span> -->
          </td>
        </tr>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr v-if="item">
          <td :colspan="columns.length">
            <v-table>
              <thead class="headerDetails">
                <tr>
                  <th v-if="(item.details || []).length > 0">
                    Fecha
                  </th>
                  <th v-if="(item.details || []).length > 0">
                    Comentario
                  </th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody v-if="(item.details || []).length > 0">
                <tr
                  v-for="(i, index) in item.details || []"
                  :key="i.id || index"
                >
                  <td>{{ i.fecha }}</td>
                  <td>{{ i.notes }}</td>
                  <td>{{ i.namelong }}</td>
                </tr>
              </tbody>
            <!-- <tbody v-else>
              <tr>
                <td>{{ item.fecha_enviocliente }}</td>
              </tr>
            </tbody> -->
            </v-table>
          </td>
        </tr>
      </template>
    </v-data-table>
    <!-- <template>
      <div class="text-center">
        <v-pagination
          v-model="$store.state.pricing.pagina"
          :total-visible="7"
          :length="$store.state.pricing.totalregistro"
          circle
          @input="cambiarPagina()"
        ></v-pagination>
      </div>
    </template> -->
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      :overlay="false"
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Actualizar Recibido / Enviado
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
          <v-form ref="frmEstado">
            <v-select
              auto-select-first
              :items="
                pricingStore.listQuoteStatus.filter((v) => v.id != 1)
              "
              label="ESTADO DE LA COTIZACIÓN"
              v-model="id_status"
              :rules="[(v) => !!v || 'Dato Requerido']"
              item-title="name"
              item-value="id"
            />
            <v-select
              :items="pricingStore.listRecibidoCotizacion"
              item-value="id"
              item-title="descripcion"
              v-model="id_master_recibidocotizacion"
              label="RECIBIDO COTIZACION EN PRICING"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-select
              :items="pricingStore.listEnviadoCliente"
              item-value="id"
              item-title="descripcion"
              v-model="id_master_enviadocliente"
              label="ENVIADO AL CLIENTE"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-text-field
              type="date"
              label="FECHA DE ENVÍO AL CLIENTE"
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-if="
                pricingStore.listEnviadoCliente.filter(
                  (v) => v.id == id_master_enviadocliente && v.codigo == 'SE',
                ).length > 0
              "
              v-model="fecha_enviocliente"
            />
            <v-text-field
              label="COMENTARIO"
              v-model="comentario"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="updateQuoteRecibidoEnviado"
          >
            Guardar
          </v-btn>
          <v-btn
            color="red"
            @click="dialog = !dialog"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogRegistroNotaLlamada"
      v-if="dialogRegistroNotaLlamada"
      max-width="30%"
    >
      <v-card>
        <v-card-title>
          <span class="text-headline-medium">Detalle de Nota de llamada</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="detallenota">
            <v-text-field
              v-model="fromData.date"
              readonly
              type="date"
            />
            <v-text-field
              v-model="fromData.descripcion"
              :rules="[(v) => !!v || 'El dato es requerido']"
              label="Descripcion"
            />
            <v-autocomplete
              :items="pricingStore.listEjecutivo"
              label="Ejecutivo."
              density="compact"
              readonly
              hide-details
              variant="outlined"
              item-title="name"
              item-value="id_entitie"
              v-model="fromData.identities"
            />

            <v-autocomplete
              variant="outlined"
              :items="pricingStore.listQuoteStatus"
              label="ESTADO DE LA COTIZACIÓN"
              v-model="id_status"
              :rules="[(v) => !!v || 'Dato Requerido']"
              item-title="name"
              item-value="id"
              density="compact"
              class="mt-5"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1 text-right">
            <v-btn
              variant="text"
              color="success"
              @click="guardarNota"
            >
              Aceptar
            </v-btn>
            <v-btn
              variant="text"
              color="red"
              @click="dialogRegistroNotaLlamada = !dialogRegistroNotaLlamada"
            >
              Cancelar
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="aprobarflag"
      scrollable
      persistent
      max-width="35%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          SELECCIONE EL EXPEDIENTE A ASOCIAR:
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="aprobarflag = !aprobarflag"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmAprobar">
            <v-row>
              <v-autocomplete
                :items="rootStore.state.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-title="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1 my-1"
            size="small"
            @click="aprobar()"
            color="success"
          >
            Generar
          </v-btn>
          <v-btn
            class="mx-1 my-1"
            size="small"
            color="error"
            @click="aprobarflag = !aprobarflag"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal para enlazar Houses -->
    <v-dialog
      v-model="modalEnlazarHouse"
      max-width="900"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Enlazar Houses a Cotización
          {{ quoteSeleccionada ? quoteSeleccionada.codigo : "" }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            @click="modalEnlazarHouse = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersHouses"
            :items="housesDisponibles"
            :loading="loadingHouses"
            class="elevation-1"
          >
            <template #[`item.actions`]="{ item }">
              <v-btn
                size="small"
                color="primary"
                @click="enlazarHouse(item)"
              >
                Enlazar
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Modal abrir y/o editar url -->

    <GuardarUrlPricing
      :dialog-url="dialogUrl"
      :master-editar="masterEditar"
      @cerrar="cerrarDialog"
    />
  </v-container>
</template>

<style scoped>
.headerDetails {
  color: #000 !important;
  background: #80deea !important;
}
.t-red {
  color: red;
}
.t-green {
  color: green;
}
.t-green-approved {
  background-color: #c8e6c9 !important;
  color: #2e7d32 !important;
  font-weight: 500;
}
.t-black {
  color: #000;
}
.filaActivda {
  background: #0097a7;
}
/* #create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
} */
</style>

<style>
.clsFiltro {
  padding: 35px 25px 35px 25px;
  margin: 0 20px;
  max-width: 94vw;
  background: #f4f8fc !important;
  border-radius: 16px;
}
.clsFechaPor {
  padding: 15px 25px 10px 25px;
  background: #f0effe;
  border-radius: 30px;
}
.v-input__control {
  background: #fff !important;
}
</style>
