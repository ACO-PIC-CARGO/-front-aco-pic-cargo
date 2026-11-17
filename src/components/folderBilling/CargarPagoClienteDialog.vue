<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import { useAppStore } from "@/stores/app";
import type { AdminCredentials } from "@/types/seguridad";
import type { DestinoPagoCliente, SolicitudCobro } from "@/types/solicitudCobro";
import { withAuthorization } from "@/utils/adminCredentials";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

// Control de Gastos > Ingresos > "Cargar Pago Cliente": voucher del cliente (imagen o PDF) y la
// cuenta nuestra (bank_details) donde depositó. Crea la solicitud de cobro (lista para enviar)
// o la edita. El monto siempre es el total pendiente del correlativo (lo calcula el backend).
const DATO_REQUERIDO = "Dato Requerido";
const props = defineProps<{
  modelValue: boolean;
  destino: DestinoPagoCliente | null;
  // edición: la solicitud actual y, si ya tenía aprobaciones, la clave del administrador
  solicitud?: SolicitudCobro | null;
  admin?: AdminCredentials | null;
}>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; guardado: [] }>();

const { smAndDown } = useDisplay();
const filesStore = useFilesStore();
const bancosStore = useBancosStore();
const appStore = useAppStore();

const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const idCuenta = ref<number | null>(null);
// banco del cliente desde donde envió el pago (mismo catálogo que "Banco Origen" en Bancos)
const idBancoOrigen = ref<number | null>(null);
const fechaDeposito = ref("");
const numeroOperacion = ref("");
const comentario = ref("");
const voucher = ref<{ id: number; nombre: string; ruta: string } | null>(null);
const subiendo = ref(false);
const arrastrando = ref(false);
const guardando = ref(false);
const inputArchivo = ref<HTMLInputElement | null>(null);
// al editar se muestran primero las cuentas en la moneda de la solicitud
const cuentas = computed(() => {
  const moneda = props.solicitud?.moneda;
  return moneda ? bancosStore.cuentas.filter((c) => c.symbol === moneda) : bancosStore.cuentas;
});
const completo = computed(() => !!idCuenta.value && !!idBancoOrigen.value && !!voucher.value && !!fechaDeposito.value && !!numeroOperacion.value.trim());

watch(
  () => props.modelValue,
  async (valor) => {
    if (!valor) return;
    const s = props.solicitud;
    idCuenta.value = s?.id_cuentabancaria ?? null;
    idBancoOrigen.value = s?.id_banco_origen ?? null;
    fechaDeposito.value = s?.fechadeposito ?? hoy();
    numeroOperacion.value = s?.numerooperacion ?? "";
    comentario.value = s?.comentario ?? "";
    voucher.value = s?.id_path_voucher
      ? { id: s.id_path_voucher, nombre: s.voucher_nombre || "Voucher", ruta: s.voucher_path || "" }
      : null;
    await Promise.all([
      bancosStore.cuentas.length ? null : bancosStore.getListBanksDetailsCargar(),
      appStore.itemsDataBanksList.length ? null : appStore._getBanksList(),
    ]);
    if (!idCuenta.value && cuentas.value.length === 1) idCuenta.value = cuentas.value[0]!.id;
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
    voucher.value = { id: Number(filesStore.payPath), nombre: archivo.name, ruta: filesStore.datosPath?.ruta || "" };
  } finally {
    subiendo.value = false;
  }
}

