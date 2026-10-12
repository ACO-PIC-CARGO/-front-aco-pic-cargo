<template>
  <v-card>
    <v-container fluid>
      <v-tabs
        bg-color="#B71C1C"
        center-active
        align-tabs="center"
        slider-color="red"
        v-model="tab"
      >
        <v-tab value="flete">Carga Masiva Flete</v-tab>
        <v-tab value="config">Configuracion</v-tab>
        <v-tab value="fletelst">Listado Fletes </v-tab>
        <v-tab value="fletegrup">Listado Fletes Grupal</v-tab>
        <!-- <v-tab href="#section">Secciones </v-tab> -->
        <!-- <v-tab href="#serv">Servicios </v-tab> -->
        <!-- <v-tab href="#cost">Costos Fijos</v-tab> -->
        <!-- <v-tab href="#profit">Profit</v-tab> -->
        <v-tab value="Transporte">Transporte</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="fletelst">
          <FleteListComponent type="LCL" :id_modality="id_modality" @flete-actualizado="handleFleteActualizado" />
        </v-tabs-window-item>
        <v-tabs-window-item value="config">
          <Configuracion type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <!-- <v-tab-item value="section">
          <SectionCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item> -->
        <v-tabs-window-item value="serv">
          <Servicios type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="cost">
          <CostosCalculadora type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="profit">
          <ProfitCalculadora type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="flete">
          <FleteComponent type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="fletegrup">
          <FleteGrupal type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="Transporte">
          <TransporteCalculadora type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
  </v-card>
</template>
<script>
import { defineAsyncComponent } from "vue";
import { mapActions } from "vuex";
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
      import("../../../components/Calculadora/Configuracion.vue")),
    FleteGrupal: defineAsyncComponent(() =>
      import("../../../components/Calculadora/FleteGrupal.vue")),
  },
  data() {
    return {
      tab: "fletelst",
      id_modality: 1,
      data: {
        shimpent: "LCL",
      id_modality: 1,
      },
    };
  },
  methods: {
    ...mapActions([
      "_getModality",
      "_getPais",
      "GetTipoCosto",
      "GetCalcServicio",
      "GetCalcMultiplicador",
      "GetCotCostos",
      "getCostosList",
      "getProfitList",
      "getDepartamentos",
      "getTransporte",
      "getOpciones",
    ]),
    handleFleteActualizado() {
      this.getCostosList(this.data);
    },
  },
  async mounted() {
   
    await Promise.all([
      this.getOpciones(),
      this._getModality(),
      this._getPais(),
      this.GetTipoCosto(this.data),
      this.GetCalcServicio(),
      this.GetCalcMultiplicador(this.data),
      this.GetCotCostos(),
      this.getCostosList(this.data),
      this.getProfitList(this.data),
      this.getDepartamentos(this.data),
      this.getTransporte(this.data),
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
