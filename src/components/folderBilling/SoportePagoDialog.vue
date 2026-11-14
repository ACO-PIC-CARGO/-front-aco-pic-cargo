<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import FormatFecha from "../comun/FormatFecha.vue";
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

const DATO_REQUERIDO = "Dato Requerido";
const props = defineProps<{
  modelValue: boolean;
  solicitud: SolicitudSoporte | null;
  fechaInicial?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; guardado: [] }>();

const { smAndDown } = useDisplay();
const filesStore = useFilesStore();
const bancosStore = useBancosStore();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
// Tipo de documento: opcional y oculto en la vista; se envía 1 (Factura Fiscal) por defecto
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
    fechaPago.value = props.fechaInicial || hoy(); // por defecto: hoy
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
    max-width="640"
    :fullscreen="smAndDown"
    persistent
    scrollable
  >
    <v-card
      v-if="solicitud"
      class="soporte"
      :class="{ 'soporte--full': smAndDown }"
    >
      <!-- mismo encabezado que "Cargar Documento a Pagar" (Control de Gastos) -->
      <div class="soporte__head">
        <div class="soporte__icon">
          <v-icon size="32">
            mdi-cloud-upload-outline
          </v-icon>
        </div>
        <div class="soporte__titles">
          <h3>CARGAR DOCUMENTO DE PAGO</h3>
          <span>ADJUNTA EL SOPORTE DEL PAGO REALIZADO AL PROVEEDOR.</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          class="soporte__close"
          tabindex="-1"
          aria-label="Cerrar"
          :disabled="guardandoSoporte"
          @click="abierto = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="soporte__body">
        <div class="soporte__prov">
          <div class="soporte__prov-row">
            <v-icon class="soporte__prov-icon">
              mdi-storefront-outline
            </v-icon>
            <span class="soporte__prov-label">ID PROVEEDOR:</span>
            <span class="soporte__prov-value">{{ solicitud.id_proveedor }}{{ solicitud.correlativo ? ` - ${solicitud.correlativo}` : "" }}</span>
          </div>
          <div class="soporte__prov-row">
            <v-icon class="soporte__prov-icon">
              mdi-account-outline
            </v-icon>
            <span class="soporte__prov-label">NOMBRE:</span>
            <span class="soporte__prov-value">{{ solicitud.proveedor }}</span>
          </div>
        </div>

        <div class="soporte__grid">
          <div>
            <span class="soporte__label">MONTO <span class="soporte__req">*</span></span>
            <div class="soporte__static">
              <v-icon
                size="20"
                class="soporte__static-icon"
              >
                mdi-cash
              </v-icon>
              <span class="soporte__value">{{ formatoMonto(solicitud.monto) }}</span>
            </div>
          </div>
          <div>
            <span class="soporte__label">MONEDA <span class="soporte__req">*</span></span>
            <div class="soporte__static">
              <v-icon
                size="20"
                class="soporte__static-icon"
              >
                mdi-cash-multiple
              </v-icon>
              <span class="soporte__value">{{ solicitud.moneda || "—" }}</span>
            </div>
          </div>
        </div>

        <label
          class="soporte__label"
          for="soporte-cuenta"
        >
          BANCO Y CUENTA (DE DONDE SALIÓ EL PAGO) <span class="soporte__req">*</span>
        </label>
        <v-autocomplete
          id="soporte-cuenta"
          v-model="idCuentaSalida"
          :items="cuentasSalida"
          item-title="label"
          item-value="id"
          placeholder="SELECCIONAR BANCO Y CUENTA"
          prepend-inner-icon="mdi-bank-outline"
          variant="outlined"
          density="compact"
          class="soporte__input"
          :no-data-text="`No hay cuentas de la empresa en ${solicitud.moneda || 'esa moneda'}`"
          hide-details="auto"
          :error-messages="idCuentaSalida ? '' : DATO_REQUERIDO"
        />

        <label
          class="soporte__label"
          for="soporte-fecha"
        >FECHA DE PAGO <span class="soporte__req">*</span></label>
        <FormatFecha
          id="soporte-fecha"
          ref="inputFecha"
          v-model="fechaPago"
          label=""
          placeholder="SELECCIONAR FECHA"
          prepend-inner-icon="mdi-calendar-blank-outline"
          outlined
          density="compact"
          field-class="soporte__input"
          :max="hoy()"
          hide-details="auto"
          :error-messages="fechaPago ? '' : DATO_REQUERIDO"
        />

        <div
          v-if="!archivoSoporte"
          class="soporte__drop"
          :class="{ 'soporte__drop--over': arrastrando, 'soporte__drop--error': !subiendo }"
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
              size="40"
              color="#0b5fd6"
            >
              mdi-cloud-upload
            </v-icon>
            <strong>CARGAR EL ARCHIVO AQUÍ</strong>
            <span>Arrastra y suelta el archivo o haz clic para seleccionar (PDF, JPG o PNG)</span>
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
          v-if="!archivoSoporte && !subiendo"
          class="soporte__error"
        >
          {{ DATO_REQUERIDO }}
        </div>
        <div
          v-if="archivoSoporte"
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
          variant="outlined"
          :disabled="guardandoSoporte"
          @click="abierto = false"
        >
          CANCELAR
        </v-btn>
        <v-btn
          class="soporte__btn"
          color="#178a1e"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          :loading="guardandoSoporte"
          :disabled="!idCuentaSalida || !archivoSoporte || !fechaPago || subiendo"
          @click="guardarSoporte"
        >
          GUARDAR DOCUMENTO DE PAGO
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* cabecera y botones fijos; solo el cuerpo hace scroll si no entra en pantalla */
.soporte {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  border-radius: 22px !important;
  overflow: hidden;
  color: #0a1f44;
}
.soporte--full {
  max-height: none;
  border-radius: 0 !important;
}
.soporte__head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px 8px;
}
.soporte__icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #dcebfd;
  color: #0b5fd6;
}
.soporte__titles {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 14px;
  border-left: 2px solid #0b5fd6;
}
.soporte__titles h3 {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
  color: #0a1f44;
  line-height: 1.15;
}
.soporte__titles span {
  font-size: 12px;
  font-weight: 600;
  color: #3b4a63;
}
.soporte__close {
  align-self: flex-start;
  color: #0a1f44 !important;
}
.soporte__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 22px 4px;
}
.soporte__prov {
  padding: 6px 14px;
  margin-bottom: 4px;
  border-radius: 12px;
  background: #dcebfd;
}
.soporte__prov-row {
  display: grid;
  grid-template-columns: 26px 120px 1fr;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}
