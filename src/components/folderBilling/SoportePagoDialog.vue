<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import { useFilesStore } from "@/stores/files";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

// Cargar el soporte de pago de una solicitud (pide la fecha de pago y la deja PAGADO).
// Se usa en Control de Gastos y en Bancos > Solicitudes de Pago.
export interface SolicitudSoporte {
  id: number;
  proveedor: string;
  id_proveedor: number;
  correlativo?: string | null;
  moneda: string | null;
  monto: number | string;
}

const props = defineProps<{
  modelValue: boolean;
  solicitud: SolicitudSoporte | null;
  fechaInicial?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; guardado: [] }>();

const TIPOS_SOPORTE = [
  { valor: 1, titulo: "Factura Fiscal", icono: "mdi-file-certificate-outline" },
  { valor: 2, titulo: "Proforma", icono: "mdi-file-document-outline" },
  { valor: 3, titulo: "Otros (ej. email)", icono: "mdi-email-outline" },
];

const { smAndDown } = useDisplay();
const filesStore = useFilesStore();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const tipoSoporte = ref(1);
const fechaPago = ref("");
const subiendo = ref(false);
const arrastrando = ref(false);
const archivoSoporte = ref<{ id: number; nombre: string; ruta: string } | null>(null);
const inputArchivo = ref<HTMLInputElement | null>(null);
const inputFecha = ref<{ focus: () => void } | null>(null);
const guardandoSoporte = ref(false);

watch(
  () => props.modelValue,
  (valor) => {
    if (!valor) return;
    tipoSoporte.value = 1;
    fechaPago.value = props.fechaInicial || "";
    archivoSoporte.value = null;
  },
);

