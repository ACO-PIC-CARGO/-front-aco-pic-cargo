<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import axios from "@/api/http";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import SolicitudCobroVerDialog from "@/components/folderBilling/SolicitudCobroVerDialog.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";
import { tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import { montoCobro, tieneAprobacionesCobro, useSolicitudCobro } from "@/composables/useSolicitudCobro";
import { CONNECTION_ERROR_MESSAGE, hasFailed, request } from "@/utils/request";
import { shortDate } from "@/utils/dates";
import { sessionBranchId } from "@/utils/sesion";
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
  columna("Voucher", "voucher"),
  columna("Estado", "estado"),
  columna("Administración", "adm"),
  columna("Gerencia", "ger"),
  ...(esRechazadas.value ? [columna("Motivo", "motivo_rechazo")] : [columna("Ingreso en Bancos", "ingreso")]),
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
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-filter-variant"
          @click="abrirFiltros"
        >
          FILTRAR
        </v-btn>
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
      <template #[`item.voucher`]="{ item }">
        <v-btn
          icon="mdi-file-eye-outline"
          size="small"
          variant="text"
          color="primary"
          :disabled="!item.voucher_path"
          :title="item.voucher_nombre || 'Ver voucher'"
          aria-label="Ver voucher del cliente"
          @click="abrir(item.voucher_path)"
        />
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
          <v-btn
            v-if="puedeRevisar(item, 'ADM')"
            size="x-small"
            color="orange-darken-2"
            variant="flat"
            :loading="revisando === item.codigo"
            @click="revisar(item, 'ADM')"
          >
            Confirmar
          </v-btn>
          <span
            v-else-if="a.usuario"
            class="scb__aprob"
          ><v-icon
            size="14"
            color="success"
          >mdi-check-circle</v-icon> {{ a.usuario }}<br>{{ fecha(a.fecha) }}</span>
          <span
            v-else-if="a.rechazado"
            class="text-error"
          >Rechazó</span>
          <span v-else>{{ a.pendiente ? "Pendiente" : "—" }}</span>
        </template>
      </template>
      <template #[`item.ger`]="{ item }">
        <template
          v-for="a in aprobaciones(item).filter((x) => x.tipo === 'GER')"
          :key="a.tipo"
        >
          <v-btn
            v-if="puedeRevisar(item, 'GER')"
            size="x-small"
            color="amber-darken-3"
            variant="flat"
            :loading="revisando === item.codigo"
            @click="revisar(item, 'GER')"
          >
            Confirmar
          </v-btn>
          <span
            v-else-if="a.usuario"
            class="scb__aprob"
          ><v-icon
            size="14"
            color="success"
          >mdi-check-circle</v-icon> {{ a.usuario }}<br>{{ fecha(a.fecha) }}</span>
          <span
            v-else-if="a.rechazado"
            class="text-error"
          >Rechazó</span>
          <span v-else>{{ a.pendiente ? "Pendiente" : "—" }}</span>
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
      <template #[`item.ingreso`]="{ item }">
        <a
          v-if="item.id_pagoingreso"
          href="#"
          class="scb__link"
          @click.prevent="verIngreso(item)"
        >N° {{ item.numerooperacion_ingreso }}</a>
        <span v-else>—</span>
      </template>
      <template #[`item.acciones`]="{ item }">
        <div class="scb__acciones">
          <v-btn
            v-if="item.codigo_estado === 'LISTO' && puedeRegistrar"
            size="x-small"
            color="green-darken-2"
            variant="flat"
            prepend-icon="mdi-bank-transfer-in"
            :loading="procesando === item.codigo"
            @click="registrarEnBancos(item)"
          >
            Registrar en Bancos
          </v-btn>
          <v-btn
            v-if="vigente(item) && puedeEliminar"
            icon="mdi-delete-outline"
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
      <article
        v-for="item in filas"
        :key="item.codigo"
        class="scb-card"
        :class="`scb-card--${item.codigo_estado.toLowerCase()}`"
      >
        <header class="scb-card__head">
          <v-chip
            size="x-small"
            variant="flat"
            :color="COLOR_ESTADO[item.codigo_estado] ?? 'grey'"
          >
            {{ item.estado }}
          </v-chip>
        </header>
        <div class="scb-card__cliente">
          {{ item.cliente }}
        </div>
        <div class="scb-card__monto">
          {{ montoCobro(item.monto, item.moneda) }}
        </div>
        <dl class="scb-card__datos">
          <dt>Expediente</dt>
          <dd>{{ item.expediente }} {{ item.correlativo ? `- ${item.correlativo}` : "" }}</dd>
          <dt>Cuenta</dt>
          <dd>{{ item.cuenta }}</dd>
          <dt>Depósito</dt>
          <dd>{{ fecha(item.fechadeposito) }} · N° {{ item.numerooperacion }}</dd>
          <dt>Solicitado</dt>
          <dd>{{ fecha(item.fechasolicitud) }} · {{ item.usuario_solicitud }}</dd>
          <template v-if="item.codigo_estado === 'RECHAZADA'">
            <dt>Motivo</dt>
            <dd class="text-error">
              {{ item.motivo_rechazo || "Sin motivo" }}
            </dd>
          </template>
          <template v-if="item.id_pagoingreso">
            <dt>Ingreso</dt>
            <dd>N° {{ item.numerooperacion_ingreso }}</dd>
          </template>
        </dl>
        <footer class="scb-card__acciones">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-file-eye-outline"
            :disabled="!item.voucher_path"
            @click="abrir(item.voucher_path)"
          >
            Voucher
          </v-btn>
          <v-btn
            v-if="puedeRevisar(item, 'ADM')"
            size="small"
            variant="flat"
            color="orange-darken-2"
            :loading="revisando === item.codigo"
            @click="revisar(item, 'ADM')"
          >
            Confirmar Adm.
          </v-btn>
          <v-btn
            v-if="puedeRevisar(item, 'GER')"
            size="small"
            variant="flat"
            color="amber-darken-3"
            :loading="revisando === item.codigo"
            @click="revisar(item, 'GER')"
          >
            Confirmar Ger.
          </v-btn>
          <v-btn
            v-if="item.codigo_estado === 'LISTO' && puedeRegistrar"
            size="small"
            variant="flat"
            color="green-darken-2"
            prepend-icon="mdi-bank-transfer-in"
            :loading="procesando === item.codigo"
            @click="registrarEnBancos(item)"
          >
            Registrar
          </v-btn>
          <v-btn
            v-if="vigente(item) && puedeEliminar"
            icon="mdi-delete-outline"
            size="small"
            variant="text"
            color="error"
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
        </footer>
      </article>
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
  gap: 6px;
  margin-left: auto;
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
.scb__aprob {
  font-size: 11.5px;
  line-height: 1.2;
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
.scb-card {
  padding: 10px 12px;
  border: 1px solid #d6dde8;
  border-left: 5px solid #90a4ae;
  border-radius: 12px;
  background: #fff;
}
.scb-card--penadm { border-left-color: #f57c00; }
.scb-card--penger { border-left-color: #ff8f00; }
.scb-card--listo { border-left-color: #1e88e5; }
.scb-card--cobrado { border-left-color: #2e7d32; }
.scb-card--rechazada { border-left-color: #e53935; }
.scb-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.scb-card__codigo {
  font-weight: 800;
  color: #0a1f44;
}
.scb-card__cliente {
  margin-top: 4px;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.scb-card__monto {
  font-size: 18px;
  font-weight: 900;
  color: #1b5e20;
}
.scb-card__datos {
  display: grid;
  grid-template-columns: 86px 1fr;
  gap: 2px 8px;
  margin: 6px 0;
  font-size: 12.5px;
}
.scb-card__datos dt {
  color: #6b7a90;
}
.scb-card__datos dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.scb-card__acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
@media (max-width: 600px) {
  .scb__search {
    flex-basis: 100%;
    max-width: none;
  }
  .scb__actions {
    width: 100%;
    margin-left: 0;
  }
  .scb__actions .v-btn {
    flex: 1 1 0;
  }
  .scb__fechas {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .scb-card__acciones .v-btn:not(.v-btn--icon) {
    flex: 1 1 calc(50% - 6px);
  }
}
</style>
