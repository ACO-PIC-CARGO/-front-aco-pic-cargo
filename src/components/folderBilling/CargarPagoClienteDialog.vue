<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import FormatFecha from "../comun/FormatFecha.vue";
import { useFilesStore } from "@/stores/files";
import { useBancosStore } from "@/stores/bancos";
import { useAppStore } from "@/stores/app";
import type { AdminCredentials } from "@/types/seguridad";
import type { DestinoPagoCliente, SolicitudCobro, SoporteCobro } from "@/types/solicitudCobro";
import { withAuthorization } from "@/utils/adminCredentials";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

// Control de Gastos > Ingresos > "Cargar Pago Cliente": un pago (total o parcial) con su voucher y la
// cuenta nuestra (bank_details) donde depositó. Un correlativo puede tener varios pagos; la suma no
// puede pasar el monto a cobrar y solo se envía a Administración cuando la suma es exacta.
const DATO_REQUERIDO = "Dato Requerido";
const props = defineProps<{
  modelValue: boolean;
  destino: DestinoPagoCliente | null;
  // la solicitud del correlativo (si ya tiene pagos) y el pago que se edita (null = pago nuevo)
  solicitud?: SolicitudCobro | null;
  soporte?: SoporteCobro | null;
  // si la solicitud ya tenía aprobaciones, la clave del administrador
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
const monto = ref<string | number>("");
const idCuenta = ref<number | null>(null);
// banco del cliente desde donde envió el pago (mismo catálogo que "Banco Origen" en Bancos)
const idBancoOrigen = ref<number | null>(null);
const fechaDeposito = ref("");
const numeroOperacion = ref("");
// N° de operación: "Aplica" (obligatorio) o "No aplica" (no se pide; se escribe en Bancos al registrar el ingreso)
const aplicaNroOperacion = ref(true);
const OPCIONES_NRO_OPERACION = [
  { titulo: "Aplica", valor: true },
  { titulo: "No aplica", valor: false },
];
watch(aplicaNroOperacion, (aplica) => {
  if (!aplica) numeroOperacion.value = "";
});
const comentario = ref("");
const voucher = ref<{ id: number; nombre: string; ruta: string } | null>(null);
const subiendo = ref(false);
const arrastrando = ref(false);
const guardando = ref<"guardar" | "enviar" | null>(null);
const inputArchivo = ref<HTMLInputElement | null>(null);

const redondear = (n: number) => Math.round(n * 100) / 100;
// monto a cobrar del correlativo y lo que ya cubren los otros pagos
const total = computed(() => redondear(Number(props.solicitud?.monto ?? props.destino?.deuda ?? 0)));
const otros = computed(() =>
  redondear((props.solicitud?.soportes ?? []).filter((x) => x.codigo !== props.soporte?.codigo).reduce((acc, x) => acc + Number(x.monto || 0), 0)),
);
const maximo = computed(() => Math.max(redondear(total.value - otros.value), 0));
const montoNum = computed(() => redondear(Number(monto.value || 0)));
const saldo = computed(() => Math.max(redondear(maximo.value - montoNum.value), 0));
const errorMonto = computed(() => {
  if (!(montoNum.value > 0)) return DATO_REQUERIDO;
  if (montoNum.value > maximo.value) return `No puede ser mayor a ${formatoMonto(maximo.value)}`;
  return "";
});

// moneda: la de la solicitud o la de la cuenta elegida
// cuentas de la moneda del correlativo
const cuentasMoneda = computed(() => {
  const moneda = props.solicitud?.moneda;
  if (moneda) return bancosStore.cuentas.filter((c) => c.symbol === moneda);
  // moneda de los ingresos del correlativo (coins): solo las cuentas en esa moneda
  const idCoins = props.destino?.id_coins;
  return idCoins ? bancosStore.cuentas.filter((c) => Number(c.id_coins) === Number(idCoins)) : bancosStore.cuentas;
});
// al cargar el soporte solo se ofrece la cuenta principal de la empresa (esprincipalflag); al editar un
// pago se mantiene también la suya. Sin cuenta principal configurada, todas las de esa moneda.
const cuentas = computed(() => {
  const principales = cuentasMoneda.value.filter((c) => c.esprincipalflag);
  if (!principales.length) return cuentasMoneda.value;
  const actual = props.soporte ? cuentasMoneda.value.find((c) => c.id === props.soporte!.id_cuentabancaria) : undefined;
  return actual && !actual.esprincipalflag ? [...principales, actual] : principales;
});
const moneda = computed(
  () =>
    props.solicitud?.moneda
    ?? bancosStore.cuentas.find((c) => c.id === idCuenta.value)?.symbol
    ?? cuentas.value[0]?.symbol
    ?? "USD",
);
const completo = computed(
  () => !errorMonto.value && !!idCuenta.value && !!idBancoOrigen.value && !!voucher.value && !!fechaDeposito.value && (!aplicaNroOperacion.value || !!numeroOperacion.value.trim()),
);
// ya enviada: al guardar con la suma exacta se vuelve a enviar sola
const yaEnviada = computed(() => !!props.solicitud?.enviadoflag);
// pago parcial permitido: se envía con lo cargado; en Bancos queda como abono parcial
const puedeEnviar = computed(() => completo.value && !yaEnviada.value);

watch(
  () => props.modelValue,
  async (valor) => {
    if (!valor) return;
    const sop = props.soporte;
    const previo = props.solicitud?.soportes?.[0];
    // pago nuevo: el monto lo escribe el usuario (no se llena solo); al editar, el del pago
    monto.value = sop ? Number(sop.monto).toFixed(2) : "";
    // editar: la cuenta del pago; pago nuevo: la cuenta principal de la empresa (se elige al cargar las cuentas)
    idCuenta.value = sop?.id_cuentabancaria ?? null;
    idBancoOrigen.value = sop?.id_banco_origen ?? previo?.id_banco_origen ?? null;
    fechaDeposito.value = sop?.fechadeposito ?? hoy();
    // al editar: sin número guardado es "No aplica"
    aplicaNroOperacion.value = sop ? !!sop.numerooperacion : true;
    numeroOperacion.value = sop?.numerooperacion ?? "";
    comentario.value = sop?.comentario ?? "";
    voucher.value = sop?.id_path_voucher
      ? { id: sop.id_path_voucher, nombre: sop.voucher_nombre || "Voucher", ruta: sop.voucher_path || "" }
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

async function guardar(enviar: boolean) {
  const d = props.destino;
  if (!d || !completo.value || guardando.value) return;
  guardando.value = enviar ? "enviar" : "guardar";
  const response = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_cobro_soporte_guardar",
    data: {
      id_house: d.id_house,
      id_correlativo: d.id_correlativo,
      codigo_soporte: props.soporte?.codigo ?? null,
      monto: montoNum.value,
      id_cuentabancaria: idCuenta.value,
      id_banco_origen: idBancoOrigen.value,
      id_path: voucher.value!.id,
      fechadeposito: fechaDeposito.value,
      numerooperacion: aplicaNroOperacion.value ? numeroOperacion.value.trim() : null,
      aplica_nrooperacion: aplicaNroOperacion.value,
      comentario: comentario.value,
      enviar,
      ...withAuthorization(props.admin),
    },
  });
  guardando.value = null;
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
    max-width="660"
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
          <v-icon size="30">
            mdi-cloud-upload-outline
          </v-icon>
        </div>
        <div class="pagocli__titles">
          <h3>{{ soporte ? "EDITAR PAGO DEL CLIENTE" : "CARGAR PAGO DEL CLIENTE" }}</h3>
          <span>Adjunta el voucher del depósito del cliente (imagen o PDF).</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          class="pagocli__close"
          tabindex="-1"
          aria-label="Cerrar"
          :disabled="!!guardando"
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
              mdi-database-outline
            </v-icon>
            <span class="pagocli__cli-label">MONTO TOTAL A COBRAR:</span>
            <span class="pagocli__cli-value">{{ moneda }} {{ formatoMonto(total) }}</span>
          </div>
          <div
            v-if="otros > 0"
            class="pagocli__cli-row"
          >
            <v-icon class="pagocli__cli-icon">
              mdi-cash-check
            </v-icon>
            <span class="pagocli__cli-label">OTROS PAGOS CARGADOS:</span>
            <span class="pagocli__cli-value">{{ moneda }} {{ formatoMonto(otros) }}</span>
          </div>
        </div>
        <p class="pagocli__nota">
          <v-icon size="16">
            mdi-information-outline
          </v-icon>
          Puedes registrar un pago total o un pago parcial del monto pendiente.
        </p>

        <div class="pagocli__montos">
          <div>
            <label
              class="pagocli__label"
              for="pagocli-monto"
            >MONTO QUE ESTÁ PAGANDO EL CLIENTE <span class="pagocli__req">*</span></label>
            <v-text-field
              id="pagocli-monto"
              v-model="monto"
              type="number"
              min="0"
              step="0.01"
              :prefix="moneda"
              variant="outlined"
              density="comfortable"
              class="pagocli__input pagocli__monto"
              hide-details="auto"
              :error-messages="errorMonto"
            />
          </div>
          <!-- misma etiqueta (invisible) que el monto: el recuadro queda a la altura del campo -->
          <div>
            <span
              class="pagocli__label pagocli__label--espacio"
              aria-hidden="true"
            >&nbsp;</span>
            <div
              class="pagocli__saldo"
              :class="{ 'pagocli__saldo--ok': saldo === 0 && !errorMonto }"
            >
              <span>{{ saldo === 0 && !errorMonto ? "MONTO COMPLETO" : "SALDO PENDIENTE" }}</span>
              <b>
                <v-icon size="22">{{ saldo === 0 && !errorMonto ? "mdi-check-circle" : "mdi-database-outline" }}</v-icon>
                {{ moneda }} {{ formatoMonto(saldo) }}
              </b>
            </div>
          </div>
        </div>

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
            >N° DE OPERACIÓN <span
              v-if="aplicaNroOperacion"
              class="pagocli__req"
            >*</span></label>
            <!-- combo Aplica / No aplica + el número (Aplica: obligatorio y pasa bloqueado a Bancos) -->
            <div class="pagocli__nroop">
              <v-select
                v-model="aplicaNroOperacion"
                :items="OPCIONES_NRO_OPERACION"
                item-title="titulo"
                item-value="valor"
                variant="outlined"
                density="compact"
                class="pagocli__input pagocli__aplica"
                aria-label="¿Aplica N° de operación?"
                hide-details
              />
              <v-text-field
                id="pagocli-nroop"
                v-model="numeroOperacion"
                :placeholder="aplicaNroOperacion ? 'N° DEL VOUCHER' : 'SE LLENA EN BANCOS'"
                prepend-inner-icon="mdi-pound"
                variant="outlined"
                density="compact"
                class="pagocli__input"
                maxlength="100"
                :disabled="!aplicaNroOperacion"
                hide-details="auto"
                :error-messages="!aplicaNroOperacion || numeroOperacion.trim() ? '' : DATO_REQUERIDO"
              />
            </div>
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
        <!-- el voucher es obligatorio: al abrir el formulario o al quitarlo se marca como dato requerido -->
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
            icon="mdi-trash-can-outline"
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
          :disabled="!!guardando"
          @click="abierto = false"
        >
          CANCELAR
        </v-btn>
        <v-btn
          class="pagocli__btn pagocli__btn--guardar"
          variant="outlined"
          prepend-icon="mdi-content-save-outline"
          :loading="guardando === 'guardar'"
          :disabled="!completo || subiendo || guardando === 'enviar'"
          @click="guardar(false)"
        >
          GUARDAR
        </v-btn>
        <v-btn
          v-if="!yaEnviada"
          class="pagocli__btn pagocli__btn--enviar"
          color="#0b5fd6"
          variant="flat"
          prepend-icon="mdi-send-outline"
          :loading="guardando === 'enviar'"
          :disabled="!puedeEnviar || subiendo || guardando === 'guardar'"
          :title="saldo > 0 ? 'Se envía como pago parcial; el saldo queda pendiente para otra solicitud' : 'Guardar y enviar a Administración'"
          @click="guardar(true)"
        >
          GUARDAR Y ENVIAR<br class="pagocli__br"> A ADMINISTRACIÓN
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
  width: 50px;
  height: 50px;
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
  font-size: 20px;
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
  grid-template-columns: 26px 190px 1fr;
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
.pagocli__montos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}
.pagocli__label--espacio {
  visibility: hidden;
}
.pagocli__monto :deep(input) {
  font-size: 1.15rem;
  font-weight: 800;
}
.pagocli__saldo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* mismo alto que el campo del monto (density comfortable = 48px) */
  height: 48px;
  padding: 2px 12px;
  border: 1px solid #fcd9a6;
  border-radius: 12px;
  background: #fff4e0;
  color: #b45309;
  text-align: center;
}
.pagocli__saldo span {
  font-size: 11px;
  line-height: 1.1;
  font-weight: 800;
}
.pagocli__saldo b {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 1.1rem;
  line-height: 1.1;
  font-weight: 900;
}
.pagocli__saldo--ok {
  border-color: #b7ebc9;
  background: #ecfdf3;
  color: #15803d;
}
.pagocli__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.pagocli__nroop {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
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
  min-height: 104px;
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
  margin: 4px 0 0 16px;
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
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 10px;
  padding: 14px 22px 18px;
}
.pagocli__btn {
  min-height: 48px;
  border-radius: 10px !important;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.15;
}
.pagocli__btn :deep(.v-btn__content) {
  white-space: normal;
  text-align: center;
}
.pagocli__btn--cancel {
  border-color: #c9d3e1 !important;
  color: #0a1f44 !important;
}
.pagocli__btn--guardar {
  border-color: #178a1e !important;
  color: #178a1e !important;
}

/* celular y tablet: una columna y botones a lo ancho */
@media (max-width: 600px) {
  .pagocli__grid,
  .pagocli__montos {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .pagocli__label--espacio {
    display: none;
  }
  .pagocli__saldo {
    margin-top: 10px;
  }
  .pagocli__cli-row {
    grid-template-columns: 26px 1fr;
  }
  .pagocli__cli-value {
    grid-column: 2;
  }
  .pagocli__actions {
    grid-template-columns: 1fr 1fr;
  }
  .pagocli__btn--enviar {
    grid-column: 1 / -1;
    order: -1;
  }
  .pagocli__br {
    display: none;
  }
}
</style>
