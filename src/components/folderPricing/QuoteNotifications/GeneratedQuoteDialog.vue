<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import { availableModalities, generatedQuoteLocation, useGeneratedQuoteNotices } from "./useGeneratedQuoteNotices";
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
    { icon: "mdi-ferry", label: "Origen", value: notice.puerto_origen },
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== "");
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
        <v-icon size="56">
          mdi-file-check-outline
        </v-icon>
        <span class="generated-quote__divider" />
        <span class="generated-quote__title">Cotización<br>registrada</span>
      </div>
      <v-card-text class="pt-4">
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
            <div class="generated-quote__value">
              {{ row.value }}
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
              size="default"
            >
              {{ SOURCE_LABELS[current.source] }}
            </v-chip>
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="flex-column ga-2 px-4 pb-4">
        <v-btn
          v-for="modality in modalities"
          :key="modality"
          block
          class="generated-quote__primary"
          variant="flat"
          size="large"
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
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #0b5ed7, #0a3d91);
  color: #fff;
}
.generated-quote__divider {
  width: 2px;
  height: 52px;
  flex: 0 0 2px;
  background: rgba(255, 255, 255, 0.6);
}
.generated-quote__title {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.05;
  text-transform: uppercase;
}
.generated-quote__source {
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
  gap: 14px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
}
.generated-quote__row:last-child {
  border-bottom: 0;
}
.generated-quote__icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 10px;
  background: #e8f2ff;
  color: #1769d2;
}
.generated-quote__label {
  color: #5a6b7d;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.generated-quote__value {
  color: #12263f;
  font-size: 1.05rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}
</style>
