<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";
import type { AreaRevision } from "@/composables/useRevisionSolicitudPago";

// Rechazar una solicitud (pago o cobro): solo el paso pendiente (Administración o Gerencia) y solo
// quien puede aprobar ese paso (perfil 04/01 Administración, 01 Gerencia; lo valida el backend).
export interface SolicitudARechazar {
  // id de la solicitud de pago o código de la solicitud de cobro (SC-000001)
  id: number | string;
  area: AreaRevision;
}

const props = defineProps<{
  modelValue: boolean;
  solicitud: SolicitudARechazar | null;
  // "INGRESO" (cobro) o "PAGO"
  tipo: "INGRESO" | "PAGO";
  ruta: string;
}>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; rechazado: [] }>();
const { smAndDown } = useDisplay();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const fecha = ref("");
const motivo = ref("");
const guardando = ref(false);
const intentado = ref(false);

// quien rechaza es el usuario conectado (el mismo que podría aprobar el paso)
const persona = computed(() => {
  try {
    const u = sessionUser();
    return u.nombrecompleto || u.names || u.users || u.usuario || "";
  } catch {
    return "";
  }
});
const area = computed(() => (props.solicitud?.area === "GER" ? "Gerencia" : "Administración"));

function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

watch(
  () => props.modelValue,
  (valor) => {
    if (!valor) return;
    fecha.value = hoy();
    motivo.value = "";
    intentado.value = false;
  },
);

async function confirmar() {
  const s = props.solicitud;
  if (!s) return;
  intentado.value = true;
  if (!fecha.value || !motivo.value.trim()) return;
  guardando.value = true;
  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + props.ruta + "/" + encodeURIComponent(String(s.id)),
    data: { tipo: s.area, motivo: motivo.value.trim(), fecha: fecha.value },
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
  emit("rechazado");
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="600"
    :fullscreen="smAndDown"
    persistent
    scrollable
  >
    <v-card
      v-if="solicitud"
      class="rechazo"
      :class="{ 'rechazo--full': smAndDown }"
    >
      <div class="rechazo__head">
        <div class="rechazo__titles">
          <h3>RECHAZAR {{ tipo }}</h3>
          <span>Indica los datos del rechazo del {{ tipo === "INGRESO" ? "ingreso" : "pago" }} ({{ area }}).</span>
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

      <v-card-text class="rechazo__body">
        <label
          class="rechazo__label"
          for="rechazo-fecha"
        >Fecha</label>
        <FormatFecha
          id="rechazo-fecha"
          v-model="fecha"
          label=""
          placeholder="SELECCIONAR FECHA"
          outlined
          density="compact"
          :max="hoy()"
          hide-details="auto"
          :error-messages="intentado && !fecha ? 'Dato Requerido' : ''"
        />

        <label
          class="rechazo__label"
          for="rechazo-motivo"
        >Motivo</label>
        <v-textarea
          id="rechazo-motivo"
          v-model="motivo"
          rows="2"
          auto-grow
          variant="outlined"
          density="compact"
          placeholder="Indica qué debe corregir el solicitante"
          maxlength="500"
          hide-details="auto"
          :error-messages="intentado && !motivo.trim() ? 'Dato Requerido' : ''"
        />

        <label
          class="rechazo__label"
          for="rechazo-persona"
        >Persona que rechaza</label>
        <v-select
          id="rechazo-persona"
          :model-value="persona"
          :items="[persona]"
          variant="outlined"
          density="compact"
          readonly
          hide-details
          title="Rechaza el usuario conectado (el mismo que puede aprobar este paso)"
        />
      </v-card-text>

      <div class="rechazo__actions">
        <v-btn
          variant="outlined"
          class="rechazo__btn rechazo__btn--cancel"
          :disabled="guardando"
          @click="abierto = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="#e11d48"
          variant="flat"
          class="rechazo__btn"
          :loading="guardando"
          @click="confirmar"
        >
          Confirmar rechazo
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.rechazo {
  border-radius: 18px !important;
  color: #111827;
}
.rechazo--full {
  border-radius: 0 !important;
}
.rechazo__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 22px 4px;
}
.rechazo__titles {
  flex: 1;
  min-width: 0;
}
.rechazo__titles h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0;
}
.rechazo__titles span {
  color: #4b5563;
  font-size: 0.9rem;
}
.rechazo__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 22px 12px !important;
}
.rechazo__label {
  margin-top: 8px;
  font-size: 0.9rem;
  font-weight: 700;
}
.rechazo__body :deep(.v-field) {
  border-radius: 8px;
}
.rechazo__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 22px 20px;
  border-top: 1px solid #e5e7eb;
}
.rechazo__btn {
  min-width: 120px;
  min-height: 40px;
  border-radius: 10px !important;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
.rechazo__btn--cancel {
  border-color: #9ca3af !important;
  color: #111827 !important;
}
@media (max-width: 600px) {
  .rechazo__actions .rechazo__btn {
    flex: 1 1 0;
    min-height: 44px;
  }
}
</style>
