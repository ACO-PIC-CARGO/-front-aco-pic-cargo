<script setup lang="ts">
import { abrirArchivo } from "@/composables/useVisorArchivo";
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import { shortDate } from "@/utils/dates";
import { montoCobro } from "@/composables/useSolicitudCobro";
import type { ConceptoSolicitudCobro } from "@/types/solicitudCobro";
import { conceptoEnMoneda } from "@/utils/montoMoneda";

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
  // todos los archivos del cliente (voucher, el de cada pago cargado y los adicionales del instructivo)
  vouchers?: { id: number; ruta: string; nombre: string | null }[] | null;
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
  // confirmación (soporte de confirmación de Administración)
  usuario_confirma?: string | null;
  fecha_confirmacion?: string | null;
  fecha_ingreso?: string | null;
}

// tabInicial: pestaña con la que abre (el ojo del soporte del cliente abre en "voucher" con todos sus archivos)
const props = defineProps<{ codigo: string | null; tabInicial?: "solicitud" | "voucher" }>();
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

// pestaña Voucher: todos los archivos; se ve uno a la vez
const vouchers = computed(() => {
  const lista = detalle.value?.vouchers ?? [];
  if (lista.length) return lista;
  return detalle.value?.voucher_path
    ? [{ id: 0, ruta: detalle.value.voucher_path, nombre: detalle.value.voucher_nombre }]
    : [];
});
const indiceVoucher = ref(0);
const voucherActual = computed(() => vouchers.value[indiceVoucher.value] ?? vouchers.value[0] ?? null);
const esPdfRuta = (ruta: string | null | undefined) => /\.pdf($|\?)/i.test(ruta ?? "");
const esPdf = computed(() => esPdfRuta(voucherActual.value?.ruta));
const totalConceptos = computed(() =>
  (detalle.value?.conceptos ?? []).reduce((acc, c) => acc + conceptoEnMoneda(c, detalle.value?.moneda).total, 0));
// en la moneda de la solicitud (PEN: los montos de la cuenta del banco, no el equivalente en USD)
const enMoneda = (c: ConceptoSolicitudCobro) => conceptoEnMoneda(c, detalle.value?.moneda);

