<template>
  <v-container fluid class="pa-0" v-if="verFlag">
    <v-card elevation="10">
      <v-stepper v-model="$store.state.pricing.e1" non-linear>
        <v-stepper-header>
          <v-stepper-step complete step="1" :editable="editable1">
            Datos de la Carga
          </v-stepper-step>

          <v-divider></v-divider>

          <v-stepper-step complete step="2" editable>
            <span> costos de la Cotización </span>
          </v-stepper-step>

          <v-divider></v-divider>
          <v-stepper-step step="3" complete editable>
            Comparativa
          </v-stepper-step>
          <v-divider></v-divider>
          <v-stepper-step complete step="4" editable>
            <span> Notas de Costos </span>
          </v-stepper-step>
          <v-divider></v-divider>

          <v-stepper-step complete step="5" editable>
            Enviar a Operaciones
          </v-stepper-step>
          <v-stepper-step complete step="6" editable>
            Unificar Cotización
          </v-stepper-step>
        </v-stepper-header>
        <!-- DATA -->
        <v-stepper-items>
          <v-stepper-content step="1">
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
          </v-stepper-content>
          <v-stepper-content step="2">
            <v-row class="my-1">
              <v-col cols="12">
                <Costos />
              </v-col>
            </v-row>
          </v-stepper-content>
          <v-stepper-content step="3">
            <Comparativa />
          </v-stepper-content>
          <v-stepper-content step="4">
            <Notas />
          </v-stepper-content>
          <v-stepper-content step="5">
            <Instructivo />
          </v-stepper-content>
          <v-stepper-content step="6">
            <UnificarCotizacion />
          </v-stepper-content>
        </v-stepper-items>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import mixins from "../../components/mixins/funciones.js";
export default {
  mixins: [mixins],
  name: "VerQuoteView",
  components: {
    DatosPrincipales: () =>
      import(
        "../../components/folderPricing/VerComponent/DatosPrincipalesComponent.vue"
      ),
    DatosCarga: () =>
      import(
        "../../components/folderPricing/VerComponent/DatosCargaComponent.vue"
      ),
    Services: () =>
      import(
        "../../components/folderPricing/VerComponent/ServicesComponent.vue"
      ),
    Costos: () =>
      import(
        "../../components/folderPricing/VerComponent/DatosCostosComponent.vue"
      ),
    Notas: () =>
      import("../../components/folderPricing/VerComponent/NotasComponent.vue"),
    Instructivo: () =>
      import(
        "../../components/folderPricing/VerComponent/InstructivoComponent.vue"
      ),
    Comparativa: () =>
      import(
        "@/components/folderPricing/VerComponent/ComparativaComponent.vue"
      ),
    UnificarCotizacion: () =>
      import("@/components/folderPricing/VerComponent/UnificarCotizacion.vue"),
  },
  data() {
    return {
      e1: 1,
      editable1: true,
      editable2: true,
      editable3: true,
      editable4: true,
      editable5: true,
      costoFlag: false,
      instructivoFlag: false,
      valores: [],
      verFlag: true,
      mostrarStepS: false,
    };
  },
  methods: {
    ...mapActions([
      "getItemsServicesDetails",
      "getMarketingList",
      "getQuoteStatus",
      "getModulesEntities",
      "getModality",
      "getShipment",
      "getIncoterms",
      "getModuleRole",
      "getCargarMasterDetalleNotasCotizacion",
      "_getEntities",
      "_getRole",
      "getImpuestos",
      "getQuote",
      "getPortBegin",
      "getPortEnd",
      "getMultiplicador",
      "getInstructivoId",
      "generaInstructivo",
      "getBegEndList",
      "cargarMasterDetallePercepcionAduana",
      "getTipoCostos",
      "cargarProveedores",
      "_getEntitiesCliente",
      "getPersonalPricing",
      "obtenerImpuestoXEmpresa",
      "getAduanaUnificar",
      "GuardaCostosFinalesQuote",
    ]),
  },
  async mounted() {
    // this.$store.commit("SET_RESET");
    this.$store.state.spiner = true;
    this.verFlag = false;
    await Promise.all([
      this.getQuote({ id: this.$route.params.id }),
      this.getShipment(),
    ]);

    this.$store.state.mainTitle = `VER  COTIZACIÓN - ${this.$store.state.pricing.nro_quote}`;

    this.$store.state.spiner = false;
    this.verFlag = true;

    // Buscar el tipo de carga y validar que existe
    const tipoCargaItem = this.$store.state.pricing.listShipment.find(
      (v) => v.id == this.$store.state.pricing.datosPrincipales.idtipocarga,
    );

    let idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;

    // Solo cargar puertos si tenemos un id_transport válido
    const promisesToLoad = [
      this.getMarketingList(),
      this.getQuoteStatus(),
      this.getModality(),
      this.getIncoterms(),
      this.getPersonalPricing(),
      this.getMultiplicador(),
      this.cargarProveedores(),
      this.getBegEndList(),
      this.getTipoCostos(),
      this.cargarMasterDetallePercepcionAduana(),
      this.obtenerImpuestoXEmpresa(),
      this.getAduanaUnificar(this.$route.params.id),
      this.getInstructivoId({ id: this.$route.params.id }),
    ];

    // Agregar carga de puertos solo si tenemos id_transport
    if (idTipoCarga) {
      promisesToLoad.unshift(
        this.getPortBegin({
          id_transport: idTipoCarga,
          id: this.$store.state.pricing.datosPrincipales.idorigen,
        }),
        this.getPortEnd({
          id_transport: idTipoCarga,
          id: this.$store.state.pricing.datosPrincipales.iddestino,
        }),
      );
    }
    //
    await Promise.all(promisesToLoad);
    this.mostrarStepS = true;

    this.$store.state.pricing.llenadoCostos = false;
    this.$store.state.pricing.actualizarCostosFlag =
      !this.$store.state.pricing.actualizarCostosFlag;
    this.$store.state.pricing.actualizarComparativa =
      !this.$store.state.pricing.actualizarComparativa;
    setTimeout(async () => {
      await this.generaInstructivo();
    }, 1000);
    this.$store.state.pricing.actualizarCostosFlag = false;
    this.$store.state.pricing.step2 = true;

    // await this.getImpuestos();
    // await this.getCargarMasterDetalleNotasCotizacion();
    // await this._getEntities();

    this.$store.state.pricing.actualizarCostosFlag =
      !this.$store.state.pricing.actualizarCostosFlag;

    this.$store.state.drawer = false;
    this.$forceUpdate;
    if (this.$route.params.step) {
      this.$nextTick(() => {
        setTimeout(() => {
          this.$store.state.pricing.e1 = this.$route.params.step
            ? this.$route.params.step
            : 1;
        }, 100);
      });
    }
    this.getAduanaUnificar(this.$route.params.id);
    setTimeout(async () => {
      let aprobadas = this.$store.state.pricing.opcionCostos.filter(
        (v) => v.selected,
      );
      if (aprobadas.length && !this.$store.state.pricing.aprobadoflag) {
        await this.GuardaCostosFinalesQuote();
      }
    }, 300);
  },
};
</script>

<style></style>
