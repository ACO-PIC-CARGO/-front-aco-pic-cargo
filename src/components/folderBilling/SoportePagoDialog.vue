<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

// Cargar el soporte de pago de una solicitud (pide la cuenta de salida y la fecha de pago y la deja PAGADO).
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
const bancosStore = useBancosStore();

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
// Cuenta de la empresa de donde sale el pago: solo cuentas en la moneda de la solicitud
const idCuentaSalida = ref<number | null>(null);
const cuentasSalida = computed(() =>
  bancosStore.cuentas.filter((c) => !props.solicitud?.moneda || c.symbol === props.solicitud.moneda),
);

watch(
  () => props.modelValue,
  (valor) => {
    if (!valor) return;
    tipoSoporte.value = 1;
    fechaPago.value = props.fechaInicial || "";
    archivoSoporte.value = null;
    idCuentaSalida.value = null;
    cargarCuentasSalida();
  },
);

async function cargarCuentasSalida() {
  if (!bancosStore.cuentas.length) await bancosStore.getListBanksDetailsCargar();
  // si solo hay una cuenta en la moneda de la solicitud, se elige sola
  if (!idCuentaSalida.value && cuentasSalida.value.length === 1) idCuentaSalida.value = cuentasSalida.value[0]!.id;
}

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
  if (!idCuentaSalida.value) {
    Swal.fire({ icon: "warning", text: "Selecciona la cuenta de la empresa de donde salió el pago." });
    return;
  }
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
    data: {
      id_path: archivoSoporte.value.id,
      tiposoporte: tipoSoporte.value,
      fechapago: fechaPago.value,
      id_cuentasalida: idCuentaSalida.value,
    },
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
    max-width="760"
    :fullscreen="smAndDown"
    persistent
  >
    <v-card
      v-if="solicitud"
      class="soporte"
    >
      <div class="soporte__head">
        <div class="soporte__icon">
          <v-icon size="40">
            mdi-cloud-upload
          </v-icon>
        </div>
        <div class="soporte__titles">
          <h3>Cargar Documento de Pago</h3>
          <p>
            {{ `${solicitud.proveedor} (${solicitud.id_proveedor})` }}<template v-if="solicitud.correlativo">
              - {{ solicitud.correlativo }}
            </template>
          </p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          class="soporte__close"
          aria-label="Cerrar"
          :disabled="guardandoSoporte"
          @click="abierto = false"
        />
      </div>

      <div class="soporte__body">
        <div class="soporte__grid">
          <div>
            <span class="soporte__label">Monto <span class="soporte__req">*</span></span>
            <div class="soporte__static">
              <span class="soporte__addon">
                <v-icon size="22">mdi-currency-usd</v-icon>
              </span>
              <span class="soporte__value">{{ formatoMonto(solicitud.monto) }}</span>
            </div>
          </div>
          <div>
            <span class="soporte__label">Moneda <span class="soporte__req">*</span></span>
            <div class="soporte__static">
              <span class="soporte__value">{{ solicitud.moneda || "—" }}</span>
            </div>
          </div>
        </div>

        <label
          class="soporte__label"
          for="soporte-cuenta"
        >
          Banco y Cuenta (de donde salió el pago) <span class="soporte__req">*</span>
        </label>
        <v-autocomplete
          id="soporte-cuenta"
          v-model="idCuentaSalida"
          :items="cuentasSalida"
          item-title="label"
          item-value="id"
          placeholder="Seleccionar banco y cuenta"
          prepend-inner-icon="mdi-bank"
          variant="outlined"
          density="comfortable"
          class="soporte__input"
          :no-data-text="`No hay cuentas de la empresa en ${solicitud.moneda || 'esa moneda'}`"
          hide-details="auto"
        />

        <div class="soporte__grid">
          <div>
            <label
              class="soporte__label"
              for="soporte-tipo"
            >Tipo de documento <span class="soporte__req">*</span></label>
            <v-select
              id="soporte-tipo"
              v-model="tipoSoporte"
              :items="TIPOS_SOPORTE"
              item-title="titulo"
              item-value="valor"
              prepend-inner-icon="mdi-file-document-outline"
              variant="outlined"
              density="comfortable"
              class="soporte__input"
              hide-details
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item
                  v-bind="itemProps"
                  :prepend-icon="item.icono"
                />
              </template>
            </v-select>
          </div>
          <div>
            <label
              class="soporte__label"
              for="soporte-fecha"
            >Fecha de pago <span class="soporte__req">*</span></label>
            <v-text-field
              id="soporte-fecha"
              ref="inputFecha"
              v-model="fechaPago"
              type="date"
              prepend-inner-icon="mdi-calendar-check-outline"
              variant="outlined"
              density="comfortable"
              class="soporte__input"
              :max="hoy()"
              hide-details="auto"
            />
          </div>
        </div>

        <div
          v-if="!archivoSoporte"
          class="soporte__drop"
          :class="{ 'soporte__drop--over': arrastrando }"
          role="button"
          tabindex="0"
          aria-label="Cargar el archivo del soporte de pago"
          @click="seleccionarArchivo"
          @keydown.enter.prevent="seleccionarArchivo"
          @keydown.space.prevent="seleccionarArchivo"
          @dragover.prevent="arrastrando = true"
          @dragleave.prevent="arrastrando = false"
          @drop.prevent="alSoltar"
        >
          <template v-if="!subiendo">
            <v-icon
              size="64"
              color="#0b5fd6"
            >
              mdi-cloud-upload
            </v-icon>
            <strong>Cargar el archivo aquí</strong>
            <span>Arrastra y suelta el archivo o haz clic para seleccionar</span>
            <span>(PDF, JPG o PNG)</span>
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
            icon="mdi-eye"
            variant="text"
            size="small"
            color="primary"
            title="Ver"
            aria-label="Ver soporte"
            @click="abrir(archivoSoporte.ruta)"
          />
          <v-btn
            icon="mdi-close-circle"
            variant="text"
            size="small"
            color="red"
            title="Quitar"
            aria-label="Quitar soporte"
            @click="archivoSoporte = null"
          />
        </div>
      </div>

      <div class="soporte__actions">
        <v-btn
          class="soporte__btn soporte__btn--cancel"
          variant="flat"
          :disabled="guardandoSoporte"
          @click="abierto = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          class="soporte__btn"
          color="#178a1e"
          variant="flat"
          prepend-icon="mdi-send"
          :loading="guardandoSoporte"
          :disabled="!idCuentaSalida || !archivoSoporte || !fechaPago || subiendo"
          @click="guardarSoporte"
        >
          Guardar Documento de Pago
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.soporte {
  border-radius: 24px !important;
  color: #0a1f44;
}
.soporte__head {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 26px 14px;
  border-bottom: 1px solid #e6ecf4;
}
.soporte__icon {
  display: grid;
  place-items: center;
  flex: 0 0 72px;
  width: 72px;
  height: 64px;
  border-radius: 14px;
  background: #dcebfd;
  color: #0b5fd6;
}
.soporte__titles {
  min-width: 0;
}
.soporte__titles h3 {
  margin: 0;
  font-size: clamp(1.4rem, 4vw, 1.9rem);
  font-weight: 900;
  color: #0a2a6b;
  line-height: 1.15;
}
.soporte__titles p {
  margin: 2px 0 0;
  color: #4a5670;
  font-weight: 600;
}
.soporte__close {
  align-self: flex-start;
  margin-left: auto;
}
.soporte__body {
  padding: 16px 26px 6px;
}
.soporte__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.soporte__label {
  display: block;
  margin: 12px 0 6px;
  font-size: 1rem;
  font-weight: 800;
  color: #0a1f44;
}
.soporte__input :deep(.v-field) {
  border-radius: 10px;
}
.soporte__static {
  display: flex;
  align-items: stretch;
  min-height: 48px;
  border: 1px solid #c9d3e1;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.soporte__addon {
  display: grid;
  place-items: center;
  width: 56px;
  background: #eef2f7;
  border-right: 1px solid #c9d3e1;
}
.soporte__value {
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-size: 1.05rem;
  font-weight: 700;
}
.soporte__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 190px;
  margin-top: 18px;
  padding: 18px;
  border: 2px dashed #0b5fd6;
  border-radius: 16px;
  background: #f1f7ff;
  color: #3b4a63;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease;
}
.soporte__drop strong {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0a2a6b;
}
.soporte__drop:hover,
.soporte__drop:focus-visible,
.soporte__drop--over {
  outline: none;
  background: #e2eefd;
}
.soporte__file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 12px 14px;
  border: 1px solid #a5d6a7;
  border-radius: 12px;
  background: #e8f5e9;
}
.soporte__actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 18px 26px 24px;
}
.soporte__btn {
  min-height: 52px;
  padding: 0 24px !important;
  border-radius: 12px !important;
  font-size: 1.05rem;
  font-weight: 800;
  text-transform: none;
  letter-spacing: 0;
}
.soporte__btn--cancel {
  background: #e3e7ee !important;
  color: #0a1f44 !important;
}

@media (max-width: 600px) {
  .soporte__grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .soporte__actions {
    flex-direction: column-reverse;
  }
}
</style>