watch(abierto, async (valor) => {
  if (!valor || !props.codigo) return;
  tab.value = props.tabInicial ?? "solicitud";
  indiceVoucher.value = 0;
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
// celular: el soporte se ve en un modal (imagen o visor PDF); en la web, otra pestaña
function abrir(url: string | null | undefined) {
  abrirArchivo(url);
}

// Autorizaciones: "17 de Noviembre del 2026", igual que en Solicitudes de Pago
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function fechaLarga(valor: string | null | undefined) {
  if (!valor) return "";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${Number(dia)} de ${MESES[Number(mes) - 1]} del ${anio}`;
}
// sin aprobaciones de Administración / Gerencia: quién la envió y quién la confirmó (soporte de confirmación)
const autorizaciones = computed(() => [
  { titulo: "Solicitado por:", usuario: detalle.value?.usuario_solicitud ?? "", fecha: detalle.value?.fechasolicitud ?? null },
  { titulo: "Confirmado por:", usuario: detalle.value?.usuario_confirma ?? "", fecha: detalle.value?.fecha_confirmacion ?? null },
]);
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
          :disabled="!vouchers.length"
        >
          Voucher
          <span
            v-if="vouchers.length > 1"
            class="vercob__count"
          >{{ vouchers.length }}</span>
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
                  </dl>
                </section>
              </div>

              <!-- autorizaciones: Solicitado / Confirmado (sin aprobaciones de Administración ni Gerencia) -->
              <div class="auth__head">
                <div class="auth__pill">
                  <v-icon
                    size="22"
                    color="#ffffff"
                  >
                    mdi-shield-check-outline
                  </v-icon>
                  Autorizaciones
                </div>
              </div>
              <section class="auth">
                <div
                  v-for="a in autorizaciones"
                  :key="a.titulo"
                  class="auth__col"
                >
                  <div class="auth__label">
                    {{ a.titulo }}
                  </div>
                  <div class="auth__sign">
                    {{ a.usuario }}
                  </div>
                  <div class="auth__date">
                    <v-icon
                      size="18"
                      color="#0b5fd6"
                    >
                      mdi-calendar-month-outline
                    </v-icon>
                    Fecha:
                    <span class="auth__dateline">{{ fechaLarga(a.fecha) }}</span>
                  </div>
                </div>
              </section>

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
                      <td>{{ monto(enMoneda(c).monto) }}</td>
                      <td>{{ monto(enMoneda(c).igv) }}</td>
                      <td>{{ monto(enMoneda(c).total) }}</td>
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
              <div
                v-if="vouchers.length > 1"
                class="vercob__files"
              >
                <button
                  v-for="(archivo, indice) in vouchers"
                  :key="`${archivo.id}-${indice}`"
                  type="button"
                  class="vercob__file"
                  :class="{ 'is-active': voucherActual === archivo }"
                  :title="archivo.nombre || 'Archivo'"
                  @click="indiceVoucher = indice"
                >
                  <v-icon size="16">
                    {{ esPdfRuta(archivo.ruta) ? "mdi-file-pdf-box" : "mdi-file-image-outline" }}
                  </v-icon>
                  <span class="text-truncate">{{ archivo.nombre || `Archivo ${indice + 1}` }}</span>
                </button>
              </div>
              <div class="vercob__voucher-bar">
                <span class="text-truncate">{{ voucherActual?.nombre || "Voucher" }}</span>
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-open-in-new"
                  @click="abrir(voucherActual?.ruta)"
                >
                  Abrir en otra pestaña
                </v-btn>
              </div>
              <iframe
                v-if="esPdf"
                :key="voucherActual?.ruta"
                :src="voucherActual?.ruta || undefined"
                class="vercob__pdf"
                title="Voucher del cliente"
              />
              <img
                v-else
                :src="voucherActual?.ruta || undefined"
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
.vercob__count {
  margin-left: 6px;
  min-width: 20px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 20px;
  text-align: center;
  color: #ffffff;
  background: #1f73e8;
  border-radius: 10px;
}
.vercob__files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.vercob__file {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 260px;
  padding: 5px 10px;
  font-size: 12px;
  color: #1f2a44;
  background: #f4f8ff;
  border: 1px solid #d6e3f7;
  border-radius: 8px;
  cursor: pointer;
}
.vercob__file.is-active {
  color: #ffffff;
  background: #1f73e8;
  border-color: #1f73e8;
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
.auth__head {
  display: flex;
  align-items: center;
  margin-top: 16px;
}
.auth__head::before,
.auth__head::after {
  content: "";
  flex: 1;
  border-top: 2px solid #0b2f6b;
}
.auth__pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 30px;
  border-radius: 999px;
  background: #0b2f6b;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
}
.auth {
  display: flex;
  margin-top: 12px;
  padding: 18px 0;
  border: 1px solid #dce5f2;
  border-radius: 14px;
}
.auth__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px;
}
.auth__col + .auth__col {
  border-left: 1px solid #c9d6ea;
}
.auth__label {
  font-size: 0.95rem;
  font-weight: 700;
}
.auth__sign {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 85%;
  min-height: 40px;
  padding-bottom: 2px;
  border-bottom: 1.5px solid #0a1f44;
  font-size: 0.85rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.auth__date {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 92%;
  margin-top: 14px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #e3eefc;
  font-size: 0.75rem;
}
.auth__dateline {
  flex: 1;
  min-height: 18px;
  border-bottom: 1px solid #0a1f44;
  font-weight: 700;
  text-align: center;
}
@media (max-width: 600px) {
  .auth {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .auth__col + .auth__col {
    padding-top: 16px;
    border-left: 0;
    border-top: 1px solid #c9d6ea;
  }
  .auth__date {
    width: 90%;
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  .auth__dateline {
    min-height: 0;
    padding-left: 12px;
    border-bottom: 0;
    border-left: 1px solid #b9cdea;
  }
}
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
