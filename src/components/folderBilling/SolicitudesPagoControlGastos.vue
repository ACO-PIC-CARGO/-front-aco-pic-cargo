<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import { useFilesStore } from "@/stores/files";
import { usePermissions } from "@/composables/usePermissions";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type {
  EstadoSolicitudPago,
  FacturaProveedorCargada,
  SolicitudPagoControl,
} from "@/types/billingEntries";

const props = defineProps<{ idMaster?: number | null }>();

const { can } = usePermissions();
const { smAndDown } = useDisplay();
const filesStore = useFilesStore();

const URL_MAIN = import.meta.env.VITE_URL_MAIN;

const ESTADOS: { codigo: EstadoSolicitudPago; titulo: string; icono: string }[] = [
  { codigo: "LISTO", titulo: "Listo para transferir", icono: "mdi-check-circle" },
  { codigo: "PENGER", titulo: "Pendiente por Gerencia", icono: "mdi-clock-outline" },
  { codigo: "PENADM", titulo: "Pendiente por Administración", icono: "mdi-account-outline" },
  { codigo: "PAGADO", titulo: "Pagado", icono: "mdi-cash-check" },
];
const TIPOS_SOPORTE = [
  { valor: 1, titulo: "Factura Fiscal", icono: "mdi-file-certificate-outline" },
  { valor: 2, titulo: "Proforma", icono: "mdi-file-document-outline" },
  { valor: 3, titulo: "Otros (ej. email)", icono: "mdi-email-outline" },
];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const solicitudes = ref<SolicitudPagoControl[]>([]);
const cargando = ref(false);
const procesando = ref<number | null>(null);

// filtros
const filtroTexto = ref("");
const filtroEstado = ref<EstadoSolicitudPago | null>(null);
const filtroProveedor = ref<number | null>(null);
const filtroBanco = ref<string | null>(null);
const filtroMetodo = ref<string | null>(null);
const filtroDesde = ref("");
const filtroHasta = ref("");
const mostrarFiltrosMovil = ref(false);

// móvil
const gruposCerrados = ref<Record<string, boolean>>({});
const tarjetasAbiertas = ref<Record<number, boolean>>({});
const fechaPagoMovil = ref<Record<number, string>>({});

// modal soporte
const dialogSoporte = ref(false);
const solicitudSoporte = ref<SolicitudPagoControl | null>(null);
const tipoSoporte = ref(1);
const fechaPago = ref("");
const subiendo = ref(false);
const arrastrando = ref(false);
const archivoSoporte = ref<{ id: number; nombre: string; ruta: string } | null>(null);
const inputArchivo = ref<HTMLInputElement | null>(null);
const inputFecha = ref<{ focus: () => void } | null>(null);
const guardandoSoporte = ref(false);

// modal anexos
const dialogAnexos = ref(false);
const anexos = ref<FacturaProveedorCargada[]>([]);
const anexoProveedor = ref("");
const cargandoAnexos = ref(false);

const logo = computed(() => {
  try {
    return sessionUser().path || "";
  } catch {
    return "";
  }
});
const puedeAprobar = computed(() => can("listControlGastos", "MODIFICAR"));

const opcionesProveedor = computed(() =>
  unicos(solicitudes.value.map((s) => ({ title: etiquetaProveedor(s), value: s.id_proveedor })), "value"),
);
const opcionesBanco = computed(() =>
  [...new Set(solicitudes.value.map((s) => s.banco).filter((b): b is string => !!b))].map((b) => ({ title: b, value: b })),
);
const opcionesMetodo = computed(() =>
  [...new Set(solicitudes.value.map((s) => s.tipopago).filter(Boolean))].map((m) => ({ title: m, value: m })),
);
const opcionesEstado = ESTADOS.map((e) => ({ title: e.titulo, value: e.codigo }));

const hayFiltros = computed(
  () =>
    !!filtroTexto.value ||
    !!filtroEstado.value ||
    !!filtroProveedor.value ||
    !!filtroBanco.value ||
    !!filtroMetodo.value ||
    !!filtroDesde.value ||
    !!filtroHasta.value,
);

const filtradas = computed(() => {
  const texto = filtroTexto.value.trim().toLowerCase();
  return solicitudes.value.filter((s) => {
    const fecha = s.fechasolicitud.slice(0, 10);
    if (filtroEstado.value && s.codigo_estado !== filtroEstado.value) return false;
    if (filtroProveedor.value && s.id_proveedor !== filtroProveedor.value) return false;
    if (filtroBanco.value && s.banco !== filtroBanco.value) return false;
    if (filtroMetodo.value && s.tipopago !== filtroMetodo.value) return false;
    if (filtroDesde.value && fecha < filtroDesde.value) return false;
    if (filtroHasta.value && fecha > filtroHasta.value) return false;
    if (!texto) return true;
    return [etiquetaProveedor(s), s.expediente, s.nrocuenta, s.codigopago, s.banco]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(texto));
  });
});

const grupos = computed(() =>
  ESTADOS.map((e) => ({ ...e, items: filtradas.value.filter((s) => s.codigo_estado === e.codigo) })).filter(
    (g) => g.items.length > 0,
  ),
);

