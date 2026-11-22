<script setup lang="ts">
// Reporte de Cuentas por Cobrar / por Pagar > "Solicitar Cobro" / "Solicitar Pago" (modal de 2 pasos).
//  Paso 1: los mismos datos que Control de Gastos (pago: tipo de pago y cuenta o código del proveedor;
//          cobro: "Cargar Pago Cliente" con voucher, cuenta de la empresa, banco del cliente y N° de operación).
//  Paso 2: los expedientes del cliente / proveedor; se eligen uno o varios y se totaliza (hoy el monto es total).
// Al enviar se registra UNA solicitud con todos los expedientes amarrados (Bancos > Solicitudes / Ingresos
// pendientes por confirmar). Los expedientes ya amarrados se pintan con su solicitud y no se pueden elegir.
import { computed, ref, watch } from "vue";
import SolicitudOrigenNota from "@/components/comun/SolicitudOrigenNota.vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import axios from "@/api/http";
import FormatFecha from "../comun/FormatFecha.vue";
import { abrirArchivo } from "@/composables/useVisorArchivo";
import { useBancosStore } from "@/stores/bancos";
import { useFilesStore } from "@/stores/files";
import type { CuentaBancariaProveedor, TipoPagoSolicitud } from "@/types/billingEntries";
import type {
  EntidadSolicitudReporte,
  ExpedienteSolicitudReporte,
  SolicitudReporteVer,
  TipoSolicitudReporte,
} from "@/types/solicitudReporte";
import { sessionBranchId } from "@/utils/sesion";
import type { AdminCredentials } from "@/types/seguridad";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

const DATO_REQUERIDO = "Dato Requerido";
const props = defineProps<{
  modelValue: boolean;
  tipo: TipoSolicitudReporte;
  entidad: EntidadSolicitudReporte | null;
  /** solicitud ya registrada desde el reporte: se ve (o edita) en una sola vista, sin pasos */
  solicitud?: SolicitudReporteVer | null;
  /** con solicitud: "ver" (por defecto) o "editar" (datos del paso 1; los expedientes no cambian) */
  modo?: "ver" | "editar";
  /** editar: administrador que autorizó (se pide antes de abrir) */
  autorizacion?: AdminCredentials | null;
}>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; guardado: [] }>();

const { smAndDown } = useDisplay();
const bancosStore = useBancosStore();
const filesStore = useFilesStore();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const esPago = computed(() => props.tipo === "pago");
// con solicitud: una sola vista (datos + expedientes), sin pasos
const detalle = computed(() => !!props.solicitud);
const editando = computed(() => detalle.value && props.modo === "editar");
const soloLectura = computed(() => detalle.value && !editando.value);
const paso = ref<1 | 2>(1);
const enviando = ref(false);
const cargando = ref(false);

// ---------------- Paso 1 · Pago (mismo formulario que la solicitud de pago de Control de Gastos) ----------------
const tipos = ref<TipoPagoSolicitud[]>([]);
const cuentasProveedor = ref<CuentaBancariaProveedor[]>([]);
const formPago = ref({ id_tipopago: null as number | null, id_cuenta: null as number | null, codigopago: "", comentario: "" });
const esCodigo = computed(() => tipos.value.find((t) => t.id === formPago.value.id_tipopago)?.codigo === "02");
const itemsCuentasProveedor = computed(() =>
  cuentasProveedor.value.map((c) => ({
    title: `${c.namebanks ?? ""} · ${c.namecoins ?? ""} · ${c.accountnumber ?? ""}${c.beneficiario ? " · " + c.beneficiario : ""}`,
    value: c.id,
    buscar: [c.namebanks, c.namebanksfull, c.namecoins, c.accountnumber, c.beneficiario].filter(Boolean).join(" "),
  })),
);
const pagoCompleto = computed(
  () => !!formPago.value.id_tipopago && (esCodigo.value ? !!formPago.value.codigopago.trim() : !!formPago.value.id_cuenta),
);

// ---------------- Paso 1 · Cobro (mismo formulario que "Cargar Pago Cliente") ----------------
const idCuenta = ref<number | null>(null);
const idBancoOrigen = ref<number | null>(null);
const fechaDeposito = ref("");
const aplicaNroOperacion = ref(true);
const numeroOperacion = ref("");
const comentarioCobro = ref("");
const voucher = ref<{ id: number; nombre: string; ruta: string } | null>(null);
const subiendo = ref(false);
const arrastrando = ref(false);
const inputArchivo = ref<HTMLInputElement | null>(null);
const OPCIONES_NRO_OPERACION = [
  { titulo: "Aplica", valor: true },
  { titulo: "No aplica", valor: false },
];
watch(aplicaNroOperacion, (aplica) => {
  if (!aplica) numeroOperacion.value = "";
});
const cuentasSucursal = computed(() =>
  bancosStore.cuentasSucursal.map((c) => ({
    ...c,
    titulo: [[c.banco, c.banco_nombre].filter(Boolean).join(" - "), c.cuenta?.trim(), c.symbol].filter(Boolean).join(" · "),
  })),
);
// como en "Cargar Pago Cliente": solo las cuentas principales de la empresa (sin principal, todas)
const cuentasEmpresa = computed(() => {
  const principales = cuentasSucursal.value.filter((c) => c.esprincipalflag);
  return principales.length ? principales : cuentasSucursal.value;
});
const bancosCliente = computed(() =>
  bancosStore.bancosSucursal.map((b) => ({ ...b, titulo: [b.acronym, b.name].filter(Boolean).join(" - ") })),
);
const cobroCompleto = computed(
  () =>
    !!idCuenta.value
    && !!idBancoOrigen.value
    && !!voucher.value
    && !!fechaDeposito.value
    && (!aplicaNroOperacion.value || !!numeroOperacion.value.trim()),
);

