<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import { tienePerfilRevision, useRevisionSolicitudPago } from "@/composables/useRevisionSolicitudPago";
import SoportePagoDialog from "./SoportePagoDialog.vue";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, hasFailed, notifySuccess, request } from "@/utils/request";
import type { ApiResponse } from "@/types/api";
import type {
  EstadoSolicitudPago,
  FacturaProveedorCargada,
  SolicitudPagoControl,
} from "@/types/billingEntries";

const props = defineProps<{ idMaster?: number | null }>();
const emit = defineEmits<{ actualizado: [] }>();

const { can } = usePermissions();
const { smAndDown } = useDisplay();
const router = useRouter();

const URL_MAIN = import.meta.env.VITE_URL_MAIN;

const ESTADOS: { codigo: EstadoSolicitudPago; titulo: string; icono: string }[] = [
  { codigo: "LISTO", titulo: "Listo para transferir", icono: "mdi-check-circle" },
  { codigo: "PENGER", titulo: "Pendiente por Gerencia", icono: "mdi-clock-outline" },
  { codigo: "PENADM", titulo: "Pendiente por Administración", icono: "mdi-account-outline" },
  { codigo: "PAGADO", titulo: "Pagado", icono: "mdi-cash-check" },
  { codigo: "RECHAZADA", titulo: "Rechazada", icono: "mdi-close-circle-outline" },
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

// modal soporte
const dialogSoporte = ref(false);
const solicitudSoporte = ref<SolicitudPagoControl | null>(null);

// móvil
const gruposCerrados = ref<Record<string, boolean>>({});
const tarjetasAbiertas = ref<Record<number, boolean>>({});
const fechaPagoMovil = ref<Record<number, string>>({});


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
// Administración: perfil 04 | Gerencia: perfil 01
const { revisando, revisar: aprobar } = useRevisionSolicitudPago(() => cargar());
const puedeTransferir = computed(() => can("registroPayForProveedor", "NUEVO"));

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
  return [
    {
      area: "administracion",
      tipo: "ADM" as const,
      aprobado: !!s.aprobadoadministracionflag,
      usuario: s.usuario_aprobadoadministracion,
      fecha: s.fecha_aprobadoadministracion,
      rechazado: !!s.rechazadoflag && s.area_rechazo === "ADM",
      pendiente: s.codigo_estado === "PENADM",
    },
    {
      area: "gerencia",
      tipo: "GER" as const,
      aprobado: !!s.aprobadogerenciaflag,
      usuario: s.usuario_aprobadogerencia,
      fecha: s.fecha_aprobadogerencia,
      rechazado: !!s.rechazadoflag && s.area_rechazo === "GER",
      pendiente: s.codigo_estado === "PENGER",
    },
  ];
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
  emit("actualizado");
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


// PAGADO: genera el token y abre Bancos > Nueva salida con los datos precargados
async function transferir(s: SolicitudPagoControl) {
  procesando.value = s.id;
  const response = await request<{ token: string }>({
    method: "put",
    url: URL_MAIN + "solicitud_pago_transferir/" + s.id,
  });
  procesando.value = null;
  const token = response.estadoflag ? response.data[0]?.token : null;
  if (!token) {
    avisar(response);
    await cargar();
    return;
  }
  router.push({ name: "registroPagoSolicitud", params: { token } });
}

function verSalida(s: SolicitudPagoControl) {
  if (s.id_pagoegreso) window.open(`/home/FolderBanks/verPagosPorProveedor/${s.id_pagoegreso}`, "_blank");
}

function abrirSoporte(s: SolicitudPagoControl) {
  solicitudSoporte.value = s;
  dialogSoporte.value = true;
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
            <th>Banco</th>
            <th>Método de pago</th>
            <th>Código / N° de cuenta</th>
            <th>Estado</th>
            <th class="text-center">
              Administración
              <div class="solpago__thsub">
                Aprobado por
              </div>
            </th>
            <th class="text-center">
              Gerencia
              <div class="solpago__thsub">
                Aprobado por
              </div>
            </th>
            <th>Fecha de pago</th>
            <th class="text-center">
              Soporte
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtradas.length">
            <td
              colspan="12"
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
            <td class="text-right solpago__monto text-no-wrap">
              {{ formatoMonto(s.monto) }} <span class="solpago__coin">{{ s.moneda }}</span>
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
            <td
              v-for="a in aprobaciones(s)"
              :key="a.area"
              class="solpago__aprob text-center"
            >
              <template v-if="a.aprobado">
                <div class="solpago__aprobuser">
                  {{ a.usuario || "—" }}
                </div>
                <span class="solpago__aprobfecha">{{ formatoFechaHora(a.fecha) }}</span>
              </template>
              <div
                v-else-if="a.rechazado"
                class="solpago__rechazo"
                :title="s.motivo_rechazo ? `Motivo: ${s.motivo_rechazo}` : ''"
              >
                <span class="solpago__rechazotag">Rechazado</span>
                <div class="solpago__aprobuser">
                  {{ s.usuario_rechazo || "—" }}
                </div>
                <span class="solpago__aprobfecha solpago__aprobfecha--rechazo">{{ formatoFechaHora(s.fecha_rechazo ?? null) }}</span>
              </div>
              <v-btn
                v-else-if="a.pendiente && puedeAprobar && tienePerfilRevision(a.tipo)"
                size="small"
                :color="a.tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
                variant="tonal"
                class="solpago__revisar"
                :loading="revisando === s.id"
                @click="aprobar(s, a.tipo)"
              >
                Aprobar
              </v-btn>
              <span v-else>—</span>
            </td>
            <td class="text-center text-no-wrap">
              {{ s.pagadoflag ? formatoFecha(s.fechapago) : "—" }}
            </td>
            <td class="text-center">
              <div
                v-if="s.pagadoflag"
                class="solpago__soporte"
              >
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Ver soporte de pago"
                  @click="abrir(s.soporte_path)"
                >
                  <v-icon>mdi-file-eye-outline</v-icon>
                </v-btn>
                <!-- con el soporte cargado ya se puede registrar el pago en Bancos -->
                <button
                  v-if="s.id_pagoegreso"
                  type="button"
                  class="solpago__salida"
                  title="Ver la salida registrada en Bancos"
                  @click="verSalida(s)"
                >
                  <v-icon
                    size="16"
                    color="success"
                  >
                    mdi-check-decagram
                  </v-icon>
                  Salida N° {{ s.numerooperacion_pago }}
                </button>
                <v-btn
                  v-else-if="puedeTransferir"
                  size="small"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-bank-transfer-out"
                  :loading="procesando === s.id"
                  @click="transferir(s)"
                >
                  Transferir
                </v-btn>
              </div>
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
                      <template v-if="s.rechazadoflag">
                        <dt class="text-error">
                          <v-icon size="16">
                            mdi-close-circle-outline
                          </v-icon> Rechazado ({{ s.area_rechazo === "ADM" ? "Adm." : "Ger." }}):
                        </dt>
                        <dd>
                          {{ s.usuario_rechazo }} · {{ s.fecha_rechazo }}
                          <div
                            v-if="s.motivo_rechazo"
                            class="text-medium-emphasis"
                          >
                            {{ s.motivo_rechazo }}
                          </div>
                        </dd>
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
                      <v-btn
                        v-if="s.id_pagoegreso"
                        size="small"
                        variant="tonal"
                        color="success"
                        rounded="pill"
                        prepend-icon="mdi-check-decagram"
                        @click="verSalida(s)"
                      >
                        Salida N° {{ s.numerooperacion_pago }}
                      </v-btn>
                      <v-btn
                        v-else-if="puedeTransferir"
                        size="small"
                        variant="flat"
                        color="success"
                        rounded="pill"
                        prepend-icon="mdi-bank-transfer-out"
                        :loading="procesando === s.id"
                        @click="transferir(s)"
                      >
                        Transferir
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
                        v-else-if="s.codigo_estado === 'PENADM' && tienePerfilRevision('ADM')"
                        size="small"
                        color="deep-purple"
                        variant="tonal"
                        rounded="pill"
                        :loading="revisando === s.id"
                        @click="aprobar(s, 'ADM')"
                      >
                        Aprobar Administración
                      </v-btn>
                      <v-btn
                        v-else-if="s.codigo_estado === 'PENGER' && tienePerfilRevision('GER')"
                        size="small"
                        color="amber-darken-3"
                        variant="tonal"
                        rounded="pill"
                        :loading="revisando === s.id"
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

    <SoportePagoDialog
      v-model="dialogSoporte"
      :solicitud="solicitudSoporte"
      :fecha-inicial="solicitudSoporte ? fechaPagoMovil[solicitudSoporte.id] : ''"
      @guardado="cargar"
    />


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
  --sp-red-bg: #fde2e2;
  --sp-red-fg: #b42318;
  --sp-red: #ef4444;
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
.solpago__soporte {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.solpago__salida {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(46, 160, 67, 0.12);
  color: #1f7a35;
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: pointer;
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
.solpago__rechazotag {
  display: inline-block;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.solpago__aprobfecha--rechazo {
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
}
.solpago__thsub {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--sp-muted);
}
.solpago__aprobuser {
  font-weight: 600;
  white-space: nowrap;
}
.solpago__aprobfecha {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #e7efff;
  color: var(--sp-primary);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
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
.solpago__chip--RECHAZADA {
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
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
.solpago__grouphead--RECHAZADA {
  background: var(--sp-red-bg);
  color: var(--sp-red-fg);
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
.solpago__card--RECHAZADA {
  border-left-color: var(--sp-red);
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
}
</style>
