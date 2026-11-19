<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";
import moment from "moment";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useAppStore } from "@/stores/app";
import ArrastraYSolarComponent from "./ArrastraYSolarComponentFile.vue";
import InstructivoStep from "./InstructivoStep.vue";
import InstructivoPreviewRow from "./InstructivoPreviewRow.vue";
import FormatFecha from "./FormatFecha.vue";
import { shortDate } from "@/utils/dates";
import { usePuertoStore } from "@/stores/puerto";
import { usePricingStore } from "@/stores/pricing";
import type { ArchivoInicial } from "@/types/archivos";
import type { Modalidad } from "@/types/catalogos";
import type { ProveedorPricing } from "@/types/entidades";
import { useFilesStore } from "@/stores/files";
import type { SendTarget } from "@/utils/trafficSend";
import type {
  DatosManualesInstructivo,
  DocumentoInstructivo,
  FichaInstructivo,
  Puerto,
  TipoCarga,
} from "@/types/cotizacion";

const props = withDefaults(
  defineProps<{
    aprobadoflag?: boolean;
    verPrevisualizacion?: boolean;
    verDatosPreview?: boolean;
    destino?: SendTarget;
    quoteId?: number | string;
  }>(),
  {
    aprobadoflag: false,
    verPrevisualizacion: true,
    verDatosPreview: true,
    destino: "OPERATIONS",
  },
);
const emit = defineEmits<{ cerrarDialogo: []; continuar: [] }>();

const route = useRoute();
const appStore = useAppStore();
const filesStore = useFilesStore();
const pricingStore = usePricingStore() as ReturnType<typeof usePricingStore> & {
  emailaddress?: string;
  itemsProveedorList?: FichaInstructivo[];
};
const puertoStore = usePuertoStore();

const txtServicio = useTemplateRef("txtServicio");
const txtEmail = useTemplateRef("txtEmail");

const listaDocumentos = ref<DocumentoInstructivo[]>([
  {
    key: "cotizacion",
    label: "COTIZACIÓN DE VENTAS",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "facturaCommercial",
    label: "FACTURA COMERCIAL",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "listaEmpaque",
    label: "LISTA DE EMPAQUE",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "proforma",
    label: "PROFORMA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "fichaTecnica",
    label: "FICHA TÉCNICA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "soportePagoAlibaba",
    label: "SOPORTE DE PAGO DE ALIBABA",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "soporteTransferenciaInternacional",
    label: "SOPORTE DE TRANSFERENCIA INTERNACIONAL",
    flag: false,
    file: null,
    editable: false,
  },
  {
    key: "otros",
    label: "OTROS",
    flag: false,
    file: null,
    editable: true,
  },
  // {
  //   key: "agregarOtros",
  //   label: "AGREGAR OTROS",
  //   flag: false,
  //   file: null,
  //   editable: true,
  // },
]);
const nro_quote = ref("");
const cboSiNo = [
  { value: true, text: "Si" },
  { value: false, text: "No" },
];
const fecha = ref(moment().format("YYYY-MM-DD HH:mm"));
const tabPreview = ref("op");
const Modality = ref<Partial<Modalidad> | null>(null);
const Shipment = ref<Partial<TipoCarga>>({ code: "" });
const Proveedor = ref<FichaInstructivo>({
  namelong: "",
});
const proveedorInstructivo = ref<FichaInstructivo>({
  namelong: "",
});
const asesor = ref<FichaInstructivo>({});
const asesorPricing = ref<FichaInstructivo>({});
const incoterms = ref<FichaInstructivo>({});
const proveedor = ref<FichaInstructivo>({});
const cliente = ref<FichaInstructivo>({});
const pricing = pricingStore;
const datosPrincipales = pricingStore.datosPrincipales;
const filesLinkPagoAlibaba = ref<{ name?: string; nombre?: string }[]>([]);
const datosFile = ref<unknown[]>([]);
// El paso 0 es "Shipper" (va antes de Servicio).
const e6 = ref(0);
const previewScroll = useTemplateRef<HTMLElement>("previewScroll");
const stepsScroll = useTemplateRef<HTMLElement>("stepsScroll");
// Paso más lejano al que se llegó: los anteriores se muestran en verde (completados) y siguen siendo editables.
const pasoMaximo = ref(0);
const datosManualesNoAplica = ref<Record<string, boolean>>({
  servicio: false,
  email: false,
  monto: false,

  clientePago: false,
  linkDePago: false,
  condiciones: false,
  nroFactura: false,
  seguro: false,
  observacion1: false,
  observacion2: false,
});
const datosManuales = ref<DatosManualesInstructivo>({
  servicio: "",
  email: "",
  monto: 0,
  listDiaFecha: "",
  grupoWhatsapp: "",
  pagarProveedor: true,
  metodoPagarProveedor: "1",
  condicionesLink: "",
  dondePagar: "",
  clientePago: "",
  linkDePago: "",
  linkDePagoAlibaba: "",
  condiciones: "",
  nroFactura: "",
  seguro: "",
  observacion1: "",
  observacion2: "",
  id_path: [],
  montoRecibido: 0,
  bancoBenbeficiario: "",
  direccionBancoBeneficiario: "",
  nombreBeneficiario: "",
  direccionBeneficiario: "",
  numeroCuentaBeneficiario: null,
  paisReceptor: null,
  porcentajePago: 0,
  cotizacionDeVentasFlag: false,
  cotizacionFlag: false,
  facturaCommercialFlag: false,
  listaEmpaqueFlag: false,
  proformaFlag: false,
  fichaTecnicaFlag: false,
  soportePagoAlibabaFlag: false,
  soporteTransferenciaInternacionalFlag: false,
  otrosFlag: false,
  agregarOtrosFlag: false,
  cotizacionDeVentas: null,
  cotizacion: null,
  facturaCommercial: null,
  listaEmpaque: null,
  proforma: null,
  fichaTecnica: null,
  soportePagoAlibaba: null,
  soporteTransferenciaInternacional: null,
  otros: null,
  agregarOtros: null,
  numeroContratoAlibaba: null,
});
const puertoOrigen = ref<Puerto | null>(null);

const puertoDestino = ref<Puerto | null>(null);

const mostrarPagarProveedorAlibaba = computed(() => {
  if (datosManuales.value.pagarProveedor) {
    if (datosManuales.value.metodoPagarProveedor == 1) {
      return true;
    }
  }
  return false;
});
const mostrarPagarProveedorInternacional = computed(() => {
  if (datosManuales.value.pagarProveedor) {
    if (datosManuales.value.metodoPagarProveedor == 2) {
      return true;
    }
  }
  return false;
});

// "Cliente ya nos pagó" (Alibaba): se guarda como texto "Si" / "No" en datosManuales.clientePago.
const clienteYaPago = computed<boolean>({
  get: () => /^s[ií]/i.test(String(datosManuales.value.clientePago ?? "").trim()),
  set: (valor) => {
    datosManuales.value.clientePago = valor ? "Si" : "No";
  },
});
// FormatFecha trabaja con string | null.
const fechaPagoCliente = computed<string | null>({
  get: () => (datosManuales.value.fechaPagoCliente as string | undefined) || null,
  set: (valor) => {
    datosManuales.value.fechaPagoCliente = valor ?? "";
  },
});

// Pasos visibles en el mismo orden y con las mismas condiciones que el template.
const pasosVisibles = computed(() => {
  const pasos = [0, 1, 2, 3, 4, 5, 6];
  if (datosManuales.value.pagarProveedor) {
    pasos.push(7, 8);
    if (mostrarPagarProveedorAlibaba.value) pasos.push(...(clienteYaPago.value ? [9, 10, 12, 13] : [9, 12, 13]));
    if (mostrarPagarProveedorInternacional.value) pasos.push(14, 15, 16, 17, 18, 19, 20, 21);
  }
  pasos.push(23, 24, 25);
  return pasos;
});
function stepNumber(paso: number) {
  return pasosVisibles.value.indexOf(paso) + 1;
}
// Verde: todo paso ya alcanzado (incluido el más lejano), salvo el que se está llenando por primera vez.
function isComplete(paso: number) {
  return paso < pasoMaximo.value || (paso === pasoMaximo.value && paso !== e6.value);
}
// Solo se puede volver a pasos ya alcanzados; para avanzar hay que usar "Continuar".
function irAPaso(paso: number) {
  if (paso <= pasoMaximo.value) e6.value = paso;
}

// Fila de la previsualización que corresponde a cada paso.
const pasoActivo = computed(() => {
  const paso = e6.value;
  if (paso <= 6) return ["shipper", "servicio", "email", "cargaLista", "whatsapp", "adjunta", "pagarProveedor"][paso];
  if (paso <= 21) return "datosBancarios";
  return ({ 22: "dondePagar", 23: "seguro", 24: "obs1", 25: "obs2" } as Record<number, string>)[paso];
});

