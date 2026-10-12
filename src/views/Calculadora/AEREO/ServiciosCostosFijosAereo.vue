<template>
  <v-card>
    <v-container fluid>
      <v-tabs align-tabs="center" v-model="tab">
        <v-tab href="#fletelst" active>Flete Listado </v-tab>
        <v-tab href="#section">Secciones </v-tab>
        <v-tab href="#serv">Servicios </v-tab>
        <v-tab href="#cost">Costos Fijos</v-tab>
        <v-tab href="#flete">Flete</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item value="fletelst">
          <FleteListComponent type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="section">
          <SectionCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="serv">
          <Servicios type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="cost">
          <CostosCalculadora type="LCL" :id_modality="id_modality" />
        </v-tab-item>
        <v-tab-item value="flete">
          <FleteComponent type="LCL" :id_modality="id_modality" />
        </v-tab-item>
      </v-tabs-items>
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
  },
  data() {
    return {
      tab: "serv",
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
    ]),
  },
  async mounted() {
    let data = {
      shimpent: "Areo",
      id_modality: this.id_modality,
    };

    await Promise.all([
      this._getModality(),
      this._getPais(),
      this.GetTipoCosto(data),
      this.GetCalcServicio(),
      this.GetCalcMultiplicador(data),
      this.GetCotCostos(),
      this.getCostosList(data),
    ]);
  },
};
</script>

<style></style>
