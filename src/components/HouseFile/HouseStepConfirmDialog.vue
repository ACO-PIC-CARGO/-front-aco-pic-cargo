<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { storeToRefs } from "pinia";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import QuoteValidityDialog from "./QuoteValidityDialog.vue";
import { useDialogSave } from "@/composables/useDialogSave";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { fromDateAndTime, stepDialogPreset, toDateAndTime } from "./houseTrackingFormat";
import { quoteExpiredOn, skipStillSaves } from "./stepValidation";
import type { HouseTrackingStep, StepDialogMode, WeightCheck } from "@/types/houseTracking";

const props = defineProps<{
  houseId: number;
  step: HouseTrackingStep | null;
  mode: StepDialogMode;
  validation?: WeightCheck | null;
}>();
const open = defineModel<boolean>({ default: false });

const store = useHouseTrackingStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const form = useTemplateRef("form");
const date = ref<string | null>(null);
const time = ref("");
const quoteDialog = ref(false);
const preset = computed(() => (props.step ? stepDialogPreset(props.step, props.mode) : null));
const currentAt = () => fromDateAndTime(date.value!, time.value, timeZone.value);
const { saving, serverError, save } = useDialogSave(open, form, () => {
  const at = currentAt();
  return props.mode === "date"
    ? store.setStepDate(props.houseId, props.step!.id, at)
    : store.confirm(props.houseId, props.step!.id, at, props.validation ?? undefined);
});
const dateRules = [(input: string | null) => Boolean(input) || "Elige la fecha."];
const timeRules = [(input: string) => Boolean(input) || "Elige la hora."];

watch(open, (isOpen) => {
  if (!isOpen) return;
  ({ date: date.value, time: time.value } = toDateAndTime(preset.value?.initial ?? new Date(), timeZone.value));
  serverError.value = "";
});

async function submit() {
  if (!(await form.value!.validate()).valid) return;
  if (quoteExpiredOn(props.step!, currentAt(), timeZone.value)) {
    quoteDialog.value = true;
    return;
  }
  await save();
}

function afterSkip() {
  if (skipStillSaves(props.step!, props.mode)) save();
  else open.value = false;
}
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
        <p
          v-if="mode === 'date'"
          class="aco-caption mb-3"
        >
          Si este es el próximo paso para tu cliente, verá esta fecha como «Próximo movimiento estimado».
        </p>
        <v-form
          ref="form"
          @submit.prevent="submit"
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
          @click="submit"
        >
          {{ preset?.action }}
        </v-btn>
      </v-card-actions>
    </v-card>
    <QuoteValidityDialog
      v-model="quoteDialog"
      :house-id="houseId"
      :step="step"
      @skip="afterSkip"
      @kept="save"
    />
  </v-dialog>
</template>
