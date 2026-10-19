<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useStore } from "vuex";
import { useConfiguracionStore } from "@/stores/configuracion";
import type { TipoContenedor } from "@/types/catalogos";
import type { TextoWhatsappFcl } from "@/types/configuracion";

const rootStore = useStore();
const configuracionStore = useConfiguracionStore();
const { fcl } = storeToRefs(configuracionStore);

const loading = ref(false);

const itemsContainers = computed<TipoContenedor[]>(() => rootStore.state.itemsContainers);
const listadoTextoFCL = computed<TextoWhatsappFcl[]>(() => {
  if (Object.keys(fcl.value).length > 0) {
    return itemsContainers.value.map((container) => ({
      id_container: container.id,
      name: container.name,
      texto: fcl.value.some((v) => v.id_container == container.id)
        ? fcl.value.find((v) => v.id_container == container.id)!.texto
        : {
            pdfindividual: "",
            pdfgrupal: "",
            linkindividual: "",
            linkgrupal: "",
          },
    }));
  } else {
    return itemsContainers.value.map((container) => ({
      ...container,
      id_container: container.id,
      texto: {
        pdf: "",
        link: "",
      },
    }));
  }
});

async function guardar() {
  loading.value = true;
  await configuracionStore.setTextoWhatsappFCL({
    fcl: listadoTextoFCL.value,
  });
  loading.value = false;
}
</script>

<template>
  <v-container fluid>
    <v-row
      v-for="(text, index) in listadoTextoFCL"
      :key="index"
      class="py-1"
    >
      <v-col cols="12">
        <div class="d-flex align-center my-2">
          <v-divider />
          <span
            class="mx-3 text-grey"
            style="font-size: 1.2em; font-weight: bold"
          >
            {{ text.name }}
          </span>
          <v-divider />
        </div>
      </v-col>

      <v-col
        cols="12"
        md="6"
        class="py-1"
      >
        <vTextarea
          v-model="text.texto.pdfindividual"
         
          auto-grow
          variant="outlined"
          hide-details
        >
          <template #label>
            <span> Texto para envío de PDF | {{ text.code }} | INDIVIDUAL </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col
        cols="12"
        md="6"
        class="py-1"
      >
        <vTextarea
          v-model="text.texto.pdfgrupal"
         
          auto-grow
          variant="outlined"
          hide-details
        >
          <template #label>
            <span> Texto para envío de PDF | {{ text.code }} | GRUPAL </span>
          </template>
        </vTextarea>
      </v-col>
      <!-- <v-col cols="12" md="3" class="py-1">
        <vTextarea
          v-model="text.texto.linkindividual"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span> Texto para envío de LINK | {{ text.code }} | INDIVIDUAL </span>
          </template>
        </vTextarea>
      </v-col>
      <v-col cols="12" md="3" class="py-1">
        <vTextarea
          v-model="text.texto.linkgrupal"
          auto-grow
          outlined
          hide-details
        >
          <template #label>
            <span>
              <span> Texto para envío de LINK | {{ text.code }} | GRUPAL </span>
            </span>
          </template>
        </vTextarea>
      </v-col> -->
    </v-row>
    <v-row>
      <v-col
        cols="12"
        class="d-flex justify-end"
      >
        <v-btn
          color="success"
          @click="guardar"
          :loading="loading"
        >
          Guardar
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
