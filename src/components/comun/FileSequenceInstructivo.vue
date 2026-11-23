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
import LogoPlataformaPago from "./LogoPlataformaPago.vue";
import ComprobantePagoCliente from "./ComprobantePagoCliente.vue";
import { useBancosStore } from "@/stores/bancos";
import { shortDate } from "@/utils/dates";
import {
  CODIGO_METODO_PAGO,
  CODIGOS_ALIBABA,
  CODIGOS_MADE_IN_CHINA,
  type MetodoPagoProveedor,
  nombreMetodoPago,
  useMetodosPagoProveedor,
} from "@/composables/useMetodosPagoProveedor";
import { usePuertoStore } from "@/stores/puerto";
import { usePricingStore } from "@/stores/pricing";
import { useShipmentSubtypeStore } from "@/stores/shipmentSubtype";
import type { ArchivoComprobante, ArchivoInicial } from "@/types/archivos";
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
const bancosStore = useBancosStore();
const pricingStore = usePricingStore() as ReturnType<typeof usePricingStore> & {
  emailaddress?: string;
  itemsProveedorList?: FichaInstructivo[];
};
const puertoStore = usePuertoStore();
const shipmentSubtypeStore = useShipmentSubtypeStore();
// "Servicio" = sub tipo de embarque de Datos principales (antes era un paso del instructivo).
const servicioTexto = computed(() => {
  const principales = pricingStore.datosPrincipales;
  const subtipo = shipmentSubtypeStore
    .ofShipment(principales.idtipocarga as number | string | null)
    .find((item) => String(item.id) === String(principales.id_shipment_subtype ?? ""));
  return subtipo?.name || principales.shipment_subtype || String(datosManuales.value.servicio ?? "");
});

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
  monto: "",
  listDiaFecha: "",
  grupoWhatsapp: "",
  pagarProveedor: "",
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
  montoRecibido: "",
  bancoBenbeficiario: "",
  direccionBancoBeneficiario: "",
  nombreBeneficiario: "",
  direccionBeneficiario: "",
  numeroCuentaBeneficiario: null,
  paisReceptor: null,
  porcentajePago: "",
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
  // Pago al proveedor (7.1 / 7.2 / 7.3)
  monedaRecibido: "USD",
  fechaPagoCliente: "",
  metodoPagoCodigo: "",
  metodoPagoNombre: "",
  metodoPagoOtro: "",
  contratoAlibaba: null,
  codigoSwift: "",
  // Seguro / certificado de origen / permisos especiales
  montoSeguro: "",
  monedaSeguro: "USD",
  certificadoOrigen: "",
  partidaArancelaria: "",
  permisosEspeciales: "",
  comentarioPermisos: "",
  monedaPago: "USD",
  capturaDatosBancarios: null,
  qrPagoProveedor: null,
  montoCNY: null,
  montoUSD: null,
});
const puertoOrigen = ref<Puerto | null>(null);

const puertoDestino = ref<Puerto | null>(null);

// ===== MÉTODO DE PAGO AL PROVEEDOR (maestro METPAGPROV; toda regla va por código) =====
const { metodos: catalogoMetodosPago, cargando: cargandoMetodos, listar: listarMetodosPago } = useMetodosPagoProveedor();
const codigoMetodoPago = computed(() => String(datosManuales.value.metodoPagoCodigo ?? ""));
const metodoPagoSeleccionado = computed<Pick<MetodoPagoProveedor, "codigo" | "descripcion" | "detalle"> | null>(() => {
  const codigo = codigoMetodoPago.value;
  if (!codigo) return null;
  return catalogoMetodosPago.value.find((m) => m.codigo === codigo)
    ?? { codigo, descripcion: String(datosManuales.value.metodoPagoNombre || codigo), detalle: null };
});
// Activos + el ya elegido aunque luego lo hayan inactivado.
const opcionesMetodoPago = computed(() => {
  const activos = catalogoMetodosPago.value.filter((m) => m.estado);
  const elegido = metodoPagoSeleccionado.value;
  return elegido && !activos.some((m) => m.codigo === elegido.codigo) ? [...activos, elegido] : activos;
});
function esMetodoOtros(codigo: string) {
  return codigo === CODIGO_METODO_PAGO.OTROS;
}
function elegirMetodoPago(metodo: Pick<MetodoPagoProveedor, "codigo" | "descripcion" | "detalle">) {
  datosManuales.value.metodoPagoCodigo = metodo.codigo;
  datosManuales.value.metodoPagoNombre = nombreMetodoPago(metodo);
}
// Texto del método para la previsualización / PDF / correo.
const metodoPagoTexto = computed(() => {
  const metodo = metodoPagoSeleccionado.value;
  if (!metodo) return "";
  const otro = String(datosManuales.value.metodoPagoOtro ?? "").trim();
  return esMetodoOtros(metodo.codigo) && otro ? `${metodo.descripcion}: ${otro}` : nombreMetodoPago(metodo);
});
const esPagoAlibaba = computed(() => !!datosManuales.value.pagarProveedor && CODIGOS_ALIBABA.includes(codigoMetodoPago.value));
// Plataformas con link de pago + contrato: Alibaba (01 / 02) y Made in China (06 tarjeta / 05 transferencia).
const plataforma = computed<"Alibaba" | "Made in China" | null>(() => {
  if (!datosManuales.value.pagarProveedor) return null;
  if (CODIGOS_ALIBABA.includes(codigoMetodoPago.value)) return "Alibaba";
  if (CODIGOS_MADE_IN_CHINA.includes(codigoMetodoPago.value)) return "Made in China";
  return null;
});
const esPlataforma = computed(() => plataforma.value !== null);
const esPlataformaTransferencia = computed(() =>
  esPlataforma.value
  && [CODIGO_METODO_PAGO.ALIBABA_TRANSFERENCIA, CODIGO_METODO_PAGO.MADE_IN_CHINA_TRANSFERENCIA].includes(codigoMetodoPago.value as "02"),
);
const mostrarPagarProveedorAlibaba = esPagoAlibaba;
const esTransferenciaInternacional = computed(
  () => !!datosManuales.value.pagarProveedor && codigoMetodoPago.value === CODIGO_METODO_PAGO.TRANSFERENCIA_INTERNACIONAL,
);
const mostrarPagarProveedorInternacional = esTransferenciaInternacional;
const esAlipay = computed(() => !!datosManuales.value.pagarProveedor && codigoMetodoPago.value === CODIGO_METODO_PAGO.ALIPAY);
// 7.3: todo método elegido tiene formulario; arriba siempre va el monto (salvo Alipay, que pide CNY / USD).
const tieneFormularioPago = computed(() => !!datosManuales.value.pagarProveedor && !!metodoPagoSeleccionado.value);
const esOtrosPago = computed(() => !!datosManuales.value.pagarProveedor && codigoMetodoPago.value === CODIGO_METODO_PAGO.OTROS);
const pideMontoPago = computed(() => tieneFormularioPago.value && !esAlipay.value);
const subtituloFormularioPago = computed(() => {
  if (esOtrosPago.value) return "(Especificar Método de Pago)";
  return metodoPagoSeleccionado.value?.detalle ? `(${metodoPagoSeleccionado.value.detalle})` : "";
});
const pideDatosTransferencia = computed(() => esPlataformaTransferencia.value || esTransferenciaInternacional.value);
const tituloFormularioPago = computed(() =>
  `Pago al Proveedor – ${plataforma.value ?? metodoPagoSeleccionado.value?.descripcion ?? ""}`,
);
const placeholderBeneficiario = computed(() =>
  plataforma.value === "Made in China"
    ? "Ej. Made in China Group Co., Ltd."
    : plataforma.value
      ? "Ej. Alibaba Group Co., Ltd."
      : "Ej. ABC Trading Co., Ltd.",
);
const monedaPago = computed<string>({
  get: () => String(datosManuales.value.monedaPago || "USD"),
  set: (valor) => {
    datosManuales.value.monedaPago = valor;
  },
});
// Un monto nunca se muestra como 0: vacío y con placeholder.
function limpiarMontosEnCero() {
  for (const campo of ["monto", "montoRecibido", "montoCNY", "montoUSD", "porcentajePago", "montoSeguro"]) {
    const valor = datosManuales.value[campo];
    if (valor === 0 || valor === "0") datosManuales.value[campo] = "";
  }
}
// Instructivos guardados antes del catálogo: 1 = Alibaba, 2 = Transferencia internacional, 3 = Otros.
function migrarMetodoPagoAntiguo() {
  if (datosManuales.value.metodoPagoCodigo !== undefined) return;
  const antiguo: Record<string, string> = {
    1: CODIGO_METODO_PAGO.ALIBABA_TARJETA,
    2: CODIGO_METODO_PAGO.TRANSFERENCIA_INTERNACIONAL,
    3: CODIGO_METODO_PAGO.OTROS,
  };
  datosManuales.value.metodoPagoCodigo = antiguo[String(datosManuales.value.metodoPagarProveedor ?? "")] ?? "";
  datosManuales.value.metodoPagoNombre = "";
}

const monedas = computed(() => {
  const lista = (appStore.itemsCoinsList ?? []).map((m) => m.acronym).filter(Boolean);
  return [...new Set(["USD", ...lista])];
});
const monedaRecibido = computed<string>({
  get: () => String(datosManuales.value.monedaRecibido || "USD"),
  set: (valor) => {
    datosManuales.value.monedaRecibido = valor;
  },
});

const camposTransferencia: { key: string; label: string; icon: string; placeholder: string }[] = [
  { key: "nombreBeneficiario", label: "Beneficiario", icon: "mdi-account-outline", placeholder: "Ej. Alibaba Group Co., Ltd." },
  { key: "direccionBeneficiario", label: "Dirección del beneficiario", icon: "mdi-map-marker-outline", placeholder: "Ej. No. 969, Wen Yi Road, Hangzhou, China" },
  { key: "bancoBenbeficiario", label: "Banco beneficiario", icon: "mdi-bank-outline", placeholder: "Ej. Bank of China" },
  { key: "direccionBancoBeneficiario", label: "Dirección del banco", icon: "mdi-map-marker-outline", placeholder: "Ej. No. 1 Fuxingmennei St., Beijing, China" },
  { key: "codigoSwift", label: "Código SWIFT", icon: "mdi-web", placeholder: "Ej. BKCHCNBJ" },
  { key: "numeroCuentaBeneficiario", label: "N.° de cuenta", icon: "mdi-credit-card-outline", placeholder: "Ej. 1234567890123456" },
];

// "Cliente ya nos pagó" (Alibaba): se guarda como texto "Si" / "No" en datosManuales.clientePago.
const clienteYaPago = computed<boolean>({
  get: () => /^s[ií]/i.test(String(datosManuales.value.clientePago ?? "").trim()),
  set: (valor) => {
    datosManuales.value.clientePago = valor ? "Si" : "No";
  },
});
// 6.1: comprobante del cliente + cuenta de la empresa / banco del cliente. Al aprobar la cotización se carga solo
// en Control de Gastos > Ingresos > "Cargar Pago Cliente" (0002) y se envía a Administración.
const comprobantePagoCliente = computed<ArchivoComprobante | null>({
  get: () => (datosManuales.value.comprobantePagoCliente as ArchivoComprobante | null | undefined) ?? null,
  set: (valor) => {
    datosManuales.value.comprobantePagoCliente = valor;
  },
});
// Solo cuentas de la moneda del monto (la principal primero, como en "Cargar Pago Cliente").
// Se compara por id de moneda: el symbol de la cuenta es "S/." y la moneda del monto es "PEN".
const idMonedaRecibido = computed(
  () => (appStore.itemsCoinsList ?? []).find((m) => m.acronym === monedaRecibido.value)?.id ?? null,
);
const cuentasPagoCliente = computed(() =>
  bancosStore.cuentasSucursal
    .filter((c) =>
      idMonedaRecibido.value ? Number(c.id_coins) === Number(idMonedaRecibido.value) : c.symbol === monedaRecibido.value,
    )
    .sort((a, b) => Number(!!b.esprincipalflag) - Number(!!a.esprincipalflag))
    .map((c) => ({
      id: c.id,
      titulo: [[c.banco, c.banco_nombre].filter(Boolean).join(" - "), c.cuenta?.trim()].filter(Boolean).join(" · "),
    })),
);
const bancosPagoCliente = computed(() =>
  bancosStore.bancosSucursal.map((b) => ({ id: b.id, titulo: [b.acronym, b.name].filter(Boolean).join(" - ") })),
);
// los combos se ven en cuanto el cliente ya pagó ("Sí"); se cargan una sola vez
let catalogosBancoCargados = false;
watch(clienteYaPago, (pago) => {
  if (!pago || catalogosBancoCargados) return;
  catalogosBancoCargados = true;
  void bancosStore.loadCatalogosSucursal();
}, { immediate: true });
// la cuenta elegida debe ser de la moneda del monto
watch(cuentasPagoCliente, (cuentas) => {
  const actual = datosManuales.value.cuentaPagoCliente;
  if (!bancosStore.cuentasSucursal.length) return;
  if (actual && !cuentas.some((c) => c.id === actual)) datosManuales.value.cuentaPagoCliente = null;
  if (!datosManuales.value.cuentaPagoCliente && cuentas.length === 1) datosManuales.value.cuentaPagoCliente = cuentas[0]!.id;
});
// hoy (YYYY-MM-DD) en hora local: tope de la fecha en que nos pagó
function hoyLima() {
  return moment().format("YYYY-MM-DD");
}
// el nombre de la cuenta / banco se guarda junto al id: Control de Gastos lo muestra tal cual
watch(
  () => [datosManuales.value.cuentaPagoCliente, datosManuales.value.bancoPagoCliente, cuentasPagoCliente.value, bancosPagoCliente.value],
  () => {
    const d = datosManuales.value;
    const cuenta = cuentasPagoCliente.value.find((c) => c.id === d.cuentaPagoCliente);
    const banco = bancosPagoCliente.value.find((b) => b.id === d.bancoPagoCliente);
    if (cuenta || !d.cuentaPagoCliente) d.cuentaPagoClienteTexto = cuenta?.titulo ?? "";
    if (banco || !d.bancoPagoCliente) d.bancoPagoClienteTexto = banco?.titulo ?? "";
  },
);
// FormatFecha trabaja con string | null.
const fechaPagoCliente = computed<string | null>({
  get: () => (datosManuales.value.fechaPagoCliente as string | undefined) || null,
  set: (valor) => {
    datosManuales.value.fechaPagoCliente = valor ?? "";
  },
});

