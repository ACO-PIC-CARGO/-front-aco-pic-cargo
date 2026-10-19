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
        <v-tab base-color="rgba(255, 255, 255, 0.6)" value="flete">Carga Masiva Flete</v-tab>
        <v-tab base-color="rgba(255, 255, 255, 0.6)" value="config">Configuracion</v-tab>
        <v-tab base-color="rgba(255, 255, 255, 0.6)" value="fletelst">Listado Fletes </v-tab>
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#fletegrup" active>Listado Fletes Grupal</v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#section">Secciones </v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#serv">Servicios </v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#cost">Costos Fijos</v-tab> -->
        <!-- <v-tab base-color="rgba(255, 255, 255, 0.6)" href="#profit">Profit</v-tab> -->
        <v-tab base-color="rgba(255, 255, 255, 0.6)" value="Transporte">Transporte</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="fletelst">
          <FleteListComponent type="FCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="config">
          <Configuracion type="FCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <!-- <v-tab-item value="section">
          <SectionCalculadora type="FCL" :id_modality="id_modality" />
        </v-tab-item> -->
        <v-tabs-window-item value="serv">
          <Servicios type="FCL" :id-modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="cost">
          <CostosCalculadora type="FCL" :id-modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="profit">
          <ProfitCalculadora type="FCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="flete">
          <FleteComponent type="FCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="fletegrup">
          <FleteGrupal type="FCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="Transporte">
          <TransporteCalculadora type="FCL" :id_modality="id_modality" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-card>
</template>
<script>
import { defineAsyncComponent } from "vue";
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";
export default {
  components: {
    SectionCalculadora: defineAsyncComponent(() =>
      import("../../../components/Calculadora/SectionCalculadora.vue")),
    Servicios: defineAsyncComponent(() =>
      import("../../../components/Calculadora/ServiciosCalculadora.vue")),
    CostosCalculadora: defineAsyncComponent(() =>
      import("../../../components/Calculadora/CostosCalculadora.vue")),
    FleteComponent: defineAsyncComponent(() =>
      import("../../../components/Calculadora/FleteComponent.vue")),
    FleteListComponent: defineAsyncComponent(() =>
      import("../../../components/Calculadora/FleteListComponent.vue")),
    ProfitCalculadora: defineAsyncComponent(() =>
      import("../../../components/Calculadora/ProfitCalculadora.vue")),
    TransporteCalculadora: defineAsyncComponent(() =>
      import("../../../components/Calculadora/TransporteCalculadora.vue")),
    Configuracion: defineAsyncComponent(() =>
      import("../../../components/Calculadora/ConfiguracionCalculadora.vue")),
    FleteGrupal: defineAsyncComponent(() =>
      import("../../../components/Calculadora/FleteGrupal.vue")),
  },
  data() {
    return {
      tab: "fletelst",
      id_modality: 1,
    };
  },
  methods: {
    ...mapActions([
      "_getModality",
      "_getPais",
    ]),
    ...mapPiniaActions(useCalculadorasStore, ["GetTipoCosto", "GetCalcServicio", "GetCalcMultiplicador", "GetCotCostos", "getCostosList", "getProfitList", "getDepartamentos", "getTransporte", "getOpciones"]),
  },
  async mounted() {
    let data = {
      shimpent: "FCL",
      id_modality: this.id_modality,
    };

    await Promise.all([
      this.getOpciones(),
      this._getModality(),
      this._getPais(),
      this.GetTipoCosto(data),
      this.GetCalcServicio(),
      this.GetCalcMultiplicador(data),
      this.GetCotCostos(),
      this.getCostosList(data),
      this.getProfitList(data),
      this.getDepartamentos(data),
      this.getTransporte(data),
    ]);
  },
};
</script>

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
