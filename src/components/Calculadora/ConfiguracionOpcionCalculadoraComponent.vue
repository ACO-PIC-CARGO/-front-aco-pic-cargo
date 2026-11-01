<script setup lang="ts">
import { computed, ref } from "vue";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePermissions } from "@/composables/usePermissions";
import type { OpcionCalculadora } from "@/types/calculadora";

const calculadorasStore = useCalculadorasStore();
const { can } = usePermissions();

const headers = [
  { width: "25%", title: "Nombre", key: "nombre" },
  { width: "25%", title: "Descripción", key: "frecuencia" },
  { width: "5%", title: "Estado", key: "estado", align: "center" },
  {
    width: "5%",
    title: "Orden Presentación",
    key: "orden",
    align: "center",
  },
  { width: "12%", title: "Tipo", key: "esgrupalflag", align: "center" },
  {
    width: "10%",
    title: "Volumen Máximo",
    key: "volumenmax",
    align: "center",
  },
  {
    width: "10%",
    title: "Tonelada Máxima",
    key: "toneladamax",
    align: "center",
  },
  { title: "", key: "action", align: "center" },
] as const;

const lstOpciones = computed({
  get() {
    return calculadorasStore.lstOpciones;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  set(value: OpcionCalculadora[]) {
    // Si necesitas actualizarlo, lo ideal es llamar a una mutación de Vuex:
    // this.$store.commit("nombreDeTuMutacion", value);
  },
});

const savingId = ref<string | null>(null);
const positiveRule = (v: unknown) => Number(v) > 0 || "Ingresa un valor mayor que 0";

async function actualizarOpcion(item: OpcionCalculadora) {
  if (savingId.value) return;
  savingId.value = item.id;
  await calculadorasStore.opcionActualizar(item);
  savingId.value = null;
}
</script>

<template>
  <v-container fluid>
    <v-data-table
      :headers="headers"
      :items="lstOpciones"
    >
      <template #[`item.nombre`]="{ item }">
        <v-textarea
          v-model="item.nombre"
          :disabled="!item.editarflag"
          hide-details
          density="compact"
          variant="outlined"
          auto-grow
          rows="1"
        />
      </template>
      <template #[`item.frecuencia`]="{ item }">
        <v-textarea
          v-model="item.frecuencia"
          :disabled="!item.editarflag"
          hide-details
          density="compact"
          variant="outlined"
          auto-grow
          rows="1"
        />
      </template>
      <template #[`item.volumenmax`]="{ item }">
        <v-text-field
          v-model="item.volumenmax"
          :disabled="!item.editarflag"
          :hide-details="!item.editarflag"
          :rules="[positiveRule]"
          aria-label="Volumen máximo"
          density="compact"
          variant="outlined"
          style="max-width: 100px"
          type="number"
          suffix="m³"
        />
      </template>
      <template #[`item.toneladamax`]="{ item }">
        <v-text-field
          v-model="item.toneladamax"
          :disabled="!item.editarflag"
          :hide-details="!item.editarflag"
          :rules="[positiveRule]"
          aria-label="Tonelada máxima"
          density="compact"
          variant="outlined"
          style="max-width: 100px"
          type="number"
        />
      </template>

      <template #[`item.estado`]="{ item }">
        <v-chip
          class="ma-2 text-white"
          color="green"
          variant="flat"
          v-if="item.estado"
        >
          Activo
        </v-chip>

        <v-chip
          class="ma-2 text-white"
          color="orange"
          variant="flat"
          v-else
        >
          Inactivo
        </v-chip>
      </template>

      <template #[`item.esgrupalflag`]="{ item }">
        <v-chip
          style="
            min-width: 130px;
            text-align: center;
            align-items: center;
            align-content: center;
          "
          v-if="item.esgrupalflag"
          color="success"
          variant="outlined"
        >
          <v-icon class="ma-2">
            mdi-account-group
          </v-icon>
          Grupal
        </v-chip>

        <v-chip
          style="
            min-width: 130px;
            text-align: center;
            align-items: center;
            align-content: center;
          "
          v-else
          color="primary"
          variant="outlined"
        >
          <v-icon class="ma-2">
            mdi-account
          </v-icon>
          Individual
        </v-chip>
      </template>
      <template #[`item.action`]="{ item }">
        <v-btn
          v-if="!item.editarflag && can('calcOpciones', 'MODIFICAR')"
          color="warning"
          size="small"
          @click="item.editarflag = true"
        >
          Editar
        </v-btn>
        <v-btn
          v-if="item.editarflag"
          color="success"
          size="small"
          :loading="savingId === item.id"
          @click="actualizarOpcion(item)"
        >
          Guardar
        </v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<style></style>