function unicos<T extends Record<string, unknown>>(items: T[], clave: keyof T) {
  const vistos = new Set<unknown>();
  return items.filter((i) => (vistos.has(i[clave]) ? false : (vistos.add(i[clave]), true)));
}

function etiquetaProveedor(s: SolicitudPagoControl) {
  return `${s.proveedor} (${s.id_proveedor})`;
}

function cuentaOCodigo(s: SolicitudPagoControl) {
  return s.codigo_tipopago === "02" ? s.codigopago || "" : s.nrocuenta || "";
}

function formatoMonto(valor: number | string) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatoFecha(valor: string | null) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}-${MESES[Number(mes) - 1]}-${anio}`;
}

function formatoFechaHora(valor: string | null) {
  if (!valor) return "—";
  return `${formatoFecha(valor)} ${valor.slice(11, 16)}`.trim();
}

function aprobaciones(s: SolicitudPagoControl) {
  const lista: { area: string; usuario: string | null; fecha: string | null }[] = [];
  if (s.aprobadoadministracionflag) {
    lista.push({ area: "Adm.", usuario: s.usuario_aprobadoadministracion, fecha: s.fecha_aprobadoadministracion });
  }
  if (s.aprobadogerenciaflag) {
    lista.push({ area: "Ger.", usuario: s.usuario_aprobadogerencia, fecha: s.fecha_aprobadogerencia });
  }
  return lista;
}

function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function limpiarFiltros() {
  filtroTexto.value = "";
  filtroEstado.value = null;
  filtroProveedor.value = null;
  filtroBanco.value = null;
  filtroMetodo.value = null;
  filtroDesde.value = "";
  filtroHasta.value = "";
}

function avisar(response: ApiResponse) {
  Swal.fire({
    icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
    text: response.mensaje || CONNECTION_ERROR_MESSAGE,
  });
}

async function cargar() {
  if (!props.idMaster) return;
  cargando.value = true;
  const response = await request<SolicitudPagoControl>({
    method: "get",
    url: URL_MAIN + "solicitud_pago_listar",
    params: { id_master: props.idMaster },
  });
  cargando.value = false;
  if (hasFailed(response)) {
    avisar(response);
    return;
  }
  solicitudes.value = response.estadoflag ? response.data : [];
}

async function copiar(texto: string | null) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    notifySuccess("Copiado al portapapeles");
  } catch {
    Swal.fire({ icon: "warning", text: "No se pudo copiar. Selecciona el texto y cópialo manualmente." });
  }
}

async function aprobar(s: SolicitudPagoControl, tipo: "ADM" | "GER") {
  const area = tipo === "ADM" ? "Administración" : "Gerencia";
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    html: `¿Aprobar por <b>${area}</b> la solicitud de <b>${etiquetaProveedor(s)}</b> por <b>${s.moneda ?? ""} ${formatoMonto(s.monto)}</b>?`,
    showCancelButton: true,
    confirmButtonText: "Sí, aprobar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1e5bd8",
  });
  if (!isConfirmed) return;
  procesando.value = s.id;
  const response = await request({
    method: "put",
    url: URL_MAIN + "solicitud_pago_aprobar/" + s.id,
    data: { tipo },
  });
  procesando.value = null;
  if (!response.estadoflag) {
    avisar(response);
    return;
  }
  notifySuccess(response.mensaje);
  await cargar();
}

function abrirSoporte(s: SolicitudPagoControl) {
  solicitudSoporte.value = s;
  tipoSoporte.value = 1;
  fechaPago.value = fechaPagoMovil.value[s.id] || "";
  archivoSoporte.value = null;
  dialogSoporte.value = true;
}

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
    archivoSoporte.value = {
      id: Number(filesStore.payPath),
      nombre: archivo.name,
      ruta: filesStore.datosPath?.ruta || "",
    };
  } finally {
    subiendo.value = false;
  }
  // Al cargar el soporte se solicita automáticamente la fecha de pago
  if (!fechaPago.value) {
    await nextTick();
    inputFecha.value?.focus();
  }
}

async function guardarSoporte() {
  const s = solicitudSoporte.value;
  if (!s) return;
  if (!archivoSoporte.value) {
    Swal.fire({ icon: "warning", text: "Sube el soporte de pago." });
    return;
  }
  if (!fechaPago.value) {
    Swal.fire({ icon: "warning", text: "Indica la fecha de pago." });
    inputFecha.value?.focus();
    return;
  }
  guardandoSoporte.value = true;
  const response = await request({
    method: "put",
    url: URL_MAIN + "solicitud_pago_pagar/" + s.id,
    data: { id_path: archivoSoporte.value.id, tiposoporte: tipoSoporte.value, fechapago: fechaPago.value },
  });
  guardandoSoporte.value = false;
  if (!response.estadoflag) {
    avisar(response);
    return;
  }
  dialogSoporte.value = false;
  notifySuccess(response.mensaje);
  await cargar();
}

async function verAnexo(s: SolicitudPagoControl) {
  anexoProveedor.value = etiquetaProveedor(s);
  anexos.value = [];
  cargandoAnexos.value = true;
  dialogAnexos.value = true;
  const response = await request<FacturaProveedorCargada>({
    method: "get",
    url: URL_MAIN + "list_invoice_path",
    params: { id_master: s.id_master, id_proveedor: s.id_proveedor, id_correlativo: s.id_correlativo },
  });
  cargandoAnexos.value = false;
  anexos.value = response.estadoflag ? response.data.filter((a) => !!a.path) : [];
}

function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
}

function nombreAnexo(a: FacturaProveedorCargada) {
  const tipo = a.type_pago == 1 ? "Factura" : a.type_pago == 2 ? "Proforma" : "Otro";
  return `${tipo}${a.number ? " - " + a.number : ""}`;
}

watch(
  () => props.idMaster,
  () => cargar(),
  { immediate: true },
);

defineExpose({ cargar });
</script>

<template>
  <section class="solpago">
    <!-- CABECERA -->
    <header class="solpago__header">
      <div class="solpago__brand">
        <img
          v-if="logo"
          :src="logo"
          alt=""
          class="solpago__logo"
        >
        <span
          v-if="logo"
          class="solpago__divider"
        />
        <h2 class="solpago__title">
          Pagos Pendientes
        </h2>
      </div>

      <template v-if="!smAndDown">
        <v-text-field
          v-model="filtroTexto"
          class="solpago__search"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar por proveedor, código o cuenta..."
        />
        <div class="solpago__dates">
          <v-icon
            color="primary"
            size="20"
          >
            mdi-calendar-month-outline
          </v-icon>
          <input
            v-model="filtroDesde"
            type="date"
            aria-label="Desde"
          >
          <span>-</span>
          <input
            v-model="filtroHasta"
            type="date"
            aria-label="Hasta"
          >
        </div>
      </template>
      <v-btn
        v-else
        variant="outlined"
        color="primary"
        rounded="lg"
        prepend-icon="mdi-filter-outline"
        @click="mostrarFiltrosMovil = !mostrarFiltrosMovil"
      >
        Filtros
      </v-btn>
    </header>

    <!-- FILTROS -->
    <v-expand-transition>
      <div
        v-show="!smAndDown || mostrarFiltrosMovil"
        class="solpago__filters"
      >
        <v-text-field
          v-if="smAndDown"
          v-model="filtroTexto"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar por proveedor, código o cuenta..."
        />
        <div
          v-if="smAndDown"
          class="solpago__dates solpago__dates--block"
        >
          <v-icon
            color="primary"
            size="20"
          >
            mdi-calendar-month-outline
          </v-icon>
          <input
            v-model="filtroDesde"
            type="date"
            aria-label="Desde"
          >
          <span>-</span>
          <input
            v-model="filtroHasta"
            type="date"
            aria-label="Hasta"
          >
        </div>
        <div class="solpago__field">
          <label>Estado</label>
          <v-select
            v-model="filtroEstado"
            :items="opcionesEstado"
            placeholder="Todos los estados"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </div>
        <div class="solpago__field">
          <label>Proveedor</label>
          <v-select
            v-model="filtroProveedor"
            :items="opcionesProveedor"
            placeholder="Todos los proveedores"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </div>
        <div class="solpago__field">
          <label>Banco</label>
          <v-select
            v-model="filtroBanco"
            :items="opcionesBanco"
            placeholder="Todos los bancos"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </div>
        <div class="solpago__field">
          <label>Método de pago</label>
          <v-select
            v-model="filtroMetodo"
            :items="opcionesMetodo"
            placeholder="Todos los métodos"
            density="compact"
            variant="outlined"
            hide-details
            clearable
          />
        </div>
        <v-btn
          class="solpago__clear"
          variant="outlined"
          color="primary"
          rounded="lg"
          prepend-icon="mdi-refresh"
          :disabled="!hayFiltros"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </v-btn>
      </div>
    </v-expand-transition>

    <div class="solpago__count">
      {{ filtradas.length }} {{ filtradas.length === 1 ? "resultado" : "resultados" }}
      <v-progress-circular
        v-if="cargando"
        indeterminate
        size="16"
        width="2"
        color="primary"
        class="ml-2"
      />
    </div>

    <!-- ======================= WEB ======================= -->
    <div
      v-if="!smAndDown"
      class="solpago__tablewrap"
    >
      <table class="solpago__table">
        <thead>
          <tr>
            <th>Fecha de solicitud</th>
            <th>Expediente</th>
            <th>Proveedor</th>
            <th class="text-right">
              Monto
            </th>
            <th>Moneda</th>
            <th>Banco</th>
            <th>Método de pago</th>
            <th>Código / N° de cuenta</th>
            <th>Estado</th>
            <th>Usuario</th>
            <th>Fecha</th>
            <th>Fecha de pago</th>
            <th class="text-center">
              Soporte
            </th>
            <th class="text-center">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtradas.length">
            <td
              colspan="14"
              class="solpago__empty"
            >
              {{ cargando ? "Cargando solicitudes..." : "No hay solicitudes de pago registradas." }}
            </td>
          </tr>
          <tr
            v-for="s in filtradas"
            :key="s.id"
          >
            <td class="text-no-wrap">
              {{ formatoFecha(s.fechasolicitud) }}
            </td>
            <td>
              <span class="solpago__pill">{{ s.expediente }}</span>
            </td>
            <td>
              <div class="solpago__prov">
                <v-btn
                  icon
                  variant="text"
                  size="x-small"
                  color="primary"
                  title="Copiar proveedor"
                  @click="copiar(etiquetaProveedor(s))"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
                <span class="solpago__provname">{{ etiquetaProveedor(s) }}</span>
              </div>
              <button
                type="button"
                class="solpago__anexo"
                @click="verAnexo(s)"
              >
                <v-icon size="14">
                  mdi-paperclip
                </v-icon> Ver anexo
              </button>
            </td>
            <td class="text-right solpago__monto">
              {{ formatoMonto(s.monto) }}
            </td>
            <td>
              <span class="solpago__coin">{{ s.moneda }}</span>
            </td>
            <td class="font-weight-bold">
              {{ s.banco || "—" }}
            </td>
            <td>{{ s.tipopago }}</td>
            <td>
              <div class="solpago__cuenta">
                <span>{{ cuentaOCodigo(s) || "—" }}</span>
                <v-btn
                  v-if="cuentaOCodigo(s)"
                  icon
                  variant="text"
                  size="x-small"
                  color="primary"
                  title="Copiar"
                  @click="copiar(cuentaOCodigo(s))"
                >
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </td>
            <td>
              <v-tooltip location="top">
                <template #activator="{ props: tip }">
                  <span
                    v-bind="tip"
                    class="solpago__chip"
                    :class="`solpago__chip--${s.codigo_estado}`"
                  >{{ s.estado }}</span>
                </template>
                <div>Solicitado: {{ s.usuario_solicitud || "—" }} · {{ s.fechasolicitud }}</div>
                <div v-if="s.aprobadoadministracionflag">
                  Administración: {{ s.usuario_aprobadoadministracion }} · {{ s.fecha_aprobadoadministracion }}
                </div>
                <div v-if="s.aprobadogerenciaflag">
                  Gerencia: {{ s.usuario_aprobadogerencia }} · {{ s.fecha_aprobadogerencia }}
                </div>
                <div v-if="s.pagadoflag">
                  Pago registrado: {{ s.usuario_pagado }} · {{ s.fecha_registropago }}
                </div>
              </v-tooltip>
            </td>
            <td class="solpago__aprob">
              <template v-if="aprobaciones(s).length">
                <div
                  v-for="a in aprobaciones(s)"
                  :key="a.area"
                >
                  <span class="solpago__area">{{ a.area }}</span>
                  {{ a.usuario || "—" }}
                </div>
              </template>
              <span v-else>—</span>
            </td>
            <td class="solpago__aprob text-no-wrap">
              <template v-if="aprobaciones(s).length">
                <div
                  v-for="a in aprobaciones(s)"
                  :key="a.area"
                >
                  <span class="solpago__area">{{ a.area }}</span>
                  {{ formatoFechaHora(a.fecha) }}
                </div>
              </template>
              <span v-else>—</span>
            </td>
            <td class="text-center text-no-wrap">
              {{ s.pagadoflag ? formatoFecha(s.fechapago) : "—" }}
            </td>
            <td class="text-center">
              <v-btn
                v-if="s.pagadoflag"
                icon
                variant="text"
                size="small"
                color="primary"
                title="Ver soporte de pago"
                @click="abrir(s.soporte_path)"
              >
                <v-icon>mdi-file-eye-outline</v-icon>
              </v-btn>
              <v-btn
                v-else
                icon
                variant="text"
                size="small"
                color="primary"
                :disabled="s.codigo_estado !== 'LISTO' || !puedeAprobar"
                title="Subir soporte de pago"
                @click="abrirSoporte(s)"
              >
                <v-icon>mdi-file-upload-outline</v-icon>
              </v-btn>
            </td>
            <td class="text-center">
              <template v-if="puedeAprobar">
                <v-btn
                  v-if="s.codigo_estado === 'PENADM'"
                  size="small"
                  color="deep-purple"
                  variant="tonal"
                  :loading="procesando === s.id"
                  @click="aprobar(s, 'ADM')"
                >
                  Aprobar Administración
                </v-btn>
                <v-btn
                  v-else-if="s.codigo_estado === 'PENGER'"
                  size="small"
                  color="amber-darken-3"
                  variant="tonal"
                  :loading="procesando === s.id"
                  @click="aprobar(s, 'GER')"
                >
                  Aprobar Gerencia
                </v-btn>
                <v-btn
                  v-else-if="s.codigo_estado === 'LISTO'"
                  size="small"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-bank-transfer-out"
                  @click="abrirSoporte(s)"
                >
                  Transferir
                </v-btn>
                <v-icon
                  v-else
                  color="success"
                  title="Pagado"
                >
                  mdi-check-decagram
                </v-icon>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ======================= MÓVIL ======================= -->
    <div
      v-else
      class="solpago__mobile"
    >
      <div
        v-if="!filtradas.length"
        class="solpago__empty"
      >
        {{ cargando ? "Cargando solicitudes..." : "No hay solicitudes de pago registradas." }}
      </div>
      <div
        v-for="g in grupos"
        :key="g.codigo"
        class="solpago__group"
      >
        <button
          type="button"
          class="solpago__grouphead"
          :class="`solpago__grouphead--${g.codigo}`"
          @click="gruposCerrados[g.codigo] = !gruposCerrados[g.codigo]"
        >
          <v-icon>{{ g.icono }}</v-icon>
          <span>{{ g.titulo }} ({{ g.items.length }})</span>
          <v-icon class="ml-auto">
            {{ gruposCerrados[g.codigo] ? "mdi-chevron-down" : "mdi-chevron-up" }}
          </v-icon>
        </button>

        <v-expand-transition>
          <div v-show="!gruposCerrados[g.codigo]">
            <article
              v-for="s in g.items"
              :key="s.id"
              class="solpago__card"
              :class="`solpago__card--${s.codigo_estado}`"
            >
              <button
                type="button"
                class="solpago__cardhead"
                @click="tarjetasAbiertas[s.id] = !tarjetasAbiertas[s.id]"
              >
                <span
                  class="solpago__cardicon"
                  @click.stop="copiar(etiquetaProveedor(s))"
                >
                  <v-icon
                    size="18"
                    color="primary"
                  >mdi-content-copy</v-icon>
                </span>
                <span class="solpago__cardmain">
                  <span class="solpago__provname">{{ etiquetaProveedor(s) }}</span>
                  <span class="solpago__pill">{{ s.expediente }}</span>
                </span>
                <span
                  class="solpago__chip solpago__chip--sm"
                  :class="`solpago__chip--${s.codigo_estado}`"
                >{{ s.estado }}</span>
                <span class="solpago__cardmonto">
                  <small>{{ s.moneda }}</small> {{ formatoMonto(s.monto) }}
                </span>
                <v-icon size="20">
                  {{ tarjetasAbiertas[s.id] ? "mdi-chevron-up" : "mdi-chevron-right" }}
                </v-icon>
              </button>

              <v-expand-transition>
                <div
                  v-show="tarjetasAbiertas[s.id]"
                  class="solpago__cardbody"
                >
                  <div class="solpago__detail">
                    <dl>
                      <dt>
                        <v-icon size="16">
                          mdi-bank-outline
                        </v-icon> Banco:
                      </dt>
                      <dd>{{ s.banco || "—" }}</dd>
                      <dt>
                        <v-icon size="16">
                          mdi-credit-card-outline
                        </v-icon> Método de pago:
                      </dt>
                      <dd>{{ s.tipopago }}</dd>
                      <dt>
                        <v-icon size="16">
                          mdi-wallet-outline
                        </v-icon>
                        {{ s.codigo_tipopago === "02" ? "Código:" : "N.° de cuenta:" }}
                      </dt>
                      <dd class="solpago__cuenta">
                        <span>{{ cuentaOCodigo(s) || "—" }}</span>
                        <v-btn
                          v-if="cuentaOCodigo(s)"
                          icon
                          variant="text"
                          size="x-small"
                          color="primary"
                          @click="copiar(cuentaOCodigo(s))"
                        >
                          <v-icon>mdi-content-copy</v-icon>
                        </v-btn>
                      </dd>
                      <dt>
                        <v-icon size="16">
                          mdi-calendar-outline
                        </v-icon> Solicitado:
                      </dt>
                      <dd>{{ formatoFecha(s.fechasolicitud) }} · {{ s.usuario_solicitud }}</dd>
                      <template v-if="s.aprobadoadministracionflag">
                        <dt>
                          <v-icon size="16">
                            mdi-account-check-outline
                          </v-icon> Administración:
                        </dt>
                        <dd>{{ s.usuario_aprobadoadministracion }} · {{ s.fecha_aprobadoadministracion }}</dd>
                      </template>
                      <template v-if="s.aprobadogerenciaflag">
                        <dt>
                          <v-icon size="16">
                            mdi-account-tie-outline
                          </v-icon> Gerencia:
                        </dt>
                        <dd>{{ s.usuario_aprobadogerencia }} · {{ s.fecha_aprobadogerencia }}</dd>
                      </template>
                    </dl>

                    <div class="solpago__paydate">
                      <span><v-icon size="16">mdi-calendar-check-outline</v-icon> Fecha de pago:</span>
                      <strong v-if="s.pagadoflag">{{ formatoFecha(s.fechapago) }}</strong>
                      <input
                        v-else-if="s.codigo_estado === 'LISTO' && puedeAprobar"
                        v-model="fechaPagoMovil[s.id]"
                        type="date"
                        :max="hoy()"
                        aria-label="Fecha de pago"
                      >
                      <span
                        v-else
                        class="text-medium-emphasis"
                      >Pendiente</span>
                    </div>
                  </div>

                  <div class="solpago__cardactions">
                    <template v-if="s.pagadoflag">
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="primary"
                        rounded="pill"
                        prepend-icon="mdi-file-eye-outline"
                        @click="abrir(s.soporte_path)"
                      >
                        Ver soporte
                      </v-btn>
                    </template>
                    <template v-else-if="puedeAprobar">
                      <v-btn
                        v-if="s.codigo_estado === 'LISTO'"
                        size="small"
                        variant="outlined"
                        color="primary"
                        rounded="pill"
                        prepend-icon="mdi-upload"
                        @click="abrirSoporte(s)"
                      >
                        Subir soporte
                      </v-btn>
                      <v-btn
                        v-else-if="s.codigo_estado === 'PENADM'"
                        size="small"
                        color="deep-purple"
                        variant="tonal"
                        rounded="pill"
                        :loading="procesando === s.id"
                        @click="aprobar(s, 'ADM')"
                      >
                        Aprobar Administración
                      </v-btn>
                      <v-btn
                        v-else-if="s.codigo_estado === 'PENGER'"
                        size="small"
                        color="amber-darken-3"
                        variant="tonal"
                        rounded="pill"
                        :loading="procesando === s.id"
                        @click="aprobar(s, 'GER')"
                      >
                        Aprobar Gerencia
                      </v-btn>
                    </template>
                    <v-btn
                      size="small"
                      variant="outlined"
                      color="primary"
                      rounded="pill"
                      prepend-icon="mdi-paperclip"
                      @click="verAnexo(s)"
                    >
                      Ver anexo
                    </v-btn>
                  </div>
                </div>
              </v-expand-transition>
            </article>
          </div>
        </v-expand-transition>
      </div>
    </div>

    <div class="solpago__note">
      <v-icon color="primary">
        mdi-information-outline
      </v-icon>
      Al registrar el soporte de pago, será obligatorio ingresar la fecha de pago.
    </div>

    <!-- ======================= MODAL SOPORTE ======================= -->
    <v-dialog
      v-model="dialogSoporte"
      max-width="720"
      :fullscreen="smAndDown"
      persistent
    >
      <v-card
        v-if="solicitudSoporte"
        class="soporte"
        rounded="xl"
      >
        <div class="soporte__head">
          <div class="soporte__icon">
            <v-icon
              color="primary"
              size="30"
            >
              mdi-file-upload-outline
            </v-icon>
          </div>
          <div class="soporte__titles">
            <h3>
              Proveedor: {{ etiquetaProveedor(solicitudSoporte) }}<template v-if="solicitudSoporte.correlativo">
                - {{ solicitudSoporte.correlativo }}
              </template>
            </h3>
            <p>
              Cargar documento a pagar · {{ solicitudSoporte.moneda }} {{ formatoMonto(solicitudSoporte.monto) }}
            </p>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            class="ml-auto"
            :disabled="guardandoSoporte"
            @click="dialogSoporte = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="soporte__body">
          <h4>Escoge una opción</h4>
          <div class="soporte__options">
            <button
              v-for="t in TIPOS_SOPORTE"
              :key="t.valor"
              type="button"
              class="soporte__option"
              :class="{ 'soporte__option--active': tipoSoporte === t.valor }"
              @click="tipoSoporte = t.valor"
            >
              <v-icon
                size="20"
                :color="tipoSoporte === t.valor ? 'primary' : 'grey'"
              >
                {{ tipoSoporte === t.valor ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
              </v-icon>
              <v-icon
                size="26"
                color="primary"
              >
                {{ t.icono }}
              </v-icon>
              <span>{{ t.titulo }}</span>
            </button>
          </div>

          <div
            v-if="!archivoSoporte"
            class="soporte__drop"
            :class="{ 'soporte__drop--over': arrastrando }"
            role="button"
            tabindex="0"
            @click="seleccionarArchivo"
            @keydown.enter="seleccionarArchivo"
            @dragover.prevent="arrastrando = true"
            @dragleave.prevent="arrastrando = false"
            @drop.prevent="alSoltar"
          >
            <template v-if="!subiendo">
              <v-icon
                size="40"
                color="grey-darken-1"
              >
                mdi-cloud-upload-outline
              </v-icon>
              <strong>Arrastra y suelta el archivo aquí</strong>
              <span>o haz clic para seleccionar</span>
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
            v-else
            class="soporte__file"
          >
            <v-icon color="success">
              mdi-check-circle-outline
            </v-icon>
            <span class="text-truncate"><b>Soporte cargado:</b> {{ archivoSoporte.nombre }}</span>
            <v-btn
              v-if="archivoSoporte.ruta"
              icon
              variant="text"
              size="small"
              color="primary"
              title="Ver"
              @click="abrir(archivoSoporte.ruta)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="red"
              title="Quitar"
              @click="archivoSoporte = null"
            >
              <v-icon>mdi-close-circle</v-icon>
            </v-btn>
          </div>

          <v-expand-transition>
            <div
              v-if="archivoSoporte"
              class="soporte__fecha"
            >
              <v-text-field
                ref="inputFecha"
                v-model="fechaPago"
                type="date"
                label="Fecha de pago *"
                prepend-inner-icon="mdi-calendar-check-outline"
                variant="outlined"
                density="comfortable"
                :max="hoy()"
                :rules="[(v: string) => !!v || 'Indica la fecha de pago']"
                hint="Obligatoria al registrar el soporte de pago"
                persistent-hint
              />
            </div>
          </v-expand-transition>
        </div>

        <div class="soporte__actions">
          <v-btn
            variant="outlined"
            rounded="lg"
            :disabled="guardandoSoporte"
            @click="dialogSoporte = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="guardandoSoporte"
            :disabled="!archivoSoporte || !fechaPago || subiendo"
            @click="guardarSoporte"
          >
            Guardar Documento
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ======================= MODAL ANEXOS ======================= -->
    <v-dialog
      v-model="dialogAnexos"
      max-width="520"
    >
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center">
          <v-icon
            color="primary"
            class="mr-2"
          >
            mdi-paperclip
          </v-icon>
          Anexos de {{ anexoProveedor }}
          <v-spacer />
          <v-btn
            icon
            variant="text"
            size="small"
            @click="dialogAnexos = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-progress-linear
            v-if="cargandoAnexos"
            indeterminate
            color="primary"
          />
          <p
            v-else-if="!anexos.length"
            class="text-medium-emphasis"
          >
            El proveedor no tiene facturas o proformas cargadas para este expediente.
          </p>
          <v-list
            v-else
            density="compact"
          >
            <v-list-item
              v-for="a in anexos"
              :key="a.id"
              :title="nombreAnexo(a)"
              :subtitle="a.originalname || ''"
              @click="abrir(a.path)"
            >
              <template #prepend>
                <v-icon :color="a.type === 'pdf' ? 'red' : 'blue-grey'">
                  {{ a.type === "pdf" ? "mdi-file-pdf-box" : "mdi-file-image" }}
                </v-icon>
              </template>
              <template #append>
                <v-icon size="18">
                  mdi-open-in-new
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </section>
</template>

<style scoped>
.solpago {
  --sp-primary: #1e3a8a;
  --sp-accent: #1e5bd8;
  --sp-surface: #ffffff;
  --sp-soft: #eef4ff;
  --sp-border: #dbe5f5;
  --sp-text: #1f2a44;
  --sp-muted: #5b6b86;
  --sp-green-bg: #d9f7e1;
  --sp-green-fg: #166534;
  --sp-green: #22c55e;
  --sp-amber-bg: #fdf0c4;
  --sp-amber-fg: #7a5a00;
  --sp-amber: #f5c518;
  --sp-purple-bg: #ece2fc;
  --sp-purple-fg: #5b21b6;
  --sp-purple: #8b5cf6;
  --sp-blue-bg: #dbeafe;
  --sp-blue-fg: #1e40af;
  background: linear-gradient(180deg, #f7faff 0%, #f1f5fd 100%);
  border: 1px solid var(--sp-border);
  border-radius: 18px;
  padding: 20px;
  color: var(--sp-text);
  box-shadow: 0 6px 24px rgba(30, 58, 138, 0.06);
}
.solpago__header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.solpago__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-right: auto;
  min-width: 0;
}
.solpago__logo {
  height: 40px;
  max-width: 140px;
  object-fit: contain;
}
.solpago__divider {
  width: 2px;
  height: 38px;
  background: var(--sp-accent);
  border-radius: 2px;
}
.solpago__title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--sp-primary);
  letter-spacing: -0.02em;
  margin: 0;
}
.solpago__search {
  flex: 0 1 420px;
  min-width: 240px;
  background: var(--sp-surface);
  border-radius: 10px;
}
.solpago__dates {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  background: var(--sp-surface);
  font-size: 0.9rem;
}
.solpago__dates input {
  border: none;
  outline: none;
  background: transparent;
  color: var(--sp-text);
  font: inherit;
  max-width: 132px;
}
.solpago__dates--block {
  justify-content: space-between;
}
.solpago__filters {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--sp-soft);
  border: 1px solid var(--sp-border);
}
.solpago__field {
  flex: 1 1 180px;
  min-width: 160px;
}
.solpago__field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--sp-text);
}
.solpago__field :deep(.v-field) {
  background: var(--sp-surface);
  border-radius: 10px;
}
.solpago__clear {
  background: var(--sp-surface);
}
.solpago__count {
  display: flex;
  align-items: center;
  font-weight: 700;
  color: var(--sp-primary);
  margin: 16px 2px 10px;
}
.solpago__tablewrap {
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid var(--sp-border);
  background: var(--sp-surface);
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.06);
}
.solpago__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.solpago__table th {
  background: #e7efff;
  color: var(--sp-primary);
  font-weight: 700;
  text-align: left;
  padding: 10px 8px;
  white-space: nowrap;
}
.solpago__table td {
  padding: 8px;
  border-top: 1px solid #edf1f8;
  vertical-align: middle;
}
.solpago__table tbody tr:hover td {
  background: #f8fbff;
}
.solpago__empty {
  text-align: center;
  color: var(--sp-muted);
  padding: 28px 12px !important;
}
.solpago__pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  background: #e9eef8;
  color: var(--sp-text);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}
.solpago__prov {
  display: flex;
  align-items: center;
  gap: 2px;
}
.solpago__provname {
  font-weight: 700;
  color: var(--sp-primary);
}
.solpago__anexo {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0 28px;
  padding: 1px 10px;
  border: 1px solid var(--sp-accent);
  border-radius: 999px;
  color: var(--sp-accent);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  background: var(--sp-surface);
}
.solpago__anexo:hover {
  background: var(--sp-soft);
}
.solpago__aprob {
  font-size: 0.8rem;
  line-height: 1.5;
}
.solpago__area {
  display: inline-block;
  min-width: 34px;
  color: var(--sp-muted);
  font-weight: 700;
}
.solpago__monto {
  font-weight: 700;
  white-space: nowrap;
}
.solpago__coin {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--sp-blue-bg);
  color: var(--sp-blue-fg);
  font-weight: 700;
  font-size: 0.8rem;
}
.solpago__cuenta {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}
.solpago__chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
}
.solpago__chip--sm {
  white-space: normal;
  font-size: 0.72rem;
  line-height: 1.15;
  padding: 4px 8px;
  max-width: 120px;
  text-align: center;
}
.solpago__chip--LISTO {
  background: var(--sp-green-bg);
  color: var(--sp-green-fg);
}
.solpago__chip--PENGER {
  background: var(--sp-amber-bg);
  color: var(--sp-amber-fg);
}
.solpago__chip--PENADM {
  background: var(--sp-purple-bg);
  color: var(--sp-purple-fg);
}
.solpago__chip--PAGADO {
  background: var(--sp-blue-bg);
  color: var(--sp-blue-fg);
}
.solpago__note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--sp-soft);
  border: 1px solid var(--sp-border);
  font-size: 0.92rem;
}

/* ---------- móvil ---------- */
.solpago__mobile {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.solpago__grouphead {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 16px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 1.02rem;
  text-align: left;
  margin-bottom: 8px;
}
.solpago__grouphead--LISTO {
  background: var(--sp-green-bg);
  color: #14532d;
}
.solpago__grouphead--LISTO .v-icon:first-child {
  color: var(--sp-green-fg);
}
.solpago__grouphead--PENGER {
  background: var(--sp-amber-bg);
  color: #4a3600;
}
.solpago__grouphead--PENADM {
  background: var(--sp-purple-bg);
  color: #3b1a7a;
}
.solpago__grouphead--PAGADO {
  background: var(--sp-blue-bg);
  color: var(--sp-blue-fg);
}
.solpago__card {
  position: relative;
  background: var(--sp-surface);
  border-radius: 16px;
  margin-bottom: 10px;
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.08);
  border-left: 6px solid var(--sp-border);
  overflow: hidden;
}
.solpago__card--LISTO {
  border-left-color: var(--sp-green);
}
.solpago__card--PENGER {
  border-left-color: var(--sp-amber);
}
.solpago__card--PENADM {
  border-left-color: var(--sp-purple);
}
.solpago__card--PAGADO {
  border-left-color: var(--sp-accent);
}
.solpago__cardhead {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 10px;
  text-align: left;
}
.solpago__cardicon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 50%;
  background: var(--sp-soft);
}
.solpago__cardmain {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
}
.solpago__cardmain .solpago__provname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.solpago__cardmonto {
  font-weight: 800;
  color: var(--sp-primary);
  white-space: nowrap;
  padding-left: 6px;
  border-left: 1px solid var(--sp-border);
}
.solpago__cardmonto small {
  color: var(--sp-accent);
  font-weight: 700;
}
.solpago__cardbody {
  padding: 0 12px 12px;
}
.solpago__detail {
  background: #f6f9ff;
  border-radius: 12px;
  padding: 10px 12px;
}
.solpago__detail dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  margin: 0;
  font-size: 0.86rem;
}
.solpago__detail dt {
  color: var(--sp-muted);
  white-space: nowrap;
}
.solpago__detail dd {
  margin: 0;
  font-weight: 600;
  word-break: break-word;
}
.solpago__paydate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--sp-border);
  font-size: 0.88rem;
}
.solpago__paydate input {
  border: 1px solid var(--sp-border);
  border-radius: 8px;
  padding: 4px 8px;
  background: var(--sp-surface);
  font: inherit;
}
.solpago__cardactions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

/* ---------- modal soporte ---------- */
.soporte__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 22px 8px;
}
.soporte__icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #e8f0fe;
  flex: 0 0 54px;
}
.soporte__titles {
  padding-left: 14px;
  border-left: 1px solid #d5dbe6;
  min-width: 0;
}
.soporte__titles h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #172036;
}
.soporte__titles p {
  margin: 2px 0 0;
  color: #5b6b86;
}
.soporte__body {
  padding: 12px 22px;
}
.soporte__body h4 {
  font-size: 1.02rem;
  font-weight: 700;
  margin-bottom: 10px;
}
.soporte__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.soporte__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid #d5dbe6;
  border-radius: 10px;
  background: #fff;
  font-weight: 700;
  text-align: left;
  transition: all 0.15s ease;
}
.soporte__option:hover {
  border-color: #1e5bd8;
}
.soporte__option--active {
  border-color: #1e5bd8;
  background: #eef4ff;
  box-shadow: 0 0 0 1px #1e5bd8 inset;
}
.soporte__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 140px;
  padding: 18px;
  border: 2px dashed #b9c3d3;
  border-radius: 12px;
  background: #f8fafc;
  color: #5b6b86;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}
.soporte__drop strong {
  color: #2b3446;
}
.soporte__drop:hover,
.soporte__drop--over {
  border-color: #1e5bd8;
  background: #eef4ff;
}
.soporte__file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #a5d6a7;
  border-radius: 10px;
  background: #e8f5e9;
}
.soporte__fecha {
  margin-top: 16px;
}
.soporte__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 22px 22px;
}

@media (max-width: 600px) {
  .solpago {
    padding: 14px;
    border-radius: 14px;
  }
  .solpago__title {
    font-size: 1.3rem;
  }
  .solpago__logo {
    height: 30px;
  }
  .solpago__field {
    flex-basis: 100%;
  }
  .solpago__clear {
    width: 100%;
  }
  .soporte__options {
    grid-template-columns: 1fr;
  }
  .soporte__actions .v-btn {
    flex: 1;
  }
}
</style>
