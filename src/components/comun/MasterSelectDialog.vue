<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from "vue";
import type { ExpedienteMaster } from "@/types/cotizacion";
import { masterMismatches, type QuoteRoute } from "@/utils/expedienteChoice";

const props = defineProps<{ masters: ExpedienteMaster[]; quote: QuoteRoute; loading?: boolean }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ select: [master: ExpedienteMaster] }>();

const form = useTemplateRef("form");
const masterId = shallowRef<number | string | null>(null);
const chosen = computed(() => props.masters.find((master) => master.id == masterId.value));
const mismatches = computed(() => (chosen.value ? masterMismatches(props.quote, chosen.value) : []));

const noDataText =
  "No se encontraron Masters con la misma Modalidad, Tipo de Carga, Incoterms y/o Puerto Origen/ Destino asociados a la cotización.";

async function select() {
  if (!(await form.value!.validate()).valid || !chosen.value) return;
  emit("select", chosen.value);
}
</script>

<template>
  <v-dialog
    v-model="open"
    eager
    scrollable
    persistent
    max-width="50%"
    transition="dialog-transition"
    class="classDialog"
  >
    <v-card>
      <v-card-title
        class="d-flex align-center flex-wrap"
        primary-title
      >
        SELECCIONE EL EXPEDIENTE A ASOCIAR:
        <v-spacer />
        <v-btn
          variant="text"
          icon
          color="default"
          @click="open = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-row>
            <v-autocomplete
              v-model="masterId"
              :items="masters"
              label="Expediente"
              item-title="code_master"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :no-data-text="noDataText"
              class="mx-5 my-5"
            />
          </v-row>
        </v-form>

        <v-alert
          v-if="mismatches.length"
          border="start"
          border-color="error"
          color="surface"
          elevation="2"
        >
          <template #prepend>
            <v-icon
              color="error"
              icon="$error"
            />
          </template>
          El Master seleccionado no coincide con
          {{ mismatches.join(", ") }} asociados a la
          cotización.
          <h3>¿Está seguro, de asociar la cotización a este registro?</h3>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          class="mx-1"
          size="small"
          color="success"
          :loading="loading"
          @click="select"
        >
          SELECCIONAR
        </v-btn>
        <v-btn
          class="mx-1"
          size="small"
          color="error"
          @click="open = false"
        >
          Cancelar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
