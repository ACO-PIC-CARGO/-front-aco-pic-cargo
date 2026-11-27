<script setup lang="ts">
import { abrirArchivo } from "@/composables/useVisorArchivo";
import ExpedienteVarios from "@/components/folderRequests/ExpedienteVarios.vue";
import SolicitudOrigenNota from "@/components/comun/SolicitudOrigenNota.vue";
// Vista móvil de solicitudes de pago: grupos por estado (se pliegan) y tarjetas que se despliegan.
// La usan Control de Gastos > Pagos Pendientes y Bancos > Solicitudes de Pago (cada pestaña).
import { computed, ref } from "vue";
import Swal from "sweetalert2";
import { tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import type { SolicitudPagoAccion } from "@/composables/useAccionesSolicitudPago";
import { tieneAprobacionesSolicitud, tieneSalidaBancosSolicitud } from "@/composables/useAccionesSolicitudPago";
import { notifySuccess } from "@/utils/request";
import { operacionBanco, usuarioCorto } from "@/utils/solicitudVista";
import { descargarArchivo } from "@/utils/descargarArchivo";
import type { ClientePagoEstado } from "@/types/billingEntries";
import type { ArchivosInstructivoSolicitud } from "@/composables/usePagoProveedorInstructivo";

export interface SolicitudPagoMovilItem extends SolicitudPagoAccion {
  expediente: string;
  codigo_estado: string;
  estado: string;
  banco: string | null;
  beneficiario?: string | null;
  tipopago: string | null;
  fechasolicitud: string;
  usuario_solicitud: string | null;
  fecha_aprobadoadministracion: string | null;
  fecha_aprobadogerencia: string | null;
  area_rechazo?: "ADM" | "GER" | null;
  usuario_rechazo?: string | null;
  fecha_rechazo?: string | null;
  motivo_rechazo?: string | null;
  usuario_anulado?: string | null;
  fecha_anulado?: string | null;
  pagadoflag: boolean | null;
  fechapago: string | null;
  soporte_path: string | null;
  soporte_nombre?: string | null;
  cliente_pago?: ClientePagoEstado | null;
  correlativo?: string | null;
  /** totales del proveedor en el expediente: Pricing y Operaciones (tarjeta cerrada) */
  total_pr?: number | string | null;
  total_op?: number | string | null;
  /** tiene el detalle del pago al proveedor del instructivo de Pricing (6.3) */
  pago_instructivoflag?: boolean | null;
  // del instructivo (6.3): N.° de factura comercial, captura de datos bancarios y factura del proveedor
  instructivo?: ArchivosInstructivoSolicitud | null;
  /** fecha de la salida en Bancos y su N° de operación */
  fecha_pago_banco?: string | null;
  numerooperacion_pago?: string | null;
  editadobancoflag?: boolean | null;
  motivo_edicion_banco?: string | null;
}

const props = defineProps<{
  items: SolicitudPagoMovilItem[];
  cargando?: boolean;
  /** subir soporte y aprobar */
  puedeAprobar: boolean;
  puedeTransferir: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  procesando?: number | null;
  revisando?: number | string | null;
  eliminando?: number | null;
  eliminandoSoporte?: number | null;
  /** botón "Ver anexo" (solo Bancos > Solicitudes de Pago; en Control de Gastos se quitó) */
  verAnexo?: boolean;
  /** Control de Gastos: avisar las solicitudes pedidas desde el Reporte (Administración) */
  notaOrigen?: boolean;
}>();
const emit = defineEmits<{
  aprobar: [s: SolicitudPagoMovilItem, tipo: AreaRevision];
  rechazar: [s: SolicitudPagoMovilItem];
  "ver-rechazo": [s: SolicitudPagoMovilItem];
  "subir-soporte": [s: SolicitudPagoMovilItem];
  transferir: [s: SolicitudPagoMovilItem];
  "ver-salida": [s: SolicitudPagoMovilItem];
  "ver-anexo": [s: SolicitudPagoMovilItem];
  editar: [s: SolicitudPagoMovilItem];
  eliminar: [s: SolicitudPagoMovilItem];
  "eliminar-soporte": [s: SolicitudPagoMovilItem];
  ver: [s: SolicitudPagoMovilItem];
  "ver-pago-instructivo": [s: SolicitudPagoMovilItem];
  // "Captura de los datos bancarios": solo esa sección del pago al proveedor
"ver-datos-bancarios": [s: SolicitudPagoMovilItem];
}>();

// "Captura de los datos bancarios": abre el archivo directo; sin archivo, la sección de datos bancarios
function verCapturaDatos(s: SolicitudPagoMovilItem) {
  const captura = s.instructivo?.captura;
  if (captura) abrirArchivo(captura.ruta, captura.name);
  else emit("ver-datos-bancarios", s);
}

const ESTADOS = [
  { codigo: "LISTO", titulo: "Listo para transferir", icono: "mdi-check-circle" },
  { codigo: "PENGER", titulo: "Pendiente por Gerencia", icono: "mdi-clock-outline" },
  { codigo: "PENADM", titulo: "Pendiente por Administración", icono: "mdi-account-outline" },
  { codigo: "PAGADO", titulo: "Pagado", icono: "mdi-cash-check" },
  { codigo: "RECHAZADA", titulo: "Rechazada", icono: "mdi-close-circle-outline" },
  { codigo: "ELIMINADA", titulo: "Eliminada", icono: "mdi-delete-outline" },
];
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const gruposCerrados = ref<Record<string, boolean>>({});
const tarjetasAbiertas = ref<Record<number, boolean>>({});

const grupos = computed(() =>
  ESTADOS.map((e) => ({
    ...e,
    // pagadas: primero las que falta registrar en Bancos y debajo las que ya tienen salida
    items: props.items
      .filter((s) => s.codigo_estado === e.codigo)
      .sort((x, y) => Number(tieneSalidaBancosSolicitud(x)) - Number(tieneSalidaBancosSolicitud(y))),
  })).filter((g) => g.items.length > 0),
);

const iconoEstado = (codigo: string) => ESTADOS.find((e) => e.codigo === codigo)?.icono ?? "mdi-circle-outline";
// en el listado de solicitudes va solo el nombre (sin el id del proveedor)
const etiquetaProveedor = (s: SolicitudPagoMovilItem) => s.proveedor;
// beneficiario de la cuenta de la solicitud o, si no tiene, el del instructivo (6.3)
const beneficiarioDe = (s: SolicitudPagoMovilItem) => s.beneficiario?.trim() || s.instructivo?.beneficiario || "";
const cuentaOCodigo = (s: SolicitudPagoMovilItem) => (s.codigo_tipopago === "02" ? s.codigopago || "" : s.nrocuenta || "");
const eliminada = (s: SolicitudPagoMovilItem) => s.codigo_estado === "ELIMINADA" || !!s.fecha_anulado;
const formatoMonto = (v: number | string) =>
  Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatoFecha(valor: string | null | undefined) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}-${MESES[Number(mes) - 1]}-${anio}`;
}
// icono según el giro que se lee en el nombre del proveedor
function iconoProveedor(nombre: string) {
  const n = (nombre || "").toUpperCase();
  if (/ADUAN/.test(n)) return "mdi-office-building-outline";
  if (/NAVIER|SHIPPING|LINE|MARITIM|LOGISTIC|WORLD/.test(n)) return "mdi-ferry";
  if (/TRANSP|CARGA|TRUCK|COURIER/.test(n)) return "mdi-truck-outline";
  if (/DEPOT|DEPOSIT|ALMAC|WAREHOUSE|TERMINAL/.test(n)) return "mdi-warehouse";
  return "mdi-storefront-outline";
}
const codigoProveedor = (s: SolicitudPagoMovilItem) => `${s.id_proveedor}${s.correlativo ? ` - ${s.correlativo}` : ""}`;
const tieneTotales = (s: SolicitudPagoMovilItem) => s.total_pr != null || s.total_op != null;
const fechaHora = (v: string | null | undefined) => (v ? `${formatoFecha(v)} ${v.slice(11, 16)}`.trim() : "");
// "Cliente pagó" como una sola píldora centrada (tarjeta abierta)
const CLIENTE_PAGO: Record<ClientePagoEstado, { texto: string; icono: string }> = {
  SI: { texto: "Sí", icono: "mdi-check-circle" },
  PARCIAL: { texto: "Parcial", icono: "mdi-circle-half-full" },
  NO: { texto: "No", icono: "mdi-close-circle" },
};
function seguimiento(s: SolicitudPagoMovilItem) {
  const filas: { titulo: string; icono: string; fecha: string; usuario: string | null; nota?: string | null; error?: boolean }[] = [
    { titulo: "Solicitado:", icono: "mdi-calendar-check-outline", fecha: formatoFecha(s.fechasolicitud), usuario: s.usuario_solicitud },
  ];
  if (s.usuario_aprobadoadministracion) {
    filas.push({ titulo: "Administración:", icono: "mdi-account-check-outline", fecha: fechaHora(s.fecha_aprobadoadministracion), usuario: s.usuario_aprobadoadministracion });
  }
  if (s.usuario_aprobadogerencia) {
    filas.push({ titulo: "Gerencia:", icono: "mdi-account-tie-outline", fecha: fechaHora(s.fecha_aprobadogerencia), usuario: s.usuario_aprobadogerencia });
  }
  if (s.usuario_rechazo) {
    filas.push({
      titulo: `Rechazado (${s.area_rechazo === "ADM" ? "Adm." : "Ger."}):`,
      icono: "mdi-close-circle-outline",
      fecha: fechaHora(s.fecha_rechazo),
      usuario: s.usuario_rechazo,
      nota: s.motivo_rechazo,
      error: true,
    });
  }
  if (eliminada(s)) {
    filas.push({ titulo: "Eliminada:", icono: "mdi-trash-can-outline", fecha: fechaHora(s.fecha_anulado), usuario: s.usuario_anulado ?? null, error: true });
  }
  // correo -> solo hasta la arroba (en el celular el correo completo se partía en dos líneas)
  return filas.map((f) => ({ ...f, usuario: usuarioCorto(f.usuario) }));
}
function tituloAccion(s: SolicitudPagoMovilItem, accion: "Editar" | "Eliminar") {
  if (tieneSalidaBancosSolicitud(s)) return "Ya está pagada en Bancos: elimine primero el movimiento";
  return `${accion} solicitud de pago${tieneAprobacionesSolicitud(s) ? " (requiere clave de administrador)" : ""}`;
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
// celular: el soporte se ve en un modal (imagen o visor PDF); en la web, otra pestaña
function abrir(url: string | null | undefined) {
  abrirArchivo(url);
}
</script>

<template>
  <div class="mov">
    <div
      v-if="!items.length"
      class="mov__empty"
    >
      <template v-if="cargando">
        Cargando solicitudes...
      </template>
      <!-- Control de Gastos explica dónde se crean; la bandeja de Bancos deja el texto corto -->
      <slot
        v-else
        name="vacio"
      >
        No hay solicitudes de pago.
      </slot>
    </div>
    <div
      v-for="g in grupos"
      :key="g.codigo"
    >
      <button
        type="button"
        class="mov__grouphead"
        :class="`mov__grouphead--${g.codigo}`"
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
        <div v-show="!gruposCerrados[g.codigo]">
          <template
            v-for="(s, i) in g.items"
            :key="s.id"
          >
            <!-- separador marcado entre solicitudes -->
            <v-divider
              v-if="i > 0"
              class="mov__sep"
              :thickness="2"
              opacity="1"
            />
            <article
              class="mov__card"
              :class="`mov__card--${s.codigo_estado}`"
            >
              <!-- cerrada: proveedor, código, estado, Pricing / Operaciones y "Ver más" -->
              <div
                v-if="!tarjetasAbiertas[s.id]"
                class="mov__resumen"
              >
                <div class="mov__resumenhead">
                  <span class="mov__resumenicon">
                    <v-icon size="24">{{ iconoProveedor(s.proveedor) }}</v-icon>
                  </span>
                  <div class="mov__resumenname">
                    <div class="mov__resumenprov">
                      {{ s.proveedor }}
                    </div>
                    <div class="mov__resumencode">
                      Código: {{ codigoProveedor(s) }}
                    </div>
                  </div>
                  <span
                    class="mov__chip"
                    :class="`mov__chip--${s.codigo_estado}`"
                  >
                    <v-icon size="14">{{ iconoEstado(s.codigo_estado) }}</v-icon>
                    {{ s.estado }}
                  </span>
                </div>
                <div
                  v-if="tieneTotales(s)"
                  class="mov__montos"
                >
                  <div>
                    <span class="mov__montolabel"><v-icon size="16">mdi-tag-outline</v-icon> Pricing ({{ s.moneda || "USD" }})</span>
                    <b>{{ formatoMonto(s.total_pr ?? 0) }}</b>
                  </div>
                  <div>
                    <span class="mov__montolabel"><v-icon size="16">mdi-cog-outline</v-icon> Operaciones ({{ s.moneda || "USD" }})</span>
                    <b>{{ formatoMonto(s.total_op ?? 0) }}</b>
                  </div>
                </div>
                <div
                  v-else
                  class="mov__montos mov__montos--uno"
                >
                  <div>
                    <span class="mov__montolabel"><v-icon size="16">mdi-cash</v-icon> Monto ({{ s.moneda || "USD" }})</span>
                    <b>{{ formatoMonto(s.monto) }}</b>
                  </div>
                </div>
                <div class="mov__resumenfoot">
                  <span class="mov__meta">
                    <ExpedienteVarios
                      tipo="pago"
                      :solicitud="s"
                    >
                      <span class="mov__pill">{{ s.expediente }}</span>
                    </ExpedienteVarios>
                    <!-- ya registrada en Bancos > Salidas -->
                    <span
                      v-if="s.id_pagoegreso"
                      class="mov__chip mov__chip--salida"
                    >
                      <v-icon size="14">mdi-check-decagram</v-icon>
                      {{ operacionBanco(s, "Salida", s.numerooperacion_pago) }}
                    </span>
                  </span>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    rounded="pill"
                    append-icon="mdi-chevron-down"
                    data-modo-ver="permitido"
                    class="mov__vermas"
                    @click="tarjetasAbiertas[s.id] = true"
                  >
                    Ver más
                  </v-btn>
                </div>
              </div>
              <!-- abierta (diseño móvil): proveedor + copiar, monto, cliente pagó, expediente y estado -->
              <div
                v-else
                class="mov__xhead"
              >
                <span class="mov__xicon">
                  <v-icon size="26">mdi-bank-outline</v-icon>
                </span>
                <span class="mov__xprov">{{ etiquetaProveedor(s) }}</span>
                <v-btn
                  icon
                  variant="tonal"
                  size="small"
                  color="primary"
                  title="Copiar proveedor"
                  aria-label="Copiar proveedor"
                  data-modo-ver="permitido"
                  @click="copiar(etiquetaProveedor(s))"
                >
                  <v-icon size="18">
                    mdi-content-copy
                  </v-icon>
                </v-btn>
              </div>

              <v-expand-transition>
                <div
                  v-show="tarjetasAbiertas[s.id]"
                  class="mov__cardbody"
                >
                  <div class="mov__xmonto">
                    <v-icon
                      size="34"
                      class="mov__xmontoicon"
                    >
                      mdi-database
                    </v-icon>
                    <span class="mov__xmontoval">{{ formatoMonto(s.monto) }} {{ s.moneda || "USD" }}</span>
                    <!-- el monto que se paga, para pegarlo en el banco -->
                    <v-btn
                      icon
                      variant="tonal"
                      size="small"
                      color="primary"
                      class="mov__xmontocopy"
                      title="Copiar monto"
                      aria-label="Copiar monto"
                      data-modo-ver="permitido"
                      @click="copiar(Number(s.monto || 0).toFixed(2))"
                    >
                      <v-icon size="18">
                        mdi-content-copy
                      </v-icon>
                    </v-btn>
                  </div>

                  <div
                    v-if="s.cliente_pago"
                    class="mov__xcenter"
                  >
                    <span
                      class="mov__xclipago"
                      :class="`mov__xclipago--${s.cliente_pago}`"
                    >
                      <v-icon size="18">{{ CLIENTE_PAGO[s.cliente_pago].icono }}</v-icon>
                      Cliente pagó: {{ CLIENTE_PAGO[s.cliente_pago].texto }}
                    </span>
                  </div>

                  <div class="mov__xexp">
                    Expediente:
                    <ExpedienteVarios
                      tipo="pago"
                      :solicitud="s"
                    >
                      <b>{{ s.expediente }}</b>
                    </ExpedienteVarios>
                  </div>

                  <div class="mov__xestado">
                    <span
                      class="mov__chip mov__chip--lg"
                      :class="`mov__chip--${s.codigo_estado}`"
                    >
                      <v-icon size="20">{{ iconoEstado(s.codigo_estado) }}</v-icon>
                      {{ s.estado }}
                    </span>
                    <SolicitudOrigenNota
                      v-if="notaOrigen && s.multiexpedienteflag"
                      origen="adm"
                      tipo="pago"
                    />
                    <span
                      v-if="s.id_pagoegreso"
                      class="mov__chip mov__chip--salida"
                    >
                      <v-icon size="14">mdi-check-decagram</v-icon>
                      {{ operacionBanco(s, "Salida", s.numerooperacion_pago) }}
                    </span>
                    <!-- "Ver más" abre la tarjeta; "Ver menos" la cierra -->
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      rounded="pill"
                      append-icon="mdi-chevron-up"
                      class="ml-auto mov__vermas"
                      data-modo-ver="permitido"
                      @click="tarjetasAbiertas[s.id] = false"
                    >
                      Ver menos
                    </v-btn>
                  </div>

                  <!-- datos para pagar: Método de pago, Banco, SWIFT (del instructivo), Beneficiario, Cuenta, N.° de Factura Comercial -->
                  <div class="mov__detail">
                    <dl>
                      <dt>
                        <v-icon size="18">
                          mdi-credit-card-outline
                        </v-icon> Método de pago:
                      </dt>
                      <dd class="mov__cuenta">
                        <span>{{ s.tipopago || "—" }}</span>
                      </dd>
                      <dt>
                        <v-icon size="18">
                          mdi-bank-outline
                        </v-icon> Banco:
                      </dt>
                      <dd class="mov__cuenta">
                        <span>{{ s.banco || "—" }}</span>
                      </dd>
                      <template v-if="s.instructivo?.codigo_swift">
                        <dt>
                          <v-icon size="18">
                            mdi-web
                          </v-icon> SWIFT:
                        </dt>
                        <dd class="mov__cuenta">
                          <span>{{ s.instructivo?.codigo_swift || "—" }}</span>
                          <v-btn
                            v-if="s.instructivo?.codigo_swift"
                            icon
                            variant="text"
                            size="x-small"
                            color="primary"
                            title="Copiar"
                            data-modo-ver="permitido"
                            @click="copiar(s.instructivo?.codigo_swift)"
                          >
                            <v-icon>mdi-content-copy</v-icon>
                          </v-btn>
                        </dd>
                      </template>
                      <template v-if="beneficiarioDe(s)">
                        <dt>
                          <v-icon size="18">
                            mdi-account-outline
                          </v-icon> Beneficiario:
                        </dt>
                        <dd class="mov__cuenta">
                          <span>{{ beneficiarioDe(s) || "—" }}</span>
                          <v-btn
                            v-if="beneficiarioDe(s)"
                            icon
                            variant="text"
                            size="x-small"
                            color="primary"
                            title="Copiar"
                            data-modo-ver="permitido"
                            @click="copiar(beneficiarioDe(s))"
                          >
                            <v-icon>mdi-content-copy</v-icon>
                          </v-btn>
                        </dd>
                      </template>
                      <dt>
                        <v-icon size="18">
                          mdi-wallet-outline
                        </v-icon>
                        {{ s.codigo_tipopago === "02" ? "Código:" : "N.° de cuenta:" }}
                      </dt>
                      <dd class="mov__cuenta">
                        <span>{{ cuentaOCodigo(s) || "—" }}</span>
                        <v-btn
                          v-if="cuentaOCodigo(s)"
                          icon
                          variant="text"
                          size="x-small"
                          color="primary"
                          title="Copiar"
                          data-modo-ver="permitido"
                          @click="copiar(cuentaOCodigo(s))"
                        >
                          <v-icon>mdi-content-copy</v-icon>
                        </v-btn>
                      </dd>
                      <template v-if="s.instructivo?.nro_factura">
                        <dt>
                          <v-icon size="18">
                            mdi-pound-box-outline
                          </v-icon> N.° de Factura Comercial:
                        </dt>
                        <dd class="mov__cuenta">
                          <span>{{ s.instructivo?.nro_factura || "—" }}</span>
                          <v-btn
                            v-if="s.instructivo?.nro_factura"
                            icon
                            variant="text"
                            size="x-small"
                            color="primary"
                            title="Copiar"
                            data-modo-ver="permitido"
                            @click="copiar(s.instructivo?.nro_factura)"
                          >
                            <v-icon>mdi-content-copy</v-icon>
                          </v-btn>
                        </dd>
                      </template>
                    </dl>
                  </div>

                  <div
                    v-if="s.total_pr != null"
                    class="mov__xpricing"
                  >
                    <v-icon
                      size="24"
                      color="#1e5bd8"
                    >
                      mdi-database
                    </v-icon>
                    <span class="mov__xpricinglabel">Monto según Pricing:</span>
                    <b>{{ formatoMonto(s.total_pr) }} {{ s.moneda || "USD" }}</b>
                  </div>

                  <!-- seguimiento: etiqueta arriba y "fecha | usuario" debajo -->
                  <div class="mov__xlinea">
                    <div
                      v-for="f in seguimiento(s)"
                      :key="f.titulo"
                      class="mov__xrow"
                      :class="{ 'mov__xrow--error': f.error }"
                    >
                      <div class="mov__xrowlabel">
                        <v-icon size="20">
                          {{ f.icono }}
                        </v-icon>
                        {{ f.titulo }}
                      </div>
                      <div class="mov__xrowpill">
                        <span>{{ f.fecha }}</span>
                        <span class="mov__xrowuser">{{ f.usuario || "—" }}</span>
                      </div>
                      <div
                        v-if="f.nota"
                        class="mov__xrownota"
                      >
                        {{ f.nota }}
                      </div>
                    </div>
                    <!-- Fecha de pago: mismo diseño que las filas de arriba (etiqueta y "fecha | detalle") -->
                    <div
                      class="mov__xrow"
                      :class="{ 'mov__xrow--inline': !s.pagadoflag }"
                    >
                      <div class="mov__xrowlabel">
                        <v-icon size="20">
                          mdi-calendar-check-outline
                        </v-icon>
                        Fecha de pago:
                      </div>
                      <div
                        v-if="s.pagadoflag"
                        class="mov__xrowpill"
                      >
                        <span>{{ formatoFecha(s.fechapago) }}</span>
                        <span class="mov__xrowuser">Soporte de pago</span>
                      </div>
                      <span
                        v-else
                        class="mov__xpendiente"
                      >{{ s.codigo_estado === "LISTO" ? "Se ingresa al subir el soporte" : "Pendiente" }}</span>
                    </div>
                    <!-- ya pasó por Bancos: fecha de la salida y su número -->
                    <div
                      v-if="s.fecha_pago_banco"
                      class="mov__xrow"
                    >
                      <div class="mov__xrowlabel">
                        <v-icon size="20">
                          mdi-bank-check
                        </v-icon>
                        Registrado en Bancos:
                      </div>
                      <div class="mov__xrowpill">
                        <span>{{ formatoFecha(s.fecha_pago_banco) }}</span>
                        <span class="mov__xrowuser">{{ s.numerooperacion_pago || s.editadobancoflag ? operacionBanco(s, "Salida", s.numerooperacion_pago) : "Salida registrada" }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="mov__cardactions">
                    <template v-if="s.pagadoflag && !eliminada(s)">
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="primary"
                        rounded="pill"
                        prepend-icon="mdi-file-eye-outline"
                        data-modo-ver="permitido"
                        @click="abrir(s.soporte_path)"
                      >
                        Ver soporte
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="primary"
                        rounded="pill"
                        prepend-icon="mdi-download"
                        data-modo-ver="permitido"
                        @click="descargarArchivo(s.soporte_path, s.soporte_nombre)"
                      >
                        Descargar
                      </v-btn>
                      <!-- ya se pagó: el soporte solo se elimina con la clave del Super administrador -->
                      <v-btn
                        v-if="puedeEliminar && !s.id_pagoegreso"
                        size="small"
                        variant="tonal"
                        color="error"
                        rounded="pill"
                        prepend-icon="mdi-trash-can-outline"
                        title="Eliminar soporte de pago (requiere clave del Super administrador)"
                        :loading="eliminandoSoporte === s.id"
                        @click="emit('eliminar-soporte', s)"
                      >
                        Eliminar soporte
                      </v-btn>
                      <v-btn
                        v-if="s.id_pagoegreso"
                        size="small"
                        variant="tonal"
                        color="success"
                        rounded="pill"
                        prepend-icon="mdi-check-decagram"
                        data-modo-ver="permitido"
                        @click="emit('ver-salida', s)"
                      >
                        {{ operacionBanco(s, "Salida", s.numerooperacion_pago) }}
                      </v-btn>
                      <v-btn
                        v-else-if="puedeTransferir"
                        size="small"
                        variant="flat"
                        color="success"
                        rounded="pill"
                        prepend-icon="mdi-bank-transfer-out"
                        :loading="procesando === s.id"
                        @click="emit('transferir', s)"
                      >
                        REGISTRAR EN BANCO
                      </v-btn>
                    </template>
                    <template v-else-if="puedeAprobar && !eliminada(s)">
                      <v-btn
                        v-if="s.codigo_estado === 'LISTO'"
                        size="small"
                        variant="outlined"
                        color="primary"
                        rounded="pill"
                        prepend-icon="mdi-upload"
                        @click="emit('subir-soporte', s)"
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
                        @click="emit('aprobar', s, 'ADM')"
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
                        @click="emit('aprobar', s, 'GER')"
                      >
                        Aprobar Gerencia
                      </v-btn>
                      <!-- rechaza solo el paso pendiente y solo quien puede aprobarlo -->
                      <v-btn
                        v-if="(s.codigo_estado === 'PENADM' && tienePerfilRevision('ADM')) || (s.codigo_estado === 'PENGER' && tienePerfilRevision('GER'))"
                        size="small"
                        color="error"
                        variant="outlined"
                        rounded="pill"
                        prepend-icon="mdi-close-circle-outline"
                        @click="emit('rechazar', s)"
                      >
                        Rechazar
                      </v-btn>
                    </template>
                    <v-btn
                      v-if="s.codigo_estado === 'RECHAZADA'"
                      size="small"
                      variant="outlined"
                      color="error"
                      rounded="pill"
                      prepend-icon="mdi-comment-alert-outline"
                      data-modo-ver="permitido"
                      @click="emit('ver-rechazo', s)"
                    >
                      Ver motivo
                    </v-btn>
                    <v-btn
                      v-if="verAnexo"
                      size="small"
                      variant="outlined"
                      color="primary"
                      rounded="pill"
                      prepend-icon="mdi-paperclip"
                      data-modo-ver="permitido"
                      @click="emit('ver-anexo', s)"
                    >
                      Ver anexo
                    </v-btn>
                  </div>

                  <!-- 1. editar  2. eliminar  3. ver -->
                  <div class="mov__cardactions mov__cardactions--fin">
                    <v-btn
                      v-if="puedeEditar && !eliminada(s) && (notaOrigen || !s.multiexpedienteflag)"
                      size="small"
                      variant="tonal"
                      :color="tieneSalidaBancosSolicitud(s) ? 'grey' : 'primary'"
                      rounded="pill"
                      prepend-icon="mdi-pencil-outline"
                      :title="tituloAccion(s, 'Editar')"
                      @click="emit('editar', s)"
                    >
                      Editar
                    </v-btn>
                    <v-btn
                      v-if="puedeEliminar && !eliminada(s)"
                      size="small"
                      variant="tonal"
                      :color="tieneSalidaBancosSolicitud(s) ? 'grey' : 'error'"
                      rounded="pill"
                      prepend-icon="mdi-trash-can-outline"
                      :title="tituloAccion(s, 'Eliminar')"
                      :loading="eliminando === s.id"
                      @click="emit('eliminar', s)"
                    >
                      Eliminar
                    </v-btn>
                    <v-btn
                      v-if="s.pago_instructivoflag"
                      size="small"
                      variant="tonal"
                      color="primary"
                      rounded="pill"
                      prepend-icon="mdi-eye-outline"
                      data-modo-ver="permitido"
                      @click="emit('ver-pago-instructivo', s)"
                    >
                      Pago proveedor
                    </v-btn>
                    <!-- mismo modal que "Pago proveedor": los datos bancarios del proveedor para copiar -->
                    <v-btn
                      v-if="s.pago_instructivoflag"
                      size="small"
                      variant="tonal"
                      color="indigo"
                      rounded="pill"
                      prepend-icon="mdi-bank-outline"
                      class="mov__captura"
                      data-modo-ver="permitido"
                      @click="verCapturaDatos(s)"
                    >
                      Captura de los datos bancarios
                    </v-btn>
                    <!-- Factura Comercial / Proforma que se subió en el 6.3: se abre directo -->
                    <v-btn
                      v-if="s.instructivo?.factura"
                      size="small"
                      variant="tonal"
                      color="success"
                      rounded="pill"
                      prepend-icon="mdi-file-document-outline"
                      class="mov__captura"
                      data-modo-ver="permitido"
                      @click="abrirArchivo(s.instructivo.factura.ruta, s.instructivo.factura.name)"
                    >
                      Factura del proveedor
                    </v-btn>
                    <!-- la que viene del instructivo se ve con "Pago proveedor" (sin Ver solicitud) -->
                    <v-btn
                      v-if="!s.pago_instructivoflag"
                      size="small"
                      variant="flat"
                      color="primary"
                      rounded="pill"
                      prepend-icon="mdi-eye-outline"
                      data-modo-ver="permitido"
                      @click="emit('ver', s)"
                    >
                      Ver solicitud
                    </v-btn>
                  </div>
                </div>
              </v-expand-transition>
            </article>
          </template>
        </div>
      </v-expand-transition>
    </div>
  </div>
</template>

<style scoped>
.mov {
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
  --sp-grey-bg: #eceff3;
  --sp-grey-fg: #475467;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--sp-text);
  font-size: 0.92rem;
}
/* aviso vacío: recuadro blanco, igual que Solicitudes de Cobro */
.mov__empty {
  padding: 14px;
  border: 1px dashed #c9d3e1;
  border-radius: 12px;
  background: #ffffff;
  color: #5b6b86;
  text-align: center;
}
.mov__grouphead {
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
.mov__grouphead--LISTO { background: var(--sp-green-bg); color: #14532d; }
.mov__grouphead--LISTO .v-icon:first-child { color: var(--sp-green-fg); }
.mov__grouphead--PENGER { background: var(--sp-amber-bg); color: #4a3600; }
.mov__grouphead--PENADM { background: var(--sp-purple-bg); color: #3b1a7a; }
.mov__grouphead--RECHAZADA { background: var(--sp-red-bg); color: var(--sp-red-fg); }
.mov__grouphead--PAGADO { background: var(--sp-blue-bg); color: var(--sp-blue-fg); }
.mov__grouphead--ELIMINADA { background: var(--sp-grey-bg); color: var(--sp-grey-fg); }
/* sin borde izquierdo en móvil: todo el ancho para el contenido */
.mov__card {
  position: relative;
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid var(--sp-border);
  border-radius: 16px;
  background: var(--sp-surface);
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.08);
}
/* separador entre solicitudes: marcado para no confundir una tarjeta con otra */
.mov__sep {
  margin: 4px 8px 14px;
  border-color: #9fb4d6;
}
.mov__cardhead {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 12px;
  text-align: left;
}
.mov__cardicon {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--sp-soft);
}
.mov__cardmain {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}
/* nombre completo: hasta 2 líneas */
.mov__provname {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--sp-primary);
  word-break: break-word;
}
.mov__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.mov__pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: #e3ebfa;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}
.mov__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px 3px 6px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  white-space: nowrap;
}
.mov__chip--LISTO { background: var(--sp-green-bg); color: var(--sp-green-fg); }
.mov__chip--PENGER { background: var(--sp-amber-bg); color: var(--sp-amber-fg); }
.mov__chip--PENADM { background: var(--sp-purple-bg); color: var(--sp-purple-fg); }
.mov__chip--RECHAZADA { background: var(--sp-red-bg); color: var(--sp-red-fg); }
.mov__chip--PAGADO { background: var(--sp-blue-bg); color: var(--sp-blue-fg); }
.mov__chip--ELIMINADA { background: var(--sp-grey-bg); color: var(--sp-grey-fg); }
.mov__chip--salida { background: var(--sp-green-bg); color: var(--sp-green-fg); }
.mov__cardmonto {
  flex: 0 0 auto;
  align-self: center;
  padding: 6px 0 6px 10px;
  border-left: 1px solid var(--sp-border);
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--sp-primary);
  white-space: nowrap;
}
.mov__cardmonto small {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--sp-accent);
}
.mov__cardbody {
  padding: 0 12px 12px;
}
/* tarjeta cerrada */
.mov__resumen {
  padding: 12px;
}
.mov__resumenhead {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.mov__resumenicon {
  display: grid;
  flex: 0 0 44px;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--sp-soft);
  color: var(--sp-primary);
}
.mov__resumenname {
  flex: 1 1 auto;
  min-width: 0;
}
.mov__resumenprov {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.98rem;
  font-weight: 900;
  line-height: 1.2;
  text-transform: uppercase;
  color: var(--sp-primary);
  word-break: break-word;
}
.mov__resumencode {
  margin-top: 2px;
  font-size: 0.82rem;
  color: var(--sp-muted);
}
.mov__resumenhead .mov__chip {
  flex: 0 1 auto;
  max-width: 45%;
  white-space: normal;
  line-height: 1.15;
}
.mov__montos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: 10px;
  padding: 8px 4px;
  border-radius: 12px;
  background: #f1f5fc;
}
.mov__montos--uno {
  grid-template-columns: 1fr;
}
.mov__montos > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 0 10px;
}
.mov__montos > div + div {
  border-left: 1px solid var(--sp-border);
}
.mov__montolabel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: var(--sp-muted);
  white-space: nowrap;
}
.mov__montos b {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--sp-text);
}
.mov__resumenfoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}
.mov__vermas {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 800;
}
/* tarjeta abierta (diseño móvil) */
.mov__xhead {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px 10px;
}
.mov__xicon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--sp-text);
}
.mov__xprov {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.2;
  color: var(--sp-text);
  word-break: break-word;
}
.mov__xmonto {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 12px;
  border-radius: 14px;
  background: #fff4e5;
}
.mov__xmontoicon {
  padding-right: 14px;
  border-right: 2px solid #f4a259;
  color: #f59e0b;
}
.mov__xmontoval {
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1.1;
  color: #f2600c;
  overflow-wrap: anywhere;
}
.mov__xcenter {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
.mov__xclipago {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 999px;
  font-weight: 700;
}
.mov__xclipago--NO { background: var(--sp-red-bg); color: var(--sp-red-fg); }
.mov__xclipago--PARCIAL { background: #ffedd5; color: #c2410c; }
.mov__xclipago--SI { background: var(--sp-green-bg); color: var(--sp-green-fg); }
.mov__xexp {
  margin: 10px 8px 0;
  padding: 7px 12px;
  border-radius: 999px;
  background: #e8edf6;
  text-align: center;
  overflow-wrap: anywhere;
}
.mov__xestado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 12px 0 8px;
}
.mov__xestado .solorigen {
  flex-basis: 100%;
}
.mov__chip--lg {
  padding: 6px 14px 6px 8px;
  font-size: 0.95rem;
}
.mov__xpricing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #e8f0fe;
}
.mov__xpricinglabel {
  flex: 1 1 auto;
  padding-right: 10px;
  border-right: 1px solid #1e5bd8;
  font-weight: 700;
}
.mov__xpricing b {
  font-size: 1.1rem;
  font-weight: 900;
  color: #1e5bd8;
  white-space: nowrap;
}
.mov__xlinea {
  margin-top: 6px;
}
.mov__xrow {
  padding: 8px 0;
  border-bottom: 1px solid #e6ebf3;
}
.mov__xrowlabel {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--sp-text);
}
.mov__xrowpill {
  display: flex;
  align-items: center;
  margin: 4px 0 0 28px;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f1f4f9;
  font-size: 0.82rem;
  font-weight: 700;
}
.mov__xrowpill > span:first-child {
  flex: 0 0 auto;
  padding-right: 10px;
  border-right: 1px solid #b8c4d8;
  white-space: nowrap;
}
.mov__xrowuser {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 10px;
  overflow-wrap: anywhere;
  text-align: center;
}
.mov__xrownota {
  margin: 4px 0 0 28px;
  font-size: 0.82rem;
  color: var(--sp-muted);
}
.mov__xrow--error .mov__xrowlabel {
  color: var(--sp-red-fg);
}
.mov__xrow--inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mov__xpendiente {
  font-style: italic;
  color: var(--sp-muted);
}
.mov__detail {
  padding: 10px 12px;
  border-radius: 12px;
  background: #f6f9ff;
}
.mov__detail dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  margin: 0;
  font-size: 0.86rem;
}
.mov__detail dt {
  color: var(--sp-muted);
  white-space: nowrap;
}
.mov__detail dd {
  margin: 0;
  font-weight: 600;
  word-break: break-word;
}
/* una línea entre cada dato (menos el último) */
.mov__detail dl {
  row-gap: 0;
}
.mov__detail dt,
.mov__detail dd {
  padding: 8px 0;
  border-bottom: 1px solid #dfe6f2;
}
.mov__detail dt:last-of-type,
.mov__detail dd:last-of-type {
  border-bottom: 0;
}
/* copiar: siempre a la derecha */
.mov__cuenta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
}
.mov__paydate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--sp-border);
  font-size: 0.88rem;
}
.mov__cardactions {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}
.mov__cardactions--fin {
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid var(--sp-border);
}
/* "Captura de los datos bancarios": texto en dos líneas si no entra */
.mov__captura {
  height: auto !important;
  min-height: 32px;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  white-space: normal;
  text-align: left;
}
</style>