// Pasos visibles en el mismo orden y con las mismas condiciones que el template.
// 6 = Debemos pagar (incluye 7.1 Cliente ya nos pagó). Sub-pasos del pago: 7 método, 12 Alibaba (01/02),
// 14-21 transferencia internacional (03), 22 monto a pagar.
// 6.5 = proveedor que se está llenando (solo con 2+ shippers), 7 = método, 12 = formulario.
const SUBPASOS_PAGO = [6.5, 7, 12];
// El paso 7 (id 6) queda abierto mientras se llenan 7.1 / 7.2 / 7.3.
const enPasoPago = computed(() => e6.value === 6 || SUBPASOS_PAGO.includes(e6.value));
const ultimoSubpasoPago = computed(() =>
  [...SUBPASOS_PAGO].reverse().find((paso) => pasosVisibles.value.includes(paso)) ?? 6,
);
const pasosVisibles = computed(() => {
  const pasos = [0, 2, 3, 4, 5, 6];
  if (datosManuales.value.pagarProveedor) {
    if (variosProveedores.value) pasos.push(6.5);
    pasos.push(7);
    if (tieneFormularioPago.value) pasos.push(12);
  }
  // 23 seguro, 24 certificado de origen, 25 permisos especiales, 26 / 27 observaciones
  pasos.push(23, 24, 25, 26, 27);
  return pasos;
});
// Número que se muestra: pasos principales 1, 2, 3…; sub-pasos del pago 7.2, 7.3… (7.1 va dentro del 7).
const etiquetasPaso = computed(() => {
  const etiquetas: Record<number, string> = {};
  let principal = 0;
  let sub = 1;
  for (const paso of pasosVisibles.value) {
    if (SUBPASOS_PAGO.includes(paso)) {
      sub += 1;
      etiquetas[paso] = `${principal}.${sub}`;
    } else {
      principal += 1;
      etiquetas[paso] = String(principal);
    }
  }
  return etiquetas;
});
function stepNumber(paso: number) {
  return etiquetasPaso.value[paso] ?? "";
}
// Verde: pasos ya llenados (se pasó de ellos con "Continuar"). El paso donde se quedó (pasoMaximo) aún no está
// completo: queda sin verde pero habilitado para volver a él.
function isComplete(paso: number) {
  return paso < pasoMaximo.value;
}
// Solo se puede volver a pasos ya alcanzados; para avanzar hay que usar "Continuar".
// Clic en la cabecera: abre el paso; si ya es el actual, lo cierra / vuelve a abrir.
const cerrado = ref(false);
const cerradoPago = ref(false);
function abierto(paso: number) {
  return e6.value === paso && !cerrado.value;
}
function irAPaso(paso: number) {
  if (paso === e6.value) {
    cerrado.value = !cerrado.value;
    return;
  }
  if (paso <= pasoMaximo.value) e6.value = paso;
}

// Fila de la previsualización que corresponde a cada paso.
const pasoActivo = computed(() => {
  const paso = e6.value;
  if (paso <= 6) return ["shipper", "servicio", "email", "cargaLista", "whatsapp", "adjunta", "pagarProveedor"][paso];
  if (paso <= 12) return "datosBancarios";
  return ({ 23: "seguro", 24: "certificadoOrigen", 25: "permisos", 26: "obs1", 27: "obs2" } as Record<number, string>)[paso];
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
  cerrado.value = false;
  cerradoPago.value = false;
  if (paso > pasoMaximo.value) pasoMaximo.value = paso;
  sincronizarScroll();
});

// Cada cambio de paso guarda el borrador (datos + paso actual / más lejano): al recargar la página se continúa
// desde el mismo paso. Mientras se restaura el paso guardado no se guarda ni se reinicia el avance.
let restaurandoPaso = true;
// skeleton mientras se cargan el borrador, los shippers y los puertos
const cargandoInstructivo = ref(true);
let autoguardado: ReturnType<typeof setTimeout> | undefined;
// Guarda cada paso, sub-paso y dato. Solo envía si algo cambió desde el último guardado
// (payloadGuardar copia el pago activo dentro de datosManuales y eso vuelve a disparar el watcher).
let ultimoGuardado = "";
function programarAutoguardado() {
  if (restaurandoPaso || props.aprobadoflag) return;
  clearTimeout(autoguardado);
  autoguardado = setTimeout(() => {
    const payload = payloadGuardar();
    const firma = JSON.stringify(payload);
    if (firma === ultimoGuardado) return;
    ultimoGuardado = firma;
    pricingStore.guardarDatosInstructivo(payload).catch((error) => {
      ultimoGuardado = "";
      console.error(error);
    });
  }, 400);
}
watch([e6, pasoMaximo], programarAutoguardado);
async function restaurarPaso(shippersListos: Promise<unknown>) {
  const guardado = pricingStore.datosPrincipales.datosinstructivomanual;
  const actual = Number(guardado?.pasoActual ?? NaN);
  const maximo = Number(guardado?.pasoMaximo ?? NaN);
  try {
    // Los pasos visibles dependen de los shippers (2+ shippers = paso 6.5).
    await shippersListos;
  } catch (error) {
    console.error(error);
  }
  await nextTick();
  if (Number.isFinite(maximo) && maximo > pasoMaximo.value) pasoMaximo.value = maximo;
  if (Number.isFinite(actual) && actual > 0) {
    const paso = actual === PASO_FINAL || pasosVisibles.value.includes(actual)
      ? actual
      : ([...pasosVisibles.value].reverse().find((p) => p <= actual) ?? 0);
    if (paso > pasoMaximo.value) pasoMaximo.value = paso;
    e6.value = paso;
  }
  await nextTick();
  restaurandoPaso = false;
}
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

function nombreArchivo(file: unknown) {
  const nombreRaw = (file as { name?: string } | null)?.name;
  if (!nombreRaw) return "";
  return nombreRaw.includes("http") ? nombreRaw.substring(nombreRaw.lastIndexOf("/") + 1) : nombreRaw;
}
function estadoDocumento(doc: DocumentoInstructivo | undefined) {
  if (!doc?.flag) return "";
  return nombreArchivo(doc.file) || "Documento confirmado";
}

type DatoPago = { label: string; valor: unknown };
function archivoTexto(archivo: unknown) {
  return nombreArchivo(archivo) || (archivo ? "Archivo cargado" : "");
}
// Resumen del pago de un proveedor (datos planos del formulario + sus documentos).
function resumenPago(
  d: Record<string, unknown>,
  docs: { factura?: DocumentoInstructivo; comprobante?: DocumentoInstructivo },
): DatoPago[] {
  const codigo = String(d.metodoPagoCodigo ?? "");
  const nombre = CODIGOS_ALIBABA.includes(codigo) ? "Alibaba" : CODIGOS_MADE_IN_CHINA.includes(codigo) ? "Made in China" : null;
  const conTransferencia = codigo === CODIGO_METODO_PAGO.ALIBABA_TRANSFERENCIA || codigo === CODIGO_METODO_PAGO.MADE_IN_CHINA_TRANSFERENCIA;
  const metodo = [{ label: "Método de pago", valor: textoMetodoDe(d) }];
  const monto = codigo === CODIGO_METODO_PAGO.ALIPAY
    ? []
    : [{ label: "Monto a pagar", valor: d.monto ? `${String(d.monedaPago || "USD")} ${d.monto}` : "" }];
  const transferencia = camposTransferencia.map((campo) => ({ label: campo.label, valor: d[campo.key] }));
  if (nombre) {
    return [
      ...metodo,
      ...monto,
      { label: "N° de factura comercial", valor: d.nroFactura },
      { label: "Factura comercial / proforma", valor: estadoDocumento(docs.factura) },
      { label: `Link de pago ${nombre}`, valor: d.linkDePagoAlibaba },
      { label: `Contrato de ${nombre}`, valor: archivoTexto(d.contratoAlibaba) },
      { label: `N° de contrato de ${nombre}`, valor: d.numeroContratoAlibaba },
      ...(conTransferencia
        ? [...transferencia, { label: "Comprobante de transferencia", valor: estadoDocumento(docs.comprobante) }]
        : []),
    ];
  }
  if (codigo === CODIGO_METODO_PAGO.TRANSFERENCIA_INTERNACIONAL) {
    return [
      ...metodo,
      ...monto,
      { label: "N° de factura comercial", valor: d.nroFactura },
      { label: "Factura comercial / proforma", valor: estadoDocumento(docs.factura) },
      { label: "Comprobante de transferencia", valor: estadoDocumento(docs.comprobante) },
      { label: "Captura de datos bancarios", valor: archivoTexto(d.capturaDatosBancarios) },
      ...transferencia,
    ];
  }
  if (codigo === CODIGO_METODO_PAGO.ALIPAY) {
    return [
      ...metodo,
      { label: "N° de factura comercial", valor: d.nroFactura },
      { label: "QR de pago", valor: archivoTexto(d.qrPagoProveedor) },
      { label: "Monto a transferir (CNY)", valor: d.montoCNY },
      { label: "Equivalente en dólares (USD)", valor: d.montoUSD },
    ];
  }
  if (codigo === CODIGO_METODO_PAGO.OTROS) {
    return [
      ...metodo,
      ...monto,
      { label: "Comprobante / datos de transferencia", valor: estadoDocumento(docs.comprobante) },
      { label: "N° de factura comercial", valor: d.nroFactura },
    ];
  }
  return [...metodo, ...monto];
}
function textoMetodoDe(d: Record<string, unknown>) {
  const codigo = String(d.metodoPagoCodigo ?? "");
  if (!codigo) return "";
  const metodo = catalogoMetodosPago.value.find((m) => m.codigo === codigo)
    ?? { codigo, descripcion: String(d.metodoPagoNombre || codigo), detalle: null };
  const otro = String(d.metodoPagoOtro ?? "").trim();
  return esMetodoOtros(codigo) && otro ? `${metodo.descripcion}: ${otro}` : nombreMetodoPago(metodo);
}

const datosBancarios = computed<DatoPago[]>(() =>
  datosManuales.value.pagarProveedor
    ? resumenPago(datosManuales.value, { factura: docFacturaPago.value, comprobante: docComprobanteTransferencia.value })
    : [],
);
// Con varios proveedores: un bloque de datos por proveedor.
const gruposPagoProveedor = computed<{ id: number; nombre: string; completo: boolean; datos: DatoPago[] }[]>(() => {
  if (!variosProveedores.value) return [];
  return pagosProveedores.value.map((pago) => {
    const activo = pago.id === proveedorPagoActivo.value;
    const d = activo ? datosManuales.value : pago.datos;
    return {
      id: pago.id,
      nombre: pago.nombre,
      completo: pago.completo,
      datos: resumenPago(d, {
        factura: d.facturaPagoDoc as DocumentoInstructivo | undefined,
        comprobante: d.comprobantePagoDoc as DocumentoInstructivo | undefined,
      }),
    };
  });
});

