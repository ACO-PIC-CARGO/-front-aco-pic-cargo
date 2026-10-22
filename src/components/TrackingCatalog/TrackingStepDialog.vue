<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import TrackingIconPicker from "./TrackingIconPicker.vue";
import { useDialogSave } from "./useDialogSave";
import { useTrackingCatalogStore } from "@/stores/trackingCatalog";
import type { TrackingStep, TrackingStepDraft } from "@/types/trackingCatalog";

const NAME_MAX = 120;
const NAME_MESSAGE = `Escribe el nombre del paso (hasta ${NAME_MAX} caracteres).`;

const props = defineProps<{ step: TrackingStep | null; phaseId: number | null }>();
const open = defineModel<boolean>({ default: false });

const store = useTrackingCatalogStore();
const { phases } = storeToRefs(store);
const form = useTemplateRef("form");
const draft = ref<TrackingStepDraft>(toDraft(null, null));
const { saving, serverError, save } = useDialogSave(open, form, () => store.saveStep(draft.value));
const isEditing = computed(() => draft.value.id !== null);
const changesPhase = computed(() => isEditing.value && draft.value.phase_id !== props.phaseId);
const nameRules = [(value: string) => (value.trim().length > 0 && value.trim().length <= NAME_MAX) || NAME_MESSAGE];
const phaseRules = [(value: number | null) => value !== null || "Elige la fase del paso."];

function toDraft(step: TrackingStep | null, phaseId: number | null): TrackingStepDraft {
  if (!step) {
    return { id: null, phase_id: phaseId, name: "", icon: "mdi-package-variant-closed", visible_to_client: true, active: true };
  }
  return {
    id: step.id,
    phase_id: phaseId,
    name: step.name,
    icon: step.icon,
    visible_to_client: step.visible_to_client,
    active: step.active,
  };
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  draft.value = toDraft(props.step, props.phaseId);
  serverError.value = "";
});
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="600"
    scrollable
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <v-card-title class="aco-title-card pt-5 px-6">
        {{ isEditing ? "Editar paso" : "Nuevo paso" }}
      </v-card-title>
      <v-card-text class="px-6">
        <v-form
          ref="form"
          @submit.prevent="save"
        >
          <v-text-field
            v-model="draft.name"
            label="Nombre del paso"
            :counter="NAME_MAX"
            :rules="nameRules"
            autofocus
          />
          <v-select
            v-model="draft.phase_id"
            label="Fase"
            :items="phases"
            item-title="name"
            item-value="id"
            :rules="phaseRules"
            :hint="changesPhase ? 'El paso pasará al final de la fase elegida.' : ''"
            persistent-hint
          />
          <TrackingIconPicker v-model="draft.icon" />
          <v-switch
            v-model="draft.visible_to_client"
            label="Visible al cliente"
            color="success"
            inset
            hide-details
          />
          <v-switch
            v-model="draft.active"
            label="Paso activo"
            color="success"
            inset
            hide-details
          />
          <v-alert
            v-if="serverError"
            type="warning"
            variant="tonal"
            class="mt-4"
            :text="serverError"
          />
        </v-form>
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn
          variant="text"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          @click="save"
        >
          {{ isEditing ? "Guardar cambios" : "Crear paso" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
