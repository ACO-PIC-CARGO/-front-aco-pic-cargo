<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import ArrastraYSolarComponent from "@/components/comun/ArrastraYSolarComponent.vue";
import { esPagoParcial, montoCobrado, montoCobro } from "@/composables/useSolicitudCobro";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

// Soporte de confirmación de una solicitud de cobro (Administración): el archivo y la fecha de ingreso
// en banco. La deja "Confirmado" y recién así se registra en Bancos (como el soporte de pago en Pagos).
export interface SolicitudConfirmar {
  codigo: string;
  cliente: string;
  correlativo?: string | null;
  expediente?: string | null;
  monto: number | string;
  // pago parcial: suma de los soportes cargados
  monto_soportes?: number | string | null;
  // confirmación por pago: el soporte de la fila
  codigo_soporte?: string | null;
  moneda: string | null;
  cuenta?: string | null;
}

const props = defineProps<{ modelValue: boolean; solicitud: SolicitudConfirmar | null }>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; guardado: [] }>();
const { smAndDown } = useDisplay();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const fechaIngreso = ref("");
const idArchivo = ref<number | null>(null);
const guardando = ref(false);
// la clave cambia en cada apertura para que el cargador empiece vacío
const apertura = ref(0);

function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

watch(
  () => props.modelValue,
  (valor) => {
    if (!valor) return;
    fechaIngreso.value = hoy();
    idArchivo.value = null;
    apertura.value += 1;
  },
);

function recibirArchivo(payload: { id: unknown }) {
  idArchivo.value = payload.id ? Number(payload.id) : null;
}

async function guardar() {
  const s = props.solicitud;
  if (!s) return;
  if (!idArchivo.value) {
    Swal.fire({ icon: "warning", text: "Sube el soporte de confirmación." });
    return;
  }
  if (!fechaIngreso.value) {
    Swal.fire({ icon: "warning", text: "Indica la fecha de ingreso en banco." });
    return;
  }
  guardando.value = true;
  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_confirmar/" + s.codigo,
    data: { id_path: idArchivo.value, fechaingreso: fechaIngreso.value, codigo_soporte: s.codigo_soporte ?? null },
  });
  guardando.value = false;
  if (!response.estadoflag) {
    Swal.fire({
      icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
      text: response.mensaje || CONNECTION_ERROR_MESSAGE,
    });
    return;
  }
  abierto.value = false;
  notifySuccess(response.mensaje);
  emit("guardado");
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="560"
    :fullscreen="smAndDown"
    persistent
    scrollable
  >
    <v-card
      v-if="solicitud"
      class="confcob"
      :class="{ 'confcob--full': smAndDown }"
    >
      <div class="confcob__head">
        <span class="confcob__icon">
          <v-icon size="28">mdi-file-check-outline</v-icon>
        </span>
        <div class="confcob__titles">
          <h3>Confirmar ingreso</h3>
          <span>Sube el soporte de confirmación y la fecha en que ingresó al banco.</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          :disabled="guardando"
          @click="abierto = false"
        />
      </div>

      <v-card-text class="confcob__body">
        <div class="confcob__resumen">
          <div>
            <span class="confcob__label">Cliente</span>
            <b>{{ solicitud.cliente }}</b>
            <small v-if="solicitud.expediente">{{ solicitud.expediente }}{{ solicitud.correlativo ? ` - ${solicitud.correlativo}` : "" }}</small>
          </div>
          <div class="confcob__monto">
            <span class="confcob__label">Monto</span>
            <b>{{ montoCobro(montoCobrado(solicitud), solicitud.moneda) }}</b>
            <small v-if="esPagoParcial(solicitud)">Pago parcial de {{ montoCobro(solicitud.monto, solicitud.moneda) }}</small>
            <small v-if="solicitud.cuenta">{{ solicitud.cuenta }}</small>
          </div>
        </div>

        <label
          class="confcob__field"
          for="confcob-fecha"
        >FECHA DE INGRESO EN BANCO <span class="text-error">*</span></label>
        <FormatFecha
          id="confcob-fecha"
          v-model="fechaIngreso"
          label=""
          placeholder="SELECCIONAR FECHA"
          prepend-inner-icon="mdi-calendar-blank-outline"
          outlined
          density="compact"
          :max="hoy()"
          hide-details="auto"
          :error-messages="fechaIngreso ? '' : 'Dato Requerido'"
        />

        <span class="confcob__field">SOPORTE DE CONFIRMACIÓN <span class="text-error">*</span></span>
        <ArrastraYSolarComponent
          :key="apertura"
          @id-archivo-cargado="recibirArchivo"
        />
      </v-card-text>

      <v-card-actions class="confcob__actions">
        <v-btn
          variant="outlined"
          :disabled="guardando"
          @click="abierto = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="success"
          variant="flat"
          prepend-icon="mdi-check-decagram"
          :loading="guardando"
          @click="guardar"
        >
          Confirmar ingreso
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.confcob {
  border-radius: 18px !important;
}
.confcob__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 10px;
}
.confcob__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e3ebfa;
  color: #1e5bd8;
}
.confcob__titles {
  flex: 1;
  min-width: 0;
}
.confcob__titles h3 {
  margin: 0;
  color: #0a1f44;
  font-size: 1.15rem;
  font-weight: 800;
  text-transform: uppercase;
}
.confcob__titles span {
  color: #5b6b86;
  font-size: 0.8rem;
}
.confcob__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.confcob__resumen {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  margin-bottom: 6px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #eef4ff;
}
.confcob__resumen > div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.confcob__resumen small {
  color: #5b6b86;
}
.confcob__monto {
  text-align: right;
}
.confcob__monto b {
  color: #15803d;
  font-size: 1.1rem;
}
.confcob__label {
  color: #5b6b86;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}
.confcob__field {
  margin-top: 6px;
  color: #0a1f44;
  font-size: 0.78rem;
  font-weight: 800;
}
.confcob__actions {
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 18px 16px;
}
/* celular: pantalla completa, botones a lo ancho */
.confcob--full {
  border-radius: 0 !important;
}
@media (max-width: 600px) {
  .confcob__resumen {
    grid-template-columns: 1fr;
  }
  .confcob__monto {
    text-align: left;
  }
  .confcob__actions .v-btn {
    flex: 1 1 0;
    min-height: 44px;
  }
}
</style>