// ---------------- Paso 2 · Expedientes ----------------
const expedientes = ref<ExpedienteSolicitudReporte[]>([]);
const seleccion = ref<string[]>([]);
const clave = (e: ExpedienteSolicitudReporte) =>
  `${esPago.value ? e.id_master : e.id_house}-${e.id_correlativo ?? 0}`;
// la moneda la fija la cuenta del paso 1 (cobro: cuenta de la empresa; pago: cuenta del proveedor)
const monedaCuenta = computed<string | null>(() => {
  if (esPago.value) {
    if (esCodigo.value) return null;
    return cuentasProveedor.value.find((c) => c.id === formPago.value.id_cuenta)?.symbol ?? null;
  }
  return cuentasSucursal.value.find((c) => c.id === idCuenta.value)?.symbol ?? null;
});
const seleccionados = computed(() => expedientes.value.filter((e) => seleccion.value.includes(clave(e))));
// una sola moneda por solicitud: la de la cuenta o la del primer expediente elegido
const monedaSolicitud = computed(() => monedaCuenta.value ?? seleccionados.value[0]?.moneda ?? null);
const redondear = (n: number) => Math.round(n * 100) / 100;
const total = computed(() => redondear(seleccionados.value.reduce((acc, e) => acc + Number(e.monto || 0), 0)));
const pendientes = computed(() => expedientes.value.filter((e) => !e.id_solicitud));
const amarrados = computed(() => expedientes.value.filter((e) => !!e.id_solicitud));

function motivoBloqueo(e: ExpedienteSolicitudReporte): string {
  if (e.id_solicitud) return `Ya está en la solicitud ${e.codigo_solicitud ?? ""}`.trim();
  if (monedaSolicitud.value && e.moneda !== monedaSolicitud.value) return `Otra moneda (${e.moneda ?? "-"})`;
  return "";
}
const seleccionables = computed(() => pendientes.value.filter((e) => !motivoBloqueo(e)));
const todos = computed({
  get: () => seleccionables.value.length > 0 && seleccionables.value.every((e) => seleccion.value.includes(clave(e))),
  set: (valor: boolean) => {
    if (soloLectura.value) return;
    seleccion.value = valor ? seleccionables.value.map(clave) : [];
  },
});
function alternar(e: ExpedienteSolicitudReporte) {
  if (soloLectura.value) return;
  if (motivoBloqueo(e) && !seleccion.value.includes(clave(e))) return;
  const k = clave(e);
  seleccion.value = seleccion.value.includes(k) ? seleccion.value.filter((x) => x !== k) : [...seleccion.value, k];
}
// si cambia la cuenta (moneda), se quitan los expedientes de otra moneda
watch(monedaCuenta, (moneda) => {
  if (moneda) seleccion.value = seleccion.value.filter((k) => expedientes.value.find((e) => clave(e) === k)?.moneda === moneda);
});

const paso1Completo = computed(() => (esPago.value ? pagoCompleto.value : cobroCompleto.value));
const titulo = computed(() => {
  if (detalle.value) {
    const codigo = props.solicitud?.codigo ?? (props.solicitud?.id ? `N° ${props.solicitud.id}` : "");
    return `${editando.value ? "EDITAR " : ""}SOLICITUD DE ${esPago.value ? "PAGO" : "COBRO"}${codigo ? " " + codigo : ""}`;
  }
  return esPago.value ? "SOLICITAR PAGO" : "SOLICITAR COBRO";
});
const etiquetaEntidad = computed(() => (esPago.value ? "PROVEEDOR" : "CLIENTE"));

function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function formatoMonto(valor: number | string) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function cargarExpedientes() {
  if (!props.entidad) return;
  const response = await request<ExpedienteSolicitudReporte>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + (esPago.value ? "solicitud_pago_reporte_expedientes" : "solicitud_cobro_reporte_expedientes"),
    params: esPago.value ? { id_proveedor: props.entidad.id } : { id_cliente: props.entidad.id },
  });
  expedientes.value = response.estadoflag ? response.data : [];
}
async function cargarPaso1() {
  if (!props.entidad) return;
  if (esPago.value) {
    const [respTipos, respCuentas] = await Promise.all([
      tipos.value.length
        ? null
        : request<TipoPagoSolicitud>({ method: "get", url: import.meta.env.VITE_URL_MAIN + "cargar_master_detalle_tipo_pago_solicitud" }),
      axios({
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "getAccountsNumber/" + props.entidad.id,
        data: { id_branch: sessionBranchId() },
      }).then((r) => (r.data?.data ?? []) as CuentaBancariaProveedor[]).catch(() => [] as CuentaBancariaProveedor[]),
    ]);
    if (respTipos) tipos.value = respTipos.estadoflag ? respTipos.data : [];
    cuentasProveedor.value = respCuentas;
    formPago.value.id_tipopago = tipos.value[0]?.id ?? null;
    if (cuentasProveedor.value.length === 1) formPago.value.id_cuenta = cuentasProveedor.value[0]!.id ?? null;
  } else {
    await bancosStore.loadCatalogosSucursal();
    if (cuentasEmpresa.value.length === 1) idCuenta.value = cuentasEmpresa.value[0]!.id;
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) return;
    paso.value = 1;
    seleccion.value = [];
    expedientes.value = [];
    formPago.value = { id_tipopago: null, id_cuenta: null, codigopago: "", comentario: "" };
    cuentasProveedor.value = [];
    idCuenta.value = null;
    idBancoOrigen.value = null;
    fechaDeposito.value = hoy();
    aplicaNroOperacion.value = true;
    numeroOperacion.value = "";
    comentarioCobro.value = "";
    voucher.value = null;
    cargando.value = true;
    await Promise.all([cargarPaso1(), cargarExpedientes()]);
    if (props.solicitud) aplicarSolicitud(await completarSolicitud(props.solicitud));
    cargando.value = false;
  },
  // también si se monta ya abierto
  { immediate: true },
);

