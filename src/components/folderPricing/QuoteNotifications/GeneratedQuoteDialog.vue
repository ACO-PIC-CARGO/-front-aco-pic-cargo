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
import type { GeneratedQuotePayload, QuoteModality } from "./useGeneratedQuoteNotices";

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
const { current, dismiss } = useGeneratedQuoteNotices(props.socket);

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
const modalities = computed(() =>
  current.value && generatedQuoteLocation(current.value, "individual") ? availableModalities(current.value) : [],
);
const canReloadList = computed(() => current.value?.source === "bot" && route.name === "lstQuote");

function viewQuote(modality: QuoteModality) {
  const location = current.value && generatedQuoteLocation(current.value, modality);
  if (!location) return;
  window.open(router.resolve(location).href, "_blank", "noopener");
  dismiss();
}

async function reloadList() {
  dismiss();
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
    max-width="420"
  >
    <v-card
      v-if="current"
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
          @click="viewQuote(modality)"
        >
          {{ modalities.length > 1 ? MODALITY_LABELS[modality].text : "Ver cotización" }}
        </v-btn>
        <v-btn
          v-if="canReloadList"
          block
          variant="tonal"
          @click="reloadList"
        >
          Recargar listado
        </v-btn>
        <v-btn
          block
          variant="text"
          @click="dismiss"
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