async function sincronizarScroll() {
  await nextTick();
  const contenedor = previewScroll.value;
  const fila = pasoActivo.value
    ? contenedor?.querySelector<HTMLElement>(`[data-paso="${pasoActivo.value}"]`)
    : null;
  if (contenedor && fila) {
    const top = fila.getBoundingClientRect().top - contenedor.getBoundingClientRect().top
      + contenedor.scrollTop - contenedor.clientHeight / 2 + fila.clientHeight / 2;
    contenedor.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  // Espera la animación de apertura del paso antes de traerlo a la vista.
  setTimeout(() => {
    stepsScroll.value
      ?.querySelector(`[data-step="${e6.value}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, 250);
}

watch(e6, (paso) => {
  if (paso > pasoMaximo.value) pasoMaximo.value = paso;
  sincronizarScroll();
});
watch(tabPreview, sincronizarScroll);

const documentosAdjuntos = computed(() =>
  listaDocumentos.value
    .filter((doc) => doc.flag)
    .map((doc) => {
      const nombreRaw = (doc.file as { name?: string } | null)?.name;
      // Limpiamos si es una URL de OneDrive/S3 o similar
      const archivo = nombreRaw
        ? nombreRaw.includes("http")
          ? nombreRaw.substring(nombreRaw.lastIndexOf("/") + 1)
          : nombreRaw
        : "Documento confirmado";
      return { key: doc.key, label: doc.label || "OTROS", archivo };
    }),
);

const datosBancarios = computed<{ label: string; valor: unknown }[]>(() => {
  const d = datosManuales.value;
  if (mostrarPagarProveedorAlibaba.value) {
    return [
      { label: "Monto a pagar", valor: d.monto },
      { label: "Cliente ya nos pagó", valor: clienteYaPago.value ? "Sí" : "No" },
      ...(clienteYaPago.value
        ? [
            { label: "Monto pagado por el cliente", valor: d.montoRecibido },
            { label: "Fecha de pago del cliente", valor: d.fechaPagoCliente ? shortDate(d.fechaPagoCliente as string) : "" },
          ]
        : []),
      { label: "Link de pago Alibaba", valor: d.linkDePagoAlibaba },
      { label: "N° de contrato de Alibaba", valor: d.numeroContratoAlibaba },
    ];
  }
  if (mostrarPagarProveedorInternacional.value) {
    return [
      { label: "Monto a pagar", valor: d.monto },
      { label: "N° factura", valor: d.nroFactura },
      { label: "Banco beneficiario", valor: d.bancoBenbeficiario },
      { label: "Dirección del banco beneficiario", valor: d.direccionBancoBeneficiario },
      { label: "Nombre del beneficiario", valor: d.nombreBeneficiario },
      { label: "Dirección del beneficiario", valor: d.direccionBeneficiario },
      { label: "Número de cuenta", valor: d.numeroCuentaBeneficiario },
      { label: "Porcentaje de pago", valor: d.porcentajePago },
      { label: "País receptor", valor: d.paisReceptor },
    ];
  }
  return [];
});

function claseSiNo(valor: unknown) {
  const v = String(valor ?? "").trim().toLowerCase();
  if (/^s[ií]/.test(v)) return "ins-chip--si";
  if (/^no\b/.test(v)) return "ins-chip--no";
  return "";
}

const destinoLabel = computed(() => (props.destino === "TRAFFIC" ? "Tráfico" : "Operaciones"));

const logoEmpresa = (() => {
  try {
    return (JSON.parse(sessionStorage.getItem("dataBranch") as string)?.[0]?.logo as string) || "";
  } catch {
    return "";
  }
})();

// Divisor arrastrable entre pasos y previsualización. 480px es el mínimo; se recuerda por navegador.
const ANCHO_MIN_PASOS = 480;
const CLAVE_ANCHO_PASOS = "instructivo.anchoPasos";
const layoutEl = useTemplateRef<HTMLElement>("layoutEl");
const anchoPasos = ref(ANCHO_MIN_PASOS);
const redimensionando = ref(false);
try {
  const guardado = Number(localStorage.getItem(CLAVE_ANCHO_PASOS));
  if (guardado >= ANCHO_MIN_PASOS) anchoPasos.value = guardado;
} catch {
  // sin localStorage: se usa el mínimo
}
const conDivisor = computed(() => props.verDatosPreview && props.verPrevisualizacion);

const estiloLayout = computed(() => {
  if (!props.verDatosPreview) return { gridTemplateColumns: "240px 1fr", columnGap: "16px" };
  if (!props.verPrevisualizacion) return { gridTemplateColumns: "1fr", columnGap: "16px" };
  // min(): un ancho guardado en una pantalla más grande nunca pasa de la mitad.
  return {
    gridTemplateColumns: `min(${anchoPasos.value}px, max(${ANCHO_MIN_PASOS}px, calc((100% - 16px) / 2))) 16px minmax(0, 1fr)`,
    columnGap: "0",
  };
});

function iniciarRedimension(evento: PointerEvent) {
  const layout = layoutEl.value;
  if (!layout) return;
  evento.preventDefault();
  redimensionando.value = true;
  const inicioLayout = layout.getBoundingClientRect().left + 16; // padding del layout
  // Máximo: la mitad del área (sin padding ni divisor).
  const maximo = () => Math.max(ANCHO_MIN_PASOS, (layout.clientWidth - 32 - 16) / 2);
  const mover = (e: PointerEvent) => {
    anchoPasos.value = Math.round(Math.min(maximo(), Math.max(ANCHO_MIN_PASOS, e.clientX - inicioLayout - 8)));
  };
  const soltar = () => {
    redimensionando.value = false;
    window.removeEventListener("pointermove", mover);
    window.removeEventListener("pointerup", soltar);
    try {
      localStorage.setItem(CLAVE_ANCHO_PASOS, String(anchoPasos.value));
    } catch {
      // ignorar
    }
  };
  window.addEventListener("pointermove", mover);
  window.addEventListener("pointerup", soltar);
}
function reiniciarAncho() {
  anchoPasos.value = ANCHO_MIN_PASOS;
  try {
    localStorage.removeItem(CLAVE_ANCHO_PASOS);
  } catch {
    // ignorar
  }
}

const defaultsPasos = {
  VTextField: { variant: "outlined", density: "compact", hideDetails: "auto" },
  VTextarea: { variant: "outlined", density: "compact", hideDetails: "auto" },
  VSelect: { density: "compact" },
  VCheckbox: { density: "compact", hideDetails: true },
  VBtn: { size: "small", class: "mx-1 text-none" },
};

const rehidratarDesdeFormatoViejo = undefined as unknown as (datos: unknown) => void;
const itemsProveedorList = undefined as FichaInstructivo[] | undefined;

watch(() => pricingStore.datosPrincipales.datosinstructivomanual, (newData) => {
  if (newData && newData.listaDocumentos) {
    listaDocumentos.value = JSON.parse(
      JSON.stringify(newData.listaDocumentos),
    );
  } else if (newData) {
    rehidratarDesdeFormatoViejo(newData);
  }
}, { immediate: true, deep: true });

function pasarASeguro() {
  e6.value = 23;
}
function continuarPagarProveedor() {
  if (!datosManuales.value.pagarProveedor) {
    cambiarPagarProvedor();
  } else {
    continuar();
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cargarArchivo(datoEmit: { id?: unknown; archivo?: unknown } | null | undefined, name: string) {
  if (datoEmit) {
    const flagName = name.replace("File", "Flag");

    datosManuales.value[name] = {
      id: datoEmit.id,
      archivo: datoEmit.archivo,
      name: name,
    };

    datosManuales.value[flagName] = true;
    filesLinkPagoAlibaba.value.push(datosManuales.value[name] as { name?: string });
  }
}
function cargarArchivoDinamico(datoEmit: { archivo?: unknown }, doc: DocumentoInstructivo) {
  doc.file = datoEmit.archivo;
  doc.flag = true;
}
function eliminarArchivoDinamico(doc: DocumentoInstructivo) {
  doc.file = null;
  doc.flag = false;
}
// "Otros" adicionales: renombrables y removibles. El "Otros" original se mantiene fijo.
function esOtroAgregado(doc: DocumentoInstructivo) {
  return doc.key.startsWith("otros_");
}
function agregarOtro() {
  listaDocumentos.value.push({
    key: `otros_${Date.now()}`,
    label: "",
    flag: true,
    file: null,
    editable: true,
  });
}
function quitarOtro(doc: DocumentoInstructivo) {
  const index = listaDocumentos.value.indexOf(doc);
  if (index !== -1) listaDocumentos.value.splice(index, 1);
}

// "Soporte de pago" se muestra en "Link de pago Alibaba", no en "Se adjunta" (sigue en listaDocumentos).
const KEY_SOPORTE_PAGO = "soportePagoAlibaba";
const docSoportePago = computed(() => listaDocumentos.value.find((doc) => doc.key === KEY_SOPORTE_PAGO));
const documentosSeAdjunta = computed(() => listaDocumentos.value.filter((doc) => doc.key !== KEY_SOPORTE_PAGO));
function cargarSoportePago(datoEmit: { archivo?: unknown }) {
  if (docSoportePago.value) cargarArchivoDinamico(datoEmit, docSoportePago.value);
}
function eliminarSoportePago() {
  if (docSoportePago.value) eliminarArchivoDinamico(docSoportePago.value);
}

// ===== SHIPPERS (table_shipper_x_quote) =====
interface ShipperOpcion {
  id: number;
  namelong?: string;
  telefono?: string | null;
}
interface ShipperDetalle extends ShipperOpcion {
  contacto?: string | null;
  emailaddress?: string | null;
}
const shippersInstructivo = ref<{ uid: number; id: number | null }[]>([]);
const detallesShipper = ref<Record<number, ShipperDetalle>>({});
let uidShipper = 0;

const opcionesShipperCatalogo = computed(() => appStore.itemsProveedorRolShipper as unknown as ShipperOpcion[]);
const shipperIdsSeleccionados = computed(() => [
  ...new Set(shippersInstructivo.value.map((fila) => fila.id).filter((id): id is number => !!id)),
]);
// Cada fila solo ofrece shippers que no estén elegidos en otra fila.
function opcionesShipper(actual: number | null) {
  return opcionesShipperCatalogo.value.filter(
    (opcion) => opcion.id === actual || !shipperIdsSeleccionados.value.includes(opcion.id),
  );
}
function agregarShipper(id: number | null = null) {
  shippersInstructivo.value.push({ uid: ++uidShipper, id });
}
function quitarShipper(index: number) {
  shippersInstructivo.value.splice(index, 1);
}
const shippersPreview = computed<ShipperDetalle[]>(() =>
  shipperIdsSeleccionados.value.map((id) => {
    const detalle = detallesShipper.value[id];
    const opcion = opcionesShipperCatalogo.value.find((o) => o.id === id);
    return {
      id,
      namelong: detalle?.namelong ?? opcion?.namelong ?? "",
      contacto: detalle?.contacto ?? "",
      emailaddress: detalle?.emailaddress ?? "",
      telefono: detalle?.telefono ?? opcion?.telefono ?? "",
    };
  }),
);

// Carga los shippers guardados; si no hay, propone el shipper de "Datos de la carga".
async function cargarShippers() {
  const idQuote = props.quoteId ?? route.params.id;
  const [respuesta] = await Promise.all([
    axios
      .get<{ estadoflag?: boolean; data?: ShipperDetalle[] }>(`${import.meta.env.VITE_URL_MAIN}listar_shippers_quote`, {
        params: { id_quote: idQuote },
      })
      .catch((error) => {
        console.error(error);
        return null;
      }),
    opcionesShipperCatalogo.value.length ? null : appStore._getProveedorRolShipper(),
  ]);
  const guardados = respuesta?.data.estadoflag ? (respuesta.data.data ?? []) : [];
  detallesShipper.value = Object.fromEntries(guardados.map((s) => [s.id, s]));
  shippersInstructivo.value = [];
  if (guardados.length) {
    guardados.forEach((s) => agregarShipper(s.id));
  } else {
    agregarShipper(pricingStore.datosPrincipales.id_proveedor ? Number(pricingStore.datosPrincipales.id_proveedor) : null);
  }
}
// Un "Otros" sin nombre se guarda / imprime como "OTROS".
function documentosParaGuardar() {
  return listaDocumentos.value.map((doc) => ({ ...doc, label: doc.label?.trim() || "OTROS" }));
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function eliminarArchivoPadre(name: string) {

  const flagName = name.replace("File", "Flag");
  datosManuales.value[flagName] = false;

  filesLinkPagoAlibaba.value = filesLinkPagoAlibaba.value.filter(
    (file) => file.name !== name,
  );

  datosManuales.value[name] = null;
}
function cambiarPagarProvedor() {
  datosManuales.value.condicionesLink = "No Aplica";
  datosManuales.value.dondePagar = "No Aplica";
  datosManuales.value.clientePago = "No Aplica";
  datosManuales.value.linkDePago = "No Aplica";
  datosManuales.value.condiciones = "No Aplica";
  datosManuales.value.nroFactura = "No Aplica";
  e6.value = 23;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarEmail() {
  if (!datosManuales.value.servicio) {
    txtServicio.value!.focus();
    return;
  }
  e6.value = 2;
}

function setDatosInstructivo() {
  if (listaDocumentos.value.some((v) => !v.flag && v.key == "cotizacion")) {
    Swal.fire({
      icon: "warning",
      title: "Soporte de Cotización",
      text: "Es Requerido adjuntar: COTIZACIÓN DE VENTAS ",
    });
    return;
  }

  pricingStore.guardarDatosInstructivo({
    id: props.quoteId ?? route.params.id,
    shippers: shipperIdsSeleccionados.value,
    datosInstructivoManual: {
      ...datosManuales.value,
      listaDocumentos: documentosParaGuardar(),
      table_allpath_list: documentosParaGuardar(),
    },
  });
  emit("continuar");
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function continuarListaDiaFecha() {
  if (!datosManuales.value.email) {
    txtEmail.value!.focus();
    return;
  }
  e6.value = 3;
}
// Avanza / retrocede al paso visible contiguo (evita caer en pasos ocultos).
function continuar() {
  const siguiente = pasosVisibles.value.find((p) => p > e6.value);
  if (siguiente !== undefined) e6.value = siguiente;
}
function regresar() {
  const anterior = [...pasosVisibles.value].reverse().find((p) => p < e6.value);
  if (anterior !== undefined) e6.value = anterior;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _uploadFile(file: File) {
  const data = new FormData();
  const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
  data.append("name", nameWithoutExtension);
  data.append("file", file);
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
    headers: {},
    data: data,
  };

  try {
    const response = await axios(config);
    const res = response.data.data[0];

    datosManuales.value.id_path.push(res.insertid);
    datosFile.value.push({
      name: nameWithoutExtension,
      url: res.ruta,
    });

    await filesStore.uploadFileFromUrlToOneDrive({
      fileUrl: res.ruta,
      destinationFolderUrl:
        pricingStore.datosPrincipales.url_folderonedrive,
    });
  } catch (error) {
    console.error(error);
  }
}
function guardarYGenenarCorreo() {
  Promise.all([
    pricingStore.guardarDatosInstructivo({
      id: props.quoteId ?? route.params.id,
      shippers: shipperIdsSeleccionados.value,
      datosInstructivoManual: {
        ...datosManuales.value,
        listaDocumentos: documentosParaGuardar(),
        table_allpath_list: documentosParaGuardar(),
      },
    }),
    generarHTML(),
    generarHTMLPDF(true),
  ]);
}
async function generarHTMLPDF(guardarFlag?: boolean) {
  const state = pricingStore;
  const main = state.datosPrincipales;
  const cliente = state.dataCliente;

  const nro_quote_clean = (state.nro_quote || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");

  const subjectStr = `INSTRUCTIVO_VENTAS_${nro_quote_clean}_EXPEDIENTE_${pricing.nro_exp}`;
  const subject = encodeURIComponent(subjectStr);
  const dataBranch =
    JSON.parse(sessionStorage.getItem("dataBranch") as string)?.[0] || {};
  const esAlibaba = !!mostrarPagarProveedorAlibaba.value;
  const esInternacional = !!mostrarPagarProveedorInternacional.value;
  const requierePagar =
    datosManuales.value.pagarProveedor === true ||
    datosManuales.value.pagarProveedor === "Si" ||
    esAlibaba ||
    esInternacional;

  await pricingStore.quotePreviewInstructivoManual({
    ...datosManuales.value,

    destino: props.destino,
    guardarFlag: guardarFlag,
    subject: subject,
    asesor: asesor.value.name || "",
    asesorPricing: asesorPricing.value.name || "",
    nro_quote: state.nro_quote || "",
    PortBegin: puertoOrigen.value!.name || "",
    PortEnd: puertoDestino.value?.name || "",
    shippers: shippersPreview.value,
    telefonoCliente: main.telefono || "",
    Incoterms: incoterms.value.name || "",
    peso: main.peso || 0,
    volumen: main.volumen || 0,
    descripcioncarga: main.descripcioncarga || "",

    nombrecompletoProveedor: proveedor.value.namelong || "",
    contactoProveedor: proveedor.value.contacto || "",
    addressProveedor: proveedor.value.emailaddress || "",
    contactoPhoneProveedor: proveedor.value.contacto_phone || "",

    nombrecompletoCliente: cliente.nombrecompleto || "",
    documentCliente: cliente.document || "",
    addressCliente: cliente.address || "",
    emailaddressCliente: state.emailaddress || "",

    Shipment: Shipment.value.code || "",
    url_folderonedrive: datosPrincipales.url_folderonedrive,
    url_folderonedriveexp: datosPrincipales.url_folderonedriveexp,

    namelongColoader: proveedorInstructivo.value.namelong || "",
    contactoColoader: proveedorInstructivo.value.contacto || "",
    phoneColoader: proveedorInstructivo.value.contacto_phone || "",

    seAdjunta:
      filesLinkPagoAlibaba.value?.length > 0
        ? filesLinkPagoAlibaba.value
            .map((file) => `• ${file.nombre || file}`)
            .join("<br />")
        : "No hay archivos",

    url_logo: dataBranch.logo || "",
    document: dataBranch.document || "",
    address: dataBranch.address || "",
    phone: dataBranch.phone || "",

    pagarProveedor: requierePagar,
    mostrarPagarProveedorAlibaba: esAlibaba,
    mostrarPagarProveedorInternacional: esInternacional,
    listaDocumentos: documentosParaGuardar(),
  });
}
async function generarHTML() {
  const documentosSeleccionados = documentosParaGuardar().filter(
    (doc) => doc.flag,
  );

  const listaArchivos =
    documentosSeleccionados.length > 0
      ? documentosSeleccionados
          .map((doc) => {
            let nombreArchivo = "";

            // VALIDACIÓN: Si hay archivo, extraemos el nombre; si no, ponemos el aviso
            if (doc.file) {
              const nombreRaw =
                (doc.file as { name?: string }).name ||
                (typeof doc.file === "string" ? doc.file : "");

              // Limpiamos el nombre si viene con la ruta completa
              nombreArchivo = nombreRaw.includes("/")
                ? nombreRaw.substring(nombreRaw.lastIndexOf("/") + 1)
                : nombreRaw;
            } else {
              // SI EL FLAG ESTÁ ACTIVO PERO NO HAY ARCHIVO
              nombreArchivo = "DOCUMENTO CONFIRMADO";
            }

            const detalle = `: <span style="color: #555;">${nombreArchivo}</span>`;

            return `• <b>${doc.label.toUpperCase()}</b>${detalle}`;
          })
          .join("<br />")
      : "No hay archivos seleccionados";

  let datosPagoAlibaba = "";
  if (mostrarPagarProveedorAlibaba.value) {
    datosPagoAlibaba = `
      <b>MONTO A PAGAR:</b> ${datosManuales.value.monto || ""}<br>
      <b>CLIENTE YA NOS PAGÓ:</b> ${datosManuales.value.clientePago || ""}<br>
      <b>MONTO RECIBIDO DEL CLIENTE:</b> ${
    datosManuales.value.montoRecibido || ""
  }<br>
      <b>FECHA DE PAGO DEL CLIENTE:</b> ${
    datosManuales.value.fechaPagoCliente || ""
  }<br>
      <b>LINK DE PAGO ALIBABA:</b> ${
    datosManuales.value.linkDePagoAlibaba || ""
  }<br>
      <b>NÚMERO DE CONTRATO DE ALIBABA:</b> ${
    datosManuales.value.numeroContratoAlibaba || ""
  }
    `;
  }
  let datosPagoInternacional = "";
  if (mostrarPagarProveedorInternacional.value) {
    datosPagoInternacional = `
      <b>MONTO A PAGAR:</b> ${datosManuales.value.monto || ""}<br>
      <b>Nro Factura:</b> ${datosManuales.value.nroFactura || ""}<br>
      <b>Banco Beneficiario:</b> ${
    datosManuales.value.bancoBenbeficiario || ""
  }<br>
      <b>Dirección del banco beneficiario:</b> ${
    datosManuales.value.direccionBancoBeneficiario || ""
  }<br>
      <b>Nombre del Beneficiario:</b> ${
    datosManuales.value.nombreBeneficiario || ""
  }<br>
      <b>Dirección del Beneficiario:</b> ${
    datosManuales.value.direccionBeneficiario || ""
  }<br>
      <b>Número de Cuenta:</b> ${
    datosManuales.value.numeroCuentaBeneficiario || ""
  }<br>
      <b>Porcentaje de Pago:</b> ${datosManuales.value.porcentajePago || ""}<br>
      <b>País Receptor:</b> ${datosManuales.value.paisReceptor || ""}
    `;
  }

  const valorDatosBancarios = mostrarPagarProveedorAlibaba.value
    ? datosPagoAlibaba
    : mostrarPagarProveedorInternacional.value
    ? datosPagoInternacional
    : "No especificado";

  const htmlTable = `
    <p style="font-family: Arial, sans-serif;">Hola Compañero,</p>
    <p style="font-family: Arial, sans-serif;">Hemos logrado cerrar esta nueva carga, abajo los detalles:</p>
    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; font-family: Arial, sans-serif; width: 100%;">
      <tbody>
        ${_tr("FECHA", moment().format("DD/MM/YYYY"))}
       ${_tr(
     "ASESOR/ PRICING",
     `${asesor.value?.name || ""} / ${asesorPricing.value?.name || ""}`,
   )}
        ${_tr("N° QUOTE", pricing.nro_quote)}
        ${_tr("TIPO DE EMBARQUE", Shipment.value.code)}
        ${_tr("SERVICIO", datosManuales.value.servicio)}
        ${_tr(
      "COLOADER/AGENTE",
      `
          <b>Datos:</b> ${proveedorInstructivo.value.namelong || ""}<br>
          <b>Contacto:</b> ${proveedorInstructivo.value.contacto || ""}<br>
          <b>Teléfono:</b> ${proveedorInstructivo.value.contacto_phone || ""}
        `,
    )}
        ${_tr("Email de Seguimiento", datosManuales.value.email)}
        ${_tr("PUERTO DE SALIDA", puertoOrigen.value!.name || "")}
        ${_tr(
      "DATOS DE LA CARGA<br><span style='color:red;font-size:10px;'>Si es EXW enviar dirección de recolecta</span>",
      `
          <b>INCOTERMS:</b> ${incoterms.value.name || ""}<br>
          <b>PESO:</b> ${datosPrincipales.peso || 0} KG<br>
          <b>VOLUMEN:</b> ${datosPrincipales.volumen || 0} M3<br>
          <b>TIPO DE MERCANCIA:</b> ${
        datosPrincipales.descripcioncarga || ""
      }
        `,
    )}
        ${_tr(
      "DETALLES DEL PROVEEDOR",
      `
          <b>NOMBRE:</b> ${proveedor.value.namelong || ""}<br>
          <b>CONTACTO:</b> ${proveedor.value.contacto || ""}<br>
          <b>EMAIL:</b> <a href="mailto:${
        proveedor.value.emailaddress || ""
      }">${proveedor.value.emailaddress || ""}</a><br>
          <b>TELÉFONO:</b> ${proveedor.value.contacto_phone || ""}
        `,
    )}
        ${_tr(
      "CLIENTE / RAZON SOCIAL",
      `
          <b>NOMBRE:</b> ${pricing.dataCliente.nombrecompleto || ""}<br>
          <b>RUC:</b> ${pricing.dataCliente.document || ""}<br>
          <b>DIRECCIÓN:</b> ${pricing.dataCliente.address || ""}<br>
          <b>EMAIL:</b> ${pricing.emailaddress || ""}
        `,
    )}
        ${_tr(
      "<b>NOTIFY</b>",
      `
          PIC LOGISTICA SAC <br>
          RUC: 20609852861 <br>
          AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS <br>
          Contacto: Carlos Ramirez <br>
          CORREO: ASESOR2@PIC-CARGO.COM
        `,
    )}
        ${_tr(
      "<b>CARGA LISTA DIA FECHA</b>",
      datosManuales.value.listDiaFecha,
    )}
        ${_tr(
      "<b>GRUPO DE WHATSAPP</b>",
      datosManuales.value.grupoWhatsapp,
    )}
        ${_tr("<b>SE ADJUNTA</b>", listaArchivos)}
        ${_tr(
      "<b>TIPO DE MERCANCIA</b>",
      datosPrincipales.descripcioncarga || "",
    )}
        ${_tr(
      "<b>DEBEMOS PAGAR AL PROVEEDOR</b><br><span style='color:red;font-size:10px;'>Solo aplica si el cliente nos cancela a nosotros y debemos pagar al proveedor</span>",
      datosManuales.value.pagarProveedor ? "Si" : "No",
    )}
        
        ${
      mostrarPagarProveedorAlibaba.value
        ? _tr(
            "<b>DONDE SE DEBE PAGAR</b>",
            datosManuales.value.dondePagar,
          )
        : ""
    }
        
        ${
      datosManuales.value.pagarProveedor
        ? _tr(
            "<b>DATOS BANCARIOS PARA TRANSFERENCIA</b>",
            valorDatosBancarios,
          )
        : ""
    }
        
        ${_tr("<b>SEGURO DE MERCANCIA</b>", datosManuales.value.seguro)}
        ${_tr(
      "OBSERVACIONES ADICIONALES 1",
      datosManuales.value.observacion1,
    )}
        ${_tr(
      "OBSERVACIONES ADICIONALES 2",
      datosManuales.value.observacion2,
    )}
        ${
      datosPrincipales.url_folderonedriveexp
        ? _tr(
            "CARPETA OPERATIVA",
            `<a href="${datosPrincipales.url_folderonedriveexp}" target="_blank" style="color: blue; font-weight: bold;">CLICK AQUÍ</a>`,
          )
        : ""
    }
      </tbody>
    </table>
    <br>
    <p style="font-family: Arial, sans-serif;">Quedamos atentos a sus comentarios y en caso de cualquier duda por favor contactarnos.</p>
  `;

  try {
    const blob = new Blob([htmlTable], { type: "text/html" });
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": blob }),
    ]);
    Swal.fire({
      icon: "info",
      title: "¡Casi listo!",
      html: `
              <div style="text-align: center; font-family: 'Segoe UI', sans-serif;">
                <h2 style="color: #333; margin-top: 0;">Tabla copiada con éxito</h2>
                
                <div style="background-color: #eef6ff; border: 2px dashed #3085d6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="font-size: 1.1rem; color: #555; margin: 0;">
                    Para finalizar, abre <strong>Outlook</strong> y presiona:
                  </p>
                  <div style="margin: 15px 0;">
                    <kbd style="font-size: 1.5rem; background: #333; color: #fff; padding: 5px 15px; border-radius: 6px; box-shadow: 0 4px 0 #000;">
                      Ctrl + V
                    </kbd>
                  </div>
                  <p style="font-size: 0.9rem; color: #3085d6; font-weight: bold;">
                    ¡Asegúrate de pegar el contenido antes de cerrar esta ventana!
                  </p>
                </div>
              </div>
            `,
    }).then((res) => {
      if (res.isConfirmed) {
        const clean = (str?: string | null) =>
          str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

        const subject = `EXPEDIENTE-${pricing.nro_exp} | QUOTE${
          pricing.nro_quote
        } ${clean(pricing.dataCliente.nombrecompleto)} ${clean(
          incoterms.value.name,
        )} ${clean(Modality.value!.name!.toUpperCase())} | AGREGAR INSTRUCTIVO INTERNO`;

        const body =
          "Hola colega, adjunto los detalles del expediente (Pega la tabla aquí):\n\n";

        setTimeout(() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(
            subject,
          )}&body=${encodeURIComponent(body)}`;
          abrirModalSegundoCorreo();
        }, 500);
      }
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

function abrirModalSegundoCorreo() {
  setTimeout(() => {
    Swal.fire({
      icon: "info",
      title: "",
      html: `
          <h1 style="font-size: 2.5em; font-weight: bold;">📧 Crear email al agente</h1>

              <h1 style="font-size: 2em; font-weight: bold;">🚨 OBLIGATORIO</h1>
              <h2 style="font-size: 1.5em;">Antes de abrir el segundo correo, primero envía el email a Operaciones.</h2>
            `,
      confirmButtonText: "☑️ Ya envié el email a Operaciones. Continuar",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      confirmButtonColor: "#00C853",
      cancelButtonColor: "red",
      customClass: {
        title: "custom-title-class",
        confirmButton: "custom-button-class",
      },
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const cancelBtn = Swal.getCancelButton();
        confirmBtn!.style.display = "none";
        cancelBtn!.style.display = "none";
        setTimeout(() => {
          confirmBtn!.style.display = "inline-block";
          cancelBtn!.style.display = "inline-block";
        }, 2000);
      },
    }).then((res) => {
      if (res.isConfirmed) {
        GenerartSegundoCorreo();
      }
    });
  }, 3000);
}
async function GenerartSegundoCorreo() {
  const cargaDetalles = `
            <strong>INCOTERMS:</strong> ${incoterms.value.name || ""}<br/>
            <strong>PESO:</strong> ${datosPrincipales.peso || 0} KG <br/>
            <strong>VOLUMEN:</strong> ${
          datosPrincipales.volumen || 0
        } M3 <br/>
            <strong>TIPO DE MERCANCIA:</strong> ${
          datosPrincipales.descripcioncarga || ""
        }
          `;

  const proveedorDetalles = `
            NOMBRE: ${proveedor.value.namelong || ""}<br>
            CONTACTO: ${proveedor.value.contacto || ""}<br>
            EMAIL: ${proveedor.value.emailaddress || ""}<br>
            TELÉFONO: ${proveedor.value.contacto_phone || ""}
          `;

  const clienteDetalles = `
              ${pricing.dataCliente.nombrecompleto || ""}<br />
              RUC: ${pricing.dataCliente.document || ""}<br />
              DIRECCION: ${pricing.dataCliente.address || ""} <br />
              EMAIL: ${
            pricing.emailaddress
              ? `<a href="mailto:${pricing.emailaddress}">${pricing.emailaddress}</a>`
              : ""
          }
            `;

  const htmlBody = `
            <p>Hola Colega Por aquí tenemos una nueva carga, por indicarnos tu numero de routing order y que Customer seguirá el tema</p>
            <table style="border-collapse: collapse; width: 100%; max-width: 800px; border: 1px solid #000; font-family: Arial, sans-serif;">
              <tbody>
                ${_tr("PUERTO DE SALIDA", puertoOrigen.value!.name || "")}
                ${_tr("TIPO DE EMBARQUE", Shipment.value.code || "")}
                ${_tr(
              "DATOS DE LA CARGA<br/><small style='font-weight:normal;'>Si es EXWORK enviar dirección de recolecta</small>",
              cargaDetalles,
            )}
                ${_tr("DETALLES DEL PROVEEDOR", proveedorDetalles)}
                ${_tr("CLIENTE / RAZON SOCIAL", clienteDetalles)}
                ${_tr(
              "NOTIFY",
              "PIC LOGISTICA SAC<br/>RUC: 20609852861<br/>AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br/>Contacto: Carlos Ramirez<br/>CORREO: ASESOR2@PIC-CARGO.COM",
            )}
                ${_tr(
              "CARGA LISTA DIA FECHA",
              datosManuales.value.listDiaFecha || "Pendiente",
            )}
              </tbody>
            </table>
          <p>Quedamos atentos a sus comentarios y en caso de cualquier duda por favor contactarnos</p>`;

  try {
    const blob = new Blob([htmlBody], { type: "text/html" });
    await navigator.clipboard.write([
      new ClipboardItem({ "text/html": blob }),
    ]);

    Swal.fire({
      icon: "info",
      title: "¡Casi listo!",
      html: `
              <div style="text-align: center; font-family: 'Segoe UI', sans-serif;">
                <h2 style="color: #333; margin-top: 0;">Tabla copiada con éxito</h2>
                
                <div style="background-color: #eef6ff; border: 2px dashed #3085d6; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="font-size: 1.1rem; color: #555; margin: 0;">
                    Para finalizar, abre <strong>Outlook</strong> y presiona:
                  </p>
                  <div style="margin: 15px 0;">
                    <kbd style="font-size: 1.5rem; background: #333; color: #fff; padding: 5px 15px; border-radius: 6px; box-shadow: 0 4px 0 #000;">
                      Ctrl + V
                    </kbd>
                  </div>
                  <p style="font-size: 0.9rem; color: #3085d6; font-weight: bold;">
                    ¡Asegúrate de pegar el contenido antes de cerrar esta ventana!
                  </p>
                </div>
              </div>
            `,
      timer: 2500,
    });

    const clean = (str?: string | null) =>
      str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

    const subject = `EXPEDIENTE-${pricing.nro_exp} | QUOTE${
      pricing.nro_quote
    } ${clean(pricing.dataCliente.nombrecompleto)} ${clean(
      incoterms.value.name,
    )} ${clean(Modality.value!.name!.toUpperCase())}`;

    window.location.href = `mailto:${
      cliente.value.emailaddress || ""
    }?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      "Hola colega, (PEGA LA TABLA AQUÍ)",
    )}`;

    emit("continuar");
  } catch (err) {
    console.error("Error:", err);
  }
}
function checkNoAplica(step: number) {
  const campos: Record<number, string> = {
    1: "servicio",
    2: "email",
    3: "listDiaFecha",
    4: "grupoWhatsapp",
    6: "pagarProveedor",
    7: "dondePagar",
    8: "monto",
    9: "clientePago",
    10: "linkDePago",
    11: "condicionesLink",
    12: "nroFactura",
    13: "seguro",
    24: "observacion1",
    25: "observacion2",
  };

  const propiedad = campos[step];

  if (propiedad) {
    datosManuales.value[propiedad] = datosManualesNoAplica.value[propiedad]
      ? "No Aplica"
      : "";
  }
}
function _tr(label: string, value?: unknown) {
  return `
    <tr>
      <td valign="top" style="width:123pt; border:solid windowtext 1.0pt; padding:4pt;">
        <p style="margin:0; font-size:11px;">${label}</p>
      </td>
      <td valign="top" style="border:solid windowtext 1.0pt; border-left:none; padding:4pt;">
        <p style="margin:0; font-size:11px;">${value || ""}</p>
      </td>
    </tr>`;
}

function cargarDatosModality() {
  if (!pricing?.listModality || !datosPrincipales) return;
  Modality.value =
    pricing.listModality.find(
      (v) => v.id == datosPrincipales.idsentido,
    ) || {};
}

function cargarDatosShipment() {
  if (!pricing?.listShipment || !datosPrincipales) return;
  Shipment.value =
    pricing.listShipment.find(
      (v) => v.id == datosPrincipales.idtipocarga,
    ) || {};
}

// Shadowed by the later cargarDatosProveedor, so it never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cargarDatosProveedorSombreado() {
  const lista = pricing?.itemsProveedorList || itemsProveedorList;
  if (!lista || !datosPrincipales) return;

  Proveedor.value =
    lista.find((v) => v.id == datosPrincipales.id_proveedor) || {};
}
function cargarDatosAsesor() {
  asesor.value = encontrar(
    pricing.listEjecutivo,
    datosPrincipales.id_vendedor,
    "id_entitie",
  );
}
function cargarDatosAsesorPricing() {
  asesorPricing.value = encontrar(
    pricing.listEjecutivo,
    datosPrincipales.id_pricing,
    "id_entitie",
  );
}
function cargarDatosIncoterms() {
  incoterms.value = encontrar(
    pricing.listIncoterms,
    datosPrincipales.idincoterms,
  );
}