// ---------------- Ver / editar una solicitud del reporte ----------------
// desde el reporte solo llega id / código: los datos del paso 1 se piden a la solicitud
async function completarSolicitud(s: SolicitudReporteVer): Promise<SolicitudReporteVer> {
  const faltan = esPago.value ? !s.id_tipopago && !s.codigo_tipopago : !s.id_cuentabancaria;
  if (!faltan) return s;
  const url = esPago.value
    ? (s.id ? "solicitud_pago_ver/" + s.id : "")
    : (s.codigo ? "solicitud_cobro_ver/" + s.codigo : "");
  if (!url) return s;
  const response = await request<SolicitudReporteVer>({ method: "get", url: import.meta.env.VITE_URL_MAIN + url });
  const datos = response.estadoflag ? response.data[0] : undefined;
  return datos ? { ...datos, id: s.id ?? datos.id, codigo: s.codigo ?? datos.codigo } : s;
}
// los datos del paso 1 de la solicitud y solo sus expedientes (todos marcados)
function aplicarSolicitud(s: SolicitudReporteVer) {
  if (esPago.value) {
    formPago.value = {
      id_tipopago: s.id_tipopago ?? tipos.value.find((t) => t.codigo === s.codigo_tipopago)?.id ?? null,
      id_cuenta: s.id_cuenta ?? cuentasProveedor.value.find((c) => !!s.nrocuenta && c.accountnumber === s.nrocuenta)?.id ?? null,
      codigopago: s.codigopago ?? "",
      comentario: s.comentario ?? "",
    };
  } else {
    idCuenta.value = s.id_cuentabancaria ?? null;
    idBancoOrigen.value = s.id_banco_origen ?? null;
    fechaDeposito.value = (s.fechadeposito ?? "").slice(0, 10);
    aplicaNroOperacion.value = !!s.numerooperacion;
    numeroOperacion.value = s.numerooperacion ?? "";
    comentarioCobro.value = s.comentario ?? "";
    // id 0 = el voucher actual (el ver del cobro no trae su id): al guardar se manda null y se mantiene
    voucher.value = s.id_path_voucher || s.voucher_path
      ? { id: Number(s.id_path_voucher ?? 0), nombre: s.voucher_nombre || "Voucher", ruta: s.voucher_path ?? "" }
      : null;
  }
  expedientes.value = expedientes.value.filter((e) =>
    (!!s.id && Number(e.id_solicitud) === Number(s.id)) || (!!s.codigo && e.codigo_solicitud === s.codigo));
  seleccion.value = expedientes.value.map(clave);
}

