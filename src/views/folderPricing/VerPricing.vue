<template>
  <v-container fluid class="pa-0" v-if="verFlag">
    <v-card elevation="5">
      <v-stepper v-model="pricingStore.e1" non-linear>
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

          <v-divider></v-divider>
          <v-stepper-item :value="3" title="Comparativa" complete editable />
          <v-divider></v-divider>
          <v-stepper-item
            complete
            :value="4"
            title="Notas de Costos"
            editable
          />
          <v-divider></v-divider>

          <v-stepper-item
            complete
            :value="5"
            title="Enviar a Operaciones"
            editable
          />
          <v-stepper-item
            complete
            :value="6"
            title="Unificar Cotización"
            editable
          />
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
                <Costos />
              </v-col>
            </v-row>
          </v-stepper-window-item>
          <v-stepper-window-item :value="3" eager>
            <Comparativa />
          </v-stepper-window-item>
          <v-stepper-window-item :value="4" eager>
            <Notas />
          </v-stepper-window-item>
          <v-stepper-window-item :value="5" eager>
            <Instructivo />
          </v-stepper-window-item>
          <v-stepper-window-item :value="6" eager>
            <UnificarCotizacion />
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
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
    Notas: defineAsyncComponent(() =>
      import("../../components/folderPricing/VerComponent/NotasComponent.vue")),
    Instructivo: defineAsyncComponent(() =>
      import(
        "../../components/folderPricing/VerComponent/InstructivoComponent.vue"
      )),
    Comparativa: defineAsyncComponent(() =>
      import(
        "@/components/folderPricing/VerComponent/ComparativaComponent.vue"
      )),
    UnificarCotizacion: defineAsyncComponent(() =>
      import("@/components/folderPricing/VerComponent/UnificarCotizacion.vue")),
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
  computed: {
    ...mapStores(usePricingStore),
  },
  methods: {
    ...mapActions([
      "_getEntities",
      "_getRole",
      "cargarProveedores",
      "_getEntitiesCliente",
      "getAduanaUnificar",
    ]),
    ...mapPiniaActions(usePricingStore, ["getItemsServicesDetails", "getMarketingList", "getQuoteStatus", "getModulesEntities", "getModality", "getShipment", "getIncoterms", "getModuleRole", "getCargarMasterDetalleNotasCotizacion", "getImpuestos", "getQuote", "getPortBegin", "getPortEnd", "getMultiplicador", "getInstructivoId", "generaInstructivo", "getBegEndList", "getTipoCostos", "getPersonalPricing", "GuardaCostosFinalesQuote"]),
    ...mapPiniaActions(useEnterprisesStore, ["obtenerImpuestoXEmpresa"]),
    ...mapPiniaActions(useMasterusuariosStore, ["cargarMasterDetallePercepcionAduana"]),
  },
  async mounted() {
    // this.$store.commit("SET_RESET");
    this.$store.state.spiner = true;
    this.verFlag = false;
    await Promise.all([
      this.getQuote({ id: this.$route.params.id }),
      this.getShipment(),
    ]);

    this.$store.state.mainTitle = `VER  COTIZACIÓN - ${this.pricingStore.nro_quote}`;

    this.$store.state.spiner = false;
    this.verFlag = true;

    // Buscar el tipo de carga y validar que existe
    const tipoCargaItem = this.pricingStore.listShipment.find(
      (v) => v.id == this.pricingStore.datosPrincipales.idtipocarga,
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
          id: this.pricingStore.datosPrincipales.idorigen,
        }),
        this.getPortEnd({
          id_transport: idTipoCarga,
          id: this.pricingStore.datosPrincipales.iddestino,
        }),
      );
    }
    //
    await Promise.all(promisesToLoad);
    this.mostrarStepS = true;

    this.pricingStore.llenadoCostos = false;
    this.pricingStore.actualizarCostosFlag =
      !this.pricingStore.actualizarCostosFlag;
    this.pricingStore.actualizarComparativa =
      !this.pricingStore.actualizarComparativa;
    setTimeout(async () => {
      await this.generaInstructivo();
    }, 1000);
    this.pricingStore.actualizarCostosFlag = false;
    this.pricingStore.step2 = true;

    // await this.getImpuestos();
    // await this.getCargarMasterDetalleNotasCotizacion();
    // await this._getEntities();

    this.pricingStore.actualizarCostosFlag =
      !this.pricingStore.actualizarCostosFlag;

    this.$store.state.drawer = false;
    this.$forceUpdate;
    if (this.$route.params.step) {
      this.$nextTick(() => {
        setTimeout(() => {
          this.pricingStore.e1 = this.$route.params.step
            ? Number(this.$route.params.step)
            : 1;
        }, 100);
      });
    }
    this.getAduanaUnificar(this.$route.params.id);
    setTimeout(async () => {
      let aprobadas = this.pricingStore.opcionCostos.filter(
        (v) => v.selected,
      );
      if (aprobadas.length && !this.pricingStore.aprobadoflag) {
        await this.GuardaCostosFinalesQuote();
      }
    }, 300);
  },
};
</script>

<style></style>
