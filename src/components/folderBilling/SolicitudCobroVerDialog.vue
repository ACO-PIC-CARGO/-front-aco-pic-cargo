<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import { shortDate } from "@/utils/dates";
import { montoCobro } from "@/composables/useSolicitudCobro";
import type { ConceptoSolicitudCobro } from "@/types/solicitudCobro";

// Modo ver (ojito) de una solicitud de cobro: Control de Gastos e Ingresos pendientes por confirmar.
// Pestaña "Solicitud" (datos, aprobaciones y conceptos) y pestaña "Voucher" (el archivo del cliente).
interface SolicitudCobroDetalle {
  codigo: string;
  expediente: string;
  nro_master: string | null;
  cliente: string;
  id_cliente: number;
  correlativo: string | null;
  monto: number | string;
  moneda: string | null;
  cuenta: string | null;
  banco_origen: string | null;
  fechadeposito: string | null;
  numerooperacion: string | null;
  voucher_path: string | null;
  voucher_nombre: string | null;
  comentario: string | null;
  fechasolicitud: string | null;
  usuario_registro: string | null;
  usuario_solicitud: string | null;
  usuario_aprobadoadministracion: string | null;
  fecha_aprobadoadministracion: string | null;
  usuario_aprobadogerencia: string | null;
  fecha_aprobadogerencia: string | null;
  codigo_estado: string;
  estado: string;
  numerooperacion_ingreso: string | null;
  motivo_rechazo: string | null;
  conceptos: ConceptoSolicitudCobro[];
}

const props = defineProps<{ codigo: string | null }>();
const abierto = defineModel<boolean>({ default: false });
const { smAndDown } = useDisplay();

const detalle = ref<SolicitudCobroDetalle | null>(null);
const cargando = ref(false);
const error = ref("");
const tab = ref<"solicitud" | "voucher">("solicitud");

const COLOR_ESTADO: Record<string, string> = {
  BORRADOR: "grey-darken-1",
  PENADM: "orange-darken-2",
  PENGER: "amber-darken-3",
  LISTO: "blue",
  COBRADO: "green-darken-2",
  RECHAZADA: "red",
  ELIMINADA: "grey",
};

const esPdf = computed(() => /\.pdf($|\?)/i.test(detalle.value?.voucher_path ?? ""));
const totalConceptos = computed(() =>
  (detalle.value?.conceptos ?? []).reduce((acc, c) => acc + Number(c.total_op || 0), 0));

watch(abierto, async (valor) => {
  if (!valor || !props.codigo) return;
  tab.value = "solicitud";
  detalle.value = null;
  error.value = "";
  cargando.value = true;
  const response = await request<SolicitudCobroDetalle>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_ver/" + props.codigo,
  });
  cargando.value = false;
  if (!response.estadoflag) {
    error.value = response.mensaje || CONNECTION_ERROR_MESSAGE;
    return;
  }
  detalle.value = response.data[0] ?? null;
});