async function guardarEdicion() {
  const s = props.solicitud;
  if (!s || !paso1Completo.value || enviando.value) return;
  enviando.value = true;
  const autorizacion = props.autorizacion ?? undefined;
  const response = esPago.value
    ? await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_reporte_editar/" + s.id,
      data: {
        id_tipopago: formPago.value.id_tipopago,
        id_cuenta: esCodigo.value ? null : formPago.value.id_cuenta,
        codigopago: esCodigo.value ? formPago.value.codigopago : null,
        comentario: formPago.value.comentario,
        autorizacion,
      },
    })
    : await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_reporte_editar/" + s.codigo,
      data: {
        id_cuentabancaria: idCuenta.value,
        id_banco_origen: idBancoOrigen.value,
        id_path: voucher.value?.id || null,
        fechadeposito: fechaDeposito.value,
        numerooperacion: aplicaNroOperacion.value ? numeroOperacion.value.trim() : null,
        aplica_nrooperacion: aplicaNroOperacion.value,
        comentario: comentarioCobro.value,
        autorizacion,
      },
    });
  enviando.value = false;
  if (!response.estadoflag) {
    Swal.fire({ icon: response.tipomensaje === "TMSGERR" ? "error" : "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
    return;
  }
  notifySuccess(response.mensaje);
  abierto.value = false;
  emit("guardado");
}

// ---------------- Voucher (cobro) ----------------
function seleccionarArchivo() {
  if (!subiendo.value) inputArchivo.value?.click();
}
async function alSoltar(event: DragEvent) {
  arrastrando.value = false;
  const archivo = event.dataTransfer?.files?.[0];
  if (archivo) await subirArchivo(archivo);
}
async function alElegir(event: Event) {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = "";
  if (archivo) await subirArchivo(archivo);
}
async function subirArchivo(archivo: File) {
  if (!(archivo.type === "application/pdf" || archivo.type.startsWith("image/"))) {
    Swal.fire({ icon: "error", title: "Formato no válido", text: "Sube una imagen o un archivo PDF." });
    return;
  }
  subiendo.value = true;
  try {
    const error = await filesStore._uploadFile(archivo);
    if (error || !filesStore.payPath) {
      Swal.fire({ icon: "error", text: error || "No pudimos subir el archivo. Intenta de nuevo." });
      return;
    }
    voucher.value = { id: Number(filesStore.payPath), nombre: archivo.name, ruta: filesStore.datosPath?.ruta || "" };
  } finally {
    subiendo.value = false;
  }
}

// ---------------- Envío ----------------
async function enviar() {
  const entidad = props.entidad;
  if (!entidad || !paso1Completo.value || !seleccionados.value.length || enviando.value) return;
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    html:
      `¿Enviar la solicitud de ${esPago.value ? "pago" : "cobro"} de <b>${entidad.nombre}</b> con `
      + `<b>${seleccionados.value.length}</b> expediente(s) por <b>${monedaSolicitud.value ?? ""} ${formatoMonto(total.value)}</b>?`
      + "<br><br>Una vez enviada, sus datos ya no se pueden editar.",
    showCancelButton: true,
    confirmButtonText: "Sí, enviar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#0b5fd6",
  });
  if (!isConfirmed) return;
  enviando.value = true;
  const response = esPago.value
    ? await request({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_reporte_insertar",
      data: {
        id_proveedor: entidad.id,
        id_tipopago: formPago.value.id_tipopago,
        id_cuenta: esCodigo.value ? null : formPago.value.id_cuenta,
        codigopago: esCodigo.value ? formPago.value.codigopago : null,
        comentario: formPago.value.comentario,
        expedientes: seleccionados.value.map((e) => ({ id_master: e.id_master, id_correlativo: e.id_correlativo })),
      },
    })
    : await request({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_reporte_insertar",
      data: {
        id_cliente: entidad.id,
        id_cuentabancaria: idCuenta.value,
        id_banco_origen: idBancoOrigen.value,
        id_path: voucher.value!.id,
        fechadeposito: fechaDeposito.value,
        numerooperacion: aplicaNroOperacion.value ? numeroOperacion.value.trim() : null,
        aplica_nrooperacion: aplicaNroOperacion.value,
        comentario: comentarioCobro.value,
        expedientes: seleccionados.value.map((e) => ({ id_house: e.id_house, id_correlativo: e.id_correlativo })),
      },
    });
  enviando.value = false;
  if (!response.estadoflag) {
    Swal.fire({ icon: response.tipomensaje === "TMSGERR" ? "error" : "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
    // otro usuario pudo amarrar un expediente: se vuelve a cargar la lista
    await cargarExpedientes();
    seleccion.value = seleccion.value.filter((k) => pendientes.value.some((e) => clave(e) === k));
    return;
  }
  notifySuccess(response.mensaje);
  abierto.value = false;
  emit("guardado");
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="820"
    :fullscreen="smAndDown"
    persistent
    scrollable
  >
    <v-card
      v-if="entidad"
      class="solrep"
      :class="{ 'solrep--full': smAndDown }"
    >
      <div class="solrep__head">
        <div class="solrep__icon">
          <v-icon size="30">
            mdi-send-outline
          </v-icon>
        </div>
        <div class="solrep__titles">
          <h3>{{ titulo }}</h3>
          <span v-if="detalle">{{ editando ? "Datos de la solicitud · los expedientes no cambian" : "Solo lectura" }}</span>
          <span v-else>{{ paso === 1 ? "Paso 1 de 2 · Datos de la solicitud" : "Paso 2 de 2 · Expedientes a " + (esPago ? "pagar" : "cobrar") }}</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          class="solrep__close"
          aria-label="Cerrar"
          :disabled="enviando"
          @click="abierto = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- pasos -->
      <div
        v-if="!detalle"
        class="solrep__steps"
        role="list"
      >
        <div
          role="listitem"
          class="solrep__step"
          :class="{ 'solrep__step--activo': paso === 1, 'solrep__step--hecho': paso === 2 }"
        >
          <span class="solrep__step-num">
            <v-icon
              v-if="paso === 2"
              size="16"
            >mdi-check</v-icon>
            <template v-else>1</template>
          </span>
          Datos de la solicitud
        </div>
        <div class="solrep__step-linea" />
        <div
          role="listitem"
          class="solrep__step"
          :class="{ 'solrep__step--activo': paso === 2 }"
        >
          <span class="solrep__step-num">2</span>
          Expedientes
        </div>
      </div>

      <div class="solrep__body">
        <v-progress-linear
          v-if="cargando"
          indeterminate
          color="primary"
          class="mb-2"
        />
        <div class="solrep__ent">
          <div class="solrep__ent-row">
            <v-icon class="solrep__ent-icon">
              {{ esPago ? "mdi-truck-outline" : "mdi-account-outline" }}
            </v-icon>
            <span class="solrep__ent-label">{{ etiquetaEntidad }}:</span>
            <span class="solrep__ent-value">{{ entidad.nombre }}</span>
          </div>
          <div
            v-if="paso === 2 || detalle"
            class="solrep__ent-row"
          >
            <v-icon class="solrep__ent-icon">
              mdi-database-outline
            </v-icon>
            <span class="solrep__ent-label">{{ detalle ? "TOTAL:" : "TOTAL SELECCIONADO:" }}</span>
            <span class="solrep__ent-value">{{ monedaSolicitud ?? "" }} {{ formatoMonto(total) }}</span>
          </div>
        </div>

        <!-- ============ PASO 1 ============ -->
        <template v-if="paso === 1 || detalle">
          <!-- Pago: igual que "Solicitar a Administración" de Control de Gastos -->
          <template v-if="esPago">
            <span class="solrep__label">TIPO DE PAGO <span class="solrep__req">*</span></span>
            <div class="solrep__tipos">
              <button
                v-for="t in tipos"
                :key="t.id"
                type="button"
                class="solrep__tipo"
                :class="{ 'solrep__tipo--active': formPago.id_tipopago === t.id }"
                :disabled="soloLectura && formPago.id_tipopago !== t.id"
                @click="!soloLectura && (formPago.id_tipopago = t.id)"
              >
                <v-icon :color="formPago.id_tipopago === t.id ? 'primary' : 'grey'">
                  {{ formPago.id_tipopago === t.id ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
                </v-icon>
                <v-icon color="primary">
                  {{ t.codigo === "01" ? "mdi-bank-transfer" : "mdi-barcode" }}
                </v-icon>
                {{ t.descripcion }}
              </button>
            </div>
            <template v-if="!esCodigo">
              <label
                class="solrep__label"
                for="solrep-cuenta-prov"
              >CUENTA BANCARIA DEL PROVEEDOR <span class="solrep__req">*</span></label>
              <v-autocomplete
                :readonly="soloLectura"
                id="solrep-cuenta-prov"
                v-model="formPago.id_cuenta"
                :items="itemsCuentasProveedor"
                :filter-keys="['title', 'raw.buscar']"
                placeholder="Selecciona o busca la cuenta (sigla o nombre del banco)"
                prepend-inner-icon="mdi-bank-outline"
                variant="outlined"
                density="compact"
                class="solrep__input"
                no-data-text="El proveedor no tiene cuentas registradas"
                hide-details="auto"
                :error-messages="formPago.id_cuenta ? '' : DATO_REQUERIDO"
              />
            </template>
            <template v-else>
              <label
                class="solrep__label"
                for="solrep-codigo"
              >CÓDIGO DE PAGO <span class="solrep__req">*</span></label>
              <v-text-field
                :readonly="soloLectura"
                id="solrep-codigo"
                v-model="formPago.codigopago"
                prepend-inner-icon="mdi-barcode"
                variant="outlined"
                density="compact"
                class="solrep__input"
                hide-details="auto"
                :error-messages="formPago.codigopago.trim() ? '' : DATO_REQUERIDO"
              />
            </template>
            <label
              class="solrep__label"
              for="solrep-obs"
            >OBSERVACIONES (OPCIONAL)</label>
            <v-textarea
              :readonly="soloLectura"
              id="solrep-obs"
              v-model="formPago.comentario"
              rows="2"
              auto-grow
              variant="outlined"
              density="compact"
              class="solrep__input"
              hide-details
            />
          </template>

          <!-- Cobro: igual que "Cargar Pago Cliente" de Control de Gastos (el monto es el total del paso 2) -->
          <template v-else>
            <label
              class="solrep__label"
              for="solrep-cuenta"
            >BANCO Y CUENTA DONDE DEPOSITÓ EL CLIENTE <span class="solrep__req">*</span></label>
            <v-autocomplete
              :readonly="soloLectura"
              id="solrep-cuenta"
              v-model="idCuenta"
              :items="soloLectura ? cuentasSucursal : cuentasEmpresa"
              item-title="titulo"
              item-value="id"
              placeholder="SELECCIONAR BANCO Y CUENTA"
              prepend-inner-icon="mdi-bank-outline"
              variant="outlined"
              density="compact"
              class="solrep__input"
              no-data-text="No hay cuentas bancarias de la empresa"
              hide-details="auto"
              :error-messages="idCuenta ? '' : DATO_REQUERIDO"
            />
            <label
              class="solrep__label"
              for="solrep-banco-origen"
            >BANCO DEL CLIENTE (DESDE DONDE ENVIÓ EL PAGO) <span class="solrep__req">*</span></label>
            <v-autocomplete
              :readonly="soloLectura"
              id="solrep-banco-origen"
              v-model="idBancoOrigen"
              :items="bancosCliente"
              item-title="titulo"
              item-value="id"
              placeholder="SELECCIONAR BANCO DEL CLIENTE"
              prepend-inner-icon="mdi-bank-transfer-out"
              variant="outlined"
              density="compact"
              class="solrep__input"
              no-data-text="No hay bancos registrados"
              hide-details="auto"
              :error-messages="idBancoOrigen ? '' : DATO_REQUERIDO"
            />
            <div class="solrep__grid">
              <div>
                <label
                  class="solrep__label"
                  for="solrep-fecha"
                >FECHA DE TRANSFERENCIA <span class="solrep__req">*</span></label>
                <FormatFecha
                  id="solrep-fecha"
                  v-model="fechaDeposito"
                  :verflag="soloLectura"
                  label=""
                  placeholder="SELECCIONAR FECHA"
                  prepend-inner-icon="mdi-calendar-blank-outline"
                  outlined
                  density="compact"
                  field-class="solrep__input"
                  :max="hoy()"
                  hide-details="auto"
                  :error-messages="fechaDeposito ? '' : DATO_REQUERIDO"
                />
              </div>
              <div>
                <label
                  class="solrep__label"
                  for="solrep-nroop"
                >N° DE OPERACIÓN <span
                  v-if="aplicaNroOperacion"
                  class="solrep__req"
                >*</span></label>
                <div class="solrep__nroop">
                  <v-select
                    :readonly="soloLectura"
                    v-model="aplicaNroOperacion"
                    :items="OPCIONES_NRO_OPERACION"
                    item-title="titulo"
                    item-value="valor"
                    variant="outlined"
                    density="compact"
                    class="solrep__input"
                    aria-label="¿Aplica N° de operación?"
                    hide-details
                  />
                  <v-text-field
                    :readonly="soloLectura"
                    id="solrep-nroop"
                    v-model="numeroOperacion"
                    :placeholder="aplicaNroOperacion ? 'N° DEL VOUCHER' : 'SE LLENA EN BANCOS'"
                    prepend-inner-icon="mdi-pound"
                    variant="outlined"
                    density="compact"
                    class="solrep__input"
                    maxlength="100"
                    :disabled="!aplicaNroOperacion"
                    hide-details="auto"
                    :error-messages="!aplicaNroOperacion || numeroOperacion.trim() ? '' : DATO_REQUERIDO"
                  />
                </div>
              </div>
            </div>
            <label
              class="solrep__label"
              for="solrep-comentario"
            >COMENTARIO</label>
            <v-textarea
              :readonly="soloLectura"
              id="solrep-comentario"
              v-model="comentarioCobro"
              rows="1"
              auto-grow
              variant="outlined"
              density="compact"
              class="solrep__input"
              hide-details
            />
            <div
              v-if="!voucher && !soloLectura"
              class="solrep__drop"
              :class="{ 'solrep__drop--over': arrastrando, 'solrep__drop--error': !subiendo }"
              role="button"
              tabindex="0"
              aria-label="Cargar el voucher del cliente"
              @click="seleccionarArchivo"
              @keydown.enter.prevent="seleccionarArchivo"
              @keydown.space.prevent="seleccionarArchivo"
              @dragover.prevent="arrastrando = true"
              @dragleave.prevent="arrastrando = false"
              @drop.prevent="alSoltar"
            >
              <template v-if="!subiendo">
                <v-icon
                  size="40"
                  color="#0b5fd6"
                >
                  mdi-cloud-upload
                </v-icon>
                <strong>CARGAR EL VOUCHER AQUÍ</strong>
                <span>Arrastra y suelta el archivo o haz clic para seleccionar (PDF, JPG o PNG)</span>
              </template>
              <template v-else>
                <v-progress-circular
                  indeterminate
                  color="primary"
                />
                <span>Subiendo archivo...</span>
              </template>
              <input
                ref="inputArchivo"
                type="file"
                accept="image/*,application/pdf"
                hidden
                @change="alElegir"
              >
            </div>
            <div
              v-if="!voucher && !subiendo && !soloLectura"
              class="solrep__error"
            >
              {{ DATO_REQUERIDO }}
            </div>
            <div
              v-if="voucher"
              class="solrep__file"
            >
              <v-icon color="success">
                mdi-check-circle-outline
              </v-icon>
              <span class="text-truncate"><b>Voucher cargado:</b> {{ voucher.nombre }}</span>
              <v-btn
                v-if="voucher.ruta"
                icon="mdi-eye"
                variant="text"
                size="small"
                color="primary"
                title="Ver"
                aria-label="Ver voucher"
                @click="abrirArchivo(voucher.ruta)"
              />
              <v-btn
                v-if="!soloLectura"
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                color="red"
                title="Quitar"
                aria-label="Quitar voucher"
                @click="voucher = null"
              />
            </div>
          </template>
        </template>

        <!-- ============ PASO 2 ============ -->
        <template v-if="paso === 2 || detalle">
          <p class="solrep__nota">
            <v-icon size="16">
              mdi-information-outline
            </v-icon>
            <template v-if="detalle">
              Expedientes de esta solicitud, registrada por Administración desde el Reporte de Cuentas por {{ esPago ? "Pagar" : "Cobrar" }}.
            </template>
            <template v-else>
              Selecciona uno o varios expedientes. Por ahora se {{ esPago ? "paga" : "cobra" }} el monto total de cada expediente.
            </template>
            <template v-if="monedaCuenta && !detalle">
              Solo expedientes en {{ monedaCuenta }} (moneda de la cuenta).
            </template>
          </p>

          <div
            v-if="!expedientes.length && !cargando"
            class="solrep__vacio"
          >
            No hay expedientes pendientes de {{ esPago ? "pago" : "cobro" }} para este {{ esPago ? "proveedor" : "cliente" }}.
          </div>

          <div
            v-else
            class="solrep__lista"
            role="table"
            :aria-label="'Expedientes a ' + (esPago ? 'pagar' : 'cobrar')"
          >
            <div
              class="solrep__fila solrep__fila--head"
              role="row"
            >
              <span role="columnheader">
                <v-checkbox-btn
                  v-model="todos"
                  density="compact"
                  :disabled="!seleccionables.length || detalle"
                  aria-label="Seleccionar todos"
                />
              </span>
              <span role="columnheader">Expediente</span>
              <span role="columnheader">Correlativo</span>
              <span role="columnheader">F. Disponibilidad</span>
              <span
                role="columnheader"
                class="text-right"
              >Monto</span>
              <span role="columnheader">Estado</span>
            </div>
            <div
              v-for="e in [...pendientes, ...amarrados]"
              :key="(e.id_solicitud ?? 0) + '-' + clave(e)"
              class="solrep__fila"
              :class="{
                'solrep__fila--sel': seleccion.includes(clave(e)),
                'solrep__fila--bloq': !!motivoBloqueo(e) && !seleccion.includes(clave(e)),
                'solrep__fila--amarrado': !!e.id_solicitud,
              }"
              role="row"
              @click="alternar(e)"
            >
              <span
                role="cell"
                class="solrep__check"
              >
                <v-checkbox-btn
                  :model-value="seleccion.includes(clave(e))"
                  density="compact"
                  :disabled="detalle || (!!motivoBloqueo(e) && !seleccion.includes(clave(e)))"
                  :aria-label="'Seleccionar ' + e.expediente"
                  @click.stop="alternar(e)"
                />
              </span>
              <span
                role="cell"
                data-label="Expediente"
                class="solrep__exp"
              >
                <b>{{ e.expediente }}</b>
                <small v-if="e.nro_master">N° {{ e.nro_master }}</small>
              </span>
              <span
                role="cell"
                data-label="Correlativo"
              >{{ e.correlativo ?? "-" }}</span>
              <span
                role="cell"
                data-label="F. Disponibilidad"
              >{{ e.fecha_disponibilidad ?? "-" }}</span>
              <span
                role="cell"
                data-label="Monto"
                class="solrep__monto"
              >{{ e.moneda }} {{ formatoMonto(e.monto) }}</span>
              <span
                role="cell"
                data-label="Estado"
              >
                <!-- amarrado: misma tarjeta que "Solicitado a Administración" -->
                <span
                  v-if="e.id_solicitud"
                  class="solreq solreq--mini"
                  :class="e.codigo_estado === 'RECHAZADA' ? 'solreq--rechazada' : 'solreq--enviada'"
                >
                  <span class="solreq__badge">
                    <v-icon size="16">{{ e.codigo_estado === "RECHAZADA" ? "mdi-email-remove-outline" : "mdi-email-check-outline" }}</v-icon>
                  </span>
                  <span class="solreq__text">
                    <span class="solreq__title">{{ e.codigo_solicitud }}</span>
                    <span class="solreq__date">{{ e.estado }}</span>
                  </span>
                </span>
                <!-- pedida desde Control de Gastos: avisar dónde revisarla -->
                <SolicitudOrigenNota
                  v-if="e.id_solicitud && !e.multiexpedienteflag"
                  origen="cg"
                  :tipo="tipo"
                />
                <span
                  v-else-if="motivoBloqueo(e)"
                  class="text-medium-emphasis text-body-small"
                >{{ motivoBloqueo(e) }}</span>
                <span
                  v-else
                  class="text-body-small solrep__pend"
                >Pendiente</span>
              </span>
            </div>
          </div>

          <!-- totalizador -->
          <div class="solrep__total">
            <span>{{ seleccionados.length }} expediente(s) seleccionado(s)</span>
            <b>
              <v-icon size="22">{{ seleccionados.length ? "mdi-check-circle" : "mdi-database-outline" }}</v-icon>
              TOTAL {{ monedaSolicitud ?? "" }} {{ formatoMonto(total) }}
            </b>
          </div>
        </template>
      </div>

      <div class="solrep__actions">
        <!-- ver / editar una solicitud del reporte -->
        <template v-if="detalle">
          <v-btn
            class="solrep__btn"
            :class="{ 'solrep__btn--cancel': editando }"
            :variant="editando ? 'outlined' : 'flat'"
            :color="editando ? undefined : '#0b5fd6'"
            :disabled="enviando"
            @click="abierto = false"
          >
            {{ editando ? "CANCELAR" : "CERRAR" }}
          </v-btn>
          <v-btn
            v-if="editando"
            class="solrep__btn"
            color="#0b5fd6"
            variant="flat"
            prepend-icon="mdi-content-save-outline"
            :loading="enviando"
            :disabled="!paso1Completo || subiendo || cargando"
            @click="guardarEdicion"
          >
            GUARDAR CAMBIOS
          </v-btn>
        </template>
        <template v-else-if="paso === 1">
          <v-btn
            class="solrep__btn solrep__btn--cancel"
            variant="outlined"
            @click="abierto = false"
          >
            CANCELAR
          </v-btn>
          <v-btn
            class="solrep__btn"
            color="#0b5fd6"
            variant="flat"
            append-icon="mdi-arrow-right"
            :disabled="!paso1Completo || subiendo || cargando"
            @click="paso = 2"
          >
            SIGUIENTE
          </v-btn>
        </template>
        <template v-else>
          <v-btn
            class="solrep__btn solrep__btn--cancel"
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            :disabled="enviando"
            @click="paso = 1"
          >
            ATRÁS
          </v-btn>
          <v-btn
            class="solrep__btn"
            color="#0b5fd6"
            variant="flat"
            prepend-icon="mdi-send-outline"
            :loading="enviando"
            :disabled="!seleccionados.length"
            @click="enviar"
          >
            ENVIAR SOLICITUD
          </v-btn>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* mismo diseño que "Cargar Pago Cliente" / "Editar solicitud de pago" */
.solrep {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  border-radius: 22px !important;
  overflow: hidden;
  color: #0a1f44;
}
.solrep--full {
  max-height: none;
  border-radius: 0 !important;
}
.solrep__head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px 8px;
}
.solrep__icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: #dcebfd;
  color: #0b5fd6;
}
.solrep__titles {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 14px;
  border-left: 2px solid #0b5fd6;
}
.solrep__titles h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.15;
}
.solrep__titles span {
  font-size: 12px;
  font-weight: 600;
  color: #3b4a63;
}
.solrep__close {
  align-self: flex-start;
  color: #0a1f44 !important;
}
.solrep__steps {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 22px 8px;
}
.solrep__step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #8a97ab;
  white-space: nowrap;
}
.solrep__step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid currentColor;
  font-size: 13px;
  font-weight: 900;
}
.solrep__step--activo {
  color: #0b5fd6;
}
.solrep__step--activo .solrep__step-num {
  background: #0b5fd6;
  border-color: #0b5fd6;
  color: #fff;
}
.solrep__step--hecho {
  color: #15803d;
}
.solrep__step-linea {
  flex: 1 1 auto;
  min-width: 16px;
  height: 2px;
  background: #d1defc;
}
.solrep__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 22px 4px;
}
.solrep__ent {
  padding: 6px 14px;
  margin-bottom: 4px;
  border-radius: 12px;
  background: #dcebfd;
}
.solrep__ent-row {
  display: grid;
  grid-template-columns: 26px 190px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}
