<script setup lang="ts">
// "Ver Detalle" de una solicitud con varios expedientes (registrada desde el Reporte de Cuentas por Pagar /
// por Cobrar): modal "Expedientes Asociados" con los montos de cada expediente. Solo lectura.
// Lo usan Bancos (Solicitudes de Pago / Ingresos por confirmar) y Control de Gastos.
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import ClientePagoChip from "@/components/folderBilling/ClientePagoChip.vue";
import { request } from "@/utils/request";
import { shortDate } from "@/utils/dates";
import { sessionBranchId } from "@/utils/sesion";
import type { DetalleExpedienteCobro, DetalleExpedientePago, TipoSolicitudReporte } from "@/types/solicitudReporte";

const props = defineProps<{
  tipo: TipoSolicitudReporte;
  /** pago: id de la solicitud */
  idSolicitud?: number | null;
  /** cobro: código de la solicitud (SC-000001) */
  codigo?: string | null;
}>();
const abierto = defineModel<boolean>({ default: false });
const { smAndDown } = useDisplay();

const esPago = computed(() => props.tipo === "pago");
const filas = ref<(DetalleExpedientePago | DetalleExpedienteCobro)[]>([]);
const cargando = ref(false);
const error = ref("");

const cabecera = computed(() => filas.value[0] ?? null);
const entidad = computed(() => {
  const f = cabecera.value;
  if (!f) return "";
  return "proveedor" in f ? f.proveedor : f.cliente_solicitud;
});
const moneda = computed(() => cabecera.value?.moneda ?? "");
const num = (v: number | string | null | undefined) => Number(v ?? 0) || 0;
const formato = (v: number | string | null | undefined) =>
  `${num(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda.value}`.trim();
const suma = (campo: "monto_pricing" | "monto_operaciones" | "ganancia" | "monto_solicitado") =>
  Math.round(filas.value.reduce((acc, f) => acc + num((f as unknown as Record<string, number | string>)[campo]), 0) * 100) / 100;
const totales = computed(() => ({
  pricing: suma("monto_pricing"),
  operaciones: suma("monto_operaciones"),
  ganancia: suma("ganancia"),
  solicitado: suma("monto_solicitado"),
}));
const clientePago = (f: DetalleExpedientePago | DetalleExpedienteCobro) => ("cliente_pago" in f ? f.cliente_pago : null);
// expediente con varios clientes: "Cliente Varios" y, en vez de "Cliente Pagó", "Ver Expediente"
const variosClientes = (f: DetalleExpedientePago | DetalleExpedienteCobro) =>
  "clientes_cantidad" in f && Number(f.clientes_cantidad ?? 0) > 1;
// igual que el ojo del Reporte de Cuentas por Pagar / Cobrar: Control de Gastos del expediente en otra ventana
function verExpediente(f: DetalleExpedientePago | DetalleExpedienteCobro) {
  window.open(
    `/home/folderBilling/editControlGastos/view/${f.id_master}/${sessionBranchId()}`,
    "Instructivo",
    "width=1593,height=1293",
  );
}
const solicitado = (f: DetalleExpedientePago | DetalleExpedienteCobro) => ("monto_solicitado" in f ? f.monto_solicitado : 0);

async function cargar() {
  filas.value = [];
  error.value = "";
  const ruta = esPago.value
    ? (props.idSolicitud ? "solicitud_pago_detalle_expedientes/" + props.idSolicitud : "")
    : (props.codigo ? "solicitud_cobro_detalle_expedientes/" + props.codigo : "");
  if (!ruta) return;
  cargando.value = true;
  const response = await request<DetalleExpedientePago | DetalleExpedienteCobro>({
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + ruta,
  });
  cargando.value = false;
  if (!response.estadoflag) {
    error.value = response.mensaje || "No pudimos cargar los expedientes de la solicitud.";
    return;
  }
  filas.value = response.data;
}

watch(abierto, (visible) => {
  if (visible) void cargar();
}, { immediate: true });
</script>

