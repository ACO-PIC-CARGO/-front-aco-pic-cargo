<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import {
  availableModalities,
  formatQuoteValue,
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
const { notices, current, dismiss, dismissAll } = useGeneratedQuoteNotices(props.socket);
// A second notice arriving while one is open turns the dialog into the grouped list.
const isList = computed(() => notices.value.length > 1);

const SOURCE_LABELS = { bot: "Bot de cotizaciones", calculadora: "Calculadora de Fletes" };

const rows = computed(() => {
  const notice = current.value;
  if (!notice) return [];
  return [
    { icon: "mdi-file-document-outline", label: "Cotización N.º", value: notice.nro_cotizacion },
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
  dismiss(notice);
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
  >
    <v-card
      v-if="isList"
      class="generated-quote"
    >
      <div class="generated-quote__header">
        <v-icon size="40">
          mdi-file-multiple-outline
        </v-icon>
        <span class="generated-quote__divider" />
        <span class="generated-quote__title">Cotizaciones<br>nuevas</span>
        <v-spacer />
        <span class="generated-quote__count">{{ notices.length }}</span>
      </div>
      <v-card-text class="generated-quote__list pa-3">
        <div
          v-for="(notice, index) in notices"
          :key="`${notice.source}-${notice.nro_cotizacion}-${index}`"
          class="generated-quote__item"
        >
          <span class="generated-quote__index">{{ index + 1 }}</span>
          <div class="generated-quote__cell">
            <div class="generated-quote__code">
              {{ notice.nro_cotizacion }}
              <v-chip
                v-if="notice.tipo"
                class="generated-quote__type"
                :class="{ 'generated-quote__type--fcl': String(notice.tipo).toUpperCase() === 'FCL' }"
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
          </div>
          <div class="generated-quote__cell">
            <div class="generated-quote__value">
              {{ formatQuoteValue(notice.valor_mercancia) ?? "—" }}
            </div>
            <div
              v-if="formatQuoteWeight(notice.peso)"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-weight-kilogram
              </v-icon>
              {{ formatQuoteWeight(notice.peso) }}
            </div>
            <div
              v-if="formatQuoteVolume(notice.volumen)"
              class="generated-quote__meta"
            >
              <v-icon size="14">
                mdi-cube-outline
              </v-icon>
              {{ formatQuoteVolume(notice.volumen) }}
            </div>
          </div>
          <div class="generated-quote__cell">
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
          </div>
          <div class="generated-quote__actions">
            <v-btn
              v-for="modality in modalitiesOf(notice)"
              :key="modality"
              class="generated-quote__primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-eye-outline"
              @click="viewQuote(notice, modality)"
            >
              {{ modalitiesOf(notice).length > 1 ? MODALITY_LABELS[modality].text : "Ver" }}
            </v-btn>
            <v-btn
              v-if="!modalitiesOf(notice).length"
              variant="text"
              size="small"
              @click="dismiss(notice)"
            >
              Quitar
            </v-btn>
          </div>
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
.generated-quote__cancel {
  background: linear-gradient(180deg, #e53935, #b71c1c) !important;
  color: #fff !important;
  font-weight: 700;
}
@media (max-width: 700px) {
  .generated-quote__item {
    grid-template-columns: 28px minmax(0, 1fr) minmax(0, 1fr);
  }
  .generated-quote__actions {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: flex-end;
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
