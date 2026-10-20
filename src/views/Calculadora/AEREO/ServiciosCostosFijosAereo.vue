<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useCalculadorasStore } from "@/stores/calculadoras";

const SectionCalculadora = defineAsyncComponent(() =>
  import("../../../components/Calculadora/SectionCalculadora.vue"));
const Servicios = defineAsyncComponent(() =>
  import("../../../components/Calculadora/ServiciosCalculadora.vue"));
const CostosCalculadora = defineAsyncComponent(() =>
  import("../../../components/Calculadora/CostosCalculadora.vue"));

const FleteComponent = defineAsyncComponent(() =>
  import("../../../components/Calculadora/FleteComponent.vue"));

const FleteListComponent = defineAsyncComponent(() =>
  import("../../../components/Calculadora/FleteListComponent.vue"));

const calculadorasStore = useCalculadorasStore();
const appStore = useAppStore();

const tab = ref("serv");
const id_modality = 1;

onMounted(async () => {
  const data = {
    shimpent: "Areo",
    id_modality: id_modality,
  };

  await Promise.all([
    appStore._getModality(),
    appStore._getPais(),
    calculadorasStore.GetTipoCosto(data),
    calculadorasStore.GetCalcServicio(),
    calculadorasStore.GetCalcMultiplicador(data),
    calculadorasStore.GetCotCostos(),
    calculadorasStore.getCostosList(data),
  ]);
});
</script>

<template>
  <v-card>
    <v-container fluid>
      <v-tabs
        align-tabs="center"
        v-model="tab"
      >
        <v-tab value="fletelst">
          Flete Listado
        </v-tab>
        <v-tab value="section">
          Secciones
        </v-tab>
        <v-tab value="serv">
          Servicios
        </v-tab>
        <v-tab value="cost">
          Costos Fijos
        </v-tab>
        <v-tab value="flete">
          Flete
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="fletelst">
          <FleteListComponent
            type="LCL"
            :id_modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="section">
          <SectionCalculadora
            type="LCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="serv">
          <Servicios
            type="LCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="cost">
          <CostosCalculadora
            type="LCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="flete">
          <FleteComponent
            type="LCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-card>
</template>

<style></style>
