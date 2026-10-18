<template>
  <v-container fluid class="pa-0" v-if="verFlag">
    <v-card elevation="5">
      <v-stepper v-model="$store.state.aduana.e1" non-linear>
        <v-stepper-header>
          <v-stepper-item
            complete
            :value="1"
            title="Datos de la Carga"
            :editable="editable1"
          />

          <v-divider></v-divider>

          <v-stepper-item complete :value="2" :editable="mostrarStepS">
            <template #title>
              <span v-if="mostrarStepS"> costos de la Cotización </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              ></v-progress-circular>
            </template>
          </v-stepper-item>

          <v-divider></v-divider>
          <v-stepper-item :value="3" complete :editable="mostrarStepS">
            <template #title>
              <span v-if="mostrarStepS"> Comparativa </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              ></v-progress-circular>
            </template>
          </v-stepper-item>
          <v-divider></v-divider>
          <v-stepper-item complete :value="4" :editable="mostrarStepS">
            <template #title>
              <span v-if="mostrarStepS"> Notas de Costos </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              ></v-progress-circular>
            </template>
          </v-stepper-item>
          <v-divider></v-divider>

          <v-stepper-item complete :value="5" :editable="mostrarStepS">
            <!-- Instructivo -->
            <template #title>
              <span v-if="mostrarStepS"> Enviar a Operaciones </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              ></v-progress-circular>
            </template>
          </v-stepper-item>
          <v-stepper-item complete :value="6" :editable="mostrarStepS">
            <template #title>
              <span v-if="mostrarStepS"> Unificar Cotización </span>
              <v-progress-circular
                v-else
                indeterminate
                color="primary"
              ></v-progress-circular>
            </template>
          </v-stepper-item>
        </v-stepper-header>
        <!-- DATA -->
        <v-stepper-window>
          <v-stepper-window-item :value="1" eager>
            <v-row class="my-1">
              <v-col cols="12" md="6" class="pa-0">
                <DatosPrincipales />
              </v-col>
              <v-col cols="12" md="6" class="pa-0">
                <DatosCarga />
              </v-col>
              <v-col cols="12">
                <Services />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item :value="2" eager>
            <v-row class="my-1">
              <v-col cols="12">
                <Costos v-if="mostrarStepS" />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item :value="3" eager>
            <Comparativa v-if="mostrarStepS" />
          </v-stepper-window-item>
          <v-stepper-window-item :value="4" eager>
            <Notas v-if="mostrarStepS" />
          </v-stepper-window-item>
          <v-stepper-window-item :value="5" eager>
            <Instructivo v-if="mostrarStepS" />
            <!-- COMBINAR -->
          </v-stepper-window-item>
          <v-stepper-window-item :value="6" eager>
            <UnificarCotizacion v-if="mostrarStepS" />
            <!-- COMBINAR -->
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapActions } from "vuex";
import mixins from "../../components/mixins/funciones.js";
export default {
  mixins: [mixins],
  name: "VerQuoteView",
  components: {
    DatosPrincipales: defineAsyncComponent(() =>
      import(
        "../../components/folderAduana/VerComponent/DatosPrincipalesComponent.vue"
      )),
    DatosCarga: defineAsyncComponent(() =>
      import(
        "../../components/folderAduana/VerComponent/DatosCargaComponent.vue"
      )),
    Services: defineAsyncComponent(() =>
      import(
        "../../components/folderAduana/VerComponent/ServicesComponent.vue"
      )),
    Costos: defineAsyncComponent(() =>
      import(
        "../../components/folderAduana/VerComponent/DatosCostosComponent.vue"
      )),
    Notas: defineAsyncComponent(() =>
      import("../../components/folderAduana/VerComponent/NotasComponent.vue")),
    Instructivo: defineAsyncComponent(() =>
      import(
        "../../components/folderAduana/VerComponent/InstructivoComponent.vue"
      )),
    Comparativa: defineAsyncComponent(() =>
      import("@/components/folderAduana/VerComponent/ComparativaComponent.vue")),
    UnificarCotizacion: defineAsyncComponent(() =>
      import("@/components/folderAduana/VerComponent/UnificarCotizacion.vue")),
  },
  data() {
    return {
      e1: 1,
      editable1: true,
      editable2: true,
      editable3: true,
      editable4: true,
      costoFlag: false,
      mostrarStepS: false,
      instructivoFlag: false,
      valores: [],
      verFlag: true,
    };
  },
  methods: {
    ...mapActions([
      "getItemsServicesDetails",
      "getMarketingList",
      "getQuoteStatus",
      "getModulesEntities",
      "getModalityAduana",
      "getShipmentAduana",
      "getIncotermsAduana",
      "getModuleRole",
      "getCargarMasterDetalleNotasCotizacion",
      "_getEntities",
      "_getRole",
      "getImpuestos",
      "getAdunaVer",
      "getPortBeginAduana",
      "getPortEndAduana",
      "getMultiplicadorAduana",
      "getInstructivoIdAduana",
      "generaInstructivoAduana",
      "getBegEndList",
      "cargarMasterDetallePercepcionAduana",
      "getTipoCostosAduana",
      "cargarProveedores",
      "_getEntitiesCliente",
      "getPersonalPricingAduana",
      "obtenerImpuestoXEmpresa",
      "getCotizacionUnificar",
      "GuardaCostosFinalesAduana",
    ]),
  },
  async mounted() {
    this.$store.state.spiner = true;
    this.verFlag = false;
    await Promise.all([
      this.getAdunaVer({ id: this.$route.params.id }),
      this.getShipmentAduana(),
    ]);
    this.$store.state.mainTitle = `VER  COTIZACIÓN - ${this.$store.state.aduana.nro_quote}`;
    this.$store.state.spiner = false;
    this.verFlag = true;

    let idTipoCarga = this.$store.state.aduana.listShipment.filter(
      (v) => v.id == this.$store.state.aduana.datosPrincipales.idtipocarga
    )[0].id_transport;

    await Promise.all([
      this.getPortBeginAduana({
        id_transport: idTipoCarga,
        id: this.$store.state.aduana.datosPrincipales.idorigen,
      }),
      this.getPortEndAduana({
        id_transport: idTipoCarga,
        id: this.$store.state.aduana.datosPrincipales.iddestino,
      }),
      this.getMarketingList(),
      this.getQuoteStatus(),
      this.getModalityAduana(),
      this.getIncotermsAduana(),
      this.getPersonalPricingAduana(),
      this.getMultiplicadorAduana(),
      this.cargarProveedores(),
      // this.getBegEndList(),
      this.getTipoCostosAduana(),
      this.cargarMasterDetallePercepcionAduana(),
      this.obtenerImpuestoXEmpresa(),
      // await this.getModulesEntities(),

      this.getCotizacionUnificar(this.$route.params.id),
      this.getInstructivoIdAduana({ id: this.$route.params.id }),
    ]);
    this.mostrarStepS = true;

    this.$store.state.aduana.actualizarCostosFlag =
      !this.$store.state.aduana.actualizarCostosFlag;

    this.$store.state.aduana.actualizarComparativa =
      !this.$store.state.aduana.actualizarComparativa;
    setTimeout(() => {
      this.generaInstructivoAduana();
    }, 1000);
    this.$store.state.aduana.actualizarCostosFlag = false;
    this.$store.state.drawer = false;

    if (this.$route.params.step) {
      this.$store.state.aduana.e1 = this.$route.params.step
        ? Number(this.$route.params.step)
        : 1;
    }

    setTimeout(async () => {
      let aprobadas = this.$store.state.aduana.opcionCostos.filter(
        (v) => v.selected
      );

      if (aprobadas.length && !this.$store.state.aduana.aprobadoflag) {
        await this.GuardaCostosFinalesAduana();
      }
    }, 300);
  },
};
</script>

<style></style>