.soporte__prov-row + .soporte__prov-row {
  border-top: 1px solid #a9c6ee;
}
.soporte__prov-icon {
  color: #0b5fd6 !important;
}
.soporte__prov-label {
  font-size: 13px;
  font-weight: 700;
  color: #1e2c44;
}
.soporte__prov-value {
  font-size: 16px;
  font-weight: 900;
  color: #0a1f44;
  overflow-wrap: anywhere;
}
.soporte__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.soporte__label {
  display: block;
  margin: 10px 0 4px;
  font-size: 13px;
  font-weight: 800;
  color: #0a1f44;
}
.soporte__req {
  color: #e53935;
}
.soporte__input :deep(.v-field),
:deep(.soporte__input .v-field) {
  border-radius: 10px;
}
.soporte__static {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid #c9d3e1;
  border-radius: 10px;
  background: #f3f6fb;
}
.soporte__static-icon {
  color: #5b6b86 !important;
}
.soporte__value {
  font-size: 15px;
  font-weight: 700;
}
.soporte__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 112px;
  margin-top: 12px;
  padding: 12px;
  border: 2px dashed #0b5fd6;
  border-radius: 14px;
  background: #f1f7ff;
  color: #3b4a63;
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s ease;
}
.soporte__drop strong {
  font-size: 15px;
  font-weight: 900;
  color: #0a2a6b;
}
.soporte__drop:hover,
.soporte__drop:focus-visible,
.soporte__drop--over {
  outline: none;
  background: #e2eefd;
}
/* obligatorios vacíos: en rojo debajo, porque el botón Guardar no se activa sin ellos */
.soporte__drop--error {
  border-color: #e53935;
}
.soporte__error {
  margin: 4px 0 0 4px;
  color: #e53935;
  font-size: 12px;
}
.soporte__file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #a5d6a7;
  border-radius: 12px;
  background: #e8f5e9;
}
.soporte__actions {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
  padding: 14px 22px 18px;
}
.soporte__btn {
  min-height: 44px;
  border-radius: 10px !important;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0;
}
.soporte__btn--cancel {
  border-color: #c9d3e1 !important;
  color: #0a1f44 !important;
}

@media (max-width: 600px) {
  .soporte__grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .soporte__prov-row {
    grid-template-columns: 26px 1fr;
  }
  .soporte__prov-value {
    grid-column: 2;
  }
  .soporte__actions {
    grid-template-columns: 1fr;
  }
}
</style>
