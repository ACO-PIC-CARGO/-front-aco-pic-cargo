<script setup lang="ts">
import { computed, reactive, useTemplateRef, watch } from "vue";
import { formatVolume, formatWeight } from "./weightCheck";
import type { WeightCheck } from "@/types/houseTracking";

type Measure = keyof WeightCheck;

const MEASURES: Record<Measure, { label: string; inputLabel: string; suffix: string; error: string; format: typeof formatWeight }> = {
  weight: { label: "Peso", inputLabel: "Peso recibido", suffix: "kg", error: "Escribe un peso mayor que 0.", format: formatWeight },
  volume: {
    label: "Volumen",
    inputLabel: "Volumen recibido",
    suffix: "m³",
    error: "Escribe un volumen mayor que 0.",
    format: formatVolume,
  },
};

const props = defineProps<{ quotedWeight: number | null; quotedVolume: number | null }>();
const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ confirmed: [check: WeightCheck] }>();

const form = useTemplateRef("form");
const quoted = computed<Record<Measure, number | null>>(() => ({ weight: props.quotedWeight, volume: props.quotedVolume }));
const entries = reactive<Record<Measure, { keep: boolean; value: number | string | null }>>({
  weight: { keep: true, value: null },
  volume: { keep: true, value: null },
});

const choices = (measure: Measure) => [
  { value: true, title: `Se mantiene (${MEASURES[measure].format(quoted.value[measure])})` },
  { value: false, title: "Ingresar otro" },
];
const rules = (measure: Measure) => [(value: number | string | null) => Number(value) > 0 || MEASURES[measure].error];
const confirmedValue = (measure: Measure) =>
  entries[measure].keep ? quoted.value[measure]! : Number(entries[measure].value);

watch(open, (isOpen) => {
  if (!isOpen) return;
  for (const measure of Object.keys(MEASURES) as Measure[]) {
    entries[measure].keep = quoted.value[measure] !== null;
    entries[measure].value = null;
  }
});

async function confirm() {
  if (!(await form.value!.validate()).valid) return;
  emit("confirmed", { weight: confirmedValue("weight"), volume: confirmedValue("volume") });
  open.value = false;
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="640"
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <v-card-title class="d-flex align-start ga-2 pt-5 px-6">
        <div class="flex-grow-1">
          <div class="aco-title-card">
            Confirmar peso y volumen
          </div>
          <p class="aco-caption mt-1 text-wrap">
            Confirma el peso y volumen de la carga recibida en el almacén de origen.
          </p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="open = false"
        />
      </v-card-title>
      <v-card-text class="px-6">
        <v-form
          ref="form"
          @submit.prevent="confirm"
        >
          <v-row
            v-for="(measure, key, index) in MEASURES"
            :key="key"
            class="py-3 align-start"
            :class="{ 'border-t': index > 0 }"
          >
            <v-col
              cols="12"
              sm="5"
            >
              <div class="aco-title-row">
                {{ measure.label }}
              </div>
              <div class="aco-caption">
                Cotizado: <strong>{{ measure.format(quoted[key]) }}</strong>
              </div>
            </v-col>
            <v-col
              cols="12"
              sm="7"
            >
              <v-select
                v-if="quoted[key] !== null"
                v-model="entries[key].keep"
                :items="choices(key)"
                :label="measure.label"
                hide-details
              />
              <v-text-field
                v-if="!entries[key].keep"
                v-model.number="entries[key].value"
                type="number"
                min="0"
                :label="measure.inputLabel"
                :suffix="measure.suffix"
                :class="{ 'mt-3': quoted[key] !== null }"
                :rules="rules(key)"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="confirm"
        >
          Confirmar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