async function guardar() {
  const d = props.destino;
  if (!d || !completo.value) return;
  const datos = {
    id_cuentabancaria: idCuenta.value,
    id_banco_origen: idBancoOrigen.value,
    id_path: voucher.value!.id,
    fechadeposito: fechaDeposito.value,
    numerooperacion: numeroOperacion.value.trim(),
    comentario: comentario.value,
  };
  guardando.value = true;
  const response = props.solicitud
    ? await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_editar/" + props.solicitud.codigo,
      data: { ...datos, ...withAuthorization(props.admin) },
    })
    : await request({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_insertar",
      data: { ...datos, id_house: d.id_house, id_correlativo: d.id_correlativo },
    });
  guardando.value = false;
  if (!response.estadoflag) {
    Swal.fire({ icon: response.tipomensaje === "TMSGERR" ? "error" : "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
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
      v-if="destino"
      class="pagocli"
      :class="{ 'pagocli--full': smAndDown }"
    >
      <div class="pagocli__head">
        <div class="pagocli__icon">
          <v-icon size="32">
            mdi-cloud-upload-outline
          </v-icon>
        </div>
        <div class="pagocli__titles">
          <h3>CARGAR PAGO CLIENTE</h3>
          <span>ADJUNTA EL VOUCHER DEL DEPÓSITO DEL CLIENTE (IMAGEN O PDF).</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          class="pagocli__close"
          tabindex="-1"
          aria-label="Cerrar"
          :disabled="guardando"
          @click="abierto = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="pagocli__body">
        <div class="pagocli__cli">
          <div class="pagocli__cli-row">
            <v-icon class="pagocli__cli-icon">
              mdi-account-outline
            </v-icon>
            <span class="pagocli__cli-label">CLIENTE:</span>
            <span class="pagocli__cli-value">{{ destino.cliente }}{{ destino.correlativo ? ` - ${destino.correlativo}` : "" }}</span>
          </div>
          <div class="pagocli__cli-row">
            <v-icon class="pagocli__cli-icon">
              mdi-cash
            </v-icon>
            <span class="pagocli__cli-label">MONTO A COBRAR:</span>
            <span class="pagocli__cli-value">
              {{ formatoMonto(solicitud ? solicitud.monto : destino.deuda) }} {{ solicitud?.moneda ?? "" }}
            </span>
          </div>
        </div>
        <p class="pagocli__nota">
          <v-icon size="16">
            mdi-information-outline
          </v-icon>
          El cobro se solicita por el monto total pendiente del correlativo (no se permiten pagos parciales).
        </p>

        <label
          class="pagocli__label"
          for="pagocli-cuenta"
        >
          BANCO Y CUENTA DONDE DEPOSITÓ EL CLIENTE <span class="pagocli__req">*</span>
        </label>
        <v-autocomplete
          id="pagocli-cuenta"
          v-model="idCuenta"
          :items="cuentas"
          item-title="label"
          item-value="id"
          placeholder="SELECCIONAR BANCO Y CUENTA"
          prepend-inner-icon="mdi-bank-outline"
          variant="outlined"
          density="compact"
          class="pagocli__input"
          no-data-text="No hay cuentas bancarias de la empresa"
          hide-details="auto"
          :error-messages="idCuenta ? '' : DATO_REQUERIDO"
        />

        <label
          class="pagocli__label"
          for="pagocli-banco-origen"
        >
          BANCO DEL CLIENTE (DESDE DONDE ENVIÓ EL PAGO) <span class="pagocli__req">*</span>
        </label>
        <v-autocomplete
          id="pagocli-banco-origen"
          v-model="idBancoOrigen"
          :items="appStore.itemsDataBanksList"
          item-title="acronym"
          item-value="id"
          placeholder="SELECCIONAR BANCO DEL CLIENTE"
          prepend-inner-icon="mdi-bank-transfer-out"
          variant="outlined"
          density="compact"
          class="pagocli__input"
          no-data-text="No hay bancos registrados"
          hide-details="auto"
          :error-messages="idBancoOrigen ? '' : DATO_REQUERIDO"
        />

        <div class="pagocli__grid">
          <div>
            <label
              class="pagocli__label"
              for="pagocli-fecha"
            >FECHA DEL DEPÓSITO <span class="pagocli__req">*</span></label>
            <FormatFecha
              id="pagocli-fecha"
              v-model="fechaDeposito"
              label=""
              placeholder="SELECCIONAR FECHA"
              prepend-inner-icon="mdi-calendar-blank-outline"
              outlined
              density="compact"
              field-class="pagocli__input"
              :max="hoy()"
              hide-details="auto"
              :error-messages="fechaDeposito ? '' : DATO_REQUERIDO"
            />
          </div>
          <div>
            <label
              class="pagocli__label"
              for="pagocli-nroop"
            >N° DE OPERACIÓN <span class="pagocli__req">*</span></label>
            <v-text-field
              id="pagocli-nroop"
              v-model="numeroOperacion"
              placeholder="N° DEL VOUCHER"
              prepend-inner-icon="mdi-pound"
              variant="outlined"
              density="compact"
              class="pagocli__input"
              maxlength="100"
              hide-details="auto"
              :error-messages="numeroOperacion.trim() ? '' : DATO_REQUERIDO"
            />
          </div>
        </div>

        <label
          class="pagocli__label"
          for="pagocli-comentario"
        >COMENTARIO</label>
        <v-textarea
          id="pagocli-comentario"
          v-model="comentario"
          rows="1"
          auto-grow
          variant="outlined"
          density="compact"
          class="pagocli__input"
          hide-details
        />

        <div
          v-if="!voucher"
          class="pagocli__drop"
          :class="{ 'pagocli__drop--over': arrastrando, 'pagocli__drop--error': !subiendo }"
          role="button"
          tabindex="0"
          aria-label="Cargar el voucher del cliente"
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
            <strong>CARGAR EL VOUCHER AQUÍ</strong>
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
          v-if="!voucher && !subiendo"
          class="pagocli__error"
        >
          {{ DATO_REQUERIDO }}
        </div>
        <div
          v-if="voucher"
          class="pagocli__file"
        >
          <v-icon color="success">
            mdi-check-circle-outline
          </v-icon>
          <span class="text-truncate"><b>Voucher cargado:</b> {{ voucher.nombre }}</span>
          <v-btn
            v-if="voucher.ruta"
            icon="mdi-eye"
            variant="text"
            size="small"
            color="primary"
            title="Ver"
            aria-label="Ver voucher"
            @click="abrir(voucher.ruta)"
          />
          <v-btn
            icon="mdi-close-circle"
            variant="text"
            size="small"
            color="red"
            title="Quitar"
            aria-label="Quitar voucher"
            @click="voucher = null"
          />
        </div>
      </div>

      <div class="pagocli__actions">
        <v-btn
          class="pagocli__btn pagocli__btn--cancel"
          variant="outlined"
          :disabled="guardando"
          @click="abierto = false"
        >
          CANCELAR
        </v-btn>
        <v-btn
          class="pagocli__btn"
          color="#178a1e"
          variant="flat"
          prepend-icon="mdi-content-save-outline"
          :loading="guardando"
          :disabled="!completo || subiendo"
          @click="guardar"
        >
          {{ solicitud ? "GUARDAR CAMBIOS" : "GUARDAR PAGO DEL CLIENTE" }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.pagocli {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  border-radius: 22px !important;
  overflow: hidden;
  color: #0a1f44;
}
.pagocli--full {
  max-height: none;
  border-radius: 0 !important;
}
.pagocli__head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px 8px;
}
.pagocli__icon {
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
.pagocli__titles {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 14px;
  border-left: 2px solid #0b5fd6;
}
.pagocli__titles h3 {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
  line-height: 1.15;
}
.pagocli__titles span {
  font-size: 12px;
  font-weight: 600;
  color: #3b4a63;
}
.pagocli__close {
  align-self: flex-start;
  color: #0a1f44 !important;
}
.pagocli__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 22px 4px;
}
.pagocli__cli {
  padding: 6px 14px;
  margin-bottom: 4px;
  border-radius: 12px;
  background: #dcebfd;
}
.pagocli__cli-row {
  display: grid;
  grid-template-columns: 26px 150px 1fr;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}
.pagocli__cli-row + .pagocli__cli-row {
  border-top: 1px solid #a9c6ee;
}
.pagocli__cli-icon {
  color: #0b5fd6 !important;
}
.pagocli__cli-label {
  font-size: 13px;
  font-weight: 700;
  color: #1e2c44;
}
.pagocli__cli-value {
  font-size: 16px;
  font-weight: 900;
  overflow-wrap: anywhere;
}
.pagocli__nota {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
  font-size: 12px;
  color: #3b4a63;
}
.pagocli__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.pagocli__label {
  display: block;
  margin: 10px 0 4px;
  font-size: 13px;
  font-weight: 800;
}
.pagocli__req {
  color: #e53935;
}
.pagocli__input :deep(.v-field),
:deep(.pagocli__input .v-field) {
  border-radius: 10px;
}
.pagocli__drop {
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
}
.pagocli__drop strong {
  font-size: 15px;
  font-weight: 900;
  color: #0a2a6b;
}
.pagocli__drop:hover,
.pagocli__drop:focus-visible,
.pagocli__drop--over {
  outline: none;
  background: #e2eefd;
}
.pagocli__drop--error {
  border-color: #e53935;
}
.pagocli__error {
  margin: 4px 0 0 4px;
  color: #e53935;
  font-size: 12px;
}
.pagocli__file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #a5d6a7;
  border-radius: 12px;
  background: #e8f5e9;
}
.pagocli__actions {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
  padding: 14px 22px 18px;
}
.pagocli__btn {
  min-height: 44px;
  border-radius: 10px !important;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0;
}
.pagocli__btn--cancel {
  border-color: #c9d3e1 !important;
  color: #0a1f44 !important;
}

/* celular y tablet: una columna y botones a lo ancho */
@media (max-width: 600px) {
  .pagocli__grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .pagocli__cli-row {
    grid-template-columns: 26px 1fr;
  }
  .pagocli__cli-value {
    grid-column: 2;
  }
  .pagocli__actions {
    grid-template-columns: 1fr;
  }
}
</style>