function cargarDatosProveedor() {

  proveedor.value = encontrar(
    appStore.itemsProveedorList,
    datosPrincipales.id_proveedor,
  );
}
function cargarDatosCliente() {
  cliente.value = { ...pricingStore.dataCliente };
  cliente.value.nombre_clean = (cliente.value.nombrecompleto || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

function encontrar(lista: object[], id: unknown, campo = "id"): FichaInstructivo {
  return (lista.find((v) => (v as Record<string, unknown>)[campo] == id) || {}) as FichaInstructivo;
}

function cargaNroQuote() {
  if (!pricing?.nro_quote) {
    nro_quote.value = "";
    return;
  }
  nro_quote.value = pricing.nro_quote
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payPath: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let payfile: unknown;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let msgfile = "";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let errfile = "";
// Never called: it handles a watch source this component does not have.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function recibirId(file: { inserid?: unknown; archivo?: unknown }) {
  payPath = file.inserid;
  payfile = file.archivo;

  msgfile = "Archivo procesado y vinculado correctamente.";
  errfile = "";
}

onMounted(async () => {
  // Siempre arranca en el primer paso (Shipper) y se avanza paso por paso (también si ya está aprobado).
  void cargarShippers();
  Promise.all([
    cargarDatosModality(),
    cargarDatosShipment(),
    cargarDatosIncoterms(),
    cargarDatosProveedor(),
    cargaNroQuote(),
    cargarDatosAsesor(),
    cargarDatosIncoterms(),
    cargarDatosCliente(),
    cargarDatosAsesorPricing(),
  ]);

  const tipoCargaItem = pricingStore.listShipment.find(
    (v) => v.id == pricingStore.datosPrincipales.idtipocarga,
  );

  const idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;
  if (pricingStore.datosPrincipales.datosinstructivomanual) {
    datosManuales.value =
      pricingStore.datosPrincipales.datosinstructivomanual;
    datosFile.value =
      pricingStore.datosPrincipales.datosinstructivomanual.table_allpath_list as unknown[];
    const opcionCostos = pricingStore.opcionCostos.filter(
      (v) => !!v.selected,
    );
    const costosFlete = opcionCostos[0]!.listCostos.filter(
      (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
    );

    const proveedoresUnicos = [
      ...new Set(costosFlete.map((v) => v.id_proveedor)),
    ];
    const idBuscado =
      proveedoresUnicos.length > 0 ? proveedoresUnicos[0] : null;
    proveedorInstructivo.value =
      appStore.provedores.find((v: ProveedorPricing) => v.id == idBuscado) || {};
  }
  puertoOrigen.value = (await puertoStore.verPuerto({
    id_transport: idTipoCarga as number | undefined,
    id: pricingStore.datosPrincipales.idorigen!,
  })) as Puerto | null;
  puertoDestino.value = (await puertoStore.verPuerto({
    id_transport: idTipoCarga as number | undefined,
    id: pricingStore.datosPrincipales.iddestino!,
  })) as Puerto | null;
});

watch(() => datosManuales.value.cotizacionFile, () => {
  if (!datosManuales.value.cotizacionFile) {
    datosManuales.value.cotizacionFlag = false;
  }
});
watch(() => datosManuales.value.facturaCommercial, () => {
  if (!datosManuales.value.facturaCommercial) {
    datosManuales.value.facturaCommercialFlag = false;
  }
});
watch(() => datosManuales.value.listaEmpaque, () => {
  if (!datosManuales.value.listaEmpaque) {
    datosManuales.value.listaEmpaqueFlag = false;
  }
});
watch(() => datosManuales.value.proforma, () => {
  if (!datosManuales.value.proforma) {
    datosManuales.value.proformaFlag = false;
  }
});
watch(() => datosManuales.value.fichaTecnica, () => {
  if (!datosManuales.value.fichaTecnica) {
    datosManuales.value.fichaTecnicaFlag = false;
  }
});
watch(() => datosManuales.value.soportePagoAlibaba, () => {
  if (!datosManuales.value.soportePagoAlibaba) {
    datosManuales.value.soportePagoAlibabaFlag = false;
  }
});
watch(() => datosManuales.value.soporteTransferenciaInternacional, () => {
  if (!datosManuales.value.soporteTransferenciaInternacional) {
    datosManuales.value.soporteTransferenciaInternacionalFlag = false;
  }
});
watch(() => datosManuales.value.otros, () => {
  if (!datosManuales.value.otros) {
    datosManuales.value.otrosFlag = false;
  }
});
watch(() => datosManuales.value.agregarOtros, () => {
  if (!datosManuales.value.agregarOtros) {
    datosManuales.value.agregarOtrosFlag = false;
  }
});
</script>

<template>
  <div
    ref="layoutEl"
    class="ins-layout"
    :class="{ 'is-resizing': redimensionando }"
    :style="estiloLayout"
  >
    <aside class="ins-aside">
      <div
        v-if="verDatosPreview"
        ref="stepsScroll"
        class="ins-aside__steps"
      >
        <v-defaults-provider :defaults="defaultsPasos">
          <div class="ins-steps">
            <!-- SHIPPER(S) -->
            <InstructivoStep
              :number="stepNumber(0)"
              title="Shipper"
              :active="e6 === 0"
              :complete="isComplete(0)"
              :data-step="0"
              :locked="0 > pasoMaximo"
              @select="irAPaso(0)"
            >
              <v-row>
                <v-col cols="12">
                  <p class="adj-intro">
                    Selecciona los shippers de este embarque (proveedores con rol SHIPPER).
                  </p>
                  <div class="shp-list">
                    <div
                      v-for="(fila, index) in shippersInstructivo"
                      :key="fila.uid"
                      class="shp-item"
                    >
                      <v-autocomplete
                        v-model="fila.id"
                        :items="opcionesShipper(fila.id)"
                        item-title="namelong"
                        item-value="id"
                        placeholder="Selecciona un shipper"
                        prepend-inner-icon="mdi-ferry"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="shp-item__select"
                      />
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        class="adj-item__remove"
                        title="Quitar shipper"
                        @click="quitarShipper(index)"
                      >
                        <v-icon>mdi-trash-can-outline</v-icon>
                      </v-btn>
                    </div>
                  </div>
                  <v-btn
                    variant="flat"
                    class="adj-add"
                    prepend-icon="mdi-plus-circle-outline"
                    @click="agregarShipper()"
                  >
                    Agregar otro Shipper
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>

            <!-- SERVICIO -->
            <InstructivoStep
              :number="stepNumber(1)"
              title="Servicio"
              :active="e6 === 1"
              :complete="isComplete(1)"
              :data-step="1"
              :locked="1 > pasoMaximo"
              @select="irAPaso(1)"
            >
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    placeholder="Individual/ Grupal"
                    v-model="datosManuales.servicio"
                    ref="txtServicio"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
    
            <InstructivoStep
              :number="stepNumber(2)"
              title="Asunto de Email de seguimiento"
              :active="e6 === 2"
              :complete="isComplete(2)"
              :data-step="2"
              :locked="2 > pasoMaximo"
              @select="irAPaso(2)"
            >
              <v-row>
                <v-col cols="12">
                  <p class="text-red">
                    Asunto del email de seguimiento con el coloader o Agente donde se
                    consiguió la tarifa
                  </p>
                  <v-textarea
                    v-model="datosManuales.email"
                    ref="txtEmail"
                    placeholder="Asunto del email de seguimiento"
                    rows="1"
                    auto-grow
                    class="txt-wrap"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
    
            <!--  -->
            <InstructivoStep
              :number="stepNumber(3)"
              title="Carga lista (día / fecha)"
              :active="e6 === 3"
              :complete="isComplete(3)"
              :data-step="3"
              :locked="3 > pasoMaximo"
              @select="irAPaso(3)"
            >
              <v-row>
                <v-col
                  cols="12"
                  class="pt-0"
                >
                  <v-textarea
                    rows="1"
                    auto-grow
                    placeholder=""
                    v-model="datosManuales.listDiaFecha"
                    ref="txtcondiciones"
                    class="txtNroFactura"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
            <!--  -->
            <InstructivoStep
              :number="stepNumber(4)"
              title="Nombre del grupo de WhatsApp"
              :active="e6 === 4"
              :complete="isComplete(4)"
              :data-step="4"
              :locked="4 > pasoMaximo"
              @select="irAPaso(4)"
            >
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    rows="1"
                    auto-grow
                    placeholder=""
                    v-model="datosManuales.grupoWhatsapp"
                    ref="txtcondiciones"
                    class="txtNroFactura"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
            <!--  -->
            <InstructivoStep
              :number="stepNumber(5)"
              title="Se adjunta"
              :active="e6 === 5"
              :complete="isComplete(5)"
              :data-step="5"
              :locked="5 > pasoMaximo"
              @select="irAPaso(5)"
            >
              <v-row>
                <v-col cols="12">
                  <p class="adj-intro">
                    Selecciona y adjunta los documentos disponibles para este embarque
                    (facturas, permisos, fotos y cualquier información relevante).
                    Basta con marcar el check; subir el archivo es opcional.
                  </p>
                  <div class="adj-list">
                    <div
                      v-for="doc in documentosSeAdjunta"
                      :key="doc.key"
                      class="adj-item"
                    >
                      <v-checkbox-btn
                        v-model="doc.flag"
                        color="success"
                        density="compact"
                        class="adj-item__check"
                      />
                      <div
                        class="adj-item__label"
                        :class="{ 'adj-item__label--otros': doc.editable }"
                      >
                        <template v-if="doc.editable">
                          <span>Otros</span>
                          <v-text-field
                            v-model="doc.label"
                            placeholder="Nombre del documento"
                            variant="outlined"
                            density="compact"
                            hide-details
                            append-inner-icon="mdi-pencil-outline"
                            class="adj-item__name"
                          />
                        </template>
                        <span v-else>{{ doc.label }}</span>
                      </div>
                      <ArrastraYSolarComponent
                        compact
                        :id="doc.key"
                        :archivo-inicial="doc.file as ArchivoInicial"
                        @archivo-cargado="(datoEmit) => cargarArchivoDinamico(datoEmit, doc)"
                        @archivo-eliminado="eliminarArchivoDinamico(doc)"
                      />
                      <v-btn
                        v-if="esOtroAgregado(doc)"
                        icon
                        variant="text"
                        size="x-small"
                        class="adj-item__remove"
                        title="Quitar"
                        @click="quitarOtro(doc)"
                      >
                        <v-icon>mdi-trash-can-outline</v-icon>
                      </v-btn>
                    </div>
                  </div>
                  <v-btn
                    variant="flat"
                    class="adj-add"
                    prepend-icon="mdi-plus-circle-outline"
                    @click="agregarOtro"
                  >
                    Agregar otros
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar()"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
    
            <!--  -->
            <InstructivoStep
              :number="stepNumber(6)"
              title="Debemos pagar al proveedor"
              :active="e6 === 6"
              :complete="isComplete(6)"
              :data-step="6"
              :locked="6 > pasoMaximo"
              @select="irAPaso(6)"
            >
              <v-row>
                <v-col cols="12">
                  <p class="text-red">
                    solo aplica si el cliente nos cancela a nosotros y
                    nosotros debemos pagar al proveedor
                  </p>
                  <v-select
                    item-title="text"
                    density="compact"
                    :items="cboSiNo"
                    v-model="datosManuales.pagarProveedor"
                    variant="outlined"
                    label="Si/ No"
                    hide-details
                    style="width: 120px; margin-top: 10px"
                  />
                </v-col>
    
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuarPagarProveedor"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
    
            <!--  -->
            <InstructivoStep
              v-if="datosManuales.pagarProveedor"
              :number="stepNumber(7)"
              title="Escoge una opción de pago"
              :active="e6 === 7"
              :complete="isComplete(7)"
              :data-step="7"
              :locked="7 > pasoMaximo"
              @select="irAPaso(7)"
            >
              <v-row>
                <v-col cols="12">
                  <v-radio-group
                    v-model="datosManuales.metodoPagarProveedor"
                    density="compact"
                  >
                    <v-radio
                      label="Pago por Alibaba"
                      value="1"
                    />
                    <v-radio
                      label="Transferencia Internacional"
                      value="2"
                    />
                    <v-radio
                      label="Otros"
                      value="3"
                    />
                  </v-radio-group>
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
            <!-- MONTO A PAGAR -->
            <template v-if="datosManuales.pagarProveedor">
              <!-- Monto -->
              <InstructivoStep
                :number="stepNumber(8)"
                title="Monto a pagar"
                :active="e6 === 8"
                :complete="isComplete(8)"
                :data-step="8"
                :locked="8 > pasoMaximo"
                @select="irAPaso(8)"
              >
                <v-row>
                  <v-col cols="12">
                    <p class="text-red">
                      Solo aplica si el cliente nos cancela a nosotros...
                    </p>
                    <v-text-field
                      v-model="datosManuales.monto"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-spacer />
                    <v-btn
                      color="primary"
                      class="mx-1"
                      @click="continuar"
                    >
                      Continuar
                    </v-btn>
                    <v-btn
                      variant="text"
                      class="mx-1"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                  </v-col>
                </v-row>
              </InstructivoStep>
              <!-- ALIBABA -->
              <template v-if="mostrarPagarProveedorAlibaba">
                <!--  -->
                <InstructivoStep
                  v-if="datosManuales.pagarProveedor"
                  :number="stepNumber(9)"
                  title="Cliente ya nos pagó"
                  :active="e6 === 9"
                  :complete="isComplete(9)"
                  :data-step="9"
                  :locked="9 > pasoMaximo"
                  @select="irAPaso(9)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-select
                        item-title="text"
                        :items="cboSiNo"
                        v-model="clienteYaPago"
                        variant="outlined"
                        label="Si/ No"
                        style="width: 120px; margin-top: 10px"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
    
                <!-- PAGO DEL CLIENTE: solo si "Cliente ya nos pagó" = Sí -->
                <InstructivoStep
                  v-if="clienteYaPago"
                  :number="stepNumber(10)"
                  title="Pago del cliente"
                  :active="e6 === 10"
                  :complete="isComplete(10)"
                  :data-step="10"
                  :locked="10 > pasoMaximo"
                  @select="irAPaso(10)"
                >
                  <v-row>
                    <v-col
                      cols="12"
                      sm="6"
                    >
                      <v-text-field
                        type="number"
                        label="Monto pagado"
                        step="0.01"
                        v-model="datosManuales.montoRecibido"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                    >
                      <FormatFecha
                        v-model="fechaPagoCliente"
                        label="Fecha de pago del cliente"
                        density="compact"
                        :outlined="true"
                        hide-details="auto"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
    
                <!-- LINK DE PAGO ALIBABA -->
                <InstructivoStep
                  :number="stepNumber(12)"
                  title="Link de pago Alibaba"
                  :active="e6 === 12"
                  :complete="isComplete(12)"
                  :data-step="12"
                  :locked="12 > pasoMaximo"
                  @select="irAPaso(12)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        name="linkPagoAlibaba"
                        label="Link de Pago Alibaba"
                        id="linkPagoAlibaba"
                        v-model="datosManuales.linkDePagoAlibaba"
                      />
                    </v-col>
                    <!-- Soporte de pago: mismo control que en "Se adjunta", reubicado aquí -->
                    <v-col
                      v-if="docSoportePago"
                      cols="12"
                    >
                      <div class="adj-item">
                        <v-checkbox-btn
                          v-model="docSoportePago.flag"
                          color="success"
                          density="compact"
                          class="adj-item__check"
                        />
                        <div class="adj-item__label">
                          {{ docSoportePago.label }}
                        </div>
                        <ArrastraYSolarComponent
                          compact
                          :id="docSoportePago.key"
                          :archivo-inicial="docSoportePago.file as ArchivoInicial"
                          @archivo-cargado="cargarSoportePago"
                          @archivo-eliminado="eliminarSoportePago"
                        />
                      </div>
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
    
                <!-- NRO DE CONTRATO DE ALIBABA -->
                <InstructivoStep
                  :number="stepNumber(13)"
                  title="Número de contrato de Alibaba"
                  :active="e6 === 13"
                  :complete="isComplete(13)"
                  :data-step="13"
                  :locked="13 > pasoMaximo"
                  @select="irAPaso(13)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        name="linkPagoAlibaba"
                        label="Número de Contrato de Alibaba (De Acuerdo a la Factura comercial)"
                        id="numeroContratoAlibaba"
                        v-model="datosManuales.numeroContratoAlibaba"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="pasarASeguro"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
              </template>
    
              <template v-if="mostrarPagarProveedorInternacional">
                <!-- Nro Factura -->
                <InstructivoStep
                  :number="stepNumber(14)"
                  title="N° de factura"
                  :active="e6 === 14"
                  :complete="isComplete(14)"
                  :data-step="14"
                  :locked="14 > pasoMaximo"
                  @select="irAPaso(14)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-checkbox
                        v-model="datosManualesNoAplica.nroFactura"
                        @update:model-value="checkNoAplica(13)"
                        label="No Aplica"
                      />
                      <v-text-field
                        v-model="datosManuales.nroFactura"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
    
                <!-- Banco Beneficiario o Cuenta Beneficiario -->
                <InstructivoStep
                  :number="stepNumber(15)"
                  title="Banco beneficiario"
                  :active="e6 === 15"
                  :complete="isComplete(15)"
                  :data-step="15"
                  :locked="15 > pasoMaximo"
                  @select="irAPaso(15)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.bancoBenbeficiario"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
    
                <!-- Dirección del banco beneficiario -->
                <InstructivoStep
                  :number="stepNumber(16)"
                  title="Dirección del banco beneficiario"
                  :active="e6 === 16"
                  :complete="isComplete(16)"
                  :data-step="16"
                  :locked="16 > pasoMaximo"
                  @select="irAPaso(16)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.direccionBancoBeneficiario"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
                <!-- Nombre del Beneficiario -->
                <InstructivoStep
                  :number="stepNumber(17)"
                  title="Nombre del beneficiario"
                  :active="e6 === 17"
                  :complete="isComplete(17)"
                  :data-step="17"
                  :locked="17 > pasoMaximo"
                  @select="irAPaso(17)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.nombreBeneficiario"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
                <!-- Dirección del Beneficiario -->
                <InstructivoStep
                  :number="stepNumber(18)"
                  title="Dirección del beneficiario"
                  :active="e6 === 18"
                  :complete="isComplete(18)"
                  :data-step="18"
                  :locked="18 > pasoMaximo"
                  @select="irAPaso(18)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.direccionBeneficiario"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
                <!-- Número de Cuenta -->
                <InstructivoStep
                  :number="stepNumber(19)"
                  title="Número de cuenta"
                  :active="e6 === 19"
                  :complete="isComplete(19)"
                  :data-step="19"
                  :locked="19 > pasoMaximo"
                  @select="irAPaso(19)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.numeroCuentaBeneficiario"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
                <!-- Porcentaje de Pago -->
                <InstructivoStep
                  :number="stepNumber(20)"
                  title="Porcentaje de pago"
                  :active="e6 === 20"
                  :complete="isComplete(20)"
                  :data-step="20"
                  :locked="20 > pasoMaximo"
                  @select="irAPaso(20)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.porcentajePago"
                        class="txtNroFactura"
                        type="number"
                        step="0.01"
                        suffix="%"
                        style="max-width: 100px"
                        max="100"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="continuar"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
                <!-- País Recepto -->
                <InstructivoStep
                  :number="stepNumber(21)"
                  title="País receptor"
                  :active="e6 === 21"
                  :complete="isComplete(21)"
                  :data-step="21"
                  :locked="21 > pasoMaximo"
                  @select="irAPaso(21)"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="datosManuales.paisReceptor"
                        class="txtNroFactura"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-spacer />
                      <v-btn
                        color="primary"
                        class="mx-1"
                        @click="pasarASeguro"
                      >
                        Continuar
                      </v-btn>
                      <v-btn
                        variant="text"
                        class="mx-1"
                        @click="regresar()"
                      >
                        Volver
                      </v-btn>
                    </v-col>
                  </v-row>
                </InstructivoStep>
              </template>
              <!-- ------------------------------------------ -->
              <InstructivoStep
                v-if="false"
                :number="stepNumber(22)"
                title="Dónde se debe pagar"
                :active="e6 === 22"
                :complete="isComplete(22)"
                :data-step="22"
                :locked="22 > pasoMaximo"
                @select="irAPaso(22)"
              >
                <v-row>
                  <v-col cols="12">
                    <p class="text-red">
                      solo aplica si el cliente nos cancela a nosotros...
                    </p>
                    <v-checkbox
                      v-model="datosManualesNoAplica.dondePagar"
                      @update:model-value="checkNoAplica(8)"
                      label="No Aplica"
                    />
                    <v-text-field
                      v-model="datosManuales.dondePagar"
                      ref="txtClientePago"
                    />
                  </v-col>
                </v-row>
              </InstructivoStep>
            </template>
            <!-- SEGURO DE MERCANCIA -->
            <InstructivoStep
              :number="stepNumber(23)"
              title="Seguro de mercancía"
              :active="e6 === 23"
              :complete="isComplete(23)"
              :data-step="23"
              :locked="23 > pasoMaximo"
              @select="irAPaso(23)"
            >
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="datosManuales.seguro"
                    placeholder="Si/No"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
            <InstructivoStep
              :number="stepNumber(24)"
              title="Observaciones adicionales 1"
              :active="e6 === 24"
              :complete="isComplete(24)"
              :data-step="24"
              :locked="24 > pasoMaximo"
              @select="irAPaso(24)"
            >
              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    label="No Aplica"
                    v-model="datosManualesNoAplica.observacion1"
                    @update:model-value="checkNoAplica(24)"
                  />
                  <v-textarea
                    v-model="datosManuales.observacion1"
                    auto-grow
                    rows="1"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
            <!--  -->
            <InstructivoStep
              :number="stepNumber(25)"
              title="Observaciones adicionales 2"
              :active="e6 === 25"
              :complete="isComplete(25)"
              :data-step="25"
              :locked="25 > pasoMaximo"
              @select="irAPaso(25)"
            >
              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    label="No Aplica"
                    v-model="datosManualesNoAplica.observacion2"
                    @update:model-value="checkNoAplica(25)"
                  />
                  <v-textarea
                    v-model="datosManuales.observacion2"
                    auto-grow
                    rows="1"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuar"
                  >
                    Continuar
                  </v-btn>
                  <v-btn
                    variant="text"
                    class="mx-1"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>
          </div>
        </v-defaults-provider>
      </div>

      <div class="ins-aside__actions">
        <v-btn
          v-if="!aprobadoflag"
          block
          class="ins-btn ins-btn--primary"
          prepend-icon="mdi-send-outline"
          @click="setDatosInstructivo"
        >
          Guardar borrador y continuar a {{ destinoLabel }}
        </v-btn>
        <v-btn
          v-if="aprobadoflag"
          block
          class="ins-btn ins-btn--primary"
          prepend-icon="mdi-send-outline"
          @click="guardarYGenenarCorreo"
        >
          Guardar y enviar a Operaciones
        </v-btn>
        <v-btn
          v-if="aprobadoflag"
          block
          variant="outlined"
          class="ins-btn ins-btn--ghost"
          prepend-icon="mdi-printer-outline"
          @click="generarHTMLPDF()"
        >
          Imprimir
        </v-btn>
        <v-btn
          block
          variant="outlined"
          class="ins-btn ins-btn--ghost"
          prepend-icon="mdi-close"
          @click="$emit('cerrarDialogo')"
        >
          Cerrar
        </v-btn>
      </div>
    </aside>

    <div
      v-if="conDivisor"
      class="ins-resizer"
      role="separator"
      aria-orientation="vertical"
      title="Arrastra para ensanchar o reducir · doble clic para volver al ancho mínimo"
      @pointerdown="iniciarRedimension"
      @dblclick="reiniciarAncho"
    >
      <span class="ins-resizer__grip" />
    </div>

    <section
      v-if="verPrevisualizacion"
      class="ins-preview"
    >
      <div class="ins-preview__tabs">
        <v-btn-toggle
          v-model="tabPreview"
          mandatory
          density="compact"
          rounded="lg"
          color="primary"
          class="ins-toggle"
        >
          <v-btn value="op">
            Instructivo a {{ destinoLabel }}
          </v-btn>
          <v-btn value="agente">
            Instructivo al agente
          </v-btn>
        </v-btn-toggle>
      </div>

      <div
        ref="previewScroll"
        class="ins-preview__scroll"
      >
        <div class="ins-sheet">
          <!-- CABECERA -->
          <header class="ins-sheet__header">
            <div class="ins-brand">
              <img
                v-if="logoEmpresa"
                :src="logoEmpresa"
                alt="Logo"
              >
              <span
                v-else
                class="ins-brand__text"
              >PIC Cargo</span>
            </div>
            <div class="ins-sheet__title">
              <h2>
                {{ tabPreview === "op" ? `INSTRUCTIVO DE ${destinoLabel.toUpperCase()}` : "INSTRUCTIVO AL AGENTE" }}
              </h2>
              <div class="ins-sheet__client">
                Cliente: <b>{{ cliente.nombrecompleto || "" }}</b>
                <template v-if="datosPrincipales.telefono">
                  <span class="ins-divider" />
                  <v-icon
                    size="16"
                    color="primary"
                  >
                    mdi-phone-outline
                  </v-icon>
                  {{ datosPrincipales.telefono }}
                </template>
              </div>
              <div
                v-if="tabPreview === 'op'"
                class="ins-sheet__tags"
              >
                <span class="ins-tag">
                  <v-icon size="16">mdi-account-outline</v-icon>
                  Asesor: <b>{{ asesor ? asesor.name : "" }}</b>
                </span>
                <span class="ins-tag">
                  <v-icon size="16">mdi-layers-outline</v-icon>
                  Pricing: <b>{{ asesorPricing ? asesorPricing.name : "" }}</b>
                </span>
              </div>
            </div>
            <div
              v-if="tabPreview === 'op'"
              class="ins-sheet__meta"
            >
              <div class="ins-meta">
                <v-icon size="18">
                  mdi-calendar-month-outline
                </v-icon>
                Fecha: <b>{{ fecha || "" }}</b>
              </div>
              <div class="ins-meta">
                <v-icon size="18">
                  mdi-clipboard-text-outline
                </v-icon>
                N.° de Cotización: <b class="ins-meta__quote">{{ nro_quote || "" }}</b>
              </div>
            </div>
          </header>

          <!-- INSTRUCTIVO A OPERACIONES / TRÁFICO -->
          <div
            v-if="tabPreview === 'op'"
            class="ins-sheet__body"
          >
            <InstructivoPreviewRow
              icon="mdi-office-building-outline"
              label="Agente o Coloader"
              class="ins-row--feature"
            >
              <div>
                <b>{{ proveedorInstructivo.namelong || "" }}</b>
                <div
                  v-if="proveedorInstructivo.contacto || proveedorInstructivo.contacto_phone"
                  class="ins-sub"
                >
                  Contacto: {{ proveedorInstructivo.contacto || "" }}
                  · Teléfono: {{ proveedorInstructivo.contacto_phone || "" }}
                </div>
              </div>
            </InstructivoPreviewRow>

            <div
              class="ins-strip"
              :class="{ 'is-active': pasoActivo === 'servicio' }"
              data-paso="servicio"
            >
              <div class="ins-strip__cell">
                <v-icon size="24">
                  mdi-map-marker-outline
                </v-icon>
                <div>
                  <small>Origen / Destino</small>
                  <b>{{ puertoOrigen ? puertoOrigen.name : "" }} - {{ puertoDestino ? puertoDestino.name : "" }}</b>
                </div>
              </div>
              <div class="ins-strip__cell">
                <v-icon size="24">
                  mdi-ferry
                </v-icon>
                <div>
                  <small>Tipo de embarque</small>
                  <b>{{ Shipment.code || "" }}</b>
                </div>
              </div>
              <div class="ins-strip__cell">
                <v-icon size="24">
                  mdi-layers-outline
                </v-icon>
                <div>
                  <small>Servicio</small>
                  <b>{{ datosManuales.servicio || "—" }}</b>
                </div>
              </div>
            </div>

            <InstructivoPreviewRow
              icon="mdi-cube-outline"
              label="Datos de la carga"
              hint="Si es EXW enviar dirección de recolecta"
            >
              <span class="ins-pair">Peso: <b>{{ datosPrincipales.peso || "" }} kg</b></span>
              <span class="ins-pair">Volumen: <b>{{ datosPrincipales.volumen || "" }} m³</b></span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-cube-outline"
              label="Incoterm"
            >
              <b>{{ incoterms.name || "" }}</b>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-tag-outline"
              label="Tipo de mercancía"
            >
              <b>{{ datosPrincipales.descripcioncarga || "" }}</b>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-account-outline"
              :label="shippersPreview.length > 1 ? 'Shippers' : 'Shipper'"
              data-paso="shipper"
              :active="pasoActivo === 'shipper'"
            >
              <div
                v-if="shippersPreview.length"
                class="ins-shippers"
              >
                <div
                  v-for="shipper in shippersPreview"
                  :key="shipper.id"
                  class="ins-grid"
                >
                  <span>Nombre: <b>{{ shipper.namelong }}</b></span>
                  <span>Contacto: <b>{{ shipper.contacto }}</b></span>
                  <span>Email:
                    <a
                      class="text-primary"
                      :href="`mailto:${shipper.emailaddress}`"
                    ><b>{{ shipper.emailaddress }}</b></a>
                  </span>
                  <span>Teléfono: <b>{{ shipper.telefono }}</b></span>
                </div>
              </div>
              <div
                v-else
                class="ins-grid"
              >
                <span>Nombre: <b>{{ proveedor.namelong || "" }}</b></span>
                <span>Contacto: <b>{{ proveedor.contacto || "" }}</b></span>
                <span>Email:
                  <a
                    class="text-primary"
                    :href="`mailto:${proveedor.emailaddress}`"
                  ><b>{{ proveedor.emailaddress || "" }}</b></a>
                </span>
                <span>Teléfono: <b>{{ proveedor.contacto_phone || "" }}</b></span>
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-domain"
              label="Cliente / Razón social"
            >
              <div class="ins-grid">
                <span>Nombre: <b>{{ cliente ? cliente.nombrecompleto : "" }}</b></span>
                <span>RUC: <b>{{ cliente ? cliente.document : "" }}</b></span>
                <span class="ins-grid__full">Dirección: <b>{{ cliente ? cliente.address : "" }}</b></span>
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-bell-outline"
              label="Notify"
            >
              <div>
                <b>PIC LOGISTICA SAC</b> · RUC: 20609852861<br>
                AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br>
                Contacto: Carlos Ramirez · CORREO: ASESOR2@PIC-CARGO.COM
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-email-outline"
              label="Asunto de Email de seguimiento"
              data-paso="email"
              :active="pasoActivo === 'email'"
            >
              {{ datosManuales.email || "" }}
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-calendar-month-outline"
              label="Carga lista (día / fecha)"
              data-paso="cargaLista"
              :active="pasoActivo === 'cargaLista'"
            >
              {{ datosManuales.listDiaFecha || "" }}
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-whatsapp"
              label="Nombre del grupo de WhatsApp"
              data-paso="whatsapp"
              :active="pasoActivo === 'whatsapp'"
            >
              {{ datosManuales.grupoWhatsapp || "" }}
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-paperclip"
              label="Se adjunta"
              data-paso="adjunta"
              :active="pasoActivo === 'adjunta'"
            >
              <div
                v-if="documentosAdjuntos.length"
                class="ins-files"
              >
                <span
                  v-for="doc in documentosAdjuntos"
                  :key="doc.key"
                  class="ins-file"
                >
                  <v-icon size="16">mdi-file-document-outline</v-icon>
                  <span>
                    {{ doc.label }}
                    <small>{{ doc.archivo }}</small>
                  </span>
                </span>
              </div>
              <span
                v-else
                class="ins-muted"
              >No hay archivos seleccionados</span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-cash-multiple"
              label="Debemos pagar al proveedor"
              hint="Solo aplica si el cliente nos cancela a nosotros y nosotros debemos pagar al proveedor"
              data-paso="pagarProveedor"
              :active="pasoActivo === 'pagarProveedor'"
            >
              <span
                class="ins-chip"
                :class="datosManuales.pagarProveedor ? 'ins-chip--si' : 'ins-chip--no'"
              >
                {{ datosManuales.pagarProveedor ? "Sí" : "No" }}
              </span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              v-if="mostrarPagarProveedorAlibaba"
              icon="mdi-map-marker-outline"
              label="Dónde se debe pagar"
              data-paso="dondePagar"
              :active="pasoActivo === 'dondePagar'"
            >
              {{ datosManuales.dondePagar || "" }}
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              v-if="datosManuales.pagarProveedor"
              icon="mdi-bank-outline"
              label="Datos bancarios para transferencia"
              data-paso="datosBancarios"
              :active="pasoActivo === 'datosBancarios'"
            >
              <div
                v-if="datosBancarios.length"
                class="ins-grid"
              >
                <span
                  v-for="dato in datosBancarios"
                  :key="dato.label"
                >{{ dato.label }}: <b>{{ dato.valor ?? "" }}</b></span>
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-shield-check-outline"
              label="Seguro de mercancía"
              data-paso="seguro"
              :active="pasoActivo === 'seguro'"
            >
              <span
                v-if="datosManuales.seguro"
                class="ins-chip"
                :class="claseSiNo(datosManuales.seguro)"
              >{{ datosManuales.seguro }}</span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-text-box-outline"
              label="Observaciones adicionales 1"
              data-paso="obs1"
              :active="pasoActivo === 'obs1'"
            >
              {{ datosManuales.observacion1 || "" }}
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-text-box-outline"
              label="Observaciones adicionales 2"
              data-paso="obs2"
              :active="pasoActivo === 'obs2'"
            >
              {{ datosManuales.observacion2 || "" }}
            </InstructivoPreviewRow>

            <a
              v-if="datosPrincipales.url_folderonedriveexp"
              class="ins-folder"
              :href="datosPrincipales.url_folderonedriveexp"
              target="_blank"
            >
              <v-icon size="22">mdi-folder-outline</v-icon>
              Clic de Carpeta Operativa
            </a>
          </div>

          <!-- INSTRUCTIVO AL AGENTE -->
          <div
            v-else
            class="ins-sheet__body"
          >
            <InstructivoPreviewRow
              icon="mdi-map-marker-outline"
              label="Puerto de salida"
            >
              <b>{{ puertoOrigen ? puertoOrigen.name : "" }}</b>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-ferry"
              label="Tipo de embarque"
            >
              <b>{{ Shipment.code || "" }}</b>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-cube-outline"
              label="Datos de la carga"
              hint="Si es EXWORK enviar dirección de recolecta"
            >
              <div class="ins-grid">
                <span>Incoterms: <b>{{ incoterms.name || "" }}</b></span>
                <span>Peso: <b>{{ datosPrincipales.peso || "" }} kg</b></span>
                <span>Volumen: <b>{{ datosPrincipales.volumen || "" }} m³</b></span>
                <span>Tipo de mercancía: <b>{{ datosPrincipales.descripcioncarga || "" }}</b></span>
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-account-outline"
              :label="shippersPreview.length > 1 ? 'Shippers' : 'Shipper'"
              data-paso="shipper"
              :active="pasoActivo === 'shipper'"
            >
              <div
                v-if="shippersPreview.length"
                class="ins-shippers"
              >
                <div
                  v-for="shipper in shippersPreview"
                  :key="shipper.id"
                  class="ins-grid"
                >
                  <span>Nombre: <b>{{ shipper.namelong }}</b></span>
                  <span>Contacto: <b>{{ shipper.contacto }}</b></span>
                  <span>Email:
                    <a
                      class="text-primary"
                      :href="`mailto:${shipper.emailaddress}`"
                    ><b>{{ shipper.emailaddress }}</b></a>
                  </span>
                  <span>Teléfono: <b>{{ shipper.telefono }}</b></span>
                </div>
              </div>
              <div
                v-else
                class="ins-grid"
              >
                <span>Nombre: <b>{{ proveedor.namelong || "" }}</b></span>
                <span>Contacto: <b>{{ proveedor.contacto || "" }}</b></span>
                <span>Email:
                  <a
                    class="text-primary"
                    :href="`mailto:${proveedor.emailaddress}`"
                  ><b>{{ proveedor.emailaddress || "" }}</b></a>
                </span>
                <span>Teléfono: <b>{{ proveedor.contacto_phone || "" }}</b></span>
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-domain"
              label="Cliente / Razón social"
            >
              <div class="ins-grid">
                <span>Nombre: <b>{{ cliente ? cliente.nombrecompleto : "" }}</b></span>
                <span>RUC: <b>{{ cliente ? cliente.document : "" }}</b></span>
                <span class="ins-grid__full">Dirección: <b>{{ cliente ? cliente.address : "" }}</b></span>
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-bell-outline"
              label="Notify"
            >
              <div>
                <b>PIC LOGISTICA SAC</b> · RUC: 20609852861<br>
                AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br>
                Contacto: Carlos Ramirez · CORREO: ASESOR2@PIC-CARGO.COM
              </div>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-calendar-month-outline"
              label="Carga lista (día / fecha)"
              data-paso="cargaLista"
              :active="pasoActivo === 'cargaLista'"
            >
              {{ datosManuales.listDiaFecha || "" }}
            </InstructivoPreviewRow>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ins-layout.is-resizing {
  cursor: col-resize;
  user-select: none;
}
.ins-resizer {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
  touch-action: none;
}
.ins-resizer::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: transparent;
  transition: background-color 0.15s;
}
.ins-resizer:hover::before,
.ins-layout.is-resizing .ins-resizer::before {
  background: #9cc0f7;
}
.ins-resizer__grip {
  position: relative;
  width: 6px;
  height: 40px;
  border-radius: 4px;
  background: #c9d2e0;
  transition: background-color 0.15s;
}
.ins-resizer:hover .ins-resizer__grip,
.ins-layout.is-resizing .ins-resizer__grip {
  background: #1f73e8;
}
.ins-layout {
  display: grid;
  row-gap: 16px;
  height: calc(100vh - 64px);
  padding: 16px;
  background: #f3f6fb;
  font-family: "Inter", "Segoe UI", Roboto, sans-serif;
}

/* ===== SIDEBAR / PASOS ===== */
.ins-aside {
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 12px;
}
.ins-aside__steps {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e3e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(16, 38, 84, 0.06);
  scrollbar-gutter: stable;
}
.ins-aside__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ins-btn {
  height: 42px !important;
  justify-content: flex-start;
  border-radius: 10px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}
.ins-btn--primary {
  color: #ffffff !important;
  background: #1f73e8 !important;
  box-shadow: 0 4px 12px rgba(31, 115, 232, 0.28) !important;
}
.ins-btn--ghost {
  color: #1f2a44 !important;
  background: #ffffff !important;
  border-color: #dfe5ee !important;
}

/* ===== PREVISUALIZACIÓN ===== */
.ins-preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  gap: 10px;
}
.ins-preview__tabs {
  display: flex;
  justify-content: flex-end;
}
.ins-toggle {
  border: 1px solid #dfe5ee;
  background: #ffffff;
}
.ins-toggle .v-btn {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.ins-preview__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-gutter: stable;
  border-radius: 14px;
}
.ins-sheet {
  padding: 20px 22px 24px;
  background: #ffffff;
  border: 1px solid #e3e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(16, 38, 84, 0.06);
}
.ins-sheet__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  padding-bottom: 16px;
  margin-bottom: 14px;
  border-bottom: 1px solid #eef1f6;
}
.ins-brand {
  flex: 0 0 auto;
  padding-right: 20px;
  border-right: 2px solid #1f2a44;
}
.ins-brand img {
  display: block;
  max-width: 150px;
  max-height: 56px;
  object-fit: contain;
}
.ins-brand__text {
  font-size: 24px;
  font-weight: 800;
  font-style: italic;
  color: #12306b;
}
.ins-sheet__title {
  flex: 1 1 280px;
  min-width: 0;
}
.ins-sheet__title h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 800;
  color: #12306b;
}
.ins-sheet__client {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 14px;
  color: #1f73e8;
}
.ins-sheet__client b {
  color: #111827;
}
.ins-divider {
  width: 1px;
  height: 16px;
  margin: 0 8px;
  background: #9aa5b8;
}
.ins-sheet__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.ins-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 13px;
  color: #1f73e8;
  background: #eaf2ff;
  border-radius: 8px;
}
.ins-tag b {
  color: #111827;
}
.ins-sheet__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.ins-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 13px;
  color: #4b5563;
  white-space: nowrap;
  border: 1px solid #e3e8f0;
  border-radius: 10px;
}
.ins-meta b {
  color: #111827;
}
.ins-meta .ins-meta__quote {
  font-size: 22px;
  font-weight: 800;
  color: #1f73e8;
}
.ins-sheet__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ins-row--feature :deep(.ins-row__value) {
  font-size: 15px;
}
.ins-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 10px 6px;
  margin: 4px 0;
  background: #eef2f8;
  border-radius: 10px;
  transition: background-color 0.3s, box-shadow 0.3s;
}
.ins-strip.is-active {
  background: #eaf2ff;
  box-shadow: 0 0 0 2px #9cc0f7;
}
.ins-strip__cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: #5b6b85;
}
.ins-strip__cell + .ins-strip__cell {
  border-left: 1px solid #c9d2e0;
}
.ins-strip__cell small {
  display: block;
  font-size: 11px;
  color: #4b5563;
}
.ins-strip__cell b {
  font-size: 15px;
  color: #111827;
}
.ins-sub {
  font-size: 12px;
  color: #6b7280;
}
.ins-pair {
  margin-right: 48px;
}
.ins-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
}
.ins-grid__full {
  grid-column: 1 / -1;
}
.ins-files {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 24px;
}
.ins-file {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.ins-file small {
  display: block;
  font-size: 11px;
  color: #6b7280;
}
.ins-muted {
  color: #9ca3af;
}
.ins-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 18px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  color: #374151;
  background: #e5e7eb;
}
.ins-chip--si {
  color: #166534;
  background: #dcf5d0;
}
.ins-chip--no {
  color: #374151;
  background: #e5e7eb;
}
.ins-folder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  padding: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #12306b;
  text-decoration: none;
  background: #eaf2ff;
  border: 1px solid #9cc0f7;
  border-radius: 10px;
}
.ins-folder:hover {
  background: #dbe8fd;
}

