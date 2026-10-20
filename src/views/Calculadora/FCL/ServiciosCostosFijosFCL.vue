<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useCalculadorasStore } from "@/stores/calculadoras";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
const ProfitCalculadora = defineAsyncComponent(() =>
  import("../../../components/Calculadora/ProfitCalculadora.vue"));
const TransporteCalculadora = defineAsyncComponent(() =>
  import("../../../components/Calculadora/TransporteCalculadora.vue"));
const Configuracion = defineAsyncComponent(() =>
  import("../../../components/Calculadora/ConfiguracionCalculadora.vue"));
const FleteGrupal = defineAsyncComponent(() =>
  import("../../../components/Calculadora/FleteGrupal.vue"));

const calculadorasStore = useCalculadorasStore();
const appStore = useAppStore();

const tab = ref("fletelst");
const id_modality = 1;

onMounted(async () => {
  const data = {
    shimpent: "FCL",
    id_modality: id_modality,
  };

  await Promise.all([
    calculadorasStore.getOpciones(),
    appStore._getModality(),
    appStore._getPais(),
    calculadorasStore.GetTipoCosto(data),
    calculadorasStore.GetCalcServicio(),
    calculadorasStore.GetCalcMultiplicador(data),
    calculadorasStore.GetCotCostos(),
    calculadorasStore.getCostosList(data),
    calculadorasStore.getProfitList(data),
    calculadorasStore.getDepartamentos(data),
    calculadorasStore.getTransporte(data),
  ]);
});
</script>

<template>
  <v-card>
    <v-container fluid>
      <v-tabs
        bg-color="#B71C1C"
        color="white"
        center-active
        align-tabs="center"
        slider-color="red"
        v-model="tab"
      >
        <v-tab
          base-color="rgba(255, 255, 255, 0.6)"
          value="flete"
        >
          Carga Masiva Flete
        </v-tab>
        <v-tab
          base-color="rgba(255, 255, 255, 0.6)"
          value="config"
        >
          Configuracion
        </v-tab>
        <v-tab
          base-color="rgba(255, 255, 255, 0.6)"
          value="fletelst"
        >
          Listado Fletes
        </v-tab>
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#fletegrup" active>Listado Fletes Grupal</v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#section">Secciones </v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#serv">Servicios </v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#cost">Costos Fijos</v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#profit">Profit</v-tab> -->
        <v-tab
          base-color="rgba(255, 255, 255, 0.6)"
          value="Transporte"
        >
          Transporte
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="fletelst">
          <FleteListComponent
            type="FCL"
            :id_modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="config">
          <Configuracion
            type="FCL"
            :id_modality="id_modality"
          />
        </v-tabs-window-item>
        <!-- <v-tab-item value="section">
          <SectionCalculadora type="FCL" :id_modality="id_modality" />
        </v-tab-item> -->
        <v-tabs-window-item value="serv">
          <Servicios
            type="FCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="cost">
          <CostosCalculadora
            type="FCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="profit">
          <ProfitCalculadora
            type="FCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="flete">
          <FleteComponent
            type="FCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="fletegrup">
          <FleteGrupal
            type="FCL"
            :id_modality="id_modality"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="Transporte">
          <TransporteCalculadora
            type="FCL"
            :id-modality="id_modality"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-card>
</template>

<style>
.Active {
  background: #1b5e20 !important;
  color: #ffffff !important;
}
.Inactive {
  background: #c8e6c9 !important;
  color: #424242 !important;
}
</style>