.solrep__ent-row + .solrep__ent-row {
  border-top: 1px solid #a9c6ee;
}
.solrep__ent-icon {
  color: #0b5fd6 !important;
}
.solrep__ent-label {
  font-size: 13px;
  font-weight: 700;
  color: #1e2c44;
}
.solrep__ent-value {
  font-size: 16px;
  font-weight: 900;
  overflow-wrap: anywhere;
}
.solrep__label {
  display: block;
  margin: 10px 0 4px;
  font-size: 13px;
  font-weight: 800;
}
.solrep__req {
  color: #e53935;
}
.solrep__input :deep(.v-field),
:deep(.solrep__input .v-field) {
  border-radius: 10px;
}
.solrep__tipos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.solrep__tipo {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid #c9d3e1;
  border-radius: 10px;
  background: #fff;
  font-weight: 600;
  text-align: left;
}
.solrep__tipo--active {
  border-color: #0b5fd6;
  background: #f1f7ff;
}
.solrep__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.solrep__nroop {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
}
.solrep__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 104px;
  margin-top: 12px;
  padding: 12px;
  border: 2px dashed #0b5fd6;
  border-radius: 14px;
  background: #f1f7ff;
  color: #3b4a63;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
}
.solrep__drop strong {
  font-size: 15px;
  font-weight: 900;
  color: #0a2a6b;
}
.solrep__drop:hover,
.solrep__drop:focus-visible,
.solrep__drop--over {
  outline: none;
  background: #e2eefd;
}
.solrep__drop--error {
  border-color: #e53935;
}
.solrep__error {
  margin: 4px 0 0 16px;
  color: #e53935;
  font-size: 12px;
}
.solrep__file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #a5d6a7;
  border-radius: 12px;
  background: #e8f5e9;
}
.solrep__nota {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 6px 0 8px;
  font-size: 12px;
  color: #3b4a63;
}
.solrep__vacio {
  padding: 18px;
  border: 1px dashed #c9d3e1;
  border-radius: 12px;
  text-align: center;
  color: #3b4a63;
}
/* lista de expedientes: tabla en escritorio, tarjetas en celular */
.solrep__lista {
  border: 1px solid #d1defc;
  border-radius: 12px;
  overflow: hidden;
}
.solrep__fila {
  display: grid;
  grid-template-columns: 44px minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr);
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-top: 1px solid #e6edf8;
  font-size: 13px;
  cursor: pointer;
}
.solrep__fila--head {
  border-top: 0;
  background: #f1f7ff;
  font-size: 12px;
  font-weight: 800;
  color: #1e2c44;
  cursor: default;
}
.solrep__fila--sel {
  background: #eff4ff;
}
.solrep__fila--bloq {
  cursor: not-allowed;
  color: #8a97ab;
}
.solrep__fila--amarrado {
  background: #fafbfd;
}
.solrep__exp {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
.solrep__exp small {
  color: #667085;
}
.solrep__monto {
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}
.solrep__pend {
  color: #b45309;
  font-weight: 700;
}
.solrep__total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 14px;
  border: 1px solid #b7ebc9;
  border-radius: 12px;
  background: #ecfdf3;
  color: #15803d;
  font-size: 13px;
  font-weight: 700;
}
.solrep__total b {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  font-weight: 900;
}
.solrep__actions {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
  padding: 14px 22px 18px;
}
.solrep__btn {
  min-height: 46px;
  border-radius: 10px !important;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0;
}
.solrep__btn--cancel {
  border-color: #c9d3e1 !important;
  color: #0a1f44 !important;
}
/* tarjeta "Solicitado a Administración" (misma que Control de Gastos > Costos) */
.solreq {
  --solreq-fg: #1d4ed8;
  --solreq-bg: #eff4ff;
  --solreq-border: #d1defc;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 4px 8px 4px 4px;
  border: 1px solid var(--solreq-border);
  border-radius: 10px;
  background: var(--solreq-bg);
}
.solreq--rechazada {
  --solreq-fg: #c0261b;
  --solreq-bg: #fef3f2;
  --solreq-border: #fbd3cf;
}
.solreq__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #fff;
  color: var(--solreq-fg);
  box-shadow: 0 0 0 1px var(--solreq-border);
}
.solreq__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.2;
}
.solreq__title {
  overflow: hidden;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--solreq-fg);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.solreq__date {
  overflow: hidden;
  font-size: 0.72rem;
  color: #667085;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* tablet */
@media (max-width: 960px) {
  .solrep__fila {
    grid-template-columns: 40px minmax(0, 1.3fr) minmax(0, 0.7fr) minmax(0, 1fr) minmax(0, 1.4fr);
  }
  .solrep__fila > :nth-child(4) {
    display: none;
  }
}
/* celular: una columna, botones a lo ancho y cada expediente como tarjeta */
@media (max-width: 600px) {
  .solrep__head,
  .solrep__steps,
  .solrep__body {
    padding-left: 16px;
    padding-right: 16px;
  }
  .solrep__actions {
    padding: 12px 16px 16px;
  }
  .solrep__tipos,
  .solrep__grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .solrep__ent-row {
    grid-template-columns: 26px minmax(0, 1fr);
  }
  .solrep__ent-value {
    grid-column: 2;
  }
  .solrep__fila--head {
    grid-template-columns: 40px minmax(0, 1fr);
  }
  .solrep__fila--head > :nth-child(n + 3) {
    display: none;
  }
  .solrep__fila:not(.solrep__fila--head) {
    grid-template-columns: 40px minmax(0, 1fr) auto;
    grid-template-areas:
      "check exp monto"
      "check corr corr"
      "check estado estado";
    row-gap: 2px;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(1) {
    grid-area: check;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(2) {
    grid-area: exp;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(3) {
    grid-area: corr;
    font-size: 12px;
    color: #667085;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(3)::before {
    content: "Correlativo ";
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(4) {
    display: none;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(5) {
    grid-area: monto;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(6) {
    grid-area: estado;
    justify-self: start;
    max-width: 100%;
    min-width: 0;
  }
  .solrep__fila:not(.solrep__fila--head) > :nth-child(6):empty {
    display: none;
  }
}
</style>
