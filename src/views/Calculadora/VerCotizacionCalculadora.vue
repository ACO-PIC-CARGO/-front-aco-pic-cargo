<template>
  <v-container fluid class="pa-0" v-if="verFlag">
    <v-card elevation="10">
      <v-stepper v-model="$store.state.pricing.e1" non-linear>
        <v-stepper-header>
          <v-stepper-item
            complete
            :value="1"
            title="Datos de la Carga"
            :editable="editable1"
          />

          <v-divider></v-divider>

          <v-stepper-item
            complete
            :value="2"
            title="costos de la Cotización"
            editable
          />
        </v-stepper-header>
        <!-- DATA -->
        <v-stepper-window>
          <v-stepper-window-item :value="1" eager>
            <v-row class="my-1">
              <v-col cols="12" md="6" class="pa-0">
                <DatosPrincipales
                  :mostrarmarketing="false"
                  :mostrarmarestado="false"
                  :mostrarmarejecutivo="false"
                  :mostrarmarpricing="false"
                />
              </v-col>
              <v-col cols="12" md="6" class="pa-0">
                <DatosCarga :mostrarproveedor="false" />
              </v-col>
              <v-col cols="12">
                <Services />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item :value="2" eager>
            <v-row class="my-1">
              <v-col cols="12">
                <Costos />
              </v-col>
            </v-row>
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
        "../../components/folderPricing/VerComponent/DatosPrincipalesComponent.vue"
      )),
    DatosCarga: defineAsyncComponent(() =>
      import(
        "../../components/folderPricing/VerComponent/DatosCargaComponent.vue"
      )),
    Services: defineAsyncComponent(() =>
      import(
        "../../components/folderPricing/VerComponent/ServicesComponent.vue"
      )),
    Costos: defineAsyncComponent(() =>
      import(
        "../../components/folderPricing/VerComponent/DatosCostosComponent.vue"
      )),
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
      "getCotzacionCalculadora",
    ]),
  },
  async mounted() {
    this.verFlag = false;

    await Promise.all([
      this.getCotzacionCalculadora({
        id: this.$route.query.id,
        individualflag: this.$route.query.individualflag == '1' ? true : false,
        esgrupalflag: this.$route.query.esgrupalflag == '1' ? true : false,
      }),
      this.getShipment(),
    ]);

    // this.$store.state.mainTitle = `VER  COTIZACIÓN - ${this.$store.state.pricing.nro_quote}`;

    // this.$store.state.spiner = false;
    this.verFlag = true;

    // Buscar el tipo de carga y validar que existe
    const tipoCargaItem = this.$store.state.pricing.listShipment.find(
      (v) => v.id == this.$store.state.pricing.datosPrincipales.idtipocarga,
    );

    let idTipoCarga = tipoCargaItem ? tipoCargaItem.id_transport : null;

    // Solo cargar puertos si tenemos un id_transport válido
    const promisesToLoad = [
      this.getModality(),
      this.getIncoterms(),

      this.getMultiplicador(),
      this.cargarProveedores(),
      this.getBegEndList(),
      this.getTipoCostos(),
      this.cargarMasterDetallePercepcionAduana(),
    ];

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
    // //
    await Promise.all(promisesToLoad);
    // this.mostrarStepS = true;

    this.$store.state.drawer = false;

    // this.$forceUpdate;

    this.$store.state.spiner = false;
  },
};
</script>

<style></style>
