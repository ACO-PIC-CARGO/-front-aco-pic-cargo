<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { useDialogSave } from "@/composables/useDialogSave";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { fromDateAndTime, stepDialogPreset, toDateAndTime } from "./houseTrackingFormat";
import type { HouseTrackingStep, StepDialogMode } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; step: HouseTrackingStep | null; mode: StepDialogMode }>();
const open = defineModel<boolean>({ default: false });

const store = useHouseTrackingStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const form = useTemplateRef("form");
const date = ref<string | null>(null);
const time = ref("");
const preset = computed(() => (props.step ? stepDialogPreset(props.step, props.mode) : null));
const { saving, serverError, save } = useDialogSave(open, form, () => {
  const at = fromDateAndTime(date.value!, time.value, timeZone.value);
  return props.mode === "date"
    ? store.setStepDate(props.houseId, props.step!.id, at)
    : store.confirm(props.houseId, props.step!.id, at);
});
const dateRules = [(input: string | null) => Boolean(input) || "Elige la fecha."];
const timeRules = [(input: string) => Boolean(input) || "Elige la hora."];

watch(open, (isOpen) => {
  if (!isOpen) return;
  ({ date: date.value, time: time.value } = toDateAndTime(preset.value?.initial ?? new Date(), timeZone.value));
  serverError.value = "";
});
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="460"
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <v-card-title class="aco-title-card pt-5 px-6">
        {{ preset?.title }}
      </v-card-title>
      <v-card-text class="px-6">
        <v-form
          ref="form"
          @submit.prevent="save"
        >
          <FormatFecha
            v-model="date"
            label="Fecha"
            :rules="dateRules"
          />
          <v-text-field
            v-model="time"
            type="time"
            label="Hora"
            prepend-icon="mdi-clock-outline"
            :hint="`Zona horaria: ${timeZone}`"
            persistent-hint
            :rules="timeRules"
          />
          <v-alert
            v-if="serverError"
            type="warning"
            variant="tonal"
            class="mt-2"
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
          {{ preset?.action }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
