<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useConfiguracionStore } from "@/stores/configuracion";

const configuracionStore = useConfiguracionStore();
const { lcl } = storeToRefs(configuracionStore);

const loading = ref(false);

async function guardar() {
  // Lógica para guardar los textos
  loading.value = true;
  await configuracionStore.setTextoWhatsappLCL({ lcl: lcl.value });
  loading.value = false;
}
</script>

<template>
  <v-container>
    <v-row class="py-1">
      <v-col cols="12">
        <p style="font-size: 1.2em; font-weight: bold">
          Texto para envío de PDF
        </p>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <vTextarea
          v-model="lcl.pdfindividual"
          label=""
          auto-grow
          variant="outlined"
          hide-details
        >
          <template #label>
            <span>Texto para envío de PDF - INDIVIDUAL</span>
          </template>
        </vTextarea>
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <vTextarea
          v-model="lcl.pdfgrupal"
          label="Texto para envío de PDF - GRUPAL"
          auto-grow
          variant="outlined"
          hide-details
        >
          <template #label>
            <span>Texto para envío de PDF - GRUPAL</span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12">
        <p style="font-size: 1.2em; font-weight: bold">
          Texto para envío de LINK
        </p>
      </v-col>
      <!-- <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.linkindividual"
          label="Texto para envío de LINK - INDIVIDUAL"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> Texto para envío de LINK - INDIVIDUAL </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="6">
        <vTextarea
          v-model="lcl.linkgrupal"
          label="Texto para envío de LINK - GRUPAL"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> Texto para envío de LINK - GRUPAL </span>
          </template>
        </vTextarea>
      </v-col> -->

      <v-col
        cols="12"
        class="d-flex justify-end"
      >
        <v-btn
          color="success"
          class="mt-4"
          :loading="loading"
          @click="guardar"
        >
          Guardar
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