// "Cliente ya nos pagó" (7.1) para la fila "Debemos pagar al proveedor".
const pagoClienteTexto = computed(() => {
  const d = datosManuales.value;
  if (!d.pagarProveedor || !clienteYaPago.value) return "";
  const monto = Number(d.montoRecibido)
    ? monedaRecibido.value + " " + Number(d.montoRecibido).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";
  const fechaPago = d.fechaPagoCliente ? shortDate(d.fechaPagoCliente as string) : "";
  return [monto, fechaPago].filter(Boolean).join(" · ");
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

// mismas columnas que el layout, sin la del divisor
const estiloSkeleton = computed(() => {
  if (!props.verDatosPreview) return { gridTemplateColumns: "1fr" };
  if (!props.verPrevisualizacion) return { gridTemplateColumns: "1fr" };
  return {
    gridTemplateColumns: `min(${anchoPasos.value}px, max(${ANCHO_MIN_PASOS}px, calc((100% - 16px) / 2))) minmax(0, 1fr)`,
  };
});
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

function avisoFaltantes(faltantes: string[]) {
  void Swal.fire({
    icon: "warning",
    title: "Completa los datos obligatorios",
    html: faltantes.map((campo) => "• " + campo).join("<br>"),
  });
}
function continuarPagarProveedor() {
  if (pagarProveedorSiNo.value === null) {
    avisoFaltantes(["¿Debemos pagar al proveedor?"]);
    return;
  }
  if (!datosManuales.value.pagarProveedor) {
    cambiarPagarProvedor();
    return;
  }
  if (clienteYaPago.value) {
    const faltantes = [
      ...(Number(datosManuales.value.montoRecibido) > 0 ? [] : ["Monto que nos pagó"]),
      ...(datosManuales.value.fechaPagoCliente ? [] : ["Fecha en que nos pagó"]),
      // "Cargar Pago Cliente" no acepta fechas futuras: con fecha futura no se cargaría al aprobar
      ...(String(datosManuales.value.fechaPagoCliente ?? "") > hoyLima() ? ["Fecha en que nos pagó (no puede ser posterior a hoy)"] : []),
      // con comprobante se carga solo al aprobar: la cuenta y el banco son obligatorios (el N.° de operación se llena en Bancos)
      ...(comprobantePagoCliente.value && !datosManuales.value.cuentaPagoCliente ? ["Cuenta donde depositó"] : []),
      ...(comprobantePagoCliente.value && !datosManuales.value.bancoPagoCliente ? ["Banco del cliente"] : []),
    ];
    if (faltantes.length) {
      avisoFaltantes(faltantes);
      return;
    }
  } else {
    // doble validación: pagamos al proveedor pero el cliente no nos pagó
    confirmarNoPago.value = true;
    return;
  }
  continuar();
}
const confirmarNoPago = ref(false);
function confirmadoNoPago() {
  confirmarNoPago.value = false;
  datosManuales.value.clientePago = "No";
  continuar();
}
function continuarMetodoPago() {
  const metodo = metodoPagoSeleccionado.value;
  if (!metodo) {
    avisoFaltantes(["Elige el método de pago al proveedor"]);
    return;
  }
  datosManuales.value.metodoPagoNombre = nombreMetodoPago(metodo);
  continuar();
}
const guardandoPago = ref(false);

// ===== Sí / No con "Seleccionar" (sin valor por defecto) =====
const opcionesSiNo = [
  { title: "Sí", value: "Si" },
  { title: "No", value: "No" },
];
function siNoDe(valor: unknown): "Si" | "No" | null {
  const texto = String(valor ?? "").trim();
  if (/^s[ií]/i.test(texto)) return "Si";
  if (/^no$/i.test(texto)) return "No";
  return null;
}
function campoSiNo(campo: string) {
  return computed<"Si" | "No" | null>({
    get: () => siNoDe(datosManuales.value[campo]),
    set: (valor) => {
      datosManuales.value[campo] = valor ?? "";
    },
  });
}
// "¿Debemos pagar al proveedor?": sin valor por defecto; el 6.1 solo aparece al elegir Sí.
const pagarProveedorSiNo = computed<boolean | null>({
  get: () => {
    const valor = datosManuales.value.pagarProveedor;
    if (valor === true || siNoDe(valor) === "Si") return true;
    if (valor === false || siNoDe(valor) === "No") return false;
    return null;
  },
  set: (valor) => {
    datosManuales.value.pagarProveedor = valor ?? "";
  },
});
const seguroSiNo = campoSiNo("seguro");
const certificadoOrigenSiNo = campoSiNo("certificadoOrigen");
const permisosEspecialesSiNo = campoSiNo("permisosEspeciales");
const monedaSeguro = computed<string>({
  get: () => String(datosManuales.value.monedaSeguro || "USD"),
  set: (valor) => {
    datosManuales.value.monedaSeguro = valor;
  },
});
const textoVacio = (valor: unknown) => !String(valor ?? "").trim();
async function guardarYContinuarCon(faltantes: string[]) {
  if (faltantes.length) {
    avisoFaltantes(faltantes);
    return;
  }
  guardandoPago.value = true;
  try {
    await pricingStore.guardarDatosInstructivo(payloadGuardar());
    continuar();
  } catch (error) {
    console.error(error);
    void Swal.fire({ icon: "error", title: "No se pudo guardar", text: "Inténtalo nuevamente." });
  } finally {
    guardandoPago.value = false;
  }
}
function guardarYContinuarSeguro() {
  const monto = Number(datosManuales.value.montoSeguro);
  const conSeguro = seguroSiNo.value === "Si";
  if (conSeguro && Number.isFinite(monto) && monto > 0) datosManuales.value.montoSeguro = monto;
  void guardarYContinuarCon([
    ...(seguroSiNo.value ? [] : ["Seguro de Mercancía"]),
    ...(conSeguro && !(Number.isFinite(monto) && monto > 0) ? ["Monto del seguro vendido al cliente (número mayor a 0)"] : []),
  ]);
}
function guardarYContinuarCertificado() {
  void guardarYContinuarCon([
    ...(certificadoOrigenSiNo.value ? [] : ["¿Libera Ad Valorem con Certificado de Origen?"]),
    ...(certificadoOrigenSiNo.value === "Si" && textoVacio(datosManuales.value.partidaArancelaria)
      ? ["Partida arancelaria aplicable"]
      : []),
  ]);
}
function guardarYContinuarPermisos() {
  void guardarYContinuarCon([
    ...(permisosEspecialesSiNo.value ? [] : ["¿El cliente informó sobre permisos especiales?"]),
  ]);
}
// Texto de las filas nuevas (previsualización / PDF / correo).
const seguroTexto = computed(() => {
  const d = datosManuales.value;
  if (seguroSiNo.value !== "Si") return seguroSiNo.value === "No" ? "No" : String(d.seguro ?? "");
  return d.montoSeguro ? `Sí · ${monedaSeguro.value} ${d.montoSeguro}` : "Sí";
});
const certificadoOrigenTexto = computed(() => {
  if (certificadoOrigenSiNo.value === "Si") {
    return datosManuales.value.partidaArancelaria ? `Sí · Partida ${datosManuales.value.partidaArancelaria}` : "Sí";
  }
  return certificadoOrigenSiNo.value === "No" ? "No" : "";
});
const permisosTexto = computed(() => {
  const respuesta = permisosEspecialesSiNo.value === "Si" ? "Sí" : permisosEspecialesSiNo.value === "No" ? "No" : "";
  const comentario = String(datosManuales.value.comentarioPermisos ?? "").trim();
  return [respuesta, comentario].filter(Boolean).join(": ");
});
// "Otros" y métodos sin formulario propio solo piden el monto.
const pideNroFactura = computed(
  () => esPlataforma.value || esTransferenciaInternacional.value || esAlipay.value || esOtrosPago.value,
);
async function guardarYContinuarPago() {
  const d = datosManuales.value;
  const vacio = (valor: unknown) => !String(valor ?? "").trim();
  const positivo = (valor: unknown) => Number.isFinite(Number(valor)) && Number(valor) > 0 && !vacio(valor);
  // 7.3: se paga al proveedor (marcó "Sí"), así que el monto a pagar es obligatorio y mayor a 0.
  const montoInvalido = (valor: unknown, etiqueta: string) => (positivo(valor) ? [] : [etiqueta]);
  const faltantes = [
    ...(pideMontoPago.value ? montoInvalido(d.monto, "Monto a pagar al proveedor (número mayor a 0)") : []),
    ...(esOtrosPago.value && !docComprobanteTransferencia.value?.flag ? ["Comprobante / Datos de Transferencia"] : []),
    ...((esPlataforma.value || esTransferenciaInternacional.value) && !docFacturaPago.value?.flag
      ? ["Factura Comercial / Proforma"]
      : []),
    ...(esPlataforma.value && !d.contratoAlibaba ? [`Contrato de ${plataforma.value} (PDF)`] : []),
    ...(esTransferenciaInternacional.value && !d.capturaDatosBancarios ? ["Captura de los Datos Bancarios del Proveedor"] : []),
    ...(esPlataformaTransferencia.value && !docComprobanteTransferencia.value?.flag
      ? ["Comprobante / Datos de Transferencia (PDF)"]
      : []),
    ...(esAlipay.value
      ? [
          ...(d.qrPagoProveedor ? [] : ["QR de pago"]),
          ...montoInvalido(d.montoCNY, "Monto a transferir (CNY) mayor a 0"),
          ...montoInvalido(d.montoUSD, "Equivalente en dólares (USD) mayor a 0"),
        ]
      : []),
  ];
  // Alipay: el monto a pagar es el equivalente en USD.
  if (esAlipay.value && !faltantes.length && positivo(d.montoUSD)) {
    d.monto = Number(d.montoUSD);
    d.monedaPago = "USD";
  }
  if (pideMontoPago.value && !faltantes.length && positivo(d.monto)) d.monto = Number(d.monto);
  if (faltantes.length) {
    avisoFaltantes(faltantes);
    return;
  }
  guardandoPago.value = true;
  try {
    let siguiente: PagoProveedor | undefined;
    if (variosProveedores.value) {
      guardarPagoActivo();
      const activo = pagosProveedores.value.find((pago) => pago.id === proveedorPagoActivo.value);
      if (activo) activo.completo = true;
      siguiente = pagosProveedores.value.find((pago) => !pago.completo);
    }
    await pricingStore.guardarDatosInstructivo(payloadGuardar());
    if (siguiente) {
      seleccionarProveedorPago(siguiente.id);
      e6.value = 6.5;
      void Swal.fire({
        icon: "success",
        title: "Proveedor guardado",
        text: `Sigue con: ${siguiente.nombre}`,
        timer: 1800,
        showConfirmButton: false,
      });
    } else {
      continuar();
    }
  } catch (error) {
    console.error(error);
    void Swal.fire({ icon: "error", title: "No se pudo guardar", text: "Inténtalo nuevamente." });
  } finally {
    guardandoPago.value = false;
  }
}
// Al cambiar "Debemos pagar" o el método, los pasos siguientes se vuelven a recorrer (y validar).
watch(
  () => [datosManuales.value.pagarProveedor, datosManuales.value.metodoPagoCodigo],
  () => {
    if (!cambiandoProveedor && !restaurandoPaso && pasoMaximo.value > e6.value) pasoMaximo.value = e6.value;
  },
);
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

// Factura comercial / proforma y comprobante de transferencia (7.3) usan el mismo documento que "Se adjunta":
// si ya se adjuntó / marcó allí, aparece aquí sin volver a subirlo.
const docFacturaPago = computed(() => {
  if (variosProveedores.value) return datosManuales.value.facturaPagoDoc as DocumentoInstructivo | undefined;
  const factura = listaDocumentos.value.find((doc) => doc.key === "facturaCommercial");
  const proforma = listaDocumentos.value.find((doc) => doc.key === "proforma");
  return factura && (factura.flag || !proforma?.flag) ? factura : (proforma ?? factura);
});
const docFacturaAdjunta = computed(() =>
  !variosProveedores.value && docFacturaPago.value?.flag ? docFacturaPago.value : undefined,
);
const docComprobanteTransferencia = computed(() =>
  variosProveedores.value
    ? (datosManuales.value.comprobantePagoDoc as DocumentoInstructivo | undefined)
    : listaDocumentos.value.find((doc) => doc.key === "soporteTransferenciaInternacional"),
);

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

// ===== PAGO POR PROVEEDOR (2+ shippers): 7.2 elige el proveedor; 7.3 / 7.4 se llenan uno por uno =====
interface PagoProveedor {
  id: number;
  nombre: string;
  completo: boolean;
  datos: Record<string, unknown>;
}
// Campos del pago que son de cada proveedor (el 7.1 "cliente ya nos pagó" es uno solo).
const CAMPOS_PAGO_PROVEEDOR = [
  "metodoPagoCodigo", "metodoPagoNombre", "metodoPagoOtro", "monto", "monedaPago", "nroFactura",
  "linkDePagoAlibaba", "contratoAlibaba", "numeroContratoAlibaba", "nombreBeneficiario", "direccionBeneficiario",
  "bancoBenbeficiario", "direccionBancoBeneficiario", "codigoSwift", "numeroCuentaBeneficiario",
  "capturaDatosBancarios", "qrPagoProveedor", "montoCNY", "montoUSD", "facturaPagoDoc", "comprobantePagoDoc",
];
const VALOR_INICIAL_PAGO: Record<string, unknown> = { monedaPago: "USD" };
const ARCHIVOS_PAGO = ["contratoAlibaba", "capturaDatosBancarios", "qrPagoProveedor"];
function documentoPago(key: string, label: string): DocumentoInstructivo {
  return { key, label, flag: false, file: null, editable: false };
}
const variosProveedores = computed(() => !!datosManuales.value.pagarProveedor && shipperIdsSeleccionados.value.length > 1);
const pagosProveedores = computed<PagoProveedor[]>(() => (datosManuales.value.pagosProveedores as PagoProveedor[] | undefined) ?? []);
const proveedorPagoActivo = computed(() => (datosManuales.value.proveedorPagoActivo as number | null | undefined) ?? null);
const nombreProveedorActivo = computed(
  () => pagosProveedores.value.find((pago) => pago.id === proveedorPagoActivo.value)?.nombre ?? "",
);
const proveedoresCompletos = computed(() => pagosProveedores.value.filter((pago) => pago.completo).length);
let cambiandoProveedor = false;

function copiaPago(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(Object.fromEntries(CAMPOS_PAGO_PROVEEDOR.map((campo) => [campo, datosManuales.value[campo] ?? null]))));
}
function cargarPago(datos: Record<string, unknown>) {
  for (const campo of CAMPOS_PAGO_PROVEEDOR) {
    const valor = datos[campo];
    datosManuales.value[campo] = valor === undefined || valor === null
      ? (VALOR_INICIAL_PAGO[campo] ?? (ARCHIVOS_PAGO.includes(campo) ? null : ""))
      : JSON.parse(JSON.stringify(valor));
  }
  if (!datosManuales.value.facturaPagoDoc) datosManuales.value.facturaPagoDoc = documentoPago("facturaPago", "FACTURA COMERCIAL / PROFORMA");
  if (!datosManuales.value.comprobantePagoDoc) {
    datosManuales.value.comprobantePagoDoc = documentoPago("comprobantePago", "COMPROBANTE DE TRANSFERENCIA");
  }
}
// Guarda en la lista lo que está en el formulario (proveedor activo).
function guardarPagoActivo() {
  const activo = pagosProveedores.value.find((pago) => pago.id === proveedorPagoActivo.value);
  if (activo) activo.datos = copiaPago();
}
function seleccionarProveedorPago(id: number) {
  if (id === proveedorPagoActivo.value) return;
  guardarPagoActivo();
  const pago = pagosProveedores.value.find((item) => item.id === id);
  if (!pago) return;
  cambiandoProveedor = true;
  datosManuales.value.proveedorPagoActivo = id;
  cargarPago(pago.datos);
  // Un proveedor pendiente se llena antes de seguir con los pasos siguientes.
  if (!pago.completo && !proveedoresCompletos.value && pasoMaximo.value > 6.5) pasoMaximo.value = 6.5;
  void nextTick(() => {
    cambiandoProveedor = false;
  });
}
// Mantiene la lista alineada con los shippers del paso 1.
function sincronizarPagosProveedores() {
  if (!variosProveedores.value) return;
  const anteriores = pagosProveedores.value;
  const nuevos: PagoProveedor[] = shippersPreview.value.map((shipper) => {
    const existente = anteriores.find((pago) => pago.id === shipper.id);
    return existente
      ? { ...existente, nombre: shipper.namelong || existente.nombre }
      : { id: shipper.id, nombre: shipper.namelong || `Proveedor ${shipper.id}`, completo: false, datos: {} };
  });
  // Al pasar de 1 a varios proveedores, lo ya llenado queda para el primero.
  if (!anteriores.length && nuevos[0]) nuevos[0].datos = copiaPago();
  const huboNuevos = nuevos.some((pago) => !anteriores.some((a) => a.id === pago.id));
  datosManuales.value.pagosProveedores = nuevos;
  const activo = nuevos.find((pago) => pago.id === proveedorPagoActivo.value) ?? nuevos[0];
  if (activo && activo.id !== proveedorPagoActivo.value) {
    cambiandoProveedor = true;
    datosManuales.value.proveedorPagoActivo = activo.id;
    cargarPago(activo.datos);
    void nextTick(() => {
      cambiandoProveedor = false;
    });
  } else {
    cargarPago(copiaPago());
  }
  if (huboNuevos && anteriores.length && !proveedoresCompletos.value && pasoMaximo.value > 6.5) pasoMaximo.value = 6.5;
}
watch(() => [variosProveedores.value, shipperIdsSeleccionados.value.join(","), shippersPreview.value.map((s) => s.namelong).join("|")], sincronizarPagosProveedores);
// Salta al paso siguiente al pago (basta con un proveedor completo).
async function continuarTrasProveedores() {
  if (!proveedoresCompletos.value) {
    avisoFaltantes(["Completa el pago de al menos un proveedor"]);
    return;
  }
  const siguiente = pasosVisibles.value.find((paso) => paso > Math.max(...SUBPASOS_PAGO));
  if (siguiente === undefined) return;
  try {
    await pricingStore.guardarDatosInstructivo(payloadGuardar());
  } catch (error) {
    console.error(error);
  }
  e6.value = siguiente;
}
function continuarProveedorPago() {
  if (!proveedorPagoActivo.value) {
    avisoFaltantes(["Elige el proveedor que vas a llenar"]);
    return;
  }
  continuar();
}

// Paso 1: al menos un shipper es obligatorio (también al guardar / enviar).
function validarShipperObligatorio() {
  if (shipperIdsSeleccionados.value.length) return true;
  avisoFaltantes(["Selecciona al menos un shipper"]);
  e6.value = 0;
  return false;
}
function continuarShipper() {
  if (validarShipperObligatorio()) continuar();
}
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
function payloadGuardar() {
  if (variosProveedores.value) guardarPagoActivo();
  return {
    id: props.quoteId ?? route.params.id,
    shippers: shipperIdsSeleccionados.value,
    datosInstructivoManual: {
      ...datosManuales.value,
      pasoActual: e6.value,
      pasoMaximo: pasoMaximo.value,
      metodoPagoNombre: metodoPagoSeleccionado.value ? nombreMetodoPago(metodoPagoSeleccionado.value) : "",
      listaDocumentos: documentosParaGuardar(),
      table_allpath_list: documentosParaGuardar(),
    },
  };
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

function setDatosInstructivo() {
  if (!validarShipperObligatorio()) return;
  if (listaDocumentos.value.some((v) => !v.flag && v.key == "cotizacion")) {
    Swal.fire({
      icon: "warning",
      title: "Soporte de Cotización",
      text: "Es Requerido adjuntar: COTIZACIÓN DE VENTAS ",
    });
    return;
  }

  pricingStore.guardarDatosInstructivo(payloadGuardar());
  emit("continuar");
}
// Paso 3: fecha (FormatFecha, obligatoria) + comentario opcional. listDiaFecha sigue siendo el texto
// que leen la vista previa, el correo y el backend: "20/NOV/2026 - comentario".
const fechaListaRecojo = computed<string>({
  get: () => (datosManuales.value.fechaListaRecojo as string | undefined) ?? "",
  set: (valor) => {
    datosManuales.value.fechaListaRecojo = valor || "";
    armarListDiaFecha();
  },
});
const comentarioListaRecojo = computed<string>({
  get: () => (datosManuales.value.comentarioListaRecojo as string | undefined) ?? "",
  set: (valor) => {
    datosManuales.value.comentarioListaRecojo = valor || "";
    armarListDiaFecha();
  },
});
function armarListDiaFecha() {
  const fecha = fechaListaRecojo.value ? shortDate(fechaListaRecojo.value) : "";
  const comentario = comentarioListaRecojo.value.trim();
  datosManuales.value.listDiaFecha = [fecha, comentario].filter(Boolean).join(" - ");
}
// borradores de antes (texto libre): el texto pasa al comentario para no perderlo
watch(
  () => datosManuales.value,
  (d) => {
    if (d && d.listDiaFecha && d.fechaListaRecojo === undefined && d.comentarioListaRecojo === undefined) {
      d.fechaListaRecojo = "";
      d.comentarioListaRecojo = d.listDiaFecha;
    }
  },
  { immediate: true },
);
function continuarListaRecojo() {
  if (!fechaListaRecojo.value && datosManuales.value.listDiaFecha !== "No Aplica") {
    void Swal.fire({ icon: "warning", title: "Fecha requerida", text: "Elige para cuándo se estima la mercancía lista para recojo." });
    return;
  }
  continuar();
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
// Después del último paso: todos se cierran y quedan en verde (como la versión anterior).
const PASO_FINAL = 99;
// Cotización aprobada: todos los pasos quedan habilitados y se puede saltar entre ellos.
watch(
  [() => props.aprobadoflag, pasoMaximo],
  () => {
    if (props.aprobadoflag && pasoMaximo.value < PASO_FINAL) pasoMaximo.value = PASO_FINAL;
  },
  { immediate: true },
);
function continuar() {
  const siguiente = pasosVisibles.value.find((p) => p > e6.value);
  e6.value = siguiente ?? PASO_FINAL;
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
const guardandoBorrador = ref(false);
async function guardarBorrador() {
  guardandoBorrador.value = true;
  try {
    const payload = payloadGuardar();
    await pricingStore.guardarDatosInstructivo(payload);
    ultimoGuardado = JSON.stringify(payload);
    void Swal.fire({ icon: "success", title: "Borrador guardado", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
  } catch (error) {
    console.error(error);
    void Swal.fire({ icon: "error", title: "No se pudo guardar el borrador" });
  } finally {
    guardandoBorrador.value = false;
  }
}
function guardarYGenenarCorreo() {
  if (!validarShipperObligatorio()) return;
  Promise.all([
    pricingStore.guardarDatosInstructivo(payloadGuardar()),
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

  const subjectStr = `INSTRUCTIVO_VENTAS_${nro_quote_clean}_${textoExpediente() === "Sin exp operativo" ? "SIN_EXP_OPERATIVO" : `EXPEDIENTE_${pricing.nro_exp}`}`;
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
    seguroTexto: seguroTexto.value,
    certificadoOrigenTexto: certificadoOrigenTexto.value,
    permisosTexto: permisosTexto.value,
    // Pago al proveedor: mismo contenido que la previsualización
    metodoPagoTexto: metodoPagoTexto.value,
    pagoClienteTexto: pagoClienteTexto.value,
    clienteYaPago: clienteYaPago.value,
    datosPagoProveedor: datosBancarios.value.map((dato) => ({ label: dato.label, valor: dato.valor ?? "" })),
    gruposPagoProveedor: gruposPagoProveedor.value.filter((grupo) => grupo.completo).map((grupo) => ({
      nombre: grupo.nombre,
      datos: grupo.datos.map((dato) => ({ label: dato.label, valor: dato.valor ?? "" })),
    })),
    servicio: servicioTexto.value,
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

  // Mismos datos que la previsualización (método, formulario 7.3 / transferencia y monto).
  const lineasPago = (datos: DatoPago[]) => datos.map((dato) => "<b>" + dato.label + ":</b> " + (dato.valor ?? "")).join("<br>");
  const valorDatosBancarios = variosProveedores.value
    ? gruposPagoProveedor.value.filter((grupo) => grupo.completo).map((grupo) => "<b>PROVEEDOR: " + grupo.nombre + "</b><br>" + lineasPago(grupo.datos)).join("<br><br>")
    : datosBancarios.value.length
      ? lineasPago(datosBancarios.value)
      : "No especificado";
  const valorPagarProveedor = datosManuales.value.pagarProveedor
    ? "Si<br><b>Cliente ya nos pagó:</b> " + (clienteYaPago.value ? "Sí" : "No") + (pagoClienteTexto.value ? " (" + pagoClienteTexto.value + ")" : "")
    : "No";

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
        ${_tr("SERVICIO", servicioTexto.value)}
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
      shippersCorreo().length > 1 ? "DETALLES DE LOS PROVEEDORES" : "DETALLES DEL PROVEEDOR",
      detalleProveedoresCorreo(true),
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
      "<b>PARA CUÁNDO SE ESTIMA LA MERCANCÍA LISTA PARA RECOJO</b>",
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
      valorPagarProveedor,
    )}
        
        ${
      datosManuales.value.pagarProveedor
        ? _tr(
            "<b>DATOS BANCARIOS PARA TRANSFERENCIA</b>",
            valorDatosBancarios,
          )
        : ""
    }
        
        ${_tr("<b>SEGURO DE MERCANCIA</b>", seguroTexto.value)}
        ${_tr("<b>LIBERA AD VALOREM CON CERTIFICADO DE ORIGEN</b>", certificadoOrigenTexto.value)}
        ${_tr("<b>PERMISOS ESPECIALES</b>", permisosTexto.value)}
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

        const subject = `${textoExpediente()} | QUOTE${
          pricing.nro_quote
        } ${clean(pricing.dataCliente.nombrecompleto)} ${clean(
          incoterms.value.name,
        )} ${clean(Modality.value!.name!.toUpperCase())} | AGREGAR INSTRUCTIVO INTERNO`;

        const body =
          "Hola colega, adjunto los detalles del expediente (Pega la tabla aquí):\n\n";

        setTimeout(() => {
          // Para: correos de los shippers elegidos en el paso 1
          window.location.href = `mailto:${correosShippers()}?subject=${encodeURIComponent(
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

  const proveedorDetalles = detalleProveedoresCorreo(false);

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
                ${_tr(shippersCorreo().length > 1 ? "DETALLES DE LOS PROVEEDORES" : "DETALLES DEL PROVEEDOR", proveedorDetalles)}
                ${_tr("CLIENTE / RAZON SOCIAL", clienteDetalles)}
                ${_tr(
              "NOTIFY",
              "PIC LOGISTICA SAC<br/>RUC: 20609852861<br/>AV. AGUSTIN DE LA ROSA TORO 770, SAN LUIS<br/>Contacto: Carlos Ramirez<br/>CORREO: ASESOR2@PIC-CARGO.COM",
            )}
                ${_tr(
              "PARA CUÁNDO SE ESTIMA LA MERCANCÍA LISTA PARA RECOJO",
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

    const subject = `${textoExpediente()} | QUOTE${
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
    26: "observacion1",
    27: "observacion2",
  };

  const propiedad = campos[step];

  if (propiedad) {
    datosManuales.value[propiedad] = datosManualesNoAplica.value[propiedad]
      ? "No Aplica"
      : "";
  }
}
// "EXPEDIENTE-123" o, si aún no hay expediente, "Sin exp operativo".
function textoExpediente() {
  const exp = pricing.nro_exp;
  return exp && String(exp) !== "null" ? `EXPEDIENTE-${exp}` : "Sin exp operativo";
}
// Shippers del paso 1; si no hay, el proveedor de la cotización.
function shippersCorreo(): { nombre: string; contacto: string; email: string; telefono: string }[] {
  const lista = shippersPreview.value
    .filter((shipper) => shipper.namelong)
    .map((shipper) => ({
      nombre: shipper.namelong ?? "",
      contacto: shipper.contacto ?? "",
      email: shipper.emailaddress ?? "",
      telefono: shipper.telefono ?? "",
    }));
  if (lista.length) return lista;
  return [{
    nombre: proveedor.value.namelong || "",
    contacto: proveedor.value.contacto || "",
    email: proveedor.value.emailaddress || "",
    telefono: proveedor.value.contacto_phone || "",
  }];
}
// Correos de los shippers (sin repetir) para el "Para:" del correo a Operaciones.
function correosShippers() {
  const correos = shippersCorreo()
    .map((p) => p.email.trim())
    .filter((correo) => /^[^\s@]+@[^\s@]+$/.test(correo));
  const unicos = new Map(correos.map((correo) => [correo.toLowerCase(), correo]));
  return [...unicos.values()].map(encodeURIComponent).join(",");
}
// Un proveedor debajo del otro, separados por una línea.
function detalleProveedoresCorreo(conEnlace: boolean) {
  return shippersCorreo()
    .map((p) => {
      const email = conEnlace && p.email ? `<a href="mailto:${p.email}">${p.email}</a>` : p.email;
      return `<b>NOMBRE:</b> ${p.nombre}<br><b>CONTACTO:</b> ${p.contacto}<br><b>EMAIL:</b> ${email}<br><b>TELÉFONO:</b> ${p.telefono}`;
    })
    .join('<hr style="border:0;border-top:1px dashed #999;margin:6px 0;">');
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

function encontrar(lista: object[] | null | undefined, id: unknown, campo = "id"): FichaInstructivo {
  return ((lista ?? []).find((v) => (v as Record<string, unknown>)[campo] == id) || {}) as FichaInstructivo;
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

// Cada dato que se elige o escribe también se guarda (no solo al cambiar de paso).
watch(shipperIdsSeleccionados, programarAutoguardado);
watch(datosManuales, programarAutoguardado, { deep: true });
watch(listaDocumentos, programarAutoguardado, { deep: true });

onMounted(async () => {
  // Arranca en el paso donde se quedó el borrador (o en Shipper si no hay); se avanza paso por paso.
  const shippersListos = cargarShippers();
  void listarMetodosPago();
  if (!shipmentSubtypeStore.subtypes.length) void shipmentSubtypeStore.load();
  if (!appStore.itemsCoinsList?.length) void appStore._getCoinsList();
  // 1) El borrador va primero y el autoguardado se habilita SIEMPRE: si algo de abajo falla
  //    (p. ej. un catálogo que aún no cargó tras F5), cada paso se sigue guardando.
  try {
    const borrador = pricingStore.datosPrincipales.datosinstructivomanual;
    if (borrador) {
      datosManuales.value = borrador;
      migrarMetodoPagoAntiguo();
      limpiarMontosEnCero();
      datosFile.value = (borrador.table_allpath_list as unknown[] | undefined) ?? [];
    }
  } catch (error) {
    console.error(error);
  }
  const restaurado = restaurarPaso(shippersListos);

  // 2) Datos de la vista previa: uno que falle no corta a los demás.
  [
    cargarDatosModality,
    cargarDatosShipment,
    cargarDatosIncoterms,
    cargarDatosProveedor,
    cargaNroQuote,
    cargarDatosAsesor,
    cargarDatosCliente,
    cargarDatosAsesorPricing,
  ].forEach((cargar) => {
    try {
      cargar();
    } catch (error) {
      console.error(error);
    }
  });

  const tipoCargaItem = (pricingStore.listShipment ?? []).find(
    (v) => v.id == pricingStore.datosPrincipales.idtipocarga,
  );
  const idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;
  if (pricingStore.datosPrincipales.datosinstructivomanual) {
    const opcionCostos = (pricingStore.opcionCostos ?? []).filter((v) => !!v.selected);
    const costosFlete = (opcionCostos[0]?.listCostos ?? []).filter(
      (v) => v.esfleteflag == 1 && v.status == 1 && v.esopcionflag == 1,
    );
    const idBuscado = costosFlete[0]?.id_proveedor ?? null;
    proveedorInstructivo.value =
      (appStore.provedores ?? []).find((v: ProveedorPricing) => v.id == idBuscado) || {};
  }
  const puertos = (async () => {
    puertoOrigen.value = (await puertoStore.verPuerto({
      id_transport: idTipoCarga as number | undefined,
      id: pricingStore.datosPrincipales.idorigen!,
    })) as Puerto | null;
    puertoDestino.value = (await puertoStore.verPuerto({
      id_transport: idTipoCarga as number | undefined,
      id: pricingStore.datosPrincipales.iddestino!,
    })) as Puerto | null;
  })();
  // skeleton hasta tener el borrador, los shippers y los puertos (lo que falle no lo deja colgado)
  const resultados = await Promise.allSettled([restaurado, puertos]);
  resultados.forEach((r) => r.status === "rejected" && console.error(r.reason));
  cargandoInstructivo.value = false;
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
    :aria-busy="cargandoInstructivo"
  >
    <!-- skeleton: pasos a la izquierda, instructivo a la derecha -->
    <div
      v-if="cargandoInstructivo"
      class="ins-skel"
      :style="estiloSkeleton"
      aria-label="Cargando instructivo"
    >
      <div
        v-if="verDatosPreview"
        class="ins-skel__card"
      >
        <v-skeleton-loader
          v-for="n in 9"
          :key="n"
          type="list-item-avatar"
          class="ins-skel__paso"
        />
        <v-skeleton-loader
          type="button"
          class="mt-auto"
        />
      </div>
      <div
        v-if="verPrevisualizacion"
        class="ins-skel__card"
      >
        <v-skeleton-loader type="heading, subtitle" />
        <v-skeleton-loader
          type="image"
          height="80"
          class="my-3"
        />
        <v-skeleton-loader
          v-for="n in 7"
          :key="n"
          type="list-item-two-line"
        />
      </div>
    </div>
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
              :active="abierto(0)"
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
                    @click="continuarShipper"
                  >
                    Continuar
                  </v-btn>
                </v-col>
              </v-row>
            </InstructivoStep>

    
            <InstructivoStep
              :number="stepNumber(2)"
              title="Asunto de Email de seguimiento"
              :active="abierto(2)"
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
              title="Para cuándo se estima la mercancía lista para recojo"
              :active="abierto(3)"
              :complete="isComplete(3)"
              :data-step="3"
              :locked="3 > pasoMaximo"
              @select="irAPaso(3)"
            >
              <v-row>
                <v-col
                  cols="12"
                  class="pt-4"
                >
                  <FormatFecha
                    v-model="fechaListaRecojo"
                    label="Fecha estimada *"
                    placeholder="SELECCIONAR FECHA"
                    prepend-inner-icon="mdi-calendar-blank-outline"
                    outlined
                    density="compact"
                    class="mb-3"
                    hide-details="auto"
                  />
                  <v-textarea
                    v-model="comentarioListaRecojo"
                    label="Comentario (opcional)"
                    rows="1"
                    auto-grow
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="txtNroFactura"
                  />
                </v-col>
                <v-col cols="12">
                  <v-spacer />
                  <v-btn
                    color="primary"
                    class="mx-1"
                    @click="continuarListaRecojo"
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
              :active="abierto(4)"
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
              :active="abierto(5)"
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
                      v-for="doc in listaDocumentos"
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
    
            <!-- DEBEMOS PAGAR AL PROVEEDOR (+ 7.1 ¿El cliente ya nos pagó?) -->
            <InstructivoStep
              :number="stepNumber(6)"
              title="Debemos pagar al proveedor"
              :active="enPasoPago && !cerradoPago"
              :complete="isComplete(ultimoSubpasoPago)"
              :data-step="6"
              :locked="6 > pasoMaximo"
              @select="enPasoPago ? (cerradoPago = !cerradoPago) : irAPaso(6)"
            >
              <div class="pg-question">
                <v-icon
                  size="26"
                  class="pg-question__icon"
                >
                  mdi-storefront-outline
                </v-icon>
                <div class="pg-question__text">
                  <span class="pg-question__line">¿Debemos pagar al <span class="pg-tag">PROVEEDOR</span>?</span>
                  <small>Solo aplica si el cliente nos cancela a nosotros y nosotros debemos pagar al proveedor.</small>
                </div>
                <v-select
                  v-model="pagarProveedorSiNo"
                  :items="cboSiNo"
                  item-title="text"
                  placeholder="Seleccionar"
                  variant="outlined"
                  hide-details
                  density="compact"
                  class="pg-sino"
                  :class="{ 'pg-sino--vacio': pagarProveedorSiNo === null }"
                />
              </div>

              <div
                v-if="datosManuales.pagarProveedor"
                class="pg-sub"
                :class="{ 'is-collapsed': !abierto(6) }"
                data-step="6"
              >
                <div class="pg-sub__head">
                  <span class="pg-sub__num">{{ stepNumber(6) }}.1</span>
                  <div class="pg-question__text">
                    <span class="pg-question__line">¿El <span class="pg-tag pg-tag--solid">CLIENTE</span> ya nos pagó?</span>
                  </div>
                  <v-select
                    v-model="clienteYaPago"
                    :items="cboSiNo"
                    item-title="text"
                    variant="outlined"
                    hide-details
                    density="compact"
                    class="pg-sino"
                  />
                  <button
                    type="button"
                    class="pg-sub__toggle"
                    :title="abierto(6) ? 'Cerrar' : 'Abrir'"
                    @click="irAPaso(6)"
                  >
                    <v-icon size="20">
                      {{ abierto(6) ? "mdi-chevron-up" : "mdi-chevron-down" }}
                    </v-icon>
                  </button>
                </div>
                <div
                  v-if="clienteYaPago && abierto(6)"
                  class="pg-sub__body"
                >
                  <div class="pg-field">
                    <span class="pg-field__icon"><v-icon size="28">mdi-database-outline</v-icon></span>
                    <div class="pg-field__main">
                      <div class="pg-field__label">
                        Monto que nos pagó
                      </div>
                      <div class="pg-money">
                        <v-select
                          v-model="monedaRecibido"
                          :items="monedas"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="pg-money__coin"
                        />
                        <v-text-field
                          v-model="datosManuales.montoRecibido"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Ej. 2,000.00"
                          class="pg-money__amount"
                        />
                      </div>
                    </div>
                  </div>
                  <!-- Al aprobar la cotización, con comprobante se carga solo en "Cargar Pago Cliente" y se envía a Administración -->
                  <ComprobantePagoCliente v-model="comprobantePagoCliente" />
                  <!-- con comprobante, cuenta y banco son obligatorios (se cargan solos al aprobar) -->
                  <template v-if="clienteYaPago">
                    <div class="pg-field">
                      <span class="pg-field__icon"><v-icon size="28">mdi-bank-outline</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          Cuenta donde depositó <span
                            v-if="comprobantePagoCliente"
                            class="pg-req"
                          >*</span>
                        </div>
                        <v-autocomplete
                          v-model="datosManuales.cuentaPagoCliente"
                          :items="cuentasPagoCliente"
                          item-title="titulo"
                          item-value="id"
                          placeholder="Seleccionar banco y cuenta"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          :no-data-text="`No hay cuentas de la empresa en ${monedaRecibido}`"
                        />
                      </div>
                    </div>
                    <div class="pg-field">
                      <span class="pg-field__icon"><v-icon size="28">mdi-bank-transfer-out</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          Banco del cliente <span
                            v-if="comprobantePagoCliente"
                            class="pg-req"
                          >*</span>
                        </div>
                        <v-autocomplete
                          v-model="datosManuales.bancoPagoCliente"
                          :items="bancosPagoCliente"
                          item-title="titulo"
                          item-value="id"
                          placeholder="Desde donde envió el pago"
                          variant="outlined"
                          density="compact"
                          hide-details="auto"
                          no-data-text="No hay bancos registrados"
                        />
                      </div>
                    </div>
                  </template>
                  <div class="pg-field">
                    <span class="pg-field__icon"><v-icon size="28">mdi-calendar-month-outline</v-icon></span>
                    <div class="pg-field__main">
                      <div class="pg-field__label">
                        Fecha en que nos pagó
                      </div>
                      <FormatFecha
                        v-model="fechaPagoCliente"
                        label=""
                        :max="hoyLima()"
                        :error-messages="(fechaPagoCliente ?? '') > hoyLima() ? 'No puede ser posterior a hoy' : ''"
                        prepend-inner-icon="mdi-calendar-month-outline"
                        density="compact"
                        :outlined="true"
                        hide-details="auto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="abierto(6)"
                class="pg-actions"
              >
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-arrow-left"
                  @click="regresar()"
                >
                  Volver
                </v-btn>
                <v-btn
                  color="primary"
                  append-icon="mdi-arrow-right"
                  @click="continuarPagarProveedor"
                >
                  Continuar
                </v-btn>
              </div>

              <!-- Doble validación: el cliente NO pagó -->
              <v-dialog
                v-model="confirmarNoPago"
                max-width="520"
              >
                <v-card class="pg-nopago">
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    class="pg-nopago__close"
                    aria-label="Cerrar"
                    @click="confirmarNoPago = false"
                  />
                  <span class="pg-nopago__icon"><v-icon size="40">mdi-alert-outline</v-icon></span>
                  <div class="pg-nopago__title">
                    ¿Confirmar que el cliente
                  </div>
                  <div class="pg-nopago__badge">
                    NO PAGÓ ?
                  </div>
                  <div class="pg-nopago__actions">
                    <v-btn
                      variant="outlined"
                      prepend-icon="mdi-arrow-left"
                      class="pg-nopago__btn"
                      @click="confirmarNoPago = false"
                    >
                      Volver
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="flat"
                      class="pg-nopago__btn"
                      @click="confirmadoNoPago"
                    >
                      Confirmado NO PAGO
                    </v-btn>
                  </div>
                </v-card>
              </v-dialog>

              <!-- Sub-pasos: dentro del paso 7, se abre uno a la vez -->
              <!-- PROVEEDOR A LLENAR (solo con 2 o más shippers) -->
              <InstructivoStep
                v-if="variosProveedores"
                :number="stepNumber(6.5)"
                title="Proveedores a pagar"
                :subtitle="`${proveedoresCompletos} de ${pagosProveedores.length} completos`"
                :active="abierto(6.5)"
                :complete="isComplete(6.5)"
                :data-step="6.5"
                :locked="6.5 > pasoMaximo"
                @select="irAPaso(6.5)"
              >
                <div class="pg-field__hint">
                  Llena el método y los datos de pago de cada proveedor, uno por uno.
                </div>
                <div class="pg-proveedores">
                  <button
                    v-for="(pago, indice) in pagosProveedores"
                    :key="pago.id"
                    type="button"
                    class="pg-proveedor"
                    :class="{ 'is-selected': pago.id === proveedorPagoActivo }"
                    @click="seleccionarProveedorPago(pago.id)"
                  >
                    <span class="pg-proveedor__num">{{ indice + 1 }}</span>
                    <span class="pg-proveedor__name">{{ pago.nombre }}</span>
                    <span
                      class="pg-proveedor__state"
                      :class="pago.completo ? 'is-ok' : ''"
                    >
                      <v-icon size="16">{{ pago.completo ? "mdi-check-circle" : "mdi-progress-clock" }}</v-icon>
                      {{ pago.completo ? "Completo" : "Pendiente" }}
                    </span>
                  </button>
                </div>
                <div class="pg-actions">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-arrow-left"
                    @click="regresar()"
                  >
                    Volver
                  </v-btn>
                  <div class="pg-actions__right">
                    <v-btn
                      variant="outlined"
                      color="primary"
                      prepend-icon="mdi-pencil-outline"
                      class="pg-btn-llenar"
                      @click="continuarProveedorPago"
                    >
                      Llenar {{ nombreProveedorActivo || "proveedor" }}
                    </v-btn>
                    <!-- Con al menos un proveedor completo ya se puede seguir; los demás son opcionales -->
                    <v-btn
                      color="primary"
                      append-icon="mdi-arrow-right"
                      :disabled="!proveedoresCompletos"
                      :title="proveedoresCompletos ? '' : 'Completa al menos un proveedor'"
                      @click="continuarTrasProveedores"
                    >
                      Continuar
                    </v-btn>
                  </div>
                </div>
              </InstructivoStep>
              <template v-if="datosManuales.pagarProveedor">
                <!-- MÉTODO DE PAGO AL PROVEEDOR (catálogo METPAGPROV, Ficheros > Pricing) -->
                <InstructivoStep
                  :number="stepNumber(7)"
                  title="Método de Pago al Proveedor"
                  :subtitle="variosProveedores ? `Proveedor: ${nombreProveedorActivo}` : ''"
                  :active="abierto(7)"
                  :complete="isComplete(7)"
                  :data-step="7"
                  :locked="7 > pasoMaximo"
                  @select="irAPaso(7)"
                >
                  <div
                    v-if="cargandoMetodos"
                    class="pg-hint"
                  >
                    Cargando métodos de pago…
                  </div>
                  <div
                    v-else-if="!opcionesMetodoPago.length"
                    class="pg-hint"
                  >
                    No hay métodos de pago activos. Regístralos en Ficheros &gt; Pricing &gt; Métodos de pago al proveedor.
                  </div>
                  <div
                    v-else
                    class="pg-methods"
                    role="radiogroup"
                  >
                    <div
                      v-for="metodo in opcionesMetodoPago"
                      :key="metodo.codigo"
                      class="pg-method"
                      :class="{ 'is-selected': datosManuales.metodoPagoCodigo === metodo.codigo }"
                      role="radio"
                      tabindex="0"
                      :aria-checked="datosManuales.metodoPagoCodigo === metodo.codigo"
                      @click="elegirMetodoPago(metodo)"
                      @keydown.enter.prevent="elegirMetodoPago(metodo)"
                      @keydown.space.prevent="elegirMetodoPago(metodo)"
                    >
                      <span class="pg-method__radio" />
                      <span class="pg-method__name">
                        <b>{{ metodo.descripcion }}<template v-if="esMetodoOtros(metodo.codigo)">:</template></b>
                        <span v-if="metodo.detalle"> ({{ metodo.detalle }})</span>
                      </span>
                      <v-text-field
                        v-if="esMetodoOtros(metodo.codigo)"
                        v-model="datosManuales.metodoPagoOtro"
                        placeholder="Especifique el método de pago"
                        class="pg-method__other"
                        @focus="elegirMetodoPago(metodo)"
                        @click.stop
                      />
                    </div>
                  </div>
                  <div class="pg-actions">
                    <v-btn
                      variant="outlined"
                      prepend-icon="mdi-arrow-left"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                    <v-btn
                      color="primary"
                      append-icon="mdi-arrow-right"
                      @click="continuarMetodoPago"
                    >
                      Continuar
                    </v-btn>
                  </div>
                </InstructivoStep>

                <!-- 7.3 PAGO AL PROVEEDOR: formulario según el código del método
                     01 Alibaba tarjeta · 02 Alibaba transferencia · 03 Transferencia internacional · 04 Alipay -->
                <InstructivoStep
                  v-if="tieneFormularioPago"
                  :number="stepNumber(12)"
                  :title="tituloFormularioPago"
                  :subtitle="variosProveedores ? `${subtituloFormularioPago} · Proveedor: ${nombreProveedorActivo}` : subtituloFormularioPago"
                  :active="abierto(12)"
                  :complete="isComplete(12)"
                  :data-step="12"
                  :locked="12 > pasoMaximo"
                  @select="irAPaso(12)"
                >
                  <template #aside>
                    <LogoPlataformaPago
                      v-if="plataforma"
                      :plataforma="plataforma"
                    />
                    <span
                      v-else-if="esOtrosPago"
                      class="pg-brand pg-brand--icon pg-brand--otros"
                    ><v-icon size="24">mdi-wallet-outline</v-icon>Otros</span>
                    <span
                      v-else
                      class="pg-brand pg-brand--icon"
                    ><v-icon size="26">mdi-bank-transfer</v-icon></span>
                  </template>

                  <div class="pg-form">
                    <!-- Monto a pagar: primero y obligatorio en todos (Alipay pide CNY / USD más abajo) -->
                    <!-- Otros (07): método, monto, comprobante y factura, en ese orden -->
                    <div
                      v-if="esOtrosPago"
                      class="pg-field"
                    >
                      <span class="pg-field__icon"><v-icon>mdi-credit-card-outline</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          Método de Pago (Otros)
                        </div>
                        <div class="pg-field__hint">
                          Especifica el método de pago utilizado.
                        </div>
                        <v-text-field
                          v-model="datosManuales.metodoPagoOtro"
                          placeholder="Ej. Pago con tarjeta, depósito bancario, Alipay, otro"
                        />
                      </div>
                    </div>

                    <div
                      v-if="pideMontoPago"
                      class="pg-field"
                    >
                      <span class="pg-field__icon"><v-icon>mdi-cash-multiple</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          Monto a pagar al proveedor <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                        </div>
                        <div class="pg-field__hint">
                          Ingresa el monto total a pagar al proveedor.
                        </div>
                        <div class="pg-money pg-money--right">
                          <v-text-field
                            v-model.number="datosManuales.monto"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ej. 1,700.00"
                            class="pg-money__amount"
                          />
                          <v-select
                            v-model="monedaPago"
                            :items="monedas"
                            variant="outlined"
                            density="compact"
                            hide-details
                            class="pg-money__coin"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="esOtrosPago"
                      class="pg-field"
                    >
                      <span class="pg-field__icon"><v-icon>mdi-image-outline</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          Comprobante / Datos de Transferencia (PDF) <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                        </div>
                        <div class="pg-field__hint">
                          Adjunta la captura o constancia del pago (donde se vean los datos de la transferencia).
                        </div>
                        <ArrastraYSolarComponent
                          v-if="docComprobanteTransferencia"
                          zona
                          accept=".pdf,.jpg,.jpeg,.png"
                          titulo="Subir comprobante (JPG / PNG / PDF)"
                          :id="docComprobanteTransferencia.key"
                          :archivo-inicial="docComprobanteTransferencia.file as ArchivoInicial"
                          @archivo-cargado="(datoEmit) => cargarArchivoDinamico(datoEmit, docComprobanteTransferencia!)"
                          @archivo-eliminado="eliminarArchivoDinamico(docComprobanteTransferencia!)"
                        />
                      </div>
                    </div>

                    <!-- N.° de factura comercial -->
                    <div
                      v-if="pideNroFactura"
                      class="pg-field"
                    >
                      <span class="pg-field__icon"><v-icon>mdi-pound-box-outline</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          N.° de Factura Comercial
                        </div>
                        <div
                          v-if="esPlataforma || esOtrosPago"
                          class="pg-field__hint"
                        >
                          Ingresa el número de la Factura Comercial o Proforma.
                        </div>
                        <v-text-field
                          v-model="datosManuales.nroFactura"
                          placeholder="Ej. FC-00012345"
                        />
                      </div>
                    </div>

                    <!-- Factura comercial / proforma (Alibaba y transferencia internacional) -->
                    <div
                      v-if="esPlataforma || esTransferenciaInternacional"
                      class="pg-field"
                    >
                      <span class="pg-field__icon"><v-icon>mdi-file-document-outline</v-icon></span>
                      <div class="pg-field__main">
                        <div class="pg-field__label">
                          Factura Comercial / Proforma <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                        </div>
                        <div
                          v-if="esPlataforma"
                          class="pg-field__hint"
                        >
                          Adjunta la Factura Comercial o Proforma del proveedor.
                        </div>
                        <div
                          v-if="docFacturaAdjunta && !docFacturaAdjunta.file"
                          class="pg-from-adjunta"
                        >
                          <v-icon size="16">
                            mdi-check-circle
                          </v-icon>
                          {{ docFacturaAdjunta.label }} marcada en «Se adjunta» (sin archivo). Puedes adjuntarlo aquí.
                        </div>
                        <ArrastraYSolarComponent
                          v-if="docFacturaPago"
                          zona
                          accept=".pdf"
                          titulo="Subir factura o proforma (PDF)"
                          :subtitulo="esPlataforma ? undefined : ''"
                          :id="docFacturaPago.key"
                          :archivo-inicial="docFacturaPago.file as ArchivoInicial"
                          @archivo-cargado="(datoEmit) => cargarArchivoDinamico(datoEmit, docFacturaPago!)"
                          @archivo-eliminado="eliminarArchivoDinamico(docFacturaPago!)"
                        />
                      </div>
                    </div>

                    <!-- Alibaba (01 / 02) y Made in China (06 / 05) -->
                    <template v-if="esPlataforma">
                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-link-variant</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Link de pago
                          </div>
                          <div class="pg-field__hint">
                            Pega el enlace de pago de {{ plataforma }}.
                          </div>
                          <v-text-field
                            v-model="datosManuales.linkDePagoAlibaba"
                            placeholder="https:// ..."
                          />
                        </div>
                      </div>

                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-file-sign</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Contrato de {{ plataforma }} (PDF) <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                          </div>
                          <div class="pg-field__hint">
                            Adjunta el contrato generado en {{ plataforma }}.
                          </div>
                          <ArrastraYSolarComponent
                            zona
                            accept=".pdf"
                            titulo="Subir contrato (PDF)"
                            id="contratoAlibaba"
                            :archivo-inicial="datosManuales.contratoAlibaba as ArchivoInicial"
                            @archivo-cargado="(datoEmit) => (datosManuales.contratoAlibaba = datoEmit.archivo)"
                            @archivo-eliminado="datosManuales.contratoAlibaba = null"
                          />
                        </div>
                      </div>

                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-pound-box-outline</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Número de contrato
                          </div>
                          <div class="pg-field__hint">
                            Ingresa el número de contrato de {{ plataforma }}.
                          </div>
                          <v-text-field
                            v-model="datosManuales.numeroContratoAlibaba"
                            placeholder="Ej. 1234567890"
                          />
                        </div>
                      </div>
                    </template>

                    <!-- Transferencia internacional (03): captura de datos bancarios (el comprobante va en 6.1, pago del cliente) -->
                    <template v-if="esTransferenciaInternacional">
                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-image-outline</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Captura de los Datos Bancarios del Proveedor <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                          </div>
                          <div class="pg-field__hint">
                            Adjunta la captura enviada por el proveedor (para validar los datos).
                          </div>
                          <ArrastraYSolarComponent
                            zona
                            accept=".pdf,.jpg,.jpeg,.png"
                            titulo="Adjuntar captura (PDF / JPG / PNG)"
                            subtitulo=""
                            id="capturaDatosBancarios"
                            :archivo-inicial="datosManuales.capturaDatosBancarios as ArchivoInicial"
                            @archivo-cargado="(datoEmit) => (datosManuales.capturaDatosBancarios = datoEmit.archivo)"
                            @archivo-eliminado="datosManuales.capturaDatosBancarios = null"
                          />
                        </div>
                      </div>
                    </template>

                    <!-- Datos de la transferencia (02 y 03) -->
                    <div
                      v-if="pideDatosTransferencia"
                      class="pg-transfer"
                    >
                      <div class="pg-transfer__head">
                        <v-icon size="30">
                          mdi-bank-outline
                        </v-icon>
                        <div>
                          <div class="pg-field__label">
                            Datos de la Transferencia Internacional
                          </div>
                          <div
                            v-if="esPlataformaTransferencia"
                            class="pg-field__hint"
                          >
                            Completa los datos bancarios del proveedor en {{ plataforma }}.
                          </div>
                        </div>
                      </div>
                      <div class="pg-transfer__rows">
                        <div
                          v-for="campo in camposTransferencia"
                          :key="campo.key"
                          class="pg-transfer__row"
                        >
                          <v-icon
                            size="20"
                            class="pg-transfer__icon"
                          >
                            {{ campo.icon }}
                          </v-icon>
                          <span class="pg-transfer__label">{{ campo.label }}</span>
                          <v-text-field
                            v-model="datosManuales[campo.key] as string"
                            :placeholder="campo.key === 'nombreBeneficiario' ? placeholderBeneficiario : campo.placeholder"
                            class="pg-transfer__input"
                          />
                        </div>
                      </div>
                      <div
                        v-if="esPlataformaTransferencia"
                        class="pg-field"
                      >
                        <span class="pg-field__icon"><v-icon>mdi-file-document-outline</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Comprobante / Datos de Transferencia (PDF) <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                          </div>
                          <div class="pg-field__hint">
                            Adjunta el comprobante de transferencia o los datos de la operación.
                          </div>
                          <ArrastraYSolarComponent
                            v-if="docComprobanteTransferencia"
                            zona
                            accept=".pdf"
                            titulo="Subir comprobante (PDF)"
                            :id="docComprobanteTransferencia.key"
                            :archivo-inicial="docComprobanteTransferencia.file as ArchivoInicial"
                            @archivo-cargado="(datoEmit) => cargarArchivoDinamico(datoEmit, docComprobanteTransferencia!)"
                            @archivo-eliminado="eliminarArchivoDinamico(docComprobanteTransferencia!)"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Alipay (04): QR y montos -->
                    <template v-if="esAlipay">
                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-qrcode</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            QR de pago (Alipay / WeChat Pay) <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                          </div>
                          <div class="pg-field__hint">
                            Adjunta la imagen del QR de pago del proveedor.
                          </div>
                          <ArrastraYSolarComponent
                            zona
                            accept=".jpg,.jpeg,.png"
                            titulo="Subir QR de pago"
                            subtitulo="(JPG / PNG)"
                            id="qrPagoProveedor"
                            :archivo-inicial="datosManuales.qrPagoProveedor as ArchivoInicial"
                            @archivo-cargado="(datoEmit) => (datosManuales.qrPagoProveedor = datoEmit.archivo)"
                            @archivo-eliminado="datosManuales.qrPagoProveedor = null"
                          />
                        </div>
                      </div>
                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-currency-cny</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Monto a transferir (CNY) <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                          </div>
                          <v-text-field
                            v-model.number="datosManuales.montoCNY"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ej. 12,345.00"
                            class="pg-amount"
                          >
                            <template #append-inner>
                              <span class="pg-amount__cur">CNY</span>
                            </template>
                          </v-text-field>
                        </div>
                      </div>
                      <div class="pg-field">
                        <span class="pg-field__icon"><v-icon>mdi-currency-usd</v-icon></span>
                        <div class="pg-field__main">
                          <div class="pg-field__label">
                            Equivalente en dólares (USD) <span class="pg-req">*</span><span class="pg-badge">Obligatorio</span>
                          </div>
                          <v-text-field
                            v-model.number="datosManuales.montoUSD"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Ej. 1,700.00"
                            class="pg-amount"
                          >
                            <template #append-inner>
                              <span class="pg-amount__cur">USD</span>
                            </template>
                          </v-text-field>
                        </div>
                      </div>
                    </template>
                    <div
                      v-if="esOtrosPago"
                      class="pg-info"
                    >
                      <v-icon
                        size="34"
                        class="pg-info__icon"
                      >
                        mdi-information
                      </v-icon>
                      <div>
                        <b>¿De dónde salen los datos?</b>
                        <span>El número de factura y el monto se toman de la Factura Comercial (o Proforma) enviada por el proveedor.</span>
                      </div>
                    </div>
                  </div>

                  <div class="pg-actions">
                    <v-btn
                      variant="outlined"
                      prepend-icon="mdi-arrow-left"
                      @click="regresar()"
                    >
                      Volver
                    </v-btn>
                    <v-btn
                      color="primary"
                      append-icon="mdi-arrow-right"
                      :loading="guardandoPago"
                      @click="guardarYContinuarPago"
                    >
                      Guardar y Continuar
                    </v-btn>
                  </div>
                </InstructivoStep>
              </template>
            </InstructivoStep>


            <!-- SEGURO DE MERCANCIA -->
            <InstructivoStep
              :number="stepNumber(23)"
              title="Seguro de mercancía"
              :active="abierto(23)"
              :complete="isComplete(23)"
              :data-step="23"
              :locked="23 > pasoMaximo"
              @select="irAPaso(23)"
            >
              <template #aside>
                <span class="pg-brand pg-brand--icon"><v-icon size="24">mdi-shield-check-outline</v-icon></span>
              </template>
              <div class="pg-form">
                <div class="pg-field">
                  <span class="pg-field__icon"><v-icon>mdi-format-list-bulleted</v-icon></span>
                  <div class="pg-field__main">
                    <div class="pg-field__label">
                      Seguro de Mercancía <span class="pg-req">*</span>
                    </div>
                    <v-select
                      v-model="seguroSiNo"
                      :items="opcionesSiNo"
                      placeholder="Seleccionar"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </div>
                </div>
                <div
                  v-if="seguroSiNo === 'Si'"
                  class="pg-field"
                >
                  <span class="pg-field__icon"><v-icon>mdi-database-outline</v-icon></span>
                  <div class="pg-field__main">
                    <div class="pg-field__label">
                      Monto del seguro vendido al cliente <span class="pg-req">*</span>
                    </div>
                    <div class="pg-money pg-money--right">
                      <v-text-field
                        v-model.number="datosManuales.montoSeguro"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej. 120.00"
                        class="pg-money__amount"
                      />
                      <v-select
                        v-model="monedaSeguro"
                        :items="monedas"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="pg-money__coin"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="pg-actions">
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-arrow-left"
                  @click="regresar()"
                >
                  Volver
                </v-btn>
                <v-btn
                  color="primary"
                  append-icon="mdi-arrow-right"
                  :loading="guardandoPago"
                  @click="guardarYContinuarSeguro"
                >
                  Guardar y Continuar
                </v-btn>
              </div>
            </InstructivoStep>

            <!-- LIBERA AD VALOREM CON CERTIFICADO DE ORIGEN -->
            <InstructivoStep
              :number="stepNumber(24)"
              title="Libera Ad Valorem con Certificado de Origen"
              :active="abierto(24)"
              :complete="isComplete(24)"
              :data-step="24"
              :locked="24 > pasoMaximo"
              @select="irAPaso(24)"
            >
              <template #aside>
                <span class="pg-brand pg-brand--icon"><v-icon size="24">mdi-file-certificate-outline</v-icon></span>
              </template>
              <div class="pg-form">
                <div class="pg-field">
                  <span class="pg-field__icon"><v-icon>mdi-file-certificate-outline</v-icon></span>
                  <div class="pg-field__main">
                    <div class="pg-field__label">
                      ¿Libera Ad Valorem con Certificado de Origen? <span class="pg-req">*</span>
                    </div>
                    <v-select
                      v-model="certificadoOrigenSiNo"
                      :items="opcionesSiNo"
                      placeholder="Seleccionar"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </div>
                </div>
                <div
                  v-if="certificadoOrigenSiNo === 'Si'"
                  class="pg-field"
                >
                  <span class="pg-field__icon"><v-icon>mdi-file-certificate-outline</v-icon></span>
                  <div class="pg-field__main">
                    <div class="pg-field__label">
                      Partida arancelaria aplicable <span class="pg-req">*</span>
                    </div>
                    <div class="pg-field__hint">
                      Indica la partida arancelaria que está aplicando.
                    </div>
                    <v-text-field
                      v-model="datosManuales.partidaArancelaria"
                      placeholder="Ej. 6403.99.90.00"
                    />
                  </div>
                </div>
              </div>
              <div class="pg-actions">
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-arrow-left"
                  @click="regresar()"
                >
                  Volver
                </v-btn>
                <v-btn
                  color="primary"
                  append-icon="mdi-arrow-right"
                  :loading="guardandoPago"
                  @click="guardarYContinuarCertificado"
                >
                  Guardar y Continuar
                </v-btn>
              </div>
            </InstructivoStep>

            <!-- PERMISOS ESPECIALES -->
            <InstructivoStep
              :number="stepNumber(25)"
              title="Permisos especiales"
              :active="abierto(25)"
              :complete="isComplete(25)"
              :data-step="25"
              :locked="25 > pasoMaximo"
              @select="irAPaso(25)"
            >
              <template #aside>
                <span class="pg-brand pg-brand--icon"><v-icon size="24">mdi-file-check-outline</v-icon></span>
              </template>
              <div class="pg-form">
                <div class="pg-field">
                  <span class="pg-field__icon"><v-icon>mdi-file-document-outline</v-icon></span>
                  <div class="pg-field__main">
                    <div class="pg-field__label">
                      ¿El cliente informó sobre permisos especiales? <span class="pg-req">*</span>
                    </div>
                    <v-select
                      v-model="permisosEspecialesSiNo"
                      :items="opcionesSiNo"
                      placeholder="Seleccionar"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </div>
                </div>
                <div class="pg-field">
                  <span class="pg-field__icon"><v-icon>mdi-message-processing-outline</v-icon></span>
                  <div class="pg-field__main">
                    <div class="pg-field__label">
                      Comentario <span class="pg-opt">(opcional)</span>
                    </div>
                    <v-textarea
                      v-model="datosManuales.comentarioPermisos"
                      placeholder="Coméntanos qué indicó el cliente."
                      rows="3"
                      auto-grow
                      class="txt-wrap"
                    />
                  </div>
                </div>
                <div class="pg-info pg-info--azul">
                  <v-icon
                    size="30"
                    class="pg-info__icon"
                  >
                    mdi-information-outline
                  </v-icon>
                  <div>
                    <span><b>Nota:</b> Indica lo que te comentó el cliente.</span>
                    <span class="pg-info__line"><b>Ejemplo:</b> Sí: Las bicimotos van hasta 20 km/h, no requiere permiso especial.</span>
                  </div>
                </div>
              </div>
              <div class="pg-actions">
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-arrow-left"
                  @click="regresar()"
                >
                  Volver
                </v-btn>
                <v-btn
                  color="primary"
                  append-icon="mdi-arrow-right"
                  :loading="guardandoPago"
                  @click="guardarYContinuarPermisos"
                >
                  Guardar y Continuar
                </v-btn>
              </div>
            </InstructivoStep>
            <InstructivoStep
              :number="stepNumber(26)"
              title="Observaciones adicionales 1"
              :active="abierto(26)"
              :complete="isComplete(26)"
              :data-step="26"
              :locked="26 > pasoMaximo"
              @select="irAPaso(26)"
            >
              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    label="No Aplica"
                    v-model="datosManualesNoAplica.observacion1"
                    @update:model-value="checkNoAplica(26)"
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
              :number="stepNumber(27)"
              title="Observaciones adicionales 2"
              :active="abierto(27)"
              :complete="isComplete(27)"
              :data-step="27"
              :locked="27 > pasoMaximo"
              @select="irAPaso(27)"
            >
              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    label="No Aplica"
                    v-model="datosManualesNoAplica.observacion2"
                    @update:model-value="checkNoAplica(27)"
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
        <div class="ins-actions__row">
          <v-btn
            variant="outlined"
            class="ins-btn ins-btn--cancel"
            @click="$emit('cerrarDialogo')"
          >
            Cancelar
          </v-btn>
          <v-btn
            v-if="!aprobadoflag"
            variant="flat"
            class="ins-btn ins-btn--soft"
            :loading="guardandoBorrador"
            @click="guardarBorrador"
          >
            Guardar borrador
          </v-btn>
          <v-btn
            v-else
            variant="flat"
            class="ins-btn ins-btn--soft"
            @click="generarHTMLPDF()"
          >
            Imprimir
          </v-btn>
          <v-btn
            variant="flat"
            class="ins-btn ins-btn--primary"
            @click="aprobadoflag ? guardarYGenenarCorreo() : setDatosInstructivo()"
          >
            Guardar y enviar a {{ destinoLabel }}
          </v-btn>
        </div>
        <v-btn
          block
          variant="outlined"
          class="ins-btn ins-btn--close"
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
                  <b>{{ servicioTexto || "—" }}</b>
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
              label="Para cuándo se estima la mercancía lista para recojo"
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
                {{ pagarProveedorSiNo === null ? "Sin seleccionar" : pagarProveedorSiNo ? "Sí" : "No" }}
              </span>
              <span
                v-if="datosManuales.pagarProveedor"
                class="ins-pago-cliente"
              >
                Cliente ya nos pagó:
                <b>{{ clienteYaPago ? "Sí" : "No" }}</b>
                <template v-if="pagoClienteTexto">· {{ pagoClienteTexto }}</template>
              </span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              v-if="datosManuales.pagarProveedor"
              icon="mdi-bank-outline"
              label="Datos del pago al proveedor"
              data-paso="datosBancarios"
              :active="pasoActivo === 'datosBancarios'"
            >
              <div
                v-if="variosProveedores"
                class="ins-shippers"
              >
                <div
                  v-for="grupo in gruposPagoProveedor"
                  :key="grupo.id"
                  class="ins-grid"
                >
                  <span class="ins-grid__full">Proveedor: <b>{{ grupo.nombre }}</b>
                    <template v-if="!grupo.completo"> (pendiente)</template></span>
                  <span
                    v-for="dato in grupo.datos"
                    :key="dato.label"
                  >{{ dato.label }}: <b>{{ dato.valor ?? "" }}</b></span>
                </div>
              </div>
              <div
                v-else-if="datosBancarios.length"
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
                v-if="seguroTexto"
                class="ins-chip"
                :class="claseSiNo(seguroTexto)"
              >{{ seguroTexto }}</span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-file-certificate-outline"
              label="Libera Ad Valorem con Certificado de Origen"
              data-paso="certificadoOrigen"
              :active="pasoActivo === 'certificadoOrigen'"
            >
              <span
                v-if="certificadoOrigenTexto"
                class="ins-chip"
                :class="claseSiNo(certificadoOrigenTexto)"
              >{{ certificadoOrigenTexto }}</span>
            </InstructivoPreviewRow>
            <InstructivoPreviewRow
              icon="mdi-file-check-outline"
              label="Permisos especiales"
              data-paso="permisos"
              :active="pasoActivo === 'permisos'"
            >
              {{ permisosTexto }}
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
              label="Para cuándo se estima la mercancía lista para recojo"
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
.ins-skel {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  gap: 16px;
  padding: 16px;
  background: #f3f6fb;
}
.ins-skel__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  border: 1px solid #e3e8f0;
  border-radius: 14px;
  background: #ffffff;
}
.ins-skel__card :deep(.v-skeleton-loader) {
  background: transparent;
}
.ins-layout {
  position: relative;
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
.ins-actions__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ins-actions__row .ins-btn {
  flex: 1 1 0;
  min-width: 110px;
}
.ins-actions__row .ins-btn--primary {
  flex: 1.6 1 0;
  min-width: 170px;
}
.ins-btn {
  height: 42px !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}
.ins-btn--cancel {
  color: #1f2a44 !important;
  background: #ffffff !important;
  border: 1px solid #c9d1dd !important;
}
.ins-btn--soft {
  color: #1f2a44 !important;
  background: #d6e4fb !important;
}
.ins-btn--primary {
  color: #ffffff !important;
  background: #1f73e8 !important;
  box-shadow: 0 4px 12px rgba(31, 115, 232, 0.28) !important;
}
.ins-btn--close {
  justify-content: flex-start;
  color: #1f2a44 !important;
  background: #ffffff !important;
  border-color: #e3e8f0 !important;
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

/* ===== Pago al proveedor (7, 7.1, 7.2, 7.3) ===== */
.pg-question {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
.pg-question__icon {
  color: #1f2a44;
}
.pg-question__text {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: #1f2a44;
}
/* La pregunta va de corrido (una sola línea); la nota, debajo. */
.pg-question__line {
  white-space: nowrap;
}
.pg-question__text small {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}
.pg-tag {
  padding: 1px 8px;
  font-weight: 800;
  color: #1f73e8;
  background: #dbe8fd;
  border-radius: 6px;
}
.pg-tag--solid {
  color: #ffffff;
  background: #1f73e8;
}
/* Combo Sí/No pequeño y siempre a la derecha */
.pg-sino {
  flex: 0 0 84px;
  max-width: 84px;
  margin-left: auto;
}
.pg-sino.pg-sino--vacio {
  flex-basis: 140px;
  max-width: 140px;
}
/* Doble validación: el cliente NO pagó */
.pg-nopago {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 24px 20px;
  text-align: center;
  border-radius: 18px !important;
}
.pg-nopago__close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.pg-nopago__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: #d32f2f;
  background: #fde2e2;
  border-radius: 14px;
}
.pg-nopago__title {
  margin-top: 14px;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  color: #0a1f44;
}
.pg-nopago__badge {
  margin-top: 6px;
  padding: 2px 18px;
  font-size: 28px;
  font-weight: 900;
  color: #d32f2f;
  background: #fde2e2;
  border-radius: 12px;
}
.pg-nopago__actions {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.pg-nopago__btn {
  flex: 1;
  height: 44px !important;
  margin: 0 !important;
  font-weight: 700;
}
@media (max-width: 599.98px) {
  .pg-nopago__title {
    font-size: 19px;
  }
  .pg-nopago__badge {
    font-size: 24px;
  }
  .pg-nopago__actions {
    flex-direction: column-reverse;
  }
}
.pg-sino :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 0;
  padding-bottom: 0;
  align-items: center;
}
.pg-sino :deep(.v-field) {
  background: #ffffff;
}
.pg-sub {
  margin: 4px 0 4px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d6e3f7;
  border-left: 3px solid #1f73e8;
  border-radius: 12px;
}
.pg-sub__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #eaf2ff;
}
.pg-sub__num {
  padding: 4px 10px;
  font-size: 15px;
  font-weight: 800;
  color: #1f2a44;
  background: #c9dcfb;
  border-radius: 8px;
}
.pg-sub.is-collapsed .pg-sub__head {
  background: #f6f9fe;
}
.pg-sub__toggle {
  display: inline-flex;
  padding: 4px;
  color: #1f73e8;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.pg-sub__toggle:hover {
  background: #dbe8fd;
}
.pg-sub__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 12px;
}
/* Ícono más grande y centrado verticalmente con su etiqueta + campo */
.pg-sub__body .pg-field {
  align-items: center;
  padding: 0;
}
.pg-sub__body .pg-field__icon {
  flex-basis: 52px;
  height: 52px;
  border-radius: 12px;
}
.pg-field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}
.pg-form > .pg-field + .pg-field,
.pg-form > .pg-field + .pg-transfer {
  border-top: 1px solid #eef2f7;
}
.pg-field__icon {
  flex: 0 0 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #1f73e8;
  background: #eaf2ff;
  border-radius: 10px;
}
.pg-field__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pg-field__label {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
}
.pg-sub__body .pg-field__label {
  font-size: 13px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.pg-field__hint {
  font-size: 12px;
  color: #4b5563;
}
.pg-req {
  margin-left: 2px;
  color: #dc2626;
}
.pg-opt {
  margin-left: 4px;
  color: #5b6b86;
  font-size: 0.85em;
  font-weight: 500;
}
.pg-badge {
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #dc2626;
  background: #fde2e2;
  border-radius: 999px;
}
.pg-badge--opt {
  color: #4b5563;
  background: #eef2f7;
}
.pg-money {
  display: flex;
  align-items: stretch;
}
/* Moneda y monto con la misma altura (el combo no se desborda) */
.pg-money :deep(.v-input__control),
.pg-money :deep(.v-field) {
  height: 40px;
}
.pg-money :deep(.v-field__input) {
  min-height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  align-items: center;
}
.pg-money__coin {
  flex: 0 0 104px;
}
.pg-money__coin :deep(.v-field) {
  background: #eef1f5;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.pg-money__amount :deep(.v-field) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.pg-from-adjunta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #166534;
}
.pg-methods {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pg-method {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 6px 12px;
  font-size: 14px;
  color: #1f2a44;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
}
.pg-method:hover {
  background: #f4f8fe;
}
.pg-method:focus-visible {
  outline: 2px solid #9cc0f7;
}
.pg-method.is-selected {
  background: #eaf2ff;
  border-color: #9cc0f7;
}
.pg-method__radio {
  flex: 0 0 20px;
  height: 20px;
  border: 2px solid #6b7280;
  border-radius: 50%;
}
.pg-method.is-selected .pg-method__radio {
  border: 6px solid #1f73e8;
}
.pg-method__name span {
  color: #374151;
}
.pg-method__other {
  flex: 1;
  min-width: 160px;
}
.pg-brand {
  padding: 3px 10px;
  font-size: 14px;
  font-weight: 800;
  color: #f05a00;
  background: #ffffff;
  border: 1px solid #f3d3bf;
  border-radius: 10px;
}
.pg-transfer {
  margin-top: 6px;
  overflow: hidden;
  border: 1px solid #d6e3f7;
  border-radius: 12px;
}
.pg-transfer__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  color: #1f73e8;
  background: #eaf2ff;
}
.pg-transfer__rows {
  padding: 4px 12px;
}
.pg-transfer__row {
  display: grid;
  grid-template-columns: 24px minmax(140px, 1fr) minmax(0, 1.4fr);
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  border-bottom: 1px solid #eef2f7;
}
.pg-transfer__icon {
  color: #1f73e8;
}
.pg-transfer__label {
  font-size: 13px;
  font-weight: 700;
  color: #1f2a44;
}
.pg-transfer > .pg-field {
  padding: 10px 12px;
}
.pg-brand--icon {
  display: inline-flex;
  color: #1f73e8;
  border-color: #c9dcfb;
}
/* Monto con la moneda en un bloque a la derecha (Alipay) */
.pg-amount :deep(.v-field) {
  padding-inline-end: 0;
}
.pg-amount__cur {
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 0 14px;
  font-weight: 800;
  color: #1f73e8;
  background: #dbe8fd;
  border-left: 1px solid #c9dcfb;
}
.pg-brand--otros {
  gap: 6px;
  font-weight: 800;
  color: #1f2a44;
}
.pg-brand--otros .v-icon {
  color: #1f73e8;
}
/* Monto con la moneda a la derecha (7.3) */
.pg-money--right .pg-money__coin :deep(.v-field) {
  color: #1f73e8;
  font-weight: 700;
  background: #eaf2ff;
  border-radius: 0 4px 4px 0;
}
.pg-money--right .pg-money__amount :deep(.v-field) {
  border-radius: 4px 0 0 4px;
}
.pg-info {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  padding: 12px 14px;
  font-size: 13px;
  color: #374151;
  background: #fff8e6;
  border: 1px solid #fde7a8;
  border-radius: 12px;
}
.pg-info--azul {
  background: #eaf2ff;
  border-color: #c9dcfb;
}
.pg-info--azul .pg-info__icon {
  color: #1f73e8;
}
.pg-info__line {
  display: block;
  margin-top: 4px;
}
.pg-info__icon {
  color: #f59e0b;
}
.pg-info b {
  display: block;
  font-size: 14px;
  color: #1f2a44;
}
.pg-proveedores {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.pg-proveedor {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: #ffffff;
  border: 1px solid #e3e8f0;
  border-radius: 10px;
  cursor: pointer;
}
.pg-proveedor:hover {
  background: #f4f8fe;
}
.pg-proveedor.is-selected {
  background: #eaf2ff;
  border-color: #9cc0f7;
}
.pg-proveedor__num {
  flex: 0 0 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #1f73e8;
  background: #dbe8fd;
  border-radius: 50%;
}
.pg-proveedor__name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2a44;
}
.pg-proveedor__state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}
.pg-proveedor__state.is-ok {
  color: #15803d;
}
.ins-grid__full {
  grid-column: 1 / -1;
}
.pg-hint {
  padding: 8px 0;
  font-size: 13px;
  color: #6b7280;
}
.pg-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #eef2f7;
}
/* "Llenar proveedor": bien visible junto a "Continuar" */
.pg-btn-llenar {
  font-weight: 700 !important;
  color: #1f73e8 !important;
  background: #ffffff !important;
  border: 2px solid #1f73e8 !important;
}
.pg-btn-llenar:hover {
  background: #eaf2ff !important;
}
.pg-actions__right {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.pg-actions .v-btn {
  min-width: 120px;
}
.ins-pago-cliente {
  margin-left: 10px;
  font-size: 12px;
  color: #374151;
}
@media (max-width: 600px) {
  .pg-question,
  .pg-sub__head {
    flex-wrap: wrap;
  }
  .pg-transfer__row {
    grid-template-columns: 24px 1fr;
  }
  .pg-transfer__input {
    grid-column: 1 / -1;
  }
}

.custom-title-class {
  font-size: 2.5rem !important;
}

.custom-button-class {
  font-size: 1.5rem !important;
  padding: 15px 30px !important;
}
</style>
