<template>
  <v-card>
    <v-container fluid>
      <v-tabs align-tabs="center" v-model="tab">
        <v-tab value="fletelst">Flete Listado </v-tab>
        <v-tab value="section">Secciones </v-tab>
        <v-tab value="serv">Servicios </v-tab>
        <v-tab value="cost">Costos Fijos</v-tab>
        <v-tab value="flete">Flete</v-tab>
      </v-tabs>
      <v-tabs-window v-model="tab">
        <v-tabs-window-item value="fletelst">
          <FleteListComponent type="LCL" :id_modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="section">
          <SectionCalculadora type="LCL" :id-modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="serv">
          <Servicios type="LCL" :id-modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="cost">
          <CostosCalculadora type="LCL" :id-modality="id_modality" />
        </v-tabs-window-item>
        <v-tabs-window-item value="flete">
          <FleteComponent type="LCL" :id_modality="id_modality" />
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
    ]),
    ...mapPiniaActions(useCalculadorasStore, ["GetTipoCosto", "GetCalcServicio", "GetCalcMultiplicador", "GetCotCostos", "getCostosList"]),
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
