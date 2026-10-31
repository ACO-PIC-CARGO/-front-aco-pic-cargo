<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { FleteCalculadora } from "@/types/calculadora";

const emit = defineEmits<{ "flete-actualizado": [] }>();

const calculadorasStore = useCalculadorasStore();

const search = ref("");
const dialog = ref(false);
const headers = [
  { key: "action", title: "" },
  { key: "pais_origen", title: "País Origen" },
  { key: "puerto_origin", title: "Puerto Origen" },
  { key: "pais_destino", title: "País Destino" },
  { key: "puerto_destino", title: "Puerto Destino" },
  { key: "flete_0_5", title: "De 0.1 - 5" },
  { key: "flete_5_10", title: "De 5 - 10" },
  { key: "flete_10_15", title: "De 10 - 15" },
  { key: "moneda", title: "Moneda" },
  { key: "vigencia", title: "Vigencia" },
  { key: "created_user", title: "Usuario" },
  { key: "created_at", title: "Fecha Reg." },
];
const flete = ref<FleteCalculadora>({});
const saving = ref(false);
const frmFlete = useTemplateRef("frmFlete");
const positiveRule = (v: unknown) => Number(v) > 0 || "Ingresa un flete mayor que 0";

function editFlete(item: FleteCalculadora) {
  flete.value = { ...item };
  dialog.value = true;
}
async function guardarFlete() {
  if (saving.value || !(await frmFlete.value!.validate()).valid) return;
  saving.value = true;
  const saved = await calculadorasStore.actualizarFlete(flete.value);
  saving.value = false;
  if (!saved) return;
  emit("flete-actualizado");
  dialog.value = false;
}
</script>

<template>
  <v-container fluid>
    <v-text-field
      v-model="search"
      append-inner-icon="mdi-magnify"
      label="Buscar"
      single-line
      hide-details
      variant="outlined"
      style="max-width: 30%"
      density="compact"
    />
    <br>

    <v-data-table
      :headers="headers"
      :items="calculadorasStore.lstFlete"
      :search="search"
      item-value="id"
    >
      <template #item.action="{ item }">
        <v-btn
          variant="text"
          color="warning"
          @click="editFlete(item)"
          size="small"
          icon
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      max-width="35%"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          {{ flete.puerto_origin }} <v-icon>mdi-arrow-right-thin</v-icon>
          {{ flete.puerto_destino }} <v-spacer />
          <v-icon @click="dialog = false">
            mdi-close
          </v-icon>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmFlete">
            <v-text-field
              v-model="flete.flete_0_5"
              label="De 0.1 - 5"
              type="number"
              :rules="[positiveRule]"
              variant="outlined"
              density="compact"
            />
            <v-text-field
              v-model="flete.flete_5_10"
              label="De 5 - 10"
              type="number"
              :rules="[positiveRule]"
              variant="outlined"
              density="compact"
            />
            <v-text-field
              v-model="flete.flete_10_15"
              label="De 10 - 15"
              type="number"
              :rules="[positiveRule]"
              variant="outlined"
              density="compact"
            />
            <FormatFecha
              v-model="flete.vigencia"
              label="Vigencia"
              outlined
              dense
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            :loading="saving"
            @click="guardarFlete"
          >
            Guardar
          </v-btn>
          <v-btn
            color="red"
            @click="dialog = false"
            variant="text"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
