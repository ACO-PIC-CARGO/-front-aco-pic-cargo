<script setup lang="ts">
// Vista móvil de solicitudes de pago: grupos por estado (se pliegan) y tarjetas que se despliegan.
// La usan Control de Gastos > Pagos Pendientes y Bancos > Solicitudes de Pago (cada pestaña).
import { computed, ref } from "vue";
import Swal from "sweetalert2";
import { tienePerfilRevision } from "@/composables/useRevisionSolicitudPago";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";
import type { SolicitudPagoAccion } from "@/composables/useAccionesSolicitudPago";
import { tieneAprobacionesSolicitud, tieneSalidaBancosSolicitud } from "@/composables/useAccionesSolicitudPago";
import { notifySuccess } from "@/utils/request";

export interface SolicitudPagoMovilItem extends SolicitudPagoAccion {
  expediente: string;
  codigo_estado: string;
  estado: string;
  banco: string | null;
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
  revisando?: number | null;
  eliminando?: number | null;
}>();
const emit = defineEmits<{
  aprobar: [s: SolicitudPagoMovilItem, tipo: AreaRevision];
  "subir-soporte": [s: SolicitudPagoMovilItem];
  transferir: [s: SolicitudPagoMovilItem];
  "ver-salida": [s: SolicitudPagoMovilItem];
  "ver-anexo": [s: SolicitudPagoMovilItem];
  editar: [s: SolicitudPagoMovilItem];
  eliminar: [s: SolicitudPagoMovilItem];
  ver: [s: SolicitudPagoMovilItem];
}>();

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
const etiquetaProveedor = (s: SolicitudPagoMovilItem) => `${s.proveedor} (${s.id_proveedor})`;
const cuentaOCodigo = (s: SolicitudPagoMovilItem) => (s.codigo_tipopago === "02" ? s.codigopago || "" : s.nrocuenta || "");
const eliminada = (s: SolicitudPagoMovilItem) => s.codigo_estado === "ELIMINADA" || !!s.fecha_anulado;
const formatoMonto = (v: number | string) =>
  Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function formatoFecha(valor: string | null | undefined) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}-${MESES[Number(mes) - 1]}-${anio}`;
}
const fechaHora = (v: string | null | undefined) => (v ? `${formatoFecha(v)} ${v.slice(11, 16)}`.trim() : "");
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
function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
}
</script>

<template>
  <div class="mov">
    <div
      v-if="!items.length"
      class="mov__empty"
    >
      {{ cargando ? "Cargando solicitudes..." : "No hay solicitudes de pago." }}
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
          <article
            v-for="s in g.items"
            :key="s.id"
            class="mov__card"
            :class="`mov__card--${s.codigo_estado}`"
          >
            <button
              type="button"
              class="mov__cardhead"
              data-modo-ver="permitido"
              @click="tarjetasAbiertas[s.id] = !tarjetasAbiertas[s.id]"
            >
              <span
                class="mov__cardicon"
                data-modo-ver="permitido"
                title="Copiar proveedor"
                @click.stop="copiar(etiquetaProveedor(s))"
              >
                <v-icon
                  size="18"
                  color="primary"
                >mdi-content-copy</v-icon>
              </span>
              <!-- nombre completo arriba; expediente y estado debajo (pasan a otra línea si no entran) -->
              <span class="mov__cardmain">
                <span class="mov__provname">{{ etiquetaProveedor(s) }}</span>
                <span class="mov__meta">
                  <span class="mov__pill">{{ s.expediente }}</span>
                  <span
                    class="mov__chip"
                    :class="`mov__chip--${s.codigo_estado}`"
                  >
                    <v-icon size="14">{{ iconoEstado(s.codigo_estado) }}</v-icon>
                    {{ s.estado }}
                  </span>
                  <!-- ya registrada en Bancos > Salidas: el mismo N° de operación que al abrirla -->
                  <span
                    v-if="s.id_pagoegreso"
                    class="mov__chip mov__chip--salida"
                  >
                    <v-icon size="14">mdi-check-decagram</v-icon>
                    Salida N° {{ s.numerooperacion_pago }}
                  </span>
                </span>
              </span>
              <span class="mov__cardmonto">
                {{ formatoMonto(s.monto) }} <small>{{ s.moneda }}</small>
              </span>
              <v-icon size="20">
                {{ tarjetasAbiertas[s.id] ? "mdi-chevron-up" : "mdi-chevron-right" }}
              </v-icon>
            </button>

            <v-expand-transition>
              <div
                v-show="tarjetasAbiertas[s.id]"
                class="mov__cardbody"
              >
                <div class="mov__detail">
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
                    <dd>{{ s.tipopago || "—" }}</dd>
                    <dt>
                      <v-icon size="16">
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
                    <dt>
                      <v-icon size="16">
                        mdi-calendar-outline
                      </v-icon> Solicitado:
                    </dt>
                    <dd>
                      {{ formatoFecha(s.fechasolicitud) }}<template v-if="s.usuario_solicitud">
                        · {{ s.usuario_solicitud }}
                      </template>
                    </dd>
                    <template v-if="s.usuario_aprobadoadministracion">
                      <dt>
                        <v-icon size="16">
                          mdi-account-check-outline
                        </v-icon> Administración:
                      </dt>
                      <dd>{{ s.usuario_aprobadoadministracion }} · {{ fechaHora(s.fecha_aprobadoadministracion) }}</dd>
                    </template>
                    <template v-if="s.usuario_aprobadogerencia">
                      <dt>
                        <v-icon size="16">
                          mdi-account-tie-outline
                        </v-icon> Gerencia:
                      </dt>
                      <dd>{{ s.usuario_aprobadogerencia }} · {{ fechaHora(s.fecha_aprobadogerencia) }}</dd>
                    </template>
                    <template v-if="s.usuario_rechazo">
                      <dt class="text-error">
                        <v-icon size="16">
                          mdi-close-circle-outline
                        </v-icon>
                        Rechazado ({{ s.area_rechazo === "ADM" ? "Adm." : "Ger." }}):
                      </dt>
                      <dd>
                        {{ s.usuario_rechazo }} · {{ fechaHora(s.fecha_rechazo) }}
                        <div
                          v-if="s.motivo_rechazo"
                          class="text-medium-emphasis"
                        >
                          {{ s.motivo_rechazo }}
                        </div>
                      </dd>
                    </template>
                    <template v-if="eliminada(s)">
                      <dt class="text-error">
                        <v-icon size="16">
                          mdi-delete-outline
                        </v-icon> Eliminada:
                      </dt>
                      <dd>{{ s.usuario_anulado || "—" }} · {{ fechaHora(s.fecha_anulado) }}</dd>
                    </template>
                  </dl>

                  <div class="mov__paydate">
                    <span><v-icon size="16">mdi-calendar-check-outline</v-icon> Fecha de pago:</span>
                    <strong v-if="s.pagadoflag">{{ formatoFecha(s.fechapago) }}</strong>
                    <span
                      v-else
                      class="text-medium-emphasis"
                    >{{ s.codigo_estado === "LISTO" ? "Se ingresa al subir el soporte" : "Pendiente" }}</span>
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
                      v-if="s.id_pagoegreso"
                      size="small"
                      variant="tonal"
                      color="success"
                      rounded="pill"
                      prepend-icon="mdi-check-decagram"
                      data-modo-ver="permitido"
                      @click="emit('ver-salida', s)"
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
                  </template>
                  <v-btn
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
                    v-if="puedeEditar && !eliminada(s)"
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
                    prepend-icon="mdi-delete-outline"
                    :title="tituloAccion(s, 'Eliminar')"
                    :loading="eliminando === s.id"
                    @click="emit('eliminar', s)"
                  >
                    Eliminar
                  </v-btn>
                  <v-btn
                    size="small"
                    variant="tonal"
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
.mov__empty {
  padding: 28px 12px;
  text-align: center;
  color: var(--sp-muted);
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
.mov__card {
  position: relative;
  margin-bottom: 10px;
  overflow: hidden;
  border-left: 6px solid var(--sp-border);
  border-radius: 16px;
  background: var(--sp-surface);
  box-shadow: 0 4px 14px rgba(30, 58, 138, 0.08);
}
.mov__card--LISTO { border-left-color: var(--sp-green); }
.mov__card--PENGER { border-left-color: var(--sp-amber); }
.mov__card--PENADM { border-left-color: var(--sp-purple); }
.mov__card--RECHAZADA { border-left-color: var(--sp-red); }
.mov__card--PAGADO { border-left-color: var(--sp-accent); }
.mov__card--ELIMINADA { border-left-color: #98a2b3; }
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
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
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
.mov__cuenta {
  display: flex;
  align-items: center;
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
</style>
