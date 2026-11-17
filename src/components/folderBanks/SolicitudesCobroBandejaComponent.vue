<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import axios from "@/api/http";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import SolicitudCobroVerDialog from "@/components/folderBilling/SolicitudCobroVerDialog.vue";
import SolicitudCobroCardMovil from "@/components/folderBilling/SolicitudCobroCardMovil.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";
import { tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import { montoCobro, tieneAprobacionesCobro, useSolicitudCobro } from "@/composables/useSolicitudCobro";
import { CONNECTION_ERROR_MESSAGE, hasFailed, request } from "@/utils/request";
import { shortDate } from "@/utils/dates";
import { sessionBranchId } from "@/utils/sesion";
import { descargarArchivo } from "@/utils/descargarArchivo";
import type {
  CodigoEstadoSolicitudCobro,
  OpcionFiltroSolicitudCobro,
  SolicitudCobroBandeja,
  TabBandejaSolicitudCobro,
} from "@/types/solicitudCobro";

// Una pestaña de "Ingresos pendientes por confirmar" (Operaciones > Facturación y Bancos):
// solicitudes de cobro paginadas en el servidor, con las mismas reglas que Solicitudes de Pago.
const props = defineProps<{
  tab: TabBandejaSolicitudCobro;
  opciones: OpcionFiltroSolicitudCobro[];
  // pestaña visible: las demás no consultan hasta que se abren
  activa: boolean;
}>();
const emit = defineEmits<{ total: [valor: number]; actualizado: [] }>();

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const MENU = "ingresosPendientesConfirmar";
const ESTADOS: { codigo: CodigoEstadoSolicitudCobro; titulo: string; tabs: TabBandejaSolicitudCobro[] }[] = [
  { codigo: "PENADM", titulo: "Pendiente por Administración", tabs: ["PEN", "HIS"] },
  { codigo: "PENGER", titulo: "Pendiente por Gerencia", tabs: ["PEN", "HIS"] },
  { codigo: "LISTO", titulo: "Listo para registrar en Bancos", tabs: ["PEN", "HIS"] },
  { codigo: "COBRADO", titulo: "Registrado en Bancos", tabs: ["HIS"] },
  { codigo: "RECHAZADA", titulo: "Rechazada", tabs: ["HIS"] },
  { codigo: "ELIMINADA", titulo: "Eliminada", tabs: ["HIS"] },
];
const COLOR_ESTADO: Record<string, string> = {
  PENADM: "orange-darken-2",
  PENGER: "amber-darken-3",
  LISTO: "blue",
  COBRADO: "green-darken-2",
  RECHAZADA: "red",
  ELIMINADA: "grey",
};

const { can } = usePermissions();
const router = useRouter();
const { smAndDown } = useDisplay();
const puedeModificar = computed(() => can(MENU, "MODIFICAR") || can("listControlGastos", "MODIFICAR"));
const puedeRegistrar = computed(() => can("registroPayForCliente", "NUEVO"));
const puedeEliminar = computed(() => can(MENU, "MODIFICAR") || can("listControlGastos", "ELIMINAR"));

const { procesando, revisando, revisar, eliminar, registrarEnBancos } = useSolicitudCobro(() => emit("actualizado"));

const filas = ref<SolicitudCobroBandeja[]>([]);
const total = ref(0);
const cargando = ref(false);
const exportando = ref(false);
const pagina = ref(1);
// en celular más filas por página; se fija antes de los watch para no consultar dos veces
const porPagina = ref(smAndDown.value ? 25 : 10);
const busqueda = ref("");

interface Filtros {
  estado: CodigoEstadoSolicitudCobro | null;
  id_cliente: number | null;
  id_cuentabancaria: number | null;
  desde: string;
  hasta: string;
}
const filtrosVacios = (): Filtros => ({ estado: null, id_cliente: null, id_cuentabancaria: null, desde: "", hasta: "" });
const filtros = ref<Filtros>(filtrosVacios());
const panelFiltros = ref(false);
const borrador = ref<Filtros>(filtrosVacios());

const esRechazadas = computed(() => props.tab === "REC");
const opcionesEstado = computed(() =>
  ESTADOS.filter((e) => e.tabs.includes(props.tab)).map((e) => ({ title: e.titulo, value: e.codigo })),
);
const opcionesDe = (tipo: OpcionFiltroSolicitudCobro["tipo"]) =>
  props.opciones.filter((o) => o.tipo === tipo).map((o) => ({ title: o.titulo, value: Number(o.valor) }));
const opcionesCliente = computed(() => opcionesDe("CLIENTE"));
const opcionesCuenta = computed(() => opcionesDe("CUENTA"));
const hayFiltros = computed(() => {
  const f = filtros.value;
  return !!(f.estado || f.id_cliente || f.id_cuentabancaria || f.desde || f.hasta || busqueda.value.trim());
});

const columna = (title: string, key: string) => ({ title, key, sortable: false, align: "center" as const });
const headers = computed(() => [
  columna("Fecha de solicitud", "fechasolicitud"),
  columna("Expediente", "expediente"),
  columna("Cliente", "cliente"),
  columna("Monto", "monto"),
  columna("Cuenta de depósito", "cuenta"),
  columna("Depósito / N° Op.", "deposito"),
  columna("Estado", "estado"),
  columna("Administración", "adm"),
  columna("Gerencia", "ger"),
  ...(esRechazadas.value ? [columna("Motivo", "motivo_rechazo")] : []),
  columna("Soporte", "soporte"),
  columna("Acciones", "acciones"),
]);

function parametros(paginar: boolean) {
  const f = filtros.value;
  return {
    tab: props.tab,
    search: busqueda.value.trim() || undefined,
    estado: esRechazadas.value ? undefined : f.estado || undefined,
    id_cliente: f.id_cliente || undefined,
    id_cuentabancaria: f.id_cuentabancaria || undefined,
    desde: f.desde || undefined,
    hasta: f.hasta || undefined,
    ...(paginar ? { page: pagina.value, limit: porPagina.value } : {}),
  };
}

let ultimaConsulta = 0;
async function cargar() {
  const consulta = ++ultimaConsulta;
  cargando.value = true;
  const response = await request<SolicitudCobroBandeja>({
    method: "get",
    url: URL_MAIN + "solicitud_cobro_bandeja",
    params: parametros(true),
  });
  if (consulta !== ultimaConsulta) return;
  cargando.value = false;
  if (hasFailed(response)) {
    filas.value = [];
    total.value = 0;
    Swal.fire({ icon: "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
    emit("total", 0);
    return;
  }
  filas.value = response.estadoflag ? response.data : [];
  total.value = filas.value.length ? Number(filas.value[0]!.total) : 0;
  emit("total", total.value);
}
function irPrimeraPagina() {
  if (pagina.value === 1) cargar();
  else pagina.value = 1;
}
const buscarConPausa = useDebouncedSearch(irPrimeraPagina, 400);
watch(busqueda, () => buscarConPausa());
watch([pagina, porPagina], () => cargar());
const paginas = computed(() => Math.max(1, Math.ceil(total.value / porPagina.value)));

function abrirFiltros() {
  borrador.value = { ...filtros.value };
  panelFiltros.value = true;
}
function aplicarFiltros() {
  const b = borrador.value;
  if (b.desde && b.hasta && b.desde > b.hasta) {
    Swal.fire({ icon: "warning", text: "La fecha inicial no puede ser mayor que la final." });
    return;
  }
  filtros.value = { ...b };
  panelFiltros.value = false;
  irPrimeraPagina();
}
function limpiarTodo() {
  filtros.value = filtrosVacios();
  borrador.value = filtrosVacios();
  if (busqueda.value) busqueda.value = "";
  else irPrimeraPagina();
}

async function exportar() {
  exportando.value = true;
  try {
    const { data } = await axios.get(URL_MAIN + "solicitud_cobro_bandeja_exportar", {
      params: parametros(false),
      responseType: "blob",
    });
    const nombre = { PEN: "Pendientes", REC: "Rechazadas", HIS: "Historico" }[props.tab];
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ingresos por confirmar - ${nombre} ${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    Swal.fire({ icon: "error", text: "No se pudo generar el Excel. Intenta de nuevo." });
  }
  exportando.value = false;
}

// fechas con el helper de FormatFecha (DD/MMM/YYYY); con hora si la trae
function fecha(valor: string | null | undefined) {
  if (!valor) return "—";
  return `${shortDate(valor.slice(0, 10))} ${valor.slice(11, 16)}`.trim();
}
function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
}
// aprobaciones como en Pagos: fecha arriba (helper de FormatFecha) y hora abajo
function soloFecha(valor: string | null | undefined) {
  return valor ? shortDate(valor.slice(0, 10)) : "—";
}
function horaDe(valor: string | null | undefined) {
  return valor ? valor.slice(11, 16) : "";
}
function verExpediente(s: SolicitudCobroBandeja) {
  const destino = router.resolve({ name: "verControlGasto", params: { id: s.id_master, id_branch: sessionBranchId() } });
  window.open(destino.href, "_blank");
}
function verIngreso(s: SolicitudCobroBandeja) {
  if (!s.id_pagoingreso) return;
  window.open(router.resolve({ name: "verPagosPorCliente", params: { id: s.id_pagoingreso } }).href, "_blank");
}
// modo ver (ojito), igual que en Solicitudes de Pago
const dialogVer = ref(false);
const codigoVer = ref<string | null>(null);
function verSolicitud(s: { codigo: string }) {
  codigoVer.value = s.codigo;
  dialogVer.value = true;
}
const AREAS_REV: AreaRevision[] = ["ADM", "GER"];

// celular: grupos por estado que se pliegan (como Solicitudes de Pago)
const GRUPOS = [
  { codigo: "LISTO", titulo: "Listo para registrar en Bancos", icono: "mdi-check-circle" },
  { codigo: "PENGER", titulo: "Pendiente por Gerencia", icono: "mdi-clock-outline" },
  { codigo: "PENADM", titulo: "Pendiente por Administración", icono: "mdi-account-outline" },
  { codigo: "BORRADOR", titulo: "Sin enviar", icono: "mdi-pencil-circle-outline" },
  { codigo: "COBRADO", titulo: "Registrado en Bancos", icono: "mdi-cash-check" },
  { codigo: "RECHAZADA", titulo: "Rechazada", icono: "mdi-close-circle-outline" },
  { codigo: "ELIMINADA", titulo: "Eliminada", icono: "mdi-trash-can-outline" },
];
const gruposCerrados = ref<Record<string, boolean>>({});
const grupos = computed(() =>
  GRUPOS.map((g) => ({ ...g, items: filas.value.filter((f) => f.codigo_estado === g.codigo) })).filter((g) => g.items.length),
);
const vigente = (s: SolicitudCobroBandeja) => !["ELIMINADA", "COBRADO"].includes(s.codigo_estado);
// botón de confirmar del área que toca, solo para el perfil que revisa (04 / 01)
function puedeRevisar(s: SolicitudCobroBandeja, tipo: AreaRevision) {
  return puedeModificar.value && s.codigo_estado === (tipo === "ADM" ? "PENADM" : "PENGER") && tienePerfilRevision(tipo);
}
function aprobaciones(s: SolicitudCobroBandeja) {
  return (["ADM", "GER"] as AreaRevision[]).map((tipo) => {
    const adm = tipo === "ADM";
    return {
      tipo,
      usuario: adm ? s.usuario_aprobadoadministracion : s.usuario_aprobadogerencia,
      fecha: adm ? s.fecha_aprobadoadministracion : s.fecha_aprobadogerencia,
      rechazado: s.codigo_estado === "RECHAZADA" && s.area_rechazo === tipo,
      pendiente: s.codigo_estado === (adm ? "PENADM" : "PENGER"),
    };
  });
}


// Solo consulta la pestaña visible. Si otra pestaña cambió (aprobar, rechazar, registrar...),
// esta queda "pendiente" y se consulta recién cuando el usuario la abre.
let pendiente = true;
function cargarSiVisible() {
  if (!props.activa) {
    pendiente = true;
    return;
  }
  pendiente = false;
  cargar();
}
watch(
  () => props.activa,
  (visible) => {
    if (visible && pendiente) cargarSiVisible();
  },
);

defineExpose({ cargar: cargarSiVisible });
onMounted(cargarSiVisible);
</script>

<template>
  <div class="scb">
    <div class="scb__toolbar">
      <v-text-field
        v-if="!smAndDown"
        v-model="busqueda"
        class="scb__search"
        label="Buscar"
        placeholder="Cliente, expediente, cuenta, N° operación…"
        variant="outlined"
        density="compact"
        append-inner-icon="mdi-text-search"
        clearable
        hide-details
        @click:clear="busqueda = ''"
      />
      <div class="scb__actions">
        <v-btn
          v-if="!smAndDown && can(MENU, 'EXPORTAR')"
          color="success"
          size="small"
          prepend-icon="mdi-microsoft-excel"
          :loading="exportando"
          @click="exportar"
        >
          EXCEL
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          prepend-icon="mdi-refresh"
          :loading="cargando"
          @click="cargar()"
        >
          ACTUALIZAR
        </v-btn>
        <v-badge
          :model-value="smAndDown && !!busqueda"
          dot
          color="error"
        >
          <v-btn
            color="info"
            size="small"
            append-icon="mdi-filter"
            class="scb__filtrar"
            @click="abrirFiltros"
          >
            Filtrar
          </v-btn>
        </v-badge>
        <v-btn
          v-if="hayFiltros"
          variant="tonal"
          size="small"
          prepend-icon="mdi-filter-remove-outline"
          @click="limpiarTodo"
        >
          LIMPIAR
        </v-btn>
      </div>
    </div>

    <div class="scb__count">
      {{ total }} {{ total === 1 ? "resultado" : "resultados" }}
    </div>

    <!-- escritorio: tabla -->
    <v-data-table-server
      v-if="!smAndDown"
      v-model:page="pagina"
      v-model:items-per-page="porPagina"
      :headers="headers"
      :items="filas"
      :items-length="total"
      :loading="cargando"
      :items-per-page-options="[10, 25, 50, 100]"
      item-value="codigo"
      density="compact"
      class="scb__tabla"
      no-data-text="No hay solicitudes de cobro"
    >
      <template #[`item.fechasolicitud`]="{ item }">
        {{ fecha(item.fechasolicitud) }}
      </template>
      <template #[`item.expediente`]="{ item }">
        <a
          href="#"
          class="scb__link"
          @click.prevent="verExpediente(item)"
        >{{ item.expediente }}</a>
        <div class="text-body-small">
          {{ item.correlativo }}
        </div>
      </template>
      <template #[`item.cliente`]="{ item }">
        <div class="scb__cliente">
          {{ item.cliente }}
        </div>
      </template>
      <template #[`item.monto`]="{ item }">
        <b>{{ montoCobro(item.monto, item.moneda) }}</b>
      </template>
      <template #[`item.deposito`]="{ item }">
        {{ fecha(item.fechadeposito) }}
        <div class="text-body-small">
          {{ item.numerooperacion }}
        </div>
      </template>
      <template #[`item.estado`]="{ item }">
        <v-chip
          size="small"
          variant="flat"
          :color="COLOR_ESTADO[item.codigo_estado] ?? 'grey'"
        >
          {{ item.estado }}
        </v-chip>
      </template>
      <template #[`item.adm`]="{ item }">
        <template
          v-for="a in aprobaciones(item).filter((x) => x.tipo === 'ADM')"
          :key="a.tipo"
        >
          <div class="scb__aprob">
            <template v-if="a.usuario">
              <div class="scb__aprobuser">
                {{ a.usuario }}
              </div>
              <span class="scb__aprobfecha">{{ soloFecha(a.fecha) }}<template v-if="horaDe(a.fecha)"><br>{{ horaDe(a.fecha) }}</template></span>
            </template>
            <template v-else-if="a.rechazado">
              <span class="scb__rechazotag">Rechazado</span>
              <div class="scb__aprobuser">
                {{ item.usuario_rechazo || "—" }}
              </div>
              <span class="scb__aprobfecha scb__aprobfecha--rechazo">{{ soloFecha(item.fecha_rechazo) }}<template v-if="horaDe(item.fecha_rechazo)"><br>{{ horaDe(item.fecha_rechazo) }}</template></span>
            </template>
            <v-btn
              v-else-if="puedeRevisar(item, 'ADM')"
              size="small"
              variant="tonal"
              :color="a.tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
              class="scb__revisar"
              :loading="revisando === item.codigo"
              @click="revisar(item, 'ADM')"
            >
              Aprobar
            </v-btn>
            <span
              v-else
              class="scb__muted"
            >—</span>
          </div>
        </template>
      </template>
      <template #[`item.ger`]="{ item }">
        <template
          v-for="a in aprobaciones(item).filter((x) => x.tipo === 'GER')"
          :key="a.tipo"
        >
          <div class="scb__aprob">
            <template v-if="a.usuario">
              <div class="scb__aprobuser">
                {{ a.usuario }}
              </div>
              <span class="scb__aprobfecha">{{ soloFecha(a.fecha) }}<template v-if="horaDe(a.fecha)"><br>{{ horaDe(a.fecha) }}</template></span>
            </template>
            <template v-else-if="a.rechazado">
              <span class="scb__rechazotag">Rechazado</span>
              <div class="scb__aprobuser">
                {{ item.usuario_rechazo || "—" }}
              </div>
              <span class="scb__aprobfecha scb__aprobfecha--rechazo">{{ soloFecha(item.fecha_rechazo) }}<template v-if="horaDe(item.fecha_rechazo)"><br>{{ horaDe(item.fecha_rechazo) }}</template></span>
            </template>
            <v-btn
              v-else-if="puedeRevisar(item, 'GER')"
              size="small"
              variant="tonal"
              :color="a.tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
              class="scb__revisar"
              :loading="revisando === item.codigo"
              @click="revisar(item, 'GER')"
            >
              Aprobar
            </v-btn>
            <span
              v-else
              class="scb__muted"
            >—</span>
          </div>
        </template>
      </template>
      <template #[`item.motivo_rechazo`]="{ item }">
        <div class="scb__motivo">
          {{ item.motivo_rechazo || "—" }}
          <div class="text-body-small">
            {{ item.usuario_rechazo }} {{ fecha(item.fecha_rechazo) }}
          </div>
        </div>
      </template>
      <template #[`item.soporte`]="{ item }">
        <div class="scb__soporte">
          <div class="scb__soporteicons">
            <v-btn
              icon="mdi-file-eye-outline"
              variant="text"
              size="small"
              color="primary"
              :disabled="!item.voucher_path"
              title="Ver voucher del cliente"
              aria-label="Ver voucher del cliente"
              data-modo-ver="permitido"
              @click="abrir(item.voucher_path)"
            />
            <v-btn
              icon="mdi-download"
              variant="text"
              size="small"
              color="primary"
              :disabled="!item.voucher_path"
              title="Descargar voucher del cliente"
              aria-label="Descargar voucher del cliente"
              data-modo-ver="permitido"
              @click="descargarArchivo(item.voucher_path, item.voucher_nombre)"
            />
          </div>
          <button
            v-if="item.id_pagoingreso"
            type="button"
            class="scb__salida"
            title="Ver el ingreso registrado en Bancos"
            data-modo-ver="permitido"
            @click="verIngreso(item)"
          >
            <v-icon
              size="16"
              color="success"
            >
              mdi-check-decagram
            </v-icon>
            Ingreso N° {{ item.numerooperacion_ingreso }}
          </button>
          <v-btn
            v-else-if="item.codigo_estado === 'LISTO' && puedeRegistrar"
            size="small"
            color="success"
            variant="flat"
            prepend-icon="mdi-bank-transfer-in"
            :loading="procesando === item.codigo"
            @click="registrarEnBancos(item)"
          >
            REGISTRAR EN BANCO
          </v-btn>
        </div>
      </template>
      <template #[`item.acciones`]="{ item }">
        <div class="scb__acciones">
          <v-btn
            v-if="vigente(item) && puedeEliminar"
            icon="mdi-trash-can-outline"
            size="x-small"
            variant="text"
            color="error"
            :title="`Eliminar solicitud${tieneAprobacionesCobro(item) ? ' (requiere clave de administrador)' : ''}`"
            aria-label="Eliminar solicitud de cobro"
            :loading="procesando === item.codigo"
            @click="eliminar(item)"
          />
          <v-btn
            icon="mdi-eye-outline"
            variant="tonal"
            size="small"
            color="primary"
            title="Ver solicitud de cobro"
            aria-label="Ver solicitud de cobro"
            data-modo-ver="permitido"
            @click="verSolicitud(item)"
          />
        </div>
      </template>
    </v-data-table-server>

    <!-- celular y tablet: tarjetas -->
    <div
      v-else
      class="scb-cards"
    >
      <v-progress-linear
        v-if="cargando"
        indeterminate
        color="primary"
      />
      <p
        v-if="!cargando && !filas.length"
        class="scb-cards__vacio"
      >
        No hay solicitudes de cobro
      </p>
      <div
        v-for="g in grupos"
        :key="g.codigo"
        class="scb-grupo"
      >
        <button
          type="button"
          class="scb-grupo__head"
          :class="`scb-grupo__head--${g.codigo}`"
          data-modo-ver="permitido"
          @click="gruposCerrados[g.codigo] = !gruposCerrados[g.codigo]"
        >
          <v-icon>{{ g.icono }}</v-icon>
          <span>{{ g.titulo }} ({{ g.items.length }})</span>
          <v-icon class="ml-auto">
            {{ gruposCerrados[g.codigo] ? "mdi-chevron-down" : "mdi-chevron-up" }}
          </v-icon>
        </button>
        <v-expand-transition>
          <div
            v-show="!gruposCerrados[g.codigo]"
            class="scb-grupo__items"
          >
            <template
              v-for="(item, i) in g.items"
              :key="item.codigo"
            >
              <!-- separador marcado entre solicitudes -->
              <v-divider
                v-if="i > 0"
                class="scb-cards__sep"
                :thickness="2"
                opacity="1"
              />
              <SolicitudCobroCardMovil
                :s="item"
                :aprobar="AREAS_REV.filter((t) => puedeRevisar(item, t))"
                :puede-registrar="puedeRegistrar"
                :puede-eliminar="vigente(item) && puedeEliminar"
                :procesando="procesando === item.codigo"
                :revisando="revisando === item.codigo"
                @aprobar="(tipo) => revisar(item, tipo)"
                @registrar="registrarEnBancos(item)"
                @ver-ingreso="verIngreso(item)"
                @eliminar="eliminar(item)"
                @ver="verSolicitud(item)"
              />
            </template>
          </div>
        </v-expand-transition>
      </div>
      <v-pagination
        v-if="paginas > 1"
        v-model="pagina"
        :length="paginas"
        density="compact"
        total-visible="5"
      />
    </div>

    <SolicitudCobroVerDialog
      v-model="dialogVer"
      :codigo="codigoVer"
    />

    <!-- filtros -->
    <v-dialog
      v-model="panelFiltros"
      max-width="520"
      :fullscreen="smAndDown"
    >
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start>
            mdi-filter-variant
          </v-icon>
          Filtros
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            @click="panelFiltros = false"
          />
        </v-card-title>
        <v-card-text>
          <!-- celular: el buscador va aquí (la barra solo tiene Actualizar y Filtrar) -->
          <v-text-field
            v-if="smAndDown"
            v-model="busqueda"
            label="Buscar"
            placeholder="Cliente, expediente, cuenta, N° operación…"
            variant="outlined"
            density="compact"
            append-inner-icon="mdi-text-search"
            clearable
            class="mb-2"
            @click:clear="busqueda = ''"
          />
          <v-select
            v-if="!esRechazadas"
            v-model="borrador.estado"
            :items="opcionesEstado"
            label="Estado"
            variant="outlined"
            density="compact"
            clearable
          />
          <v-autocomplete
            v-model="borrador.id_cliente"
            :items="opcionesCliente"
            label="Cliente"
            variant="outlined"
            density="compact"
            clearable
          />
          <v-autocomplete
            v-model="borrador.id_cuentabancaria"
            :items="opcionesCuenta"
            label="Cuenta de depósito"
            variant="outlined"
            density="compact"
            clearable
          />
          <div class="scb__fechas">
            <FormatFecha
              v-model="borrador.desde"
              label="Solicitud desde"
              outlined
              density="compact"
              clearable
            />
            <FormatFecha
              v-model="borrador.hasta"
              label="Solicitud hasta"
              outlined
              density="compact"
              clearable
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            variant="text"
            @click="borrador = filtrosVacios()"
          >
            Limpiar
          </v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            @click="aplicarFiltros"
          >
            Aplicar filtros
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.scb__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.scb__search {
  flex: 1 1 320px;
  max-width: 460px;
}
.scb__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.scb__filtrar {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}
.scb__count {
  margin: 4px 2px 10px;
  font-weight: 700;
  color: #1e3a8a;
}
/* celular: grupos por estado (como Solicitudes de Pago) */
.scb-grupo + .scb-grupo {
  margin-top: 12px;
}
.scb-grupo__head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 8px;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 1.02rem;
  font-weight: 800;
  text-align: left;
}
.scb-grupo__head--LISTO { background: #d9f7e1; color: #14532d; }
.scb-grupo__head--PENGER { background: #fdf0c4; color: #4a3600; }
.scb-grupo__head--PENADM { background: #ece2fc; color: #3b1a7a; }
.scb-grupo__head--BORRADOR { background: #eceff3; color: #475467; }
.scb-grupo__head--COBRADO { background: #dbeafe; color: #1e40af; }
.scb-grupo__head--RECHAZADA { background: #fde2e2; color: #b42318; }
.scb-grupo__head--ELIMINADA { background: #eceff3; color: #475467; }
.scb-grupo__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.scb__tabla :deep(td) {
  font-size: 12.5px;
}
.scb__cliente {
  max-width: 220px;
  white-space: normal;
}
.scb__motivo {
  max-width: 220px;
  white-space: normal;
  text-align: left;
}
.scb__soporte {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.scb__soporteicons {
  display: inline-flex;
  align-items: center;
}
/* separador entre solicitudes (móvil): marcado para no confundir una tarjeta con otra */
.scb-cards__sep {
  margin: 2px 8px;
  border-color: #9fb4d6;
}
.scb__aprob {
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
}
.scb__aprobuser {
  font-weight: 600;
  white-space: nowrap;
}
.scb__aprobfecha {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 10px;
  border-radius: 8px;
  line-height: 1.3;
  text-align: center;
  background: #e7efff;
  color: #1e3a8a;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.scb__aprobfecha--rechazo {
  background: #fde2e2;
  color: #b42318;
}
.scb__rechazotag {
  display: inline-block;
  padding: 0 8px;
  border-radius: 999px;
  background: #fde2e2;
  color: #b42318;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.scb__revisar {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
.scb__muted {
  color: #98a2b3;
}
.scb__salida {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(46, 160, 67, 0.12);
  color: #1f7a35;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.scb__link {
  color: #0b5fd6;
  font-weight: 600;
}
.scb__acciones {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.scb__fechas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* celular y tablet */
.scb-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.scb-cards__vacio {
  padding: 24px 0;
  text-align: center;
  color: #6b7a90;
}
@media (max-width: 600px) {
  .scb__search {
    flex-basis: 100%;
    max-width: none;
  }
  .scb__fechas {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
