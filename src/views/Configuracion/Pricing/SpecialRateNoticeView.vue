<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { usePermissions } from "@/composables/usePermissions";
import { notifySuccess } from "@/utils/request";
import SpecialRateNoticeBox from "@/components/folderPricing/SpecialRateNoticeBox.vue";
import { conditionsFromText, conditionsToText } from "@/components/folderPricing/specialRateNotice";
import { getSpecialRateNotice, saveSpecialRateNotice } from "./specialRateNoticeApi";

const SCREEN = "quoteSpecialRateNotice";

const appStore = useAppStore();
const { can } = usePermissions();

const active = ref(true);
const title = ref("");
const intro = ref("");
const conditionsText = ref("");
const sideText = ref("");
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
}));

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