/* ===== SE ADJUNTA ===== */
.adj-intro {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.4;
  color: #4b5563;
}
.adj-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* Flex (no grid): el checkbox de Vuetify trae grid-area propio y desordenaba las columnas. */
.adj-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
}
.adj-item > .adj-item__check {
  flex: 0 0 32px;
  max-width: 32px;
}
.adj-item__label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: #1f2a44;
}
.adj-item__label--otros {
  display: flex;
  align-items: center;
  gap: 8px;
}
.adj-item__label--otros .adj-item__name {
  flex: 1;
  min-width: 0;
}
.adj-item > :deep(.adj-file) {
  flex: 0 0 180px;
  width: 180px;
}
.adj-item > .adj-item__remove {
  flex: none;
}
.adj-item__name :deep(.v-field) {
  font-size: 12px;
  border-radius: 8px;
}
.adj-item__name :deep(.v-field__input) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
}
.adj-item__name :deep(.v-field__append-inner .v-icon) {
  font-size: 16px;
  color: #1f73e8;
}
.adj-item__remove {
  color: #9ca3af !important;
}

/* ===== SHIPPERS ===== */
.shp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shp-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.shp-item__select {
  flex: 1;
  min-width: 0;
}
.ins-shippers {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ins-shippers > .ins-grid + .ins-grid {
  padding-top: 6px;
  border-top: 1px dashed #e3e8f0;
}

/* Textarea que crece hacia abajo, sin scroll horizontal */
.txt-wrap :deep(textarea) {
  overflow-x: hidden;
  white-space: pre-wrap;
  word-break: break-word;
}
.adj-item__remove:hover {
  color: #dc2626 !important;
}
.adj-add {
  margin: 12px 0 0 !important;
  height: 36px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  color: #1f73e8 !important;
  background: #dbe8fd !important;
  border-radius: 10px !important;
}

.custom-title-class {
  font-size: 2.5rem !important;
}

.custom-button-class {
  font-size: 1.5rem !important;
  padding: 15px 30px !important;
}
</style>
