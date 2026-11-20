<script setup lang="ts">
import { abrirArchivo } from "@/composables/useVisorArchivo";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import axios from "@/api/http";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import SolicitudCobroCardMovil from "@/components/folderBilling/SolicitudCobroCardMovil.vue";
import ConfirmarCobroDialog from "@/components/folderBilling/ConfirmarCobroDialog.vue";
import RechazarSolicitudDialog from "@/components/folderBilling/RechazarSolicitudDialog.vue";
import SoportesCobroDialog from "@/components/folderBilling/SoportesCobroDialog.vue";
import { useRechazoSolicitud, verMotivoRechazo } from "@/composables/useRechazoSolicitud";
import type { SolicitudConfirmar } from "@/components/folderBilling/ConfirmarCobroDialog.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";
import {
  areaRechazoCobro,
  esPagoParcial,
  faltaRegistrarCobro,
  filasPorSoporte,
  type FilaSoporteCobro,
  montoCobrado,
  montoCobro,
  tieneAprobacionesCobro,
  useSolicitudCobro,
} from "@/composables/useSolicitudCobro";
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
}>();
const emit = defineEmits<{ total: [valor: number]; actualizado: [] }>();

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const MENU = "ingresosPendientesConfirmar";
const ESTADOS: { codigo: CodigoEstadoSolicitudCobro; titulo: string; tabs: TabBandejaSolicitudCobro[] }[] = [
  { codigo: "LISTO", titulo: "Pendiente por confirmar", tabs: ["PEN", "HIS"] },
  { codigo: "CONFIRMADO", titulo: "Confirmado", tabs: ["PEN", "HIS"] },
  { codigo: "COBRADO", titulo: "Registrado en Bancos", tabs: ["HIS"] },
  { codigo: "RECHAZADA", titulo: "Rechazada", tabs: ["HIS"] },
  { codigo: "ELIMINADA", titulo: "Eliminada", tabs: ["HIS"] },
];

const { can } = usePermissions();
const router = useRouter();
const { smAndDown } = useDisplay();
const puedeModificar = computed(() => can(MENU, "MODIFICAR") || can("listControlGastos", "MODIFICAR"));
const puedeRegistrar = computed(() => can("registroPayForCliente", "NUEVO"));
const puedeEliminar = computed(() => can(MENU, "MODIFICAR") || can("listControlGastos", "ELIMINAR"));

const { procesando, eliminar, eliminarSoporte, registrarEnBancos, eliminarConfirmacion } = useSolicitudCobro(() => emit("actualizado"));
// una fila por soporte (pago cargado)
const filasSoporte = computed(() => filasPorSoporte(filas.value));
function eliminarFila(fila: FilaSoporteCobro<SolicitudCobroBandeja>) {
  const s = filas.value.find((x) => x.codigo === fila.codigo)!;
  if (fila._soporte && (s.soportes?.length ?? 0) > 1) eliminarSoporte(s, fila._soporte);
  else eliminar(s);
}
// sin aprobaciones: rechaza Administración (04 / 01) mientras está pendiente por confirmar
const { dialogRechazo, rechazoSel, puedeRechazar, tituloRechazar, abrirRechazo } = useRechazoSolicitud(areaRechazoCobro);
const motivoDe = (s: SolicitudCobroBandeja) =>
  verMotivoRechazo({ motivo: s.motivo_rechazo, usuario: s.usuario_rechazo, fecha: s.fecha_rechazo, area: s.area_rechazo });