<template>
  <v-dialog
    v-model="abierto"
    :max-width="smAndDown ? undefined : 1140"
    :fullscreen="smAndDown"
    scrollable
  >
    <v-card class="expas">
      <div class="expas__head">
        <v-icon size="22">
          mdi-folder-open
        </v-icon>
        <span class="expas__titulo">Expedientes Asociados</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="white"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </div>

      <v-card-text class="expas__body">
        <v-progress-linear
          v-if="cargando"
          indeterminate
          color="primary"
          class="mb-3"
        />
        <v-alert
          v-if="error"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ error }}
        </v-alert>

        <template v-if="cabecera">
          <div class="expas__info">
            <span class="expas__ent"><b>{{ esPago ? "Proveedor" : "Cliente" }}:</b> {{ entidad }}</span>
            <span class="expas__meta">
              <span>Solicitud: {{ cabecera.fechasolicitud ? shortDate(cabecera.fechasolicitud) : "-" }}</span>
              <span class="expas__sep" />
              <span>Total {{ esPago ? "Proveedor" : "Cliente" }}:</span>
              <b class="expas__badge">{{ formato(cabecera.monto_solicitud) }}</b>
            </span>
          </div>

          <!-- web: tabla · celular / tablet: tarjetas -->
          <div
            class="expas__tabla"
            role="table"
            :aria-label="'Expedientes de la solicitud de ' + (esPago ? 'pago' : 'cobro')"
          >
            <div
              class="expas__fila expas__fila--head"
              :class="{ 'expas__fila--cobro': !esPago }"
              role="row"
            >
              <span role="columnheader">Expediente</span>
              <span role="columnheader">Cliente</span>
              <span
                v-if="esPago"
                role="columnheader"
                class="text-center"
              >Cliente Pagó</span>
              <span
                role="columnheader"
                class="text-right"
              >Monto según Pricing</span>
              <span
                role="columnheader"
                class="text-right"
              >Monto según Operaciones</span>
              <span
                v-if="!esPago"
                role="columnheader"
                class="text-right"
              >Monto a cobrar</span>
              <span
                role="columnheader"
                class="text-right"
              >Ganancia del Expediente</span>
              <span role="columnheader">Comentario</span>
            </div>
            <div
              v-for="f in filas"
              :key="f.expediente + '-' + (f.correlativo ?? '')"
              class="expas__fila"
              :class="{ 'expas__fila--cobro': !esPago }"
              role="row"
            >
              <span
                role="cell"
                data-label="Expediente"
                class="expas__exp"
              >
                {{ f.expediente }}
                <small v-if="f.correlativo">Corr. {{ f.correlativo }}</small>
              </span>
              <span
                role="cell"
                data-label="Cliente"
                :title="variosClientes(f) ? f.cliente ?? undefined : undefined"
              >
                <b v-if="variosClientes(f)">Cliente Varios</b>
                <template v-else>{{ f.cliente || "-" }}</template>
              </span>
              <span
                v-if="esPago"
                role="cell"
                data-label="Cliente Pagó"
                class="text-center"
              >
                <v-btn
                  v-if="variosClientes(f)"
                  size="small"
                  variant="flat"
                  color="primary"
                  prepend-icon="mdi-eye-outline"
                  class="expas__verexp"
                  data-modo-ver="permitido"
                  @click="verExpediente(f)"
                >
                  Ver Expediente
                </v-btn>
                <ClientePagoChip
                  v-else
                  :estado="clientePago(f)"
                />
              </span>
              <span
                role="cell"
                data-label="Monto según Pricing"
                class="text-right"
              >{{ formato(f.monto_pricing) }}</span>
              <span
                role="cell"
                data-label="Monto según Operaciones"
                class="text-right"
              >{{ formato(f.monto_operaciones) }}</span>
              <span
                v-if="!esPago"
                role="cell"
                data-label="Monto a cobrar"
                class="text-right"
              >{{ formato(solicitado(f)) }}</span>
              <span
                role="cell"
                data-label="Ganancia del Expediente"
                class="text-right"
              >
                <span
                  class="expas__ganancia"
                  :class="{ 'expas__ganancia--neg': num(f.ganancia) < 0 }"
                >{{ formato(f.ganancia) }}</span>
              </span>
              <!-- comentario del expediente escrito al solicitar desde el reporte (columna propia) -->
              <span
                role="cell"
                data-label="Comentario"
                class="expas__coment"
              >
                <template v-if="f.comentario">{{ f.comentario }}</template>
                <span
                  v-else
                  class="expas__sin"
                >—</span>
              </span>
            </div>
            <div
              class="expas__fila expas__fila--total"
              :class="{ 'expas__fila--cobro': !esPago }"
              role="row"
            >
              <span
                role="cell"
                class="expas__total-label"
              >Totales del Expediente ({{ filas.length }})</span>
              <span
                role="cell"
                class="expas__vacio"
              />
              <span
                v-if="esPago"
                role="cell"
                class="expas__vacio"
              />
              <span
                role="cell"
                data-label="Monto según Pricing"
                class="text-right"
              >{{ formato(totales.pricing) }}</span>
              <span
                role="cell"
                data-label="Monto según Operaciones"
                class="text-right"
              >{{ formato(totales.operaciones) }}</span>
              <span
                v-if="!esPago"
                role="cell"
                data-label="Monto a cobrar"
                class="text-right"
              >{{ formato(totales.solicitado) }}</span>
              <span
                role="cell"
                data-label="Ganancia del Expediente"
                class="text-right"
              >
                <span
                  class="expas__ganancia expas__ganancia--total"
                  :class="{ 'expas__ganancia--neg': totales.ganancia < 0 }"
                >{{ formato(totales.ganancia) }}</span>
              </span>
              <span
                role="cell"
                class="expas__vacio"
              />
            </div>
          </div>
        </template>
      </v-card-text>

      <v-card-actions class="expas__actions">
        <v-spacer />
        <v-btn
          variant="tonal"
          prepend-icon="mdi-close"
          @click="abierto = false"
        >
          CERRAR
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.expas {
  overflow: hidden;
  border-radius: 14px !important;
  color: #0a1f44;
}
.expas__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 18px;
  background: #0a2f6b;
  color: #fff;
}
.expas__titulo {
  flex: 1;
  font-size: 1.05rem;
  font-weight: 700;
}
.expas__body {
  padding: 16px !important;
}
.expas__info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid #d1defc;
  border-radius: 10px;
  background: #eef4ff;
  font-size: 0.875rem;
}
.expas__ent {
  min-width: 0;
  overflow-wrap: anywhere;
}
.expas__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.expas__sep {
  width: 1px;
  height: 16px;
  background: #b8c7e6;
}
.expas__badge {
  padding: 2px 10px;
  border-radius: 8px;
  background: #cfe0ff;
  color: #0b3d91;
  white-space: nowrap;
}
.expas__tabla {
  overflow: hidden;
  border: 1px solid #dbe5f5;
  border-radius: 10px;
}
.expas__fila {
  display: grid;
  grid-template-columns: 1.05fr 1.4fr 0.75fr 1fr 1.1fr 1.05fr 1.5fr;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef2f8;
  font-size: 0.8125rem;
}
.expas__fila--cobro {
  grid-template-columns: 1.05fr 1.4fr 1fr 1.1fr 0.95fr 1.05fr 1.5fr;
}
.expas__fila--head {
  background: #f4f7fc;
  color: #1d4ed8;
  font-weight: 700;
}
.expas__fila--total {
  border-bottom: 0;
  background: #e6efff;
  font-weight: 700;
}
.expas__exp {
  display: flex;
  flex-direction: column;
  font-weight: 600;
}
.expas__exp small {
  color: #667085;
  font-weight: 400;
}
.expas__verexp {
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
  white-space: nowrap;
}
.expas__coment {
  min-width: 0;
  color: #344054;
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
  white-space: pre-line;
}
.expas__sin {
  color: #98a2b3;
}
.expas__ganancia {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  background: #e3f6e8;
  color: #146c2e;
  font-weight: 700;
  white-space: nowrap;
}
.expas__ganancia--total {
  background: #1f8a3b;
  color: #fff;
}
.expas__ganancia--neg {
  background: #fde8e7;
  color: #b42318;
}
.expas__ganancia--total.expas__ganancia--neg {
  background: #b42318;
  color: #fff;
}
.expas__actions {
  padding: 8px 16px 14px !important;
}
/* celular / tablet: cada expediente es una tarjeta "etiqueta: valor" */
@media (max-width: 959.98px) {
  .expas__tabla {
    border: 0;
  }
  .expas__fila--head {
    display: none;
  }
  .expas__fila,
  .expas__fila--cobro {
    display: block;
    margin-bottom: 10px;
    border: 1px solid #dbe5f5;
    border-radius: 10px;
  }
  .expas__fila > span {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .expas__fila > span[data-label]::before {
    content: attr(data-label);
    flex-shrink: 0;
    max-width: 50%;
    color: #475467;
    font-weight: 600;
    text-align: left;
  }
  .expas__exp {
    flex-direction: row !important;
    align-items: baseline;
  }
  .expas__vacio {
    display: none !important;
  }
}
</style>
