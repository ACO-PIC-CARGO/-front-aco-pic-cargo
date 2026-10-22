<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import TrackingIconPicker from "./TrackingIconPicker.vue";
import { useDialogSave } from "./useDialogSave";
import { useTrackingCatalogStore } from "@/stores/trackingCatalog";
import type { TrackingPhase, TrackingPhaseDraft } from "@/types/trackingCatalog";

const NAME_MAX = 80;
const NAME_MESSAGE = `Escribe el nombre de la fase (hasta ${NAME_MAX} caracteres).`;

const props = defineProps<{ phase: TrackingPhase | null }>();
const open = defineModel<boolean>({ default: false });

const store = useTrackingCatalogStore();
const form = useTemplateRef("form");
const draft = ref<TrackingPhaseDraft>(toDraft(null));
const { saving, serverError, save } = useDialogSave(open, form, () => store.savePhase(draft.value));
const isEditing = computed(() => draft.value.id !== null);
const nameRules = [(value: string) => (value.trim().length > 0 && value.trim().length <= NAME_MAX) || NAME_MESSAGE];

function toDraft(phase: TrackingPhase | null): TrackingPhaseDraft {
  if (!phase) return { id: null, name: "", icon: "mdi-factory", active: true };
  return { id: phase.id, name: phase.name, icon: phase.icon, active: phase.active };
}

watch(open, (isOpen) => {
  if (!isOpen) return;
  draft.value = toDraft(props.phase);
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
        {{ isEditing ? "Editar fase" : "Nueva fase" }}
      </v-card-title>
      <v-card-text class="px-6">
        <v-form
          ref="form"
          @submit.prevent="save"
        >
          <v-text-field
            v-model="draft.name"
            label="Nombre de la fase"
            :counter="NAME_MAX"
            :rules="nameRules"
            autofocus
          />
          <TrackingIconPicker v-model="draft.icon" />
          <v-switch
            v-model="draft.active"
            label="Fase activa"
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
          {{ isEditing ? "Guardar cambios" : "Crear fase" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
