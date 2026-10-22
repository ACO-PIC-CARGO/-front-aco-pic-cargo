<script setup lang="ts">
import { useHousesStore } from "@/stores/houses";

const housesStore = useHousesStore();
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
      class="text-title-medium font-weight-bold mb-2"
    >
      Datos de Aduana
    </h2>
    <div class="d-flex flex-wrap gc-8 gr-2">
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
