<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { usePermissions } from "@/composables/usePermissions";
import { notifySuccess } from "@/utils/request";
import SpecialRateNoticeBox from "@/components/folderPricing/SpecialRateNoticeBox.vue";
import {
  VISIBILITY_COMPARISONS,
  VISIBILITY_METRICS,
  conditionsFromText,
  conditionsToText,
  visibilityConditionsToSave,
} from "@/components/folderPricing/specialRateNotice";
import type { VisibilityConditionDraft } from "@/components/folderPricing/specialRateNotice";
import { getSpecialRateNotice, saveSpecialRateNotice } from "./specialRateNoticeApi";

const SCREEN = "quoteSpecialRateNotice";

const appStore = useAppStore();
const { can } = usePermissions();

const active = ref(true);
const title = ref("");
const intro = ref("");
const conditionsText = ref("");
const sideText = ref("");
const visibilityConditions = ref<VisibilityConditionDraft[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadFailed = ref(false);
const formError = ref<string | null>(null);

const draft = computed(() => ({
  active: active.value,
  title: title.value.trim(),
  intro: intro.value.trim(),
  conditions: conditionsFromText(conditionsText.value),
  side_text: sideText.value.trim(),
  visibility_conditions: visibilityConditionsToSave(visibilityConditions.value),
}));

function addVisibilityCondition() {
  visibilityConditions.value.push({ metric: "total_weight", comparison: "greater_than", value: "" });
}

function removeVisibilityCondition(index: number) {
  visibilityConditions.value.splice(index, 1);
}

async function load() {
  loading.value = true;
  const notice = await getSpecialRateNotice();
  loading.value = false;
  loadFailed.value = notice === null;
  if (!notice) return;
  active.value = notice.active;
  title.value = notice.title;
  intro.value = notice.intro;
  conditionsText.value = conditionsToText(notice.conditions);
  sideText.value = notice.side_text;
  visibilityConditions.value = notice.visibility_conditions.map((condition) => ({ ...condition }));
}

async function save() {
  formError.value = null;
  saving.value = true;
  const response = await saveSpecialRateNotice(draft.value);
  saving.value = false;
  if (!response.estadoflag) {
    formError.value = response.mensaje;
    return;
  }
  notifySuccess(response.mensaje);
}

onMounted(() => {
  appStore.mainTitle = "Aviso de Tarifa Especial";
  load();
});
</script>

<template>
  <v-alert
    v-if="loadFailed"
    type="warning"
    variant="tonal"
    class="ma-4"
  >
    No pudimos cargar el aviso de Tarifa Especial. Recarga la página para intentarlo de nuevo.
  </v-alert>
  <v-card
    v-else
    :loading="loading"
    class="ma-4"
  >
    <v-card-text>
      <v-switch
        v-model="active"
        label="Activo"
        color="primary"
        hide-details
      />
      <v-text-field
        v-model="title"
        label="Título"
      />
      <v-text-field
        v-model="intro"
        label="Texto antes de las condiciones"
      />
      <v-textarea
        v-model="conditionsText"
        label="Condiciones"
        hint="Escribe una condición por línea."
        persistent-hint
        rows="4"
        auto-grow
      />
      <v-text-field
        v-model="sideText"
        label="Texto de la derecha"
        class="mt-4"
      />
      <div class="text-title-small">
        Cuándo se muestra el aviso
      </div>
      <p class="text-body-small text-medium-emphasis mb-3">
        El aviso sale en la cotización si se cumple al menos una de estas condiciones con los datos de la carga.
      </p>
      <div
        v-for="(condition, index) in visibilityConditions"
        :key="index"
        class="visibility-condition"
      >
        <v-select
          v-model="condition.metric"
          :items="VISIBILITY_METRICS"
          item-title="title"
          item-value="value"
          label="Dato"
          density="compact"
          hide-details
        />
        <v-select
          v-model="condition.comparison"
          :items="VISIBILITY_COMPARISONS"
          item-title="title"
          item-value="value"
          label="Comparación"
          density="compact"
          hide-details
        />
        <v-text-field
          v-model="condition.value"
          type="number"
          min="0"
          label="Valor"
          density="compact"
          hide-details
        />
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          color="error"
          :aria-label="`Quitar la condición ${index + 1}`"
          @click="removeVisibilityCondition(index)"
        />
      </div>
      <p
        v-if="!visibilityConditions.length"
        class="text-body-medium text-medium-emphasis mb-2"
      >
        Sin condiciones el aviso no se muestra. Agrega al menos una o desactívalo.
      </p>
      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-plus"
        class="mb-4"
        @click="addVisibilityCondition"
      >
        Agregar condición
      </v-btn>
      <v-alert
        v-if="formError"
        type="warning"
        variant="tonal"
        class="mb-4"
      >
        {{ formError }}
      </v-alert>
      <div class="text-title-small mb-1">
        Vista previa
      </div>
      <SpecialRateNoticeBox :notice="draft" />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        v-if="can(SCREEN, 'MODIFICAR')"
        color="success"
        :loading="saving"
        @click="save"
      >
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.visibility-condition {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

@media (max-width: 599px) {
  .visibility-condition {
    grid-template-columns: minmax(0, 1fr);
    padding-bottom: 8px;
    border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .visibility-condition > .v-btn {
    justify-self: end;
  }
}
</style>
