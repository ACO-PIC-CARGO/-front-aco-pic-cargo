<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import type { SolicitudPagoDetalle } from "@/types/billingEntries";

// Modo ver (ojito) de una solicitud de pago: Control de Gastos y Bancos > Solicitudes de Pago
const props = defineProps<{ idSolicitud: number | null }>();
const abierto = defineModel<boolean>({ default: false });

const URL_MAIN = import.meta.env.VITE_URL_MAIN;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const detalle = ref<SolicitudPagoDetalle | null>(null);
const cargando = ref(false);
const error = ref("");

const logo = computed(() => {
  try {
    return sessionUser().path || "";
  } catch {
    return "";
  }
});

const esCodigo = computed(() => detalle.value?.codigo_tipopago === "02");
const cuenta = computed(() => (esCodigo.value ? detalle.value?.codigopago : detalle.value?.nrocuenta) || "—");
const autorizadoPor = computed(
  () => detalle.value?.usuario_aprobadogerencia || detalle.value?.usuario_aprobadoadministracion || "",
);
const fechaAutorizacion = computed(
  () => detalle.value?.fecha_aprobadogerencia || detalle.value?.fecha_aprobadoadministracion || null,
);

function formatoMonto(valor: number | string | null | undefined) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatoFecha(valor: string | null | undefined) {
  if (!valor) return "—";
  const [anio, mes, dia] = valor.slice(0, 10).split("-");
  return `${dia}-${MESES[Number(mes) - 1]}-${anio}`;
}

function esActual(p: SolicitudPagoDetalle["pendientes"][number]) {
  const d = detalle.value;
  return !!d && p.id_proveedor === d.id_proveedor && (p.id_correlativo ?? null) === (d.id_correlativo ?? null);
}

async function cargar() {
  if (!props.idSolicitud) return;
  cargando.value = true;
  error.value = "";
  detalle.value = null;
  const response = await request<SolicitudPagoDetalle>({
    method: "get",
    url: URL_MAIN + "solicitud_pago_ver/" + props.idSolicitud,
  });
  cargando.value = false;
  if (!response.estadoflag || !response.data[0]) {
    error.value = response.mensaje || CONNECTION_ERROR_MESSAGE;
    return;
  }
  detalle.value = response.data[0];
}

