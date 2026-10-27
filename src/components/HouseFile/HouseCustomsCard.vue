<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useHousesStore } from "@/stores/houses";
import { useHouseEditStore } from "@/stores/houseEdit";

defineProps<{ editing?: boolean }>();

const housesStore = useHousesStore();
const { form } = storeToRefs(useHouseEditStore());
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    class="pa-3"
    aria-labelledby="house-customs-title"
  >
    <h2
      id="house-customs-title"
      class="text-title-small font-weight-bold mt-0 mb-2"
    >
      Datos de Aduana
    </h2>
    <div
      v-if="editing"
      class="d-flex flex-wrap ga-3"
    >
      <v-text-field
        v-model="form.nro_declaracion_aduana"
        label="N° de declaración"
        :counter="255"
        :readonly="false"
        density="compact"
      />
      <v-text-field
        v-model="form.canal_aduana"
        label="Canal"
        :counter="50"
        :readonly="false"
        density="compact"
      />
    </div>
    <div
      v-else
      class="d-flex flex-wrap gc-8 gr-2"
    >
      <div>
        <div class="text-body-small text-medium-emphasis">
          N° de declaración
        </div>
        <div class="text-body-medium font-weight-bold">
          {{ housesStore.house.nro_declaracion_aduana || "—" }}
        </div>
      </div>
      <div>
        <div class="text-body-small text-medium-emphasis">
          Canal
        </div>
        <div class="text-body-medium font-weight-bold">
          {{ housesStore.house.canal_aduana || "—" }}
        </div>
      </div>
    </div>
  </v-card>
</template>