// varios pagos parciales del cliente
const dialogSoportes = ref(false);
const solicitudSoportes = ref<SolicitudCobroBandeja | null>(null);
function verSoportes(s: SolicitudCobroBandeja) {
  solicitudSoportes.value = s;
  dialogSoportes.value = true;
}

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
  columna("Banco", "banco"),
  columna("N° de cuenta / Código", "nrocuenta"),
  columna("Estado", "estado"),
  ...(esRechazadas.value ? [columna("Motivo", "motivo_rechazo")] : []),
  columna("Soporte de pago (Cliente)", "soporte"),
  columna("Fecha de ingreso en banco", "fecha_ingreso"),
  columna("Soporte de confirmación (Administración)", "soporte_confirmacion"),
  columna("Persona que confirma", "usuario_confirma"),
  columna("Fecha de confirmación", "fecha_confirmacion"),
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
// celular: el soporte se ve en un modal (imagen o visor PDF); en la web, otra pestaña
function abrir(url: string | null | undefined) {
  abrirArchivo(url);
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
// estado con ícono (diseño del listado)
// Soporte de confirmación (Administración): subir con la fecha de ingreso en banco
const dialogConfirmar = ref(false);
const solicitudConfirmar = ref<SolicitudConfirmar | null>(null);
function abrirConfirmar(s: SolicitudConfirmar) {
  solicitudConfirmar.value = s;
  dialogConfirmar.value = true;
}
const ICONO_ESTADO_LISTA: Record<string, string> = {
  BORRADOR: "mdi-pencil-circle-outline",
  PENADM: "mdi-clock-outline",
  PENGER: "mdi-clock-outline",
  LISTO: "mdi-clock-outline",
  CONFIRMADO: "mdi-check-circle",
  COBRADO: "mdi-bank-check",
  RECHAZADA: "mdi-close-circle",
  ELIMINADA: "mdi-trash-can-outline",
};

// celular: grupos por estado que se pliegan (como Solicitudes de Pago)
const GRUPOS = [
  { codigo: "CONFIRMADO", titulo: "Confirmado", icono: "mdi-check-circle" },
  { codigo: "LISTO", titulo: "Pendiente por confirmar", icono: "mdi-clock-outline" },
  { codigo: "BORRADOR", titulo: "Sin enviar", icono: "mdi-pencil-circle-outline" },
  { codigo: "COBRADO", titulo: "Registrado en Bancos", icono: "mdi-cash-check" },
  { codigo: "RECHAZADA", titulo: "Rechazada", icono: "mdi-close-circle-outline" },
  { codigo: "ELIMINADA", titulo: "Eliminada", icono: "mdi-trash-can-outline" },
];
const gruposCerrados = ref<Record<string, boolean>>({});
const grupos = computed(() =>
  GRUPOS.map((g) => ({ ...g, items: filasSoporte.value.filter((f) => f.codigo_estado === g.codigo) })).filter((g) => g.items.length),
);
const vigente = (s: SolicitudCobroBandeja) => !["ELIMINADA", "COBRADO"].includes(s.codigo_estado);


// Al entrar a la vista se cargan las tres pestañas (Pendientes, Rechazadas e Histórico) a la vez;
// cambiar de pestaña no vuelve a consultar. Después de una acción (aprobar, rechazar, registrar...)
// la vista recarga las tres.
defineExpose({ cargar });
onMounted(cargar);
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
          append-icon="mdi-file-excel"
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
          v-if="!smAndDown"
          color="red"
          size="small"
          variant="outlined"
          append-icon="mdi-filter-remove"
          :disabled="!hayFiltros"
          @click="limpiarTodo"
        >
          LIMPIAR
        </v-btn>
        <v-btn
          v-else-if="hayFiltros"
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

    <!-- escritorio: tabla (mismo diseño que Bancos > Solicitudes de Pago) -->
    <div
      v-if="!smAndDown"
      class="scb__tablewrap"
    >
      <v-data-table-server
        v-model:page="pagina"
        v-model:items-per-page="porPagina"
        :headers="headers"
        :items="filasSoporte"
        :items-length="total"
        :loading="cargando"
        :items-per-page-options="[10, 25, 50, 100]"
        item-value="_key"
        density="comfortable"
        class="scb__tabla"
        loading-text="Cargando solicitudes…"
        :no-data-text="hayFiltros ? 'No hay solicitudes que coincidan con la búsqueda o los filtros.' : 'No hay solicitudes de cobro.'"
        items-per-page-text="Filas por página"
      >
        <!-- encabezados largos en dos filas -->
        <template #[`header.fecha_ingreso`]>
          Fecha de ingreso<br>en banco
        </template>
        <template #[`header.soporte_confirmacion`]>
          Soporte de confirmación<br>(Administración)
        </template>
        <template #[`header.fecha_confirmacion`]>
          Fecha de<br>confirmación
        </template>
        <template #[`item.fechasolicitud`]="{ item }">
          <div
            v-if="item.fechasolicitud"
            class="cobl__fecha"
          >
            <span>{{ soloFecha(item.fechasolicitud) }}</span>
            <span>{{ horaDe(item.fechasolicitud) }}</span>
          </div>
          <span v-else>Sin enviar</span>
        </template>
        <template #[`item.expediente`]="{ item }">
          <button
            type="button"
            class="cobl__exp"
            @click="verExpediente(item)"
          >
            {{ item.expediente }}
          </button>
          <div
            v-if="item.correlativo"
            class="cobl__corr"
          >
            Corr. {{ item.correlativo }}
          </div>
        </template>
        <template #[`item.cliente`]="{ item }">
          <span class="cobl__cliente">{{ item.cliente }}</span>
        </template>
        <template #[`item.monto`]="{ item }">
          <span class="cobl__monto">{{ montoCobro(montoCobrado(item), item.moneda) }}</span>
          <span
            v-if="esPagoParcial(item)"
            class="cobl__parcial"
          >Parcial de {{ montoCobro(item.monto, item.moneda) }}</span>
        </template>
        <template #[`item.banco`]="{ item }">
          <b>{{ item.banco || "—" }}</b>
        </template>
        <template #[`item.nrocuenta`]="{ item }">
          <span class="cobl__nowrap">{{ item.nrocuenta || "—" }}</span>
        </template>
        <template #[`item.estado`]="{ item }">
          <span
            class="cobl__estado"
            :class="`cobl__estado--${item.codigo_estado}`"
          >
            <v-icon size="16">{{ ICONO_ESTADO_LISTA[item.codigo_estado] ?? "mdi-circle-outline" }}</v-icon>
            {{ item.estado }}
          </span>
          <div
            v-if="item.codigo_estado === 'RECHAZADA'"
            class="cobl__motivo"
          >
            {{ item.motivo_rechazo || "Sin motivo" }}
          </div>
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
          <!-- un soporte: el ojo; dos o más: "Ver todos los soportes de ingreso" -->
          <v-btn
            v-if="(item.soportes_total ?? 1) > 1"
            variant="text"
            size="small"
            color="primary"
            prepend-icon="mdi-folder-open-outline"
            class="cobl__vertodos"
            data-modo-ver="permitido"
            @click="verSoportes(item)"
          >
            Ver todos los soportes de ingreso
          </v-btn>
          <div
            v-else
            class="cobl__iconos"
          >
            <v-btn
              icon="mdi-file-eye-outline"
              variant="text"
              size="small"
              color="primary"
              :disabled="!item.voucher_path"
              title="Ver soporte de pago del cliente"
              aria-label="Ver soporte de pago del cliente"
              data-modo-ver="permitido"
              @click="abrir(item.voucher_path)"
            />
            <v-btn
              icon="mdi-download"
              variant="text"
              size="small"
              color="primary"
              :disabled="!item.voucher_path"
              title="Descargar soporte de pago del cliente"
              aria-label="Descargar soporte de pago del cliente"
              data-modo-ver="permitido"
              @click="descargarArchivo(item.voucher_path, item.voucher_nombre)"
            />
          </div>
        </template>
        <template #[`item.fecha_ingreso`]="{ item }">
          <span
            v-if="item.fecha_ingreso"
            class="cobl__chipfecha"
          >{{ soloFecha(item.fecha_ingreso) }}</span>
          <span v-else>—</span>
        </template>
        <template #[`item.soporte_confirmacion`]="{ item }">
          <div
            v-if="item.soporte_confirmacion_path"
            class="cobl__soportecol"
          >
            <div class="cobl__iconos">
              <v-btn
                icon="mdi-file-eye-outline"
                variant="text"
                size="small"
                color="primary"
                title="Ver soporte de confirmación"
                aria-label="Ver soporte de confirmación"
                data-modo-ver="permitido"
                @click="abrir(item.soporte_confirmacion_path)"
              />
              <v-btn
                icon="mdi-download"
                variant="text"
                size="small"
                color="primary"
                title="Descargar soporte de confirmación"
                aria-label="Descargar soporte de confirmación"
                data-modo-ver="permitido"
                @click="descargarArchivo(item.soporte_confirmacion_path, item.soporte_confirmacion_nombre)"
              />
              <!-- ya confirmado: el soporte solo se elimina con la clave del Super administrador -->
              <v-btn
                v-if="puedeEliminar && !item.id_pagoingreso"
                icon="mdi-trash-can-outline"
                variant="text"
                size="small"
                color="error"
                title="Eliminar soporte de confirmación (requiere clave del Super administrador)"
                aria-label="Eliminar soporte de confirmación"
                :loading="procesando === item.codigo"
                @click="eliminarConfirmacion(item)"
              />
            </div>
            <!-- con el soporte cargado ya se puede registrar el ingreso en Bancos -->
            <button
              v-if="item.id_pagoingreso"
              type="button"
              class="cobl__ingreso"
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
          </div>
          <v-btn
            v-else
            icon="mdi-file-upload-outline"
            variant="text"
            size="small"
            color="primary"
            :disabled="item.codigo_estado !== 'LISTO' || !puedeModificar"
            :title="item.codigo_estado === 'LISTO' ? 'Subir soporte de confirmación' : 'Se sube cuando la solicitud está enviada (pendiente por confirmar)'"
            aria-label="Subir soporte de confirmación"
            @click="abrirConfirmar(item)"
          />
        </template>
        <template #[`item.usuario_confirma`]="{ item }">
          <b class="cobl__persona">{{ item.usuario_confirma || "—" }}</b>
        </template>
        <template #[`item.fecha_confirmacion`]="{ item }">
          <span
            v-if="item.fecha_confirmacion"
            class="cobl__chipfecha"
          >{{ soloFecha(item.fecha_confirmacion) }}<br>{{ horaDe(item.fecha_confirmacion) }}</span>
          <span v-else>—</span>
        </template>
        <template #[`item.acciones`]="{ item }">
          <div class="scb__acciones">
            <v-btn
              v-if="vigente(item) && puedeEliminar"
              icon="mdi-trash-can-outline"
              size="small"
              variant="text"
              color="error"
              :title="`Eliminar solicitud${tieneAprobacionesCobro(item) ? ' (requiere clave de administrador)' : ''}`"
              aria-label="Eliminar solicitud de cobro"
              :loading="procesando === item.codigo"
              @click="eliminarFila(item)"
            />
            <!-- confirmado: registrar el ingreso en Bancos (uno por pago cargado, mientras falte alguno) -->
            <v-btn
              v-if="item.codigo_estado === 'CONFIRMADO' && faltaRegistrarCobro(item) && puedeRegistrar"
              size="small"
              color="success"
              variant="flat"
              prepend-icon="mdi-bank-transfer-in"
              :loading="procesando === item.codigo"
              @click="registrarEnBancos(item)"
            >
              REGISTRAR EN BANCO<template v-if="(item.soportes_total ?? 1) > 1">
                ({{ (item.soportes_registrados ?? 0) + 1 }}/{{ item.soportes_total }})
              </template>
            </v-btn>
            <v-btn
              v-if="item.codigo_estado === 'RECHAZADA'"
              size="small"
              variant="outlined"
              rounded="lg"
              color="error"
              prepend-icon="mdi-comment-alert-outline"
              class="cobl__rechazar"
              data-modo-ver="permitido"
              @click="motivoDe(item)"
            >
              Ver motivo
            </v-btn>
            <v-btn
              v-else-if="vigente(item) && puedeModificar"
              size="small"
              variant="outlined"
              rounded="lg"
              color="error"
              class="cobl__rechazar"
              :disabled="!puedeRechazar(item.codigo_estado, true)"
              :title="tituloRechazar(item.codigo_estado)"
              @click="abrirRechazo(item.codigo, item.codigo_estado)"
            >
              Rechazar
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </div>

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
              :key="item._key"
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
                :puede-rechazar="puedeRechazar(item.codigo_estado, puedeModificar)"
                :puede-registrar="puedeRegistrar"
                :puede-confirmar="puedeModificar"
                :puede-eliminar="vigente(item) && puedeEliminar"
                :procesando="procesando === item.codigo"
                @rechazar="abrirRechazo(item.codigo, item.codigo_estado)"
                @ver-rechazo="motivoDe(item)"
                @ver-soportes="verSoportes(item)"
                @registrar="registrarEnBancos(item)"
                @confirmar="abrirConfirmar(item)"
                @eliminar-confirmacion="eliminarConfirmacion(item)"
                @ver-ingreso="verIngreso(item)"
                @eliminar="eliminarFila(item)"
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

    <RechazarSolicitudDialog
      v-model="dialogRechazo"
      :solicitud="rechazoSel"
      tipo="INGRESO"
      ruta="solicitud_cobro_rechazar"
      @rechazado="emit('actualizado')"
    />
    <SoportesCobroDialog
      v-model="dialogSoportes"
      :soportes="solicitudSoportes?.soportes ?? []"
      :moneda="solicitudSoportes?.moneda ?? null"
      :total="solicitudSoportes?.monto ?? 0"
      :cliente="solicitudSoportes?.cliente"
      :expediente="solicitudSoportes?.expediente"
      :correlativo="solicitudSoportes?.correlativo"
      :solicitud="solicitudSoportes"
    />
    <ConfirmarCobroDialog
      v-model="dialogConfirmar"
      :solicitud="solicitudConfirmar"
      @guardado="emit('actualizado')"
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
/* ===== listado de solicitudes de cobro (diseño acordado) ===== */
.cobl__soportecol {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.cobl__ingreso {
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
.cobl__fecha {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  white-space: nowrap;
}
/* expediente, cliente y monto como en Bancos > Solicitudes de Pago */
.cobl__exp {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  background: #e9eef8;
  color: #1f2a44;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}
button.cobl__exp:hover {
  text-decoration: underline;
}
.cobl__corr {
  margin-top: 2px;
  color: #5b6b86;
  font-size: 0.75rem;
  white-space: nowrap;
}
.cobl__cliente {
  font-weight: 700;
  color: #1e3a8a;
}
.cobl__persona {
  font-weight: 600;
  color: #1f2a44;
}
.cobl__monto {
  font-weight: 700;
  white-space: nowrap;
}
.cobl__nowrap {
  white-space: nowrap;
}
.cobl__estado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}
/* mismos colores que los estados de Solicitudes de Pago: pendiente de Administración en morado */
.cobl__estado--BORRADOR { background: #eceff3; color: #475467; }
.cobl__estado--PENADM,
.cobl__estado--LISTO { background: #ece2fc; color: #5b21b6; }
.cobl__estado--PENGER { background: #fdf0c4; color: #7a5a00; }
.cobl__estado--CONFIRMADO { background: #d9f7e1; color: #166534; }
.cobl__estado--CONFIRMADO .v-icon { color: #16a34a; }
.cobl__estado--COBRADO { background: #dbeafe; color: #1e40af; }
.cobl__estado--RECHAZADA { background: #fde2e2; color: #b42318; }
.cobl__estado--ELIMINADA { background: #eceff3; color: #475467; }
.cobl__motivo {
  max-width: 200px;
  margin: 4px auto 0;
  color: #b42318;
  font-size: 0.75rem;
}
.cobl__iconos {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.cobl__chipfecha {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  background: #e3ebfa;
  color: #1e3a8a;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
}
.scb__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.scb__search {
  flex: 0 1 560px;
  min-width: 240px;
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
  margin: 12px 2px 8px;
  font-weight: 700;
  color: #1e3a8a;
}
/* tabla: mismo contenedor, encabezados y scroll que Bancos > Solicitudes de Pago */
.scb__tablewrap {
  overflow-x: auto;
  border: 1px solid #dbe5f5;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.06);
  padding-bottom: 4px;
}
.scb__tabla {
  font-size: 0.85rem;
  color: #1f2a44;
  background: transparent;
}
@supports not selector(::-webkit-scrollbar) {
  .scb__tabla :deep(.v-table__wrapper) {
    scrollbar-color: #1e5bd8 #e7efff;
  }
}
.scb__tabla :deep(.v-table__wrapper::-webkit-scrollbar) {
  height: 12px;
}
.scb__tabla :deep(.v-table__wrapper::-webkit-scrollbar-track) {
  background: #e7efff;
}
.scb__tabla :deep(.v-table__wrapper::-webkit-scrollbar-thumb) {
  border: 2px solid #e7efff;
  border-radius: 999px;
  background: #1e5bd8;
}
.scb__tabla :deep(.v-table__wrapper::-webkit-scrollbar-thumb:hover) {
  background: #0b3d91;
}
.scb__tabla :deep(thead th) {
  background: #e7efff !important;
  color: #1e3a8a !important;
  font-weight: 700 !important;
  white-space: nowrap;
}
.scb__tabla :deep(tbody td) {
  border-bottom: 1px solid #edf1f8 !important;
}
.scb__tabla :deep(tbody tr:hover td) {
  background: #f8fbff;
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
.cobl__rechazar {
  min-width: 0;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.cobl__vertodos {
  height: auto !important;
  min-height: 28px;
  padding: 2px 6px !important;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0;
  text-decoration: underline;
  text-transform: none;
}
.cobl__vertodos :deep(.v-btn__content) {
  white-space: normal;
  text-align: center;
}
.cobl__parcial {
  display: block;
  margin-top: 2px;
  color: #b45309;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