watch(
  () => [abierto.value, props.idSolicitud] as const,
  ([visible]) => {
    if (visible) cargar();
  },
  { immediate: true },
);
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="600"
    scrollable
  >
    <v-card class="spver">
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        class="spver__close"
        aria-label="Cerrar"
        @click="abierto = false"
      />

      <div
        v-if="cargando"
        class="spver__state"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
        Cargando solicitud…
      </div>
      <div
        v-else-if="error"
        class="spver__state text-error"
      >
        <v-icon>mdi-alert-circle-outline</v-icon> {{ error }}
      </div>

      <div
        v-else-if="detalle"
        class="spver__body"
      >
        <!-- cabecera -->
        <header class="spver__head">
          <img
            v-if="logo"
            :src="logo"
            alt=""
            class="spver__logo"
          >
          <span
            v-if="logo"
            class="spver__divider"
          />
          <h2 class="spver__title">
            Solicitud de Pago
          </h2>
          <div class="spver__exp">
            <span class="spver__exppill">EXP {{ detalle.expediente }}</span>
            <span class="spver__expdate">{{ formatoFecha(detalle.fechasolicitud) }}</span>
          </div>
        </header>

        <!-- proveedor y monto -->
        <section class="spver__hero">
          <div class="spver__heroitem">
            <v-icon
              size="34"
              color="#0b3d91"
            >
              mdi-storefront-outline
            </v-icon>
            <div>
              <div class="spver__herolabel">
                Proveedor
              </div>
              <div class="spver__herovalue">
                {{ detalle.proveedor }} ({{ detalle.id_proveedor }})
                <span
                  v-if="detalle.correlativo"
                  class="spver__corr"
                >- {{ detalle.correlativo }}</span>
              </div>
            </div>
          </div>
          <span class="spver__herosep" />
          <div class="spver__heroitem">
            <v-icon
              size="34"
              color="#0b3d91"
            >
              mdi-cash-multiple
            </v-icon>
            <div>
              <div class="spver__herolabel">
                Monto a Pagar
              </div>
              <div class="spver__herovalue spver__herovalue--monto">
                {{ detalle.moneda }} {{ formatoMonto(detalle.monto) }}
              </div>
            </div>
          </div>
        </section>

        <!-- cliente / ya pagó -->
        <section class="spver__client">
          <v-icon color="#0b5fd6">
            mdi-account-outline
          </v-icon>
          <div class="spver__clienttext">
            <div class="spver__herolabel">
              Cliente
            </div>
            <div>{{ detalle.clientes || "—" }}</div>
          </div>
          <div class="spver__paid">
            <span>¿Ya pagó?</span>
            <span
              class="spver__paidpill"
              :class="{ 'spver__paidpill--si': detalle.pagadoflag }"
            >{{ detalle.pagadoflag ? "Sí" : "No" }}</span>
          </div>
        </section>

        <!-- datos para el pago -->
        <section class="spver__card">
          <h3 class="spver__cardtitle">
            <v-icon color="#0b5fd6">
              mdi-wallet-outline
            </v-icon>
            Datos para el Pago
          </h3>
          <dl class="spver__dl">
            <dt>
              <v-icon
                size="20"
                color="#0b5fd6"
              >
                mdi-bank-outline
              </v-icon> Banco:
            </dt>
            <dd>{{ detalle.banco || "—" }}</dd>
            <dt>
              <v-icon
                size="20"
                color="#0b5fd6"
              >
                mdi-credit-card-outline
              </v-icon> Método:
            </dt>
            <dd><span class="spver__metodo">{{ detalle.tipopago || "—" }}</span></dd>
            <dt>
              <v-icon
                size="20"
                color="#0b5fd6"
              >
                {{ esCodigo ? "mdi-barcode" : "mdi-card-account-details-outline" }}
              </v-icon>
              {{ esCodigo ? "Código:" : "N° de Cuenta:" }}
            </dt>
            <dd>{{ cuenta }}</dd>
            <template v-if="detalle.beneficiario">
              <dt>
                <v-icon
                  size="20"
                  color="#0b5fd6"
                >
                  mdi-account-cash-outline
                </v-icon> Beneficiario:
              </dt>
              <dd>{{ detalle.beneficiario }}</dd>
            </template>
          </dl>
        </section>

        <!-- autorización -->
        <section class="spver__auth">
          <div class="spver__authtitle">
            <v-icon color="#0b5fd6">
              mdi-shield-check-outline
            </v-icon>
            Autorización para el Pago
          </div>
          <div class="spver__authcol">
            <span class="spver__authlabel">Autorizado por:</span>
            <span class="spver__authline">{{ autorizadoPor }}</span>
          </div>
          <div class="spver__authcol">
            <span class="spver__authlabel">Fecha:</span>
            <span class="spver__authline">{{ fechaAutorizacion ? formatoFecha(fechaAutorizacion) : "" }}</span>
          </div>
        </section>

        <!-- pendientes del expediente -->
        <section>
          <h3 class="spver__cardtitle spver__cardtitle--plain">
            <v-icon color="#0b5fd6">
              mdi-format-list-bulleted
            </v-icon>
            Pagos Pendientes del Expediente
          </h3>
          <div class="spver__tablewrap">
            <table class="spver__table">
              <thead>
                <tr>
                  <th>Proveedor / Concepto</th>
                  <th class="text-right">
                    Total
                  </th>
                  <th class="text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!detalle.pendientes.length">
                  <td
                    colspan="3"
                    class="text-center text-medium-emphasis"
                  >
                    No hay pagos pendientes en el expediente.
                  </td>
                </tr>
                <tr
                  v-for="p in detalle.pendientes"
                  :key="`${p.id_proveedor}-${p.id_correlativo}`"
                  :class="{ 'spver__row--actual': esActual(p) }"
                >
                  <td class="font-weight-bold">
                    {{ p.proveedor }} ({{ p.id_proveedor }})
                    <span
                      v-if="p.correlativo"
                      class="spver__corr"
                    >- {{ p.correlativo }}</span>
                  </td>
                  <td class="text-right text-no-wrap">
                    {{ p.moneda }} {{ formatoMonto(p.total) }}
                  </td>
                  <td class="text-center">
                    <span class="spver__status">{{ p.estado }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p
          v-if="detalle.comentario"
          class="spver__comment"
        >
          <b>Observaciones:</b> {{ detalle.comentario }}
        </p>
      </div>
      <span
        class="spver__wave"
        aria-hidden="true"
      />
    </v-card>
  </v-dialog>
</template>

<style scoped>
.spver {
  position: relative;
  overflow: hidden;
  border-radius: 20px !important;
  color: #0a1f44;
  background: #fff;
}
.spver__close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
}
.spver__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  padding: 24px;
}
.spver__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 22px 56px;
  overflow-y: auto;
}
.spver__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-right: 32px;
}
.spver__logo {
  height: 42px;
  max-width: 130px;
  object-fit: contain;
}
.spver__divider {
  width: 2px;
  height: 40px;
  background: #0b5fd6;
}
.spver__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a1f44;
}
.spver__exp {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: auto;
}
.spver__exppill {
  padding: 4px 12px;
  border-radius: 8px;
  background: #dcebfd;
  color: #0b3d91;
  font-weight: 800;
  white-space: nowrap;
}
.spver__expdate {
  margin-top: 2px;
  font-size: 0.8rem;
  color: #4a5670;
}
.spver__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 16px;
  background: #e8f1fd;
}
.spver__heroitem {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 0;
  min-width: 0;
}
.spver__herosep {
  width: 1px;
  align-self: stretch;
  background: #b7cff0;
}
.spver__herolabel {
  font-size: 0.82rem;
  font-weight: 700;
  color: #3b4a63;
}
.spver__herovalue {
  font-size: 1.2rem;
  font-weight: 900;
  overflow-wrap: anywhere;
}
.spver__herovalue--monto {
  white-space: nowrap;
}
.spver__corr {
  font-weight: 600;
  color: #4a5670;
  font-size: 0.85em;
}
.spver__client {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 6px 12px;
  border-bottom: 1px solid #e3e9f3;
  font-size: 0.9rem;
}
.spver__clienttext {
  flex: 1 1 auto;
  min-width: 0;
}
.spver__paid {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 14px;
  border-left: 1px solid #e3e9f3;
  font-weight: 700;
  white-space: nowrap;
}
.spver__paidpill {
  padding: 4px 14px;
  border-radius: 8px;
  background: #e5e9f0;
  font-weight: 800;
}
.spver__paidpill--si {
  background: #d9f7e1;
  color: #166534;
}
.spver__card {
  border: 1px solid #dbe5f5;
  border-radius: 14px;
  overflow: hidden;
}
.spver__cardtitle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 10px 16px;
  background: #e8f1fd;
  font-size: 1.05rem;
  font-weight: 800;
}
.spver__cardtitle--plain {
  padding: 4px 0 10px;
  background: transparent;
}
.spver__dl {
  display: grid;
  grid-template-columns: auto 1fr;
  margin: 0;
}
.spver__dl dt,
.spver__dl dd {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 10px 16px;
  border-top: 1px solid #edf1f8;
}
.spver__dl dt {
  font-weight: 700;
  color: #3b4a63;
  white-space: nowrap;
}
.spver__dl dd {
  font-size: 1.05rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.spver__metodo {
  padding: 3px 12px;
  border-radius: 8px;
  background: #dcebfd;
  color: #0a1f44;
}
.spver__auth {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  align-items: end;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid #dbe5f5;
  border-radius: 14px;
}
.spver__authtitle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 16px;
  border-right: 1px solid #dbe5f5;
  font-weight: 800;
  align-self: center;
}
.spver__authcol {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.spver__authlabel {
  font-size: 0.8rem;
  color: #4a5670;
}
.spver__authline {
  min-height: 24px;
  border-bottom: 1px solid #8a97ab;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.spver__tablewrap {
  overflow-x: auto;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
}
.spver__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.spver__table th {
  padding: 10px 14px;
  background: #e8f1fd;
  font-weight: 700;
  text-align: left;
}
.spver__table td {
  padding: 10px 14px;
  border-top: 1px solid #edf1f8;
}
.spver__row--actual td {
  background: #fff7dc;
}
.spver__status {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 8px;
  background: #fde9a8;
  color: #6b4e00;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}
.spver__comment {
  margin: 0;
  font-size: 0.88rem;
  color: #3b4a63;
}
.spver__wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 48px;
  background: linear-gradient(90deg, #0b3d91, #0b5fd6);
  clip-path: path("M0 30 C 180 0, 360 60, 600 14 L 600 48 L 0 48 Z");
  pointer-events: none;
}
@media (max-width: 560px) {
  .spver__head {
    flex-wrap: wrap;
  }
  .spver__exp {
    margin-left: 0;
    align-items: flex-start;
  }
  .spver__hero {
    flex-direction: column;
    align-items: stretch;
  }
  .spver__herosep {
    width: auto;
    height: 1px;
  }
  .spver__auth {
    grid-template-columns: 1fr;
  }
  .spver__authtitle {
    border-right: 0;
  }
}
</style>
