<template>
  <v-card>
    <v-container fluid>
      <v-tabs
        background-color="#B71C1C"
        center-active
        dark
        centered
        v-model="tab"
      >
        <v-tabs-slider color="red"></v-tabs-slider>
        <v-tab href="#flete">Carga Masiva Flete</v-tab>
        <v-tab href="#config">Configuracion</v-tab>
        <v-tab href="#fletelst" active>Listado Fletes </v-tab>
        <v-tab href="#fletegrup" active>Listado Fletes Grupal</v-tab>
        <!-- <v-tab href="#section">Secciones </v-tab> -->
        <v-tab href="#serv">Servicios </v-tab>
        <v-tab href="#cost">Costos Fijos</v-tab>
        <v-tab href="#profit">Profit</v-tab>
        <v-tab href="#Transporte">Transporte</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item value="fletelst">
          <FleteListComponent type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="config">
          <Configuracion type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <!-- <v-tab-item value="section">
          <SectionCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item> -->
        <v-tab-item value="serv">
          <Servicios type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="cost">
          <CostosCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="profit">
          <ProfitCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="flete">
          <FleteComponent type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="fletegrup">
          <FleteGrupal type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="Transporte">
          <TransporteCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item>
      </v-tabs-items>
    </v-container>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
export default {
  components: {
    SectionCalculadora: () =>
      import("../../../components/Calculadora/SectionCalculadora.vue"),
    Servicios: () =>
      import("../../../components/Calculadora/ServiciosCalculadora.vue"),
    CostosCalculadora: () =>
      import("../../../components/Calculadora/CostosCalculadora.vue"),
    FleteComponent: () =>
      import("../../../components/Calculadora/FleteComponent.vue"),
    FleteListComponent: () =>
      import("../../../components/Calculadora/FleteListComponent.vue"),
    ProfitCalculadora: () =>
      import("../../../components/Calculadora/ProfitCalculadora.vue"),
    TransporteCalculadora: () =>
      import("../../../components/Calculadora/TransporteCalculadora.vue"),
    Configuracion: () =>
      import("../../../components/Calculadora/Configuracion.vue"),
    FleteGrupal: () =>
      import("../../../components/Calculadora/FleteGrupal.vue"),
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
  },
  async mounted() {
    let data = {
      shimpent: "LCL",
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