// fechas con el helper de FormatFecha (DD/MMM/YYYY) y la hora si la trae
function fecha(valor: string | null | undefined) {
  if (!valor) return "—";
  return `${shortDate(valor.slice(0, 10))} ${valor.slice(11, 16)}`.trim();
}
function monto(valor: number | string | null) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="980"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card class="vercob">
      <div class="vercob__head">
        <div class="vercob__icon">
          <v-icon size="28">
            mdi-cash-check
          </v-icon>
        </div>
        <div class="vercob__titles">
          <h3>SOLICITUD DE COBRO</h3>
          <span v-if="detalle">{{ detalle.expediente }}{{ detalle.correlativo ? ` - Corr. ${detalle.correlativo}` : "" }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </div>

      <v-tabs
        v-model="tab"
        color="primary"
        density="compact"
        :grow="smAndDown"
        class="px-4"
      >
        <v-tab
          value="solicitud"
          prepend-icon="mdi-file-document-outline"
        >
          Solicitud
        </v-tab>
        <v-tab
          value="voucher"
          prepend-icon="mdi-receipt-text-outline"
          :disabled="!detalle?.voucher_path"
        >
          Voucher
        </v-tab>
      </v-tabs>

      <v-card-text class="vercob__body">
        <v-progress-linear
          v-if="cargando"
          indeterminate
          color="primary"
        />
        <v-alert
          v-else-if="error"
          type="warning"
          variant="tonal"
          density="compact"
        >
          {{ error }}
        </v-alert>

        <template v-else-if="detalle">
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="solicitud">
              <div class="vercob__resumen">
                <span
                  class="vercob__estado"
                  :class="`bg-${COLOR_ESTADO[detalle.codigo_estado] ?? 'grey'}`"
                >{{ detalle.estado }}</span>
                <span class="vercob__monto">{{ montoCobro(detalle.monto, detalle.moneda) }}</span>
              </div>
              <v-alert
                v-if="detalle.codigo_estado === 'RECHAZADA'"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                <b>Motivo del rechazo:</b> {{ detalle.motivo_rechazo || "Sin motivo" }}
              </v-alert>

              <div class="vercob__grid">
                <section class="vercob__card">
                  <h4>Cliente</h4>
                  <dl>
                    <dt>Cliente</dt>
                    <dd>{{ detalle.cliente }} ({{ detalle.id_cliente }})</dd>
                    <dt>Expediente</dt>
                    <dd>{{ detalle.expediente }}</dd>
                    <dt>N° Master</dt>
                    <dd>{{ detalle.nro_master || "—" }}</dd>
                    <dt>Correlativo</dt>
                    <dd>{{ detalle.correlativo || "—" }}</dd>
                  </dl>
                </section>
                <section class="vercob__card">
                  <h4>Depósito del cliente</h4>
                  <dl>
                    <dt>Cuenta de depósito</dt>
                    <dd>{{ detalle.cuenta || "—" }}</dd>
                    <dt>Banco del cliente</dt>
                    <dd>{{ detalle.banco_origen || "—" }}</dd>
                    <dt>Fecha de depósito</dt>
                    <dd>{{ fecha(detalle.fechadeposito) }}</dd>
                    <dt>N° de operación</dt>
                    <dd>{{ detalle.numerooperacion || "—" }}</dd>
                    <dt>Ingreso en Bancos</dt>
                    <dd>{{ detalle.numerooperacion_ingreso ? `N° ${detalle.numerooperacion_ingreso}` : "—" }}</dd>
                  </dl>
                </section>
                <section class="vercob__card">
                  <h4>Seguimiento</h4>
                  <dl>
                    <dt>Pago cargado por</dt>
                    <dd>{{ detalle.usuario_registro || "—" }}</dd>
                    <dt>Solicitado</dt>
                    <dd>{{ detalle.usuario_solicitud ? `${detalle.usuario_solicitud} · ${fecha(detalle.fechasolicitud)}` : "Sin enviar" }}</dd>
                    <dt>Administración</dt>
                    <dd>
                      {{ detalle.usuario_aprobadoadministracion
                        ? `${detalle.usuario_aprobadoadministracion} · ${fecha(detalle.fecha_aprobadoadministracion)}` : "—" }}
                    </dd>
                    <dt>Gerencia</dt>
                    <dd>
                      {{ detalle.usuario_aprobadogerencia
                        ? `${detalle.usuario_aprobadogerencia} · ${fecha(detalle.fecha_aprobadogerencia)}` : "—" }}
                    </dd>
                  </dl>
                </section>
              </div>

              <p
                v-if="detalle.comentario"
                class="vercob__comentario"
              >
                <b>Comentario:</b> {{ detalle.comentario }}
              </p>

              <h4 class="vercob__subtitulo">
                Conceptos cobrados (Operaciones)
              </h4>
              <div class="vercob__tablewrap">
                <table class="vercob__table">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Monto</th>
                      <th>Impuesto</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="c in detalle.conceptos"
                      :key="c.codigo"
                    >
                      <td class="text-left">
                        {{ c.concepto }}
                      </td>
                      <td>{{ monto(c.monto_op) }}</td>
                      <td>{{ monto(c.igv_op) }}</td>
                      <td>{{ monto(c.total_op) }}</td>
                    </tr>
                    <tr v-if="!detalle.conceptos.length">
                      <td colspan="4">
                        Sin conceptos
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colspan="3"
                        class="text-right"
                      >
                        Total
                      </td>
                      <td>{{ monto(totalConceptos) }} {{ detalle.moneda }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </v-tabs-window-item>

            <v-tabs-window-item value="voucher">
              <div class="vercob__voucher-bar">
                <span class="text-truncate">{{ detalle.voucher_nombre || "Voucher" }}</span>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-open-in-new"
                  @click="abrir(detalle.voucher_path)"
                >
                  Abrir en otra pestaña
                </v-btn>
              </div>
              <iframe
                v-if="esPdf"
                :src="detalle.voucher_path || undefined"
                class="vercob__pdf"
                title="Voucher del cliente"
              />
              <img
                v-else
                :src="detalle.voucher_path || undefined"
                class="vercob__img"
                alt="Voucher del cliente"
              >
            </v-tabs-window-item>
          </v-tabs-window>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.vercob {
  border-radius: 18px !important;
  color: #0a1f44;
}
.vercob__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 6px;
}
.vercob__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e3f4e5;
  color: #1b5e20;
}
.vercob__titles {
  flex: 1 1 auto;
  min-width: 0;
}
.vercob__titles h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 900;
}
.vercob__titles span {
  font-size: 12.5px;
  color: #3b4a63;
}
.vercob__body {
  padding-top: 12px !important;
}
.vercob__resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.vercob__estado {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}
.vercob__monto {
  font-size: 22px;
  font-weight: 900;
  color: #1b5e20;
}
.vercob__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.vercob__card {
  padding: 10px 12px;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
  background: #f8fbff;
}
.vercob__card h4,
.vercob__subtitulo {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 800;
  color: #1e3a8a;
  text-transform: uppercase;
}
.vercob__card dl {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 3px 8px;
  margin: 0;
  font-size: 12.5px;
}
.vercob__card dt {
  color: #6b7a90;
}
.vercob__card dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.vercob__comentario {
  margin: 12px 0 0;
  font-size: 13px;
}
.vercob__subtitulo {
  margin-top: 16px;
}
.vercob__tablewrap {
  overflow-x: auto;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
  background: #fff;
}
.vercob__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.vercob__table th {
  padding: 8px;
  background: #e7efff;
  color: #1e3a8a;
  text-align: center;
}
.vercob__table td {
  padding: 7px 8px;
  border-top: 1px solid #edf1f8;
  text-align: center;
}
.vercob__table tfoot td {
  font-weight: 800;
  background: #f8fbff;
}
.vercob__voucher-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}
.vercob__pdf {
  width: 100%;
  height: 70vh;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
}
.vercob__img {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  margin: 0 auto;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
}
/* celular y tablet: tarjetas en una columna */
@media (max-width: 960px) {
  .vercob__grid {
    grid-template-columns: 1fr;
  }
  .vercob__card dl {
    grid-template-columns: 112px 1fr;
  }
  .vercob__pdf {
    height: 60vh;
  }
}
</style>
