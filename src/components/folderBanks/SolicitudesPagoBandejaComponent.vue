<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";
import { tienePerfilRevision, useRevisionSolicitudPago } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import SoportePagoDialog from "@/components/folderBilling/SoportePagoDialog.vue";
import SolicitudPagoVerDialog from "@/components/folderBilling/SolicitudPagoVerDialog.vue";
import { CONNECTION_ERROR_MESSAGE, hasFailed, notifySuccess, request } from "@/utils/request";
import type {
  FacturaProveedorCargada,
  EstadoBandejaSolicitudPago,
  FiltrosBandejaSolicitudPago,
  OpcionFiltroSolicitudPago,
  SolicitudPagoBandeja,
  TabBandejaSolicitudPago,
} from "@/types/billingEntries";

// Una pestaña de Bancos > Solicitudes de Pago: listado paginado en el servidor.
// Tiene las mismas acciones que Pagos Pendientes de Control de Gastos.
const props = defineProps<{
  tab: TabBandejaSolicitudPago;
  opciones: OpcionFiltroSolicitudPago[];
}>();
const emit = defineEmits<{ total: [valor: number]; actualizado: [] }>();

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const ESTADOS: { codigo: EstadoBandejaSolicitudPago; titulo: string; tabs: TabBandejaSolicitudPago[] }[] = [
  { codigo: "PENADM", titulo: "Pendiente por Administración", tabs: ["PEN", "HIS"] },
  { codigo: "PENGER", titulo: "Pendiente por Gerencia", tabs: ["PEN", "HIS"] },
  { codigo: "LISTO", titulo: "Listo para transferir", tabs: ["PEN", "HIS"] },
  { codigo: "PAGADO", titulo: "Pagado", tabs: ["HIS"] },
  { codigo: "RECHAZADA", titulo: "Rechazada", tabs: ["HIS"] },
  { codigo: "ELIMINADA", titulo: "Eliminada", tabs: ["HIS"] },
];
const ICONO_ESTADO: Record<EstadoBandejaSolicitudPago, string> = {
  PENADM: "mdi-account-outline",
  PENGER: "mdi-clock-outline",
  LISTO: "mdi-send-outline",
  PAGADO: "mdi-cash-check",
  RECHAZADA: "mdi-close-circle-outline",
  ELIMINADA: "mdi-delete-outline",
};

const { can } = usePermissions();
const router = useRouter();
const puedeModificar = computed(() => can("solicitudesPagoBancos", "MODIFICAR"));
const puedeTransferir = computed(() => can("registroPayForProveedor", "NUEVO"));
const procesando = ref<number | null>(null);

// ver solicitud (ojito)
const dialogVer = ref(false);
const idSolicitudVer = ref<number | null>(null);
function verSolicitud(s: SolicitudPagoBandeja) {
  idSolicitudVer.value = s.id;
  dialogVer.value = true;
}

