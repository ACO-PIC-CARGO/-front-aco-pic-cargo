<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import {
  availableModalities,
  formatQuoteContainer,
  formatQuoteDate,
  formatQuoteValue,
  quoteDateParts,
  formatQuoteVolume,
  formatQuoteWeight,
  generatedQuoteLocation,
  useGeneratedQuoteNotices,
} from "./useGeneratedQuoteNotices";
import type { GeneratedQuoteNotice, GeneratedQuotePayload, QuoteModality } from "./useGeneratedQuoteNotices";

const props = defineProps<{
  socket: {
    on(event: string, listener: (payload: GeneratedQuotePayload) => void): unknown;
    off(event: string, listener: (payload: GeneratedQuotePayload) => void): unknown;
  };
}>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
// celular: la lista ocupa toda la pantalla (la web mantiene su diálogo)
const { smAndDown } = useDisplay();
const { notices, current, pendingCount, dismiss, dismissAll, markSeen, isSeen } = useGeneratedQuoteNotices(props.socket);
// A second notice arriving while one is open turns the dialog into the grouped list.
const isList = computed(() => notices.value.length > 1);

// "VER" deja el aviso visto (en BD, por usuario): en la lista la fila queda deshabilitada y no se quita;
// la lista solo se cierra con "Cancelar". Con un solo aviso, el diálogo se cierra.
function markSeenOrDismiss(notice: GeneratedQuoteNotice) {
  markSeen(notice);
  if (!isList.value) dismiss(notice);
}