function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function formatoMonto(valor: number | string) {
  return Number(valor || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function abrir(url: string | null | undefined) {
  if (url) window.open(url, "_blank");
}

function seleccionarArchivo() {
  if (!subiendo.value) inputArchivo.value?.click();
}

async function alSoltar(event: DragEvent) {
  arrastrando.value = false;
  const archivo = event.dataTransfer?.files?.[0];
  if (archivo) await subirArchivo(archivo);
}

async function alElegir(event: Event) {
  const input = event.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = "";
  if (archivo) await subirArchivo(archivo);
}

async function subirArchivo(archivo: File) {
  if (!(archivo.type === "application/pdf" || archivo.type.startsWith("image/"))) {
    Swal.fire({ icon: "error", title: "Formato no válido", text: "Sube una imagen o un archivo PDF." });
    return;
  }
  subiendo.value = true;
  try {
    const error = await filesStore._uploadFile(archivo);
    if (error || !filesStore.payPath) {
      Swal.fire({ icon: "error", text: error || "No pudimos subir el archivo. Intenta de nuevo." });
      return;
    }
    archivoSoporte.value = {
      id: Number(filesStore.payPath),
      nombre: archivo.name,
      ruta: filesStore.datosPath?.ruta || "",
    };
  } finally {
    subiendo.value = false;
  }
  // Al cargar el soporte se solicita automáticamente la fecha de pago
  if (!fechaPago.value) {
    await nextTick();
    inputFecha.value?.focus();
  }
}

async function guardarSoporte() {
  const s = props.solicitud;
  if (!s) return;
  if (!archivoSoporte.value) {
    Swal.fire({ icon: "warning", text: "Sube el soporte de pago." });
    return;
  }
  if (!fechaPago.value) {
    Swal.fire({ icon: "warning", text: "Indica la fecha de pago." });
    inputFecha.value?.focus();
    return;
  }
  guardandoSoporte.value = true;
  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_pagar/" + s.id,
    data: { id_path: archivoSoporte.value.id, tiposoporte: tipoSoporte.value, fechapago: fechaPago.value },
  });
  guardandoSoporte.value = false;
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
    max-width="720"
    :fullscreen="smAndDown"
    persistent
  >
    <v-card
      v-if="solicitud"
      class="soporte"
      rounded="xl"
    >
      <div class="soporte__head">
        <div class="soporte__icon">
          <v-icon
            color="primary"
            size="30"
          >
            mdi-file-upload-outline
          </v-icon>
        </div>
        <div class="soporte__titles">
          <h3>
            Proveedor: {{ `${solicitud.proveedor} (${solicitud.id_proveedor})` }}<template v-if="solicitud.correlativo">
              - {{ solicitud.correlativo }}
            </template>
          </h3>
          <p>
            Cargar documento a pagar · {{ solicitud.moneda }} {{ formatoMonto(solicitud.monto) }}
          </p>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          class="ml-auto"
          :disabled="guardandoSoporte"
          @click="abierto = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="soporte__body">
        <h4>Escoge una opción</h4>
        <div class="soporte__options">
          <button
            v-for="t in TIPOS_SOPORTE"
            :key="t.valor"
            type="button"
            class="soporte__option"
            :class="{ 'soporte__option--active': tipoSoporte === t.valor }"
            @click="tipoSoporte = t.valor"
          >
            <v-icon
              size="20"
              :color="tipoSoporte === t.valor ? 'primary' : 'grey'"
            >
              {{ tipoSoporte === t.valor ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
            </v-icon>
            <v-icon
              size="26"
              color="primary"
            >
              {{ t.icono }}
            </v-icon>
            <span>{{ t.titulo }}</span>
          </button>
        </div>

        <div
          v-if="!archivoSoporte"
          class="soporte__drop"
          :class="{ 'soporte__drop--over': arrastrando }"
          role="button"
          tabindex="0"
          @click="seleccionarArchivo"
          @keydown.enter="seleccionarArchivo"
          @dragover.prevent="arrastrando = true"
          @dragleave.prevent="arrastrando = false"
          @drop.prevent="alSoltar"
        >
          <template v-if="!subiendo">
            <v-icon
              size="40"
              color="grey-darken-1"
            >
              mdi-cloud-upload-outline
            </v-icon>
            <strong>Arrastra y suelta el archivo aquí</strong>
            <span>o haz clic para seleccionar</span>
          </template>
          <template v-else>
            <v-progress-circular
              indeterminate
              color="primary"
            />
            <span>Subiendo archivo...</span>
          </template>
          <input
            ref="inputArchivo"
            type="file"
            accept="image/*,application/pdf"
            hidden
            @change="alElegir"
          >
        </div>
        <div
          v-else
          class="soporte__file"
        >
          <v-icon color="success">
            mdi-check-circle-outline
          </v-icon>
          <span class="text-truncate"><b>Soporte cargado:</b> {{ archivoSoporte.nombre }}</span>
          <v-btn
            v-if="archivoSoporte.ruta"
            icon
            variant="text"
            size="small"
            color="primary"
            title="Ver"
            @click="abrir(archivoSoporte.ruta)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="red"
            title="Quitar"
            @click="archivoSoporte = null"
          >
            <v-icon>mdi-close-circle</v-icon>
          </v-btn>
        </div>

        <v-expand-transition>
          <div
            v-if="archivoSoporte"
            class="soporte__fecha"
          >
            <v-text-field
              ref="inputFecha"
              v-model="fechaPago"
              type="date"
              label="Fecha de pago *"
              prepend-inner-icon="mdi-calendar-check-outline"
              variant="outlined"
              density="comfortable"
              :max="hoy()"
              :rules="[(v: string) => !!v || 'Indica la fecha de pago']"
              hint="Obligatoria al registrar el soporte de pago"
              persistent-hint
            />
          </div>
        </v-expand-transition>
      </div>

      <div class="soporte__actions">
        <v-btn
          variant="outlined"
          rounded="lg"
          :disabled="guardandoSoporte"
          @click="abierto = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="guardandoSoporte"
          :disabled="!archivoSoporte || !fechaPago || subiendo"
          @click="guardarSoporte"
        >
          Guardar Documento
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.soporte__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 22px 8px;
}
.soporte__icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #e8f0fe;
  flex: 0 0 54px;
}
.soporte__titles {
  padding-left: 14px;
  border-left: 1px solid #d5dbe6;
  min-width: 0;
}
.soporte__titles h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #172036;
}
.soporte__titles p {
  margin: 2px 0 0;
  color: #5b6b86;
}
.soporte__body {
  padding: 12px 22px;
}
.soporte__body h4 {
  font-size: 1.02rem;
  font-weight: 700;
  margin-bottom: 10px;
}
.soporte__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.soporte__option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid #d5dbe6;
  border-radius: 10px;
  background: #fff;
  font-weight: 700;
  text-align: left;
  transition: all 0.15s ease;
}
.soporte__option:hover {
  border-color: #1e5bd8;
}
.soporte__option--active {
  border-color: #1e5bd8;
  background: #eef4ff;
  box-shadow: 0 0 0 1px #1e5bd8 inset;
}
.soporte__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 140px;
  padding: 18px;
  border: 2px dashed #b9c3d3;
  border-radius: 12px;
  background: #f8fafc;
  color: #5b6b86;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}
.soporte__drop strong {
  color: #2b3446;
}
.soporte__drop:hover,
.soporte__drop--over {
  border-color: #1e5bd8;
  background: #eef4ff;
}
.soporte__file {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #a5d6a7;
  border-radius: 10px;
  background: #e8f5e9;
}
.soporte__fecha {
  margin-top: 16px;
}
.soporte__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 22px 22px;
}

@media (max-width: 600px) {
  .soporte__options {
    grid-template-columns: 1fr;
  }
  .soporte__actions .v-btn {
    flex: 1;
  }
}
</style>