// anexos (facturas / proformas del proveedor)
const dialogAnexos = ref(false);
const anexos = ref<FacturaProveedorCargada[]>([]);
const anexoProveedor = ref("");
const cargandoAnexos = ref(false);
async function verAnexo(s: SolicitudPagoBandeja) {
  anexoProveedor.value = proveedor(s);
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
function nombreAnexo(a: FacturaProveedorCargada) {
  const tipo = a.type_pago == 1 ? "Factura" : a.type_pago == 2 ? "Proforma" : "Otro";
  return `${tipo}${a.number ? " - " + a.number : ""}`;
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
async function transferir(s: SolicitudPagoBandeja) {
  procesando.value = s.id;
  const response = await request<{ token: string }>({
    method: "put",
    url: URL_MAIN + "solicitud_pago_transferir/" + s.id,
  });
  procesando.value = null;
  const token = response.estadoflag ? response.data[0]?.token : null;
  if (!token) {
    Swal.fire({
      icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
      text: response.mensaje || CONNECTION_ERROR_MESSAGE,
    });
    emit("actualizado");
    return;
  }
  router.push({ name: "registroPagoSolicitud", params: { token } });
}
function verSalida(s: SolicitudPagoBandeja) {
  if (s.id_pagoegreso) window.open(`/home/FolderBanks/verPagosPorProveedor/${s.id_pagoegreso}`, "_blank");
}

// Aprobar / rechazar: Administración perfil 04, Gerencia perfil 01. Al cambiar, se recargan todas las pestañas
const { revisando, revisar } = useRevisionSolicitudPago(() => emit("actualizado"));
const dialogSoporte = ref(false);
const solicitudSoporte = ref<SolicitudPagoBandeja | null>(null);
function abrirSoporte(s: SolicitudPagoBandeja) {
  solicitudSoporte.value = s;
  dialogSoporte.value = true;
}
function aprobaciones(s: SolicitudPagoBandeja) {
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

const filas = ref<SolicitudPagoBandeja[]>([]);
const total = ref(0);
const cargando = ref(false);
const exportando = ref(false);
const pagina = ref(1);
const porPagina = ref(10);
const busqueda = ref("");

const filtrosVacios = (): FiltrosBandejaSolicitudPago => ({
  estado: null,
  id_proveedor: null,
  banco: null,
  tipopago: null,
  desde: "",
  hasta: "",
});
const filtros = ref<FiltrosBandejaSolicitudPago>(filtrosVacios());
// el panel edita un borrador; se aplica con "Aplicar filtros"
const borrador = ref<FiltrosBandejaSolicitudPago>(filtrosVacios());
const panelFiltros = ref(false);

const esRechazadas = computed(() => props.tab === "REC");
const opcionesEstado = computed(() =>
  ESTADOS.filter((e) => e.tabs.includes(props.tab)).map((e) => ({ title: e.titulo, value: e.codigo })),
);
const opcionesDe = (tipo: OpcionFiltroSolicitudPago["tipo"]) =>
  props.opciones.filter((o) => o.tipo === tipo).map((o) => ({ title: o.titulo, value: o.valor }));
const opcionesProveedor = computed(() =>
  opcionesDe("PROV").map((o) => ({ ...o, value: Number(o.value) })),
);
const opcionesBanco = computed(() => opcionesDe("BANCO"));
const opcionesMetodo = computed(() => opcionesDe("METODO"));

// chips de los filtros aplicados (se pueden quitar uno a uno)
const filtrosActivos = computed(() => {
  const f = filtros.value;
  const titulo = (lista: { title: string; value: unknown }[], valor: unknown) =>
    lista.find((o) => o.value === valor)?.title ?? String(valor);
  const chips: { clave: keyof FiltrosBandejaSolicitudPago | "fechas"; texto: string }[] = [];
  if (f.desde || f.hasta) {
    chips.push({ clave: "fechas", texto: `Fecha: ${f.desde ? formatoFecha(f.desde) : "…"} – ${f.hasta ? formatoFecha(f.hasta) : "…"}` });
  }
  if (f.estado) chips.push({ clave: "estado", texto: `Estado: ${titulo(opcionesEstado.value, f.estado)}` });
  if (f.id_proveedor) chips.push({ clave: "id_proveedor", texto: `Proveedor: ${titulo(opcionesProveedor.value, f.id_proveedor)}` });
  if (f.banco) chips.push({ clave: "banco", texto: `Banco: ${f.banco}` });
  if (f.tipopago) chips.push({ clave: "tipopago", texto: `Método: ${titulo(opcionesMetodo.value, f.tipopago)}` });
  return chips;
});
const hayFiltros = computed(() => filtrosActivos.value.length > 0 || !!busqueda.value.trim());

const headers = computed(() => [
  { title: "Fecha de solicitud", key: "fechasolicitud", sortable: false },
  { title: "Expediente", key: "expediente", sortable: false },
  { title: "Proveedor", key: "proveedor", sortable: false },
  { title: "Monto", key: "monto", sortable: false, align: "end" as const },
  { title: "Banco", key: "banco", sortable: false },
  { title: "Método de pago", key: "tipopago", sortable: false },
  { title: "Código / N° de cuenta", key: "cuenta", sortable: false },
  { title: "Estado", key: "estado", sortable: false },
  { title: "Administración", key: "adm", sortable: false, align: "center" as const },
  { title: "Gerencia", key: "ger", sortable: false, align: "center" as const },
  ...(esRechazadas.value
    ? [{ title: "Motivo", key: "motivo_rechazo", sortable: false }]
    : [
      { title: "Fecha de pago", key: "fechapago", sortable: false, align: "center" as const },
      { title: "Soporte", key: "soporte", sortable: false, align: "center" as const },
    ]),
]);

function parametros(paginar: boolean) {
  const f = filtros.value;
  return {
    tab: props.tab,
    search: busqueda.value.trim() || undefined,
    estado: esRechazadas.value ? undefined : f.estado || undefined,
    id_proveedor: f.id_proveedor || undefined,
    banco: f.banco || undefined,
    tipopago: f.tipopago || undefined,
    desde: f.desde || undefined,
    hasta: f.hasta || undefined,
    ...(paginar ? { page: pagina.value, limit: porPagina.value } : {}),
  };
}

let ultimaConsulta = 0;
async function cargar() {
  const consulta = ++ultimaConsulta;
  cargando.value = true;
  const response = await request<SolicitudPagoBandeja>({
    method: "get",
    url: URL_MAIN + "solicitud_pago_bandeja",
    params: parametros(true),
  });
  // una respuesta vieja (búsqueda anterior) no pisa a la más reciente
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
function limpiarBorrador() {
  borrador.value = filtrosVacios();
}
function quitarFiltro(clave: keyof FiltrosBandejaSolicitudPago | "fechas") {
  if (clave === "fechas") filtros.value = { ...filtros.value, desde: "", hasta: "" };
  else filtros.value = { ...filtros.value, [clave]: clave === "desde" || clave === "hasta" ? "" : null };
  irPrimeraPagina();
}
function limpiarTodo() {
  filtros.value = filtrosVacios();
  borrador.value = filtrosVacios();
  if (busqueda.value) busqueda.value = ""; // el watch de la búsqueda recarga
  else irPrimeraPagina();
}

async function exportar() {
  exportando.value = true;
  try {
    const { data } = await axios.get(URL_MAIN + "solicitud_pago_bandeja_exportar", {
      params: parametros(false),
      responseType: "blob",
    });
    const nombre = { PEN: "Pendientes", REC: "Rechazadas", HIS: "Historico" }[props.tab];
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `Solicitudes de Pago - ${nombre} ${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    Swal.fire({ icon: "error", text: "No se pudo generar el Excel. Intenta de nuevo." });
  }
  exportando.value = false;
}

function proveedor(s: SolicitudPagoBandeja) {
  return `${s.proveedor} (${s.id_proveedor})`;
}
function cuentaOCodigo(s: SolicitudPagoBandeja) {
  return (s.codigo_tipopago === "02" ? s.codigopago : s.nrocuenta) || "";
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
function abrir(url: string | null) {
  if (url) window.open(url, "_blank");
}

defineExpose({ cargar });
onMounted(cargar);
</script>

<template>
  <div class="spb">
    <!-- barra superior: buscar + Excel / Filtrar / Limpiar -->
    <div class="spb__toolbar">
      <v-text-field
        v-model="busqueda"
        class="spb__search"
        label="Buscar"
        placeholder="Proveedor, expediente, banco, cuenta, estado…"
        variant="outlined"
        density="compact"
        append-inner-icon="mdi-text-search"
        clearable
        hide-details
        @click:clear="busqueda = ''"
      />
      <v-spacer />
      <div class="spb__actions">
        <v-btn
          v-if="can('solicitudesPagoBancos', 'EXPORTAR')"
          color="success"
          size="small"
          :loading="exportando"
          @click="exportar"
        >
          EXCEL <v-icon
            size="small"
            end
          >
            mdi-file-excel
          </v-icon>
        </v-btn>
        <v-badge
          :model-value="filtrosActivos.length > 0"
          :content="filtrosActivos.length"
          color="error"
          offset-x="4"
          offset-y="4"
        >
          <v-btn
            color="info"
            size="small"
            @click="abrirFiltros"
          >
            Filtrar <v-icon
              size="small"
              end
            >
              mdi-filter
            </v-icon>
          </v-btn>
        </v-badge>
        <v-btn
          color="red"
          size="small"
          variant="outlined"
          :disabled="!hayFiltros"
          @click="limpiarTodo"
        >
          LIMPIAR <v-icon
            size="small"
            end
          >
            mdi-filter-remove
          </v-icon>
        </v-btn>
      </div>
    </div>

    <div
      v-if="filtrosActivos.length"
      class="spb__chips"
    >
      <v-chip
        v-for="c in filtrosActivos"
        :key="c.clave"
        size="small"
        color="primary"
        variant="tonal"
        closable
        @click:close="quitarFiltro(c.clave)"
      >
        {{ c.texto }}
      </v-chip>
    </div>

    <div class="spb__count">
      {{ total }} {{ total === 1 ? "resultado" : "resultados" }}
    </div>

    <div class="spb__tablewrap">
      <v-data-table-server
        v-model:page="pagina"
        v-model:items-per-page="porPagina"
        class="spb__table"
        :headers="headers"
        :items="filas"
        :items-length="total"
        :loading="cargando"
        :items-per-page-options="[10, 25, 50, 100]"
        item-value="id"
        density="comfortable"
        loading-text="Cargando solicitudes…"
        :no-data-text="hayFiltros ? 'No hay solicitudes que coincidan con la búsqueda o los filtros.' : 'No hay solicitudes de pago.'"
        items-per-page-text="Filas por página"
      >
        <template #[`item.fechasolicitud`]="{ item }">
          <span class="text-no-wrap">{{ formatoFecha(item.fechasolicitud) }}</span>
        </template>
        <template #[`item.expediente`]="{ item }">
          <div class="spb__exp">
            <v-btn
              icon="mdi-eye-outline"
              variant="tonal"
              size="x-small"
              color="primary"
              title="Ver solicitud de pago"
              aria-label="Ver solicitud de pago"
              @click="verSolicitud(item)"
            />
            <span class="spb__pill">{{ item.expediente }}</span>
          </div>
          <div
            v-if="item.correlativo"
            class="spb__sub"
          >
            Corr. {{ item.correlativo }}
          </div>
        </template>
        <template #[`item.proveedor`]="{ item }">
          <div class="spb__provrow">
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              size="x-small"
              color="primary"
              title="Copiar proveedor"
              aria-label="Copiar proveedor"
              @click="copiar(proveedor(item))"
            />
            <span class="spb__prov">{{ proveedor(item) }}</span>
          </div>
          <button
            type="button"
            class="spb__anexo"
            @click="verAnexo(item)"
          >
            <v-icon size="14">
              mdi-paperclip
            </v-icon> Ver anexo
          </button>
        </template>
        <template #[`item.monto`]="{ item }">
          <span class="spb__monto">{{ formatoMonto(item.monto) }} {{ item.moneda || "" }}</span>
        </template>
        <template #[`item.banco`]="{ item }">
          <span class="font-weight-bold">{{ item.banco || "—" }}</span>
        </template>
        <template #[`item.tipopago`]="{ item }">
          <span class="spb__metodo">
            <v-icon
              size="18"
              color="primary"
            >
              {{ item.codigo_tipopago === "02" ? "mdi-barcode" : "mdi-swap-horizontal" }}
            </v-icon>
            {{ item.tipopago || "—" }}
          </span>
        </template>
        <template #[`item.cuenta`]="{ item }">
          <div class="spb__cuenta">
            <span>{{ cuentaOCodigo(item) || "—" }}</span>
            <v-btn
              v-if="cuentaOCodigo(item)"
              icon="mdi-content-copy"
              variant="text"
              size="x-small"
              color="primary"
              title="Copiar"
              aria-label="Copiar código o número de cuenta"
              @click="copiar(cuentaOCodigo(item))"
            />
          </div>
        </template>
        <template #[`item.estado`]="{ item }">
          <v-tooltip location="top">
            <template #activator="{ props: tip }">
              <span
                v-bind="tip"
                class="spb__chip"
                :class="`spb__chip--${item.codigo_estado}`"
              >
                <v-icon size="16">{{ ICONO_ESTADO[item.codigo_estado] }}</v-icon>
                {{ item.estado }}
              </span>
            </template>
            <div>Solicitado: {{ item.usuario_solicitud || "—" }} · {{ formatoFechaHora(item.fechasolicitud) }}</div>
            <div v-if="item.usuario_aprobadoadministracion">
              Administración: {{ item.usuario_aprobadoadministracion }} · {{ formatoFechaHora(item.fecha_aprobadoadministracion) }}
            </div>
            <div v-if="item.usuario_aprobadogerencia">
              Gerencia: {{ item.usuario_aprobadogerencia }} · {{ formatoFechaHora(item.fecha_aprobadogerencia) }}
            </div>
            <div v-if="item.numerooperacion_pago">
              Salida N° {{ item.numerooperacion_pago }}
            </div>
            <div v-if="item.usuario_rechazo">
              Rechazado ({{ item.area_rechazo === "ADM" ? "Administración" : "Gerencia" }}): {{ item.usuario_rechazo }} · {{ formatoFechaHora(item.fecha_rechazo) }}
            </div>
            <div v-if="item.usuario_anulado">
              Eliminado: {{ item.usuario_anulado }} · {{ formatoFechaHora(item.fecha_anulado) }}
            </div>
          </v-tooltip>
        </template>
        <template #[`item.adm`]="{ item }">
          <template
            v-for="a in aprobaciones(item).slice(0, 1)"
            :key="a.tipo"
          >
            <div class="spb__aprob">
              <template v-if="a.usuario">
                <div class="spb__aprobuser">
                  {{ a.usuario }}
                </div>
                <span class="spb__aprobfecha">{{ formatoFechaHora(a.fecha) }}</span>
              </template>
              <template v-else-if="a.rechazado">
                <span class="spb__rechazotag">Rechazado</span>
                <div class="spb__aprobuser">
                  {{ item.usuario_rechazo || "—" }}
                </div>
                <span class="spb__aprobfecha spb__aprobfecha--rechazo">{{ formatoFechaHora(item.fecha_rechazo) }}</span>
              </template>
              <v-btn
                v-else-if="a.pendiente && puedeModificar && tienePerfilRevision(a.tipo)"
                size="small"
                variant="tonal"
                :color="a.tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
                class="spb__revisar"
                :loading="revisando === item.id"
                @click="revisar(item, a.tipo)"
              >
                Aprobar
              </v-btn>
              <span
                v-else
                class="spb__muted"
              >—</span>
            </div>
          </template>
        </template>
        <template #[`item.ger`]="{ item }">
          <template
            v-for="a in aprobaciones(item).slice(1)"
            :key="a.tipo"
          >
            <div class="spb__aprob">
              <template v-if="a.usuario">
                <div class="spb__aprobuser">
                  {{ a.usuario }}
                </div>
                <span class="spb__aprobfecha">{{ formatoFechaHora(a.fecha) }}</span>
              </template>
              <template v-else-if="a.rechazado">
                <span class="spb__rechazotag">Rechazado</span>
                <div class="spb__aprobuser">
                  {{ item.usuario_rechazo || "—" }}
                </div>
                <span class="spb__aprobfecha spb__aprobfecha--rechazo">{{ formatoFechaHora(item.fecha_rechazo) }}</span>
              </template>
              <v-btn
                v-else-if="a.pendiente && puedeModificar && tienePerfilRevision(a.tipo)"
                size="small"
                variant="tonal"
                :color="a.tipo === 'ADM' ? 'deep-purple' : 'amber-darken-3'"
                class="spb__revisar"
                :loading="revisando === item.id"
                @click="revisar(item, a.tipo)"
              >
                Aprobar
              </v-btn>
              <span
                v-else
                class="spb__muted"
              >—</span>
            </div>
          </template>
        </template>
        <template #[`item.fechapago`]="{ item }">
          <span class="text-no-wrap">{{ item.fechapago ? formatoFecha(item.fechapago) : "—" }}</span>
        </template>
        <template #[`item.soporte`]="{ item }">
          <div
            v-if="item.soporte_path"
            class="spb__soporte"
          >
            <v-btn
              icon="mdi-file-eye-outline"
              variant="text"
              size="small"
              color="primary"
              title="Ver soporte de pago"
              aria-label="Ver soporte de pago"
              @click="abrir(item.soporte_path)"
            />
            <!-- con el soporte cargado ya se puede registrar el pago en Bancos -->
            <button
              v-if="item.id_pagoegreso"
              type="button"
              class="spb__salida"
              title="Ver la salida registrada en Bancos"
              @click="verSalida(item)"
            >
              <v-icon
                size="16"
                color="success"
              >
                mdi-check-decagram
              </v-icon>
              Salida N° {{ item.numerooperacion_pago }}
            </button>
            <v-btn
              v-else-if="item.pagadoflag && item.codigo_estado === 'PAGADO' && puedeTransferir"
              size="small"
              color="success"
              variant="flat"
              prepend-icon="mdi-bank-transfer-out"
              :loading="procesando === item.id"
              @click="transferir(item)"
            >
              REGISTRAR EN BANCO
            </v-btn>
          </div>
          <!-- con las dos aprobaciones se carga el soporte (pide la fecha de pago) -->
          <v-btn
            v-else-if="item.codigo_estado !== 'ELIMINADA'"
            icon="mdi-file-upload-outline"
            variant="text"
            size="small"
            color="primary"
            title="Subir soporte de pago"
            aria-label="Subir soporte de pago"
            :disabled="item.codigo_estado !== 'LISTO' || !puedeModificar"
            @click="abrirSoporte(item)"
          />
          <span
            v-else
            class="spb__muted"
          >—</span>
        </template>
        <template #[`item.motivo_rechazo`]="{ item }">
          <span class="spb__motivo">{{ item.motivo_rechazo || "Sin motivo" }}</span>
        </template>
      </v-data-table-server>
    </div>

    <SoportePagoDialog
      v-model="dialogSoporte"
      :solicitud="solicitudSoporte"
      @guardado="emit('actualizado')"
    />

    <SolicitudPagoVerDialog
      v-model="dialogVer"
      :id-solicitud="idSolicitudVer"
    />

    <!-- anexos -->
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
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Cerrar"
            @click="dialogAnexos = false"
          />
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
              @click="abrir(a.path ?? null)"
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

    <!-- filtros: panel a la derecha -->
    <v-navigation-drawer
      v-model="panelFiltros"
      location="right"
      temporary
      width="380"
      class="spb__drawer"
    >
      <div class="spb__drawerhead">
        <div>
          <div class="spb__drawertitle">
            Filtrar solicitudes
          </div>
          <div class="spb__sub">
            Se aplican a esta pestaña
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar filtros"
          @click="panelFiltros = false"
        />
      </div>
      <div class="spb__drawerbody">
        <div class="spb__field">
          <label>Fecha de solicitud</label>
          <div class="spb__dates">
            <v-text-field
              v-model="borrador.desde"
              type="date"
              label="Desde"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field
              v-model="borrador.hasta"
              type="date"
              label="Hasta"
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>
        </div>
        <div
          v-if="!esRechazadas"
          class="spb__field"
        >
          <label>Estado</label>
          <v-select
            v-model="borrador.estado"
            :items="opcionesEstado"
            placeholder="Todos los estados"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </div>
        <div class="spb__field">
          <label>Proveedor</label>
          <v-autocomplete
            v-model="borrador.id_proveedor"
            :items="opcionesProveedor"
            placeholder="Todos los proveedores"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </div>
        <div class="spb__field">
          <label>Banco</label>
          <v-select
            v-model="borrador.banco"
            :items="opcionesBanco"
            placeholder="Todos los bancos"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </div>
        <div class="spb__field">
          <label>Método de pago</label>
          <v-select
            v-model="borrador.tipopago"
            :items="opcionesMetodo"
            placeholder="Todos los métodos"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          />
        </div>
      </div>
      <template #append>
        <div class="spb__drawerfoot">
          <v-btn
            variant="outlined"
            color="red"
            prepend-icon="mdi-refresh"
            @click="limpiarBorrador"
          >
            Limpiar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-filter-check"
            @click="aplicarFiltros"
          >
            Aplicar filtros
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>
  </div>
</template>

<style scoped>
.spb {
  --spb-primary: #1e3a8a;
  --spb-border: #dbe5f5;
  --spb-text: #1f2a44;
  --spb-muted: #5b6b86;
  color: var(--spb-text);
}
.spb__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.spb__search {
  flex: 0 1 560px;
  min-width: 240px;
}
.spb__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.spb__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.spb__count {
  margin: 12px 2px 8px;
  font-weight: 700;
  color: var(--spb-primary);
}
.spb__tablewrap {
  overflow-x: auto;
  border: 1px solid var(--spb-border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 16px rgba(30, 58, 138, 0.06);
}
.spb__table {
  font-size: 0.85rem;
  background: transparent;
}
.spb__table :deep(thead th) {
  background: #e7efff !important;
  color: var(--spb-primary) !important;
  font-weight: 700 !important;
  white-space: nowrap;
}
.spb__table :deep(tbody td) {
  border-bottom: 1px solid #edf1f8 !important;
}
.spb__table :deep(tbody tr:hover td) {
  background: #f8fbff;
}
.spb__pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  background: #e9eef8;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}
.spb__sub {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--spb-muted);
  white-space: nowrap;
}
.spb__muted {
  color: var(--spb-muted);
}
.spb__exp,
.spb__provrow,
.spb__cuenta,
.spb__soporte {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.spb__anexo {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0 28px;
  padding: 1px 10px;
  border: 1px solid #1e5bd8;
  border-radius: 999px;
  background: #fff;
  color: #1e5bd8;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}
.spb__anexo:hover {
  background: #eef4ff;
}
.spb__salida {
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
.spb__prov {
  font-weight: 700;
  color: var(--spb-primary);
}
.spb__monto {
  font-weight: 700;
  white-space: nowrap;
}
.spb__metodo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.spb__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  white-space: nowrap;
}
.spb__chip--LISTO {
  background: #dbeafe;
  color: #1e40af;
}
.spb__chip--PENGER {
  background: #fdf0c4;
  color: #7a5a00;
}
.spb__chip--PENADM {
  background: #ece2fc;
  color: #5b21b6;
}
.spb__chip--PAGADO {
  background: #d9f7e1;
  color: #166534;
}
.spb__chip--RECHAZADA {
  background: #fde2e2;
  color: #b42318;
}
.spb__chip--ELIMINADA {
  background: #eceff3;
  color: #475467;
}
.spb__aprob {
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
}
.spb__aprobuser {
  font-weight: 600;
  white-space: nowrap;
}
.spb__aprobfecha {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #e7efff;
  color: var(--spb-primary);
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}
.spb__aprobfecha--rechazo {
  background: #fde2e2;
  color: #b42318;
}
.spb__rechazotag {
  display: inline-block;
  padding: 0 8px;
  border-radius: 999px;
  background: #fde2e2;
  color: #b42318;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.spb__revisar {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 700;
}
.spb__motivo {
  display: inline-block;
  max-width: 280px;
  white-space: normal;
}
.spb__drawer {
  color: var(--spb-text);
}
.spb__drawerhead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 16px 12px;
  border-bottom: 1px solid var(--spb-border);
}
.spb__drawertitle {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--spb-primary);
}
.spb__drawerbody {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}
.spb__field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}
.spb__dates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.spb__drawerfoot {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--spb-border);
}
</style>