// "tipo" es el tipo de embarque: FCL, LCL o Aéreo (bot: shipment; calculadora: tipo).
// FCL no lleva peso ni volumen; el contenedor (40S x 1) se muestra cuando viene (hoy lo manda el bot).
const tipoEmbarque = (notice: GeneratedQuoteNotice) =>
  String(notice.tipo ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
const esFcl = (notice: GeneratedQuoteNotice) => tipoEmbarque(notice) === "FCL";

const SOURCE_LABELS = { bot: "Bot de cotizaciones", calculadora: "Calculadora de Fletes" };

const rows = computed(() => {
  const notice = current.value;
  if (!notice) return [];
  return [
    { icon: "mdi-file-document-outline", label: "Cotización N.º", value: notice.nro_cotizacion },
    { icon: "mdi-clock-outline", label: "Fecha y hora", value: formatQuoteDate(notice.fecha_registro) },
    { icon: "mdi-account-outline", label: "Cliente", value: notice.cliente },
    { icon: "mdi-phone-outline", label: "Teléfono", value: notice.telefono },
    { icon: "mdi-ferry", label: "Tipo de embarque", value: notice.tipo, chip: true },
    { icon: "mdi-ferry", label: "Origen", value: notice.puerto_origen },
    { icon: "mdi-database-outline", label: "Valor", value: formatQuoteValue(notice.valor_mercancia) },
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== "");
});
const measures = computed(() => {
  const notice = current.value;
  if (!notice) return [];
  if (esFcl(notice)) {
    const contenedor = formatQuoteContainer(notice);
    return contenedor ? [{ icon: "mdi-train-car-container", label: "Contenedor", value: contenedor }] : [];
  }
  return [
    { icon: "mdi-weight-kilogram", label: "Peso", value: formatQuoteWeight(notice.peso) },
    { icon: "mdi-cube-outline", label: "Volumen", value: formatQuoteVolume(notice.volumen) },
  ].filter((measure) => measure.value !== null);
});
const MODALITY_LABELS: Record<QuoteModality, { text: string; icon: string }> = {
  individual: { text: "Ver individual", icon: "mdi-account" },
  grupal: { text: "Ver grupal", icon: "mdi-account-group" },
};
const modalitiesOf = (notice: GeneratedQuoteNotice): QuoteModality[] =>
  generatedQuoteLocation(notice, "individual") ? availableModalities(notice) : [];
const modalities = computed(() => (current.value ? modalitiesOf(current.value) : []));
const canReloadList = computed(
  () => route.name === "lstQuote" && notices.value.some((notice) => notice.source === "bot"),
);

function viewQuote(notice: GeneratedQuoteNotice, modality: QuoteModality) {
  const location = generatedQuoteLocation(notice, modality);
  if (!location) return;
  window.open(router.resolve(location).href, "_blank", "noopener");
  markSeenOrDismiss(notice);
}

async function reloadList() {
  // The reloaded list already shows every bot quote, so those notices are done.
  dismissAll((notice) => notice.source === "bot");
  appStore.spiner = true;
  try {
    await pricingStore.reloadQuoteList();
  } catch (error) {
    console.error("Error al recargar cotizaciones después de una notificación de Socket.IO:", error);
    await Swal.fire({ icon: "error", text: "No se pudieron recargar las cotizaciones. Inténtalo nuevamente." });
  } finally {
    appStore.spiner = false;
  }
}
</script>

<template>
  <v-dialog
    :model-value="!!current"
    persistent
    :max-width="isList ? 860 : 420"
    :scrollable="isList"
    :fullscreen="isList && smAndDown"
  >
    <v-card
      v-if="isList"
      class="generated-quote"
      :class="{ 'generated-quote--movil': smAndDown }"
    >
      <div class="generated-quote__header">
        <v-icon size="40">
          mdi-file-multiple-outline
        </v-icon>
        <span class="generated-quote__divider" />
        <span class="generated-quote__title">Cotizaciones<br>nuevas</span>
        <v-spacer />
        <span
          class="generated-quote__count"
          title="Sin revisar"
        >{{ pendingCount }}</span>
      </div>
      <v-card-text class="generated-quote__list pa-3">
        <div
          v-for="(notice, index) in notices"
          :key="notice.codigo ?? `${notice.source}-${notice.nro_cotizacion}-${index}`"
          class="generated-quote__item"
          :class="{ 'generated-quote__item--visto': isSeen(notice) }"
          :aria-disabled="isSeen(notice)"
        >
          <span class="generated-quote__index">{{ index + 1 }}</span>
          <div class="generated-quote__cell generated-quote__cell--main">
            <div class="generated-quote__code">
              {{ notice.nro_cotizacion }}
              <v-chip
                v-if="notice.tipo"
                class="generated-quote__type"
                :class="{
                  'generated-quote__type--fcl': tipoEmbarque(notice) === 'FCL',
                  'generated-quote__type--aereo': tipoEmbarque(notice) === 'AEREO',
                }"
                variant="flat"
                size="x-small"
              >
                {{ notice.tipo }}
              </v-chip>
            </div>
            <div
              v-if="notice.cliente"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-account-outline
              </v-icon>
              {{ notice.cliente }}
            </div>
            <div
              v-if="notice.telefono"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-phone-outline
              </v-icon>
              {{ notice.telefono }}
            </div>
            <!-- fecha y hora centrada a la derecha del número, en dos líneas (17/NOV/2026 · 09:25) -->
            <span
              v-if="quoteDateParts(notice.fecha_registro)"
              class="generated-quote__time"
            >
              <v-icon size="14">mdi-clock-outline</v-icon>
              <span class="generated-quote__timetext">
                <span>{{ quoteDateParts(notice.fecha_registro)!.fecha }}</span>
                <span v-if="quoteDateParts(notice.fecha_registro)!.hora">{{ quoteDateParts(notice.fecha_registro)!.hora }}</span>
              </span>
            </span>
          </div>
          <div class="generated-quote__cell generated-quote__cell--montos">
            <div class="generated-quote__value">
              {{ formatQuoteValue(notice.valor_mercancia) ?? "—" }}
            </div>
            <!-- FCL: contenedor y cantidad -->
            <div
              v-if="esFcl(notice) && formatQuoteContainer(notice)"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-train-car-container
              </v-icon>
              {{ formatQuoteContainer(notice) }}
            </div>
            <div
              v-if="!esFcl(notice) && formatQuoteWeight(notice.peso)"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-weight-kilogram
              </v-icon>
              {{ formatQuoteWeight(notice.peso) }}
            </div>
            <div
              v-if="!esFcl(notice) && formatQuoteVolume(notice.volumen)"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-cube-outline
              </v-icon>
              {{ formatQuoteVolume(notice.volumen) }}
            </div>
          </div>
          <div class="generated-quote__cell generated-quote__cell--fuente">
            <div class="generated-quote__label">
              Fuente
            </div>
            <v-chip
              class="generated-quote__source"
              variant="flat"
              size="small"
              :prepend-icon="notice.source === 'bot' ? 'mdi-robot-outline' : 'mdi-calculator-variant-outline'"
            >
              {{ SOURCE_LABELS[notice.source] }}
            </v-chip>
            <div
              v-if="notice.nombrevendedor_chatwoot"
              class="generated-quote__seller"
            >
              <span class="generated-quote__label">Vendedor:</span>
              {{ notice.nombrevendedor_chatwoot }}
            </div>
          </div>
          <div class="generated-quote__actions">
            <v-btn
              v-for="modality in modalitiesOf(notice)"
              :key="modality"
              class="generated-quote__primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-eye-outline"
              :disabled="isSeen(notice)"
              @click="viewQuote(notice, modality)"
            >
              {{ modalitiesOf(notice).length > 1 ? MODALITY_LABELS[modality].text : "Ver" }}
            </v-btn>
            <v-btn
              v-if="!modalitiesOf(notice).length"
              variant="text"
              size="small"
              :disabled="isSeen(notice)"
              @click="markSeenOrDismiss(notice)"
            >
              Quitar
            </v-btn>
          </div>
        </div>
        <div
          v-if="!pendingCount"
          class="text-center text-medium-emphasis py-3"
        >
          Ya revisaste todas las cotizaciones nuevas.
        </div>
      </v-card-text>
      <v-card-actions class="flex-column ga-1 px-4 pb-3 pt-1">
        <!-- <v-btn
          v-if="canReloadList"
          block
          variant="tonal"
          @click="reloadList"
        >
          Recargar listado
        </v-btn> -->
        <v-btn
          block
          class="generated-quote__cancel"
          variant="flat"
          @click="dismissAll()"
        >
          Cancelar
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card
      v-else-if="current"
      class="generated-quote"
    >
      <div class="generated-quote__header">
        <v-icon size="40">
          mdi-file-check-outline
        </v-icon>
        <span class="generated-quote__divider" />
        <span class="generated-quote__title">Cotización<br>registrada</span>
      </div>
      <v-card-text class="pt-2 pb-1">
        <div
          v-for="row in rows"
          :key="row.label"
          class="generated-quote__row"
        >
          <span class="generated-quote__icon">
            <v-icon>{{ row.icon }}</v-icon>
          </span>
          <div>
            <div class="generated-quote__label">
              {{ row.label }}
            </div>
            <v-chip
              v-if="row.chip"
              class="generated-quote__source"
              variant="flat"
              size="small"
            >
              {{ row.value }}
            </v-chip>
            <div
              v-else
              class="generated-quote__value"
            >
              {{ row.value }}
            </div>
          </div>
        </div>
        <div
          v-if="measures.length"
          class="generated-quote__row generated-quote__measures"
        >
          <div
            v-for="measure in measures"
            :key="measure.label"
            class="generated-quote__measure"
          >
            <span class="generated-quote__icon">
              <v-icon>{{ measure.icon }}</v-icon>
            </span>
            <div>
              <div class="generated-quote__label">
                {{ measure.label }}
              </div>
              <div class="generated-quote__value">
                {{ measure.value }}
              </div>
            </div>
          </div>
        </div>
        <div class="generated-quote__row">
          <span class="generated-quote__icon">
            <v-icon>mdi-laptop</v-icon>
          </span>
          <div>
            <div class="generated-quote__label">
              Fuente
            </div>
            <v-chip
              class="generated-quote__source"
              variant="flat"
              size="small"
            >
              {{ SOURCE_LABELS[current.source] }}
            </v-chip>
            <div
              v-if="current.nombrevendedor_chatwoot"
              class="generated-quote__seller"
            >
              <span class="generated-quote__label">Vendedor:</span>
              {{ current.nombrevendedor_chatwoot }}
            </div>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="flex-column ga-1 px-4 pb-3 pt-1">
        <v-btn
          v-for="modality in modalities"
          :key="modality"
          block
          class="generated-quote__primary"
          variant="flat"
          size="default"
          :prepend-icon="modalities.length > 1 ? MODALITY_LABELS[modality].icon : 'mdi-open-in-new'"
          @click="viewQuote(current, modality)"
        >
          {{ modalities.length > 1 ? MODALITY_LABELS[modality].text : "Ver cotización" }}
        </v-btn>
        <!-- <v-btn
          v-if="canReloadList"
          block
          variant="tonal"
          @click="reloadList"
        >
          Recargar listado
        </v-btn> -->
        <v-btn
          block
          variant="text"
          @click="dismiss()"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.generated-quote {
  border: 2px solid #1769d2;
  border-radius: 18px !important;
}
.generated-quote__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0b5ed7, #0a3d91);
  color: #fff;
}
.generated-quote__divider {
  width: 2px;
  height: 38px;
  flex: 0 0 2px;
  background: rgba(255, 255, 255, 0.6);
}
.generated-quote__title {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.05;
  text-transform: uppercase;
}
.generated-quote__source {
  height: 24px !important;
  background: #cfe2fb !important;
  color: #0a3d91 !important;
  font-weight: 700;
}
.generated-quote__primary {
  background: linear-gradient(180deg, #1478e8, #0a4fb8) !important;
  color: #fff !important;
  font-weight: 700;
  text-transform: none;
}
.generated-quote__count {
  min-width: 34px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  font-weight: 800;
  text-align: center;
}
.generated-quote__list {
  max-height: 65vh;
  background: #f4f7fb;
}
.generated-quote__item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1.1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid #dbe5f1;
  border-radius: 12px;
  background: #fff;
}
/* ya revisada ("VER"): queda en la lista, atenuada y sin acciones */
.generated-quote__item--visto {
  background: #f8fafc;
  border-style: dashed;
}
.generated-quote__item--visto > *:not(.generated-quote__actions) {
  opacity: 0.55;
}
/* número, cliente y teléfono a la izquierda; la fecha centrada (vertical y horizontal) a la derecha */
.generated-quote__cell--main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 10px;
  align-items: center;
}
.generated-quote__cell--main > * {
  grid-column: 1;
}
.generated-quote__cell--main > .generated-quote__time {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: center;
  justify-self: center;
}
.generated-quote__time {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 8px;
  background: #eef3fb;
  color: #3b4b5e;
}
.generated-quote__time .v-icon {
  color: #1769d2;
}
.generated-quote__timetext {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
}
.generated-quote__item:last-child {
  margin-bottom: 0;
}
.generated-quote__cell {
  min-width: 0;
}
.generated-quote__cell + .generated-quote__cell {
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}
.generated-quote__index {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 6px;
  background: #0b5ed7;
  color: #fff;
  font-weight: 800;
}
.generated-quote__code {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #12263f;
  font-size: 1rem;
  font-weight: 800;
}
.generated-quote__type {
  background: #cfe2fb !important;
  color: #0a3d91 !important;
  font-weight: 700;
}
.generated-quote__type--fcl {
  background: #d3f2d6 !important;
  color: #1b6b2a !important;
}
.generated-quote__type--aereo {
  background: #ece2fc !important;
  color: #5b21b6 !important;
}
.generated-quote__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #3b4b5e;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}
.generated-quote__meta .v-icon {
  color: #1769d2;
}
.generated-quote__actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
/* debajo de la fuente: vendedor asignado en Chatwoot */
.generated-quote__seller {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  color: #12263f;
  font-size: 0.8rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.generated-quote__cancel {
  background: linear-gradient(180deg, #e53935, #b71c1c) !important;
  color: #fff !important;
  font-weight: 700;
}
/* ===================== celular (la web no cambia) ===================== */
.generated-quote--movil {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 0;
  border-radius: 0 !important;
}
.generated-quote--movil .generated-quote__header {
  padding: 12px 14px;
  padding-top: max(12px, env(safe-area-inset-top));
}
.generated-quote--movil .generated-quote__header .v-icon {
  font-size: 30px !important;
}
.generated-quote--movil .generated-quote__divider {
  height: 30px;
}
.generated-quote--movil .generated-quote__title {
  font-size: 1.05rem;
}
.generated-quote--movil .generated-quote__list {
  flex: 1 1 auto;
  max-height: none;
  padding: 10px !important;
}
.generated-quote--movil .v-card-actions {
  padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
  box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.06);
}
.generated-quote--movil .generated-quote__cancel {
  min-height: 46px;
}
@media (max-width: 700px) {
  /* tarjeta: número y datos arriba, montos en un recuadro, fuente y VER a todo el ancho */
  .generated-quote__item {
    grid-template-columns: 30px minmax(0, 1fr);
    grid-template-areas:
      "idx main"
      "montos montos"
      "fuente fuente"
      "acciones acciones";
    align-items: start;
    gap: 10px;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  }
  .generated-quote__index {
    grid-area: idx;
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }
  .generated-quote__cell + .generated-quote__cell {
    padding-left: 0;
    border-left: 0;
  }
  .generated-quote__cell--main {
    grid-area: main;
    row-gap: 3px;
  }
  .generated-quote__cell--main .generated-quote__code {
    font-size: 1.05rem;
  }
  .generated-quote__cell--main .generated-quote__meta {
    font-size: 0.85rem;
  }
  /* monto destacado y debajo contenedor (FCL) o peso / volumen, en una sola fila */
  .generated-quote__cell--montos {
    grid-area: montos;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f1f6fd;
  }
  .generated-quote__cell--montos .generated-quote__value {
    flex: 1 0 100%;
    font-size: 1.15rem;
    color: #0a3d91;
  }
  .generated-quote__cell--montos .generated-quote__meta {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .generated-quote__cell--fuente {
    grid-area: fuente;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .generated-quote__actions {
    grid-area: acciones;
    flex-direction: row;
    gap: 8px;
  }
  .generated-quote__actions .v-btn {
    flex: 1 1 0;
    min-height: 42px;
    font-size: 0.9rem;
  }
}
.generated-quote__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}
.generated-quote__row:last-child {
  border-bottom: 0;
}
.generated-quote__measures {
  gap: 0;
}
.generated-quote__measure {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.generated-quote__measure + .generated-quote__measure {
  padding-left: 14px;
  margin-left: 14px;
  border-left: 1px solid #e2e8f0;
}
.generated-quote__icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border-radius: 8px;
  background: #e8f2ff;
  color: #1769d2;
}
.generated-quote__label {
  color: #5a6b7d;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}
.generated-quote__value {
  color: #12263f;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
</style>
