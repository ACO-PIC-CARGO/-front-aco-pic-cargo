<template>
  <v-container fluid class="pt-0 px-0" v-if="mostrar">
    <v-stepper v-model="step" class="pt-0">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1" editable>
          Datos de la Carga
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="step > 2" step="2" :editable="mostrarStepS">
          <span> Costos de la Cotización </span>
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3" :editable="mostrarStepS">
          <span> Comparativa </span>
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="4" :editable="mostrarStepS">
          <span> Notas de Costos </span>
        </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-row>
            <v-col cols="12" md="6" class="pt-0">
              <v-row>
                <v-col cols="12" class="my-0 py-0">
                  <DatosPrincipales
                    @recargarServiciosCostos="recargar"
                    @activarDatosCarga="activarDatosCarga"
                    :mostrarBtn="false"
                    :EditableFlag="false"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" md="6" class="my-0 py-0">
              <DatosCargaComponent
                @activarServicios="activarServicios"
                @recargarCostos="recargarCostos"
                :mostrarBtn="false"
                :abrirModalContenedorRecargar="abrirModalContenedorRecargar"
              />
            </v-col>
            <v-col cols="12">
              <ServicesComponent
                @activarLlenadoCostos="activarLlenadoCostos()"
                @recargarCostos="recargarCostos()"
                :mostrarBtn="false"
              />
            </v-col>
          </v-row>

          <!-- <v-btn color="primary" @click="step = 2"> Continue </v-btn>

          <v-btn text> Cancel </v-btn> -->
        </v-stepper-content>

        <v-stepper-content step="2">
          <DatosCostosComponent
            :key="indexCostos"
            :mostrarBtn="false"
            @anadirNuevaOpcion="anadirNuevaOpcion"
            @continuarComparativa="continuarComparativa"
            @irANotas="irANotas"
            :mostrarImpuestosEditar="true"
            v-if="mostrarStepS"
          />
          <v-progress-linear
            color="light-blue"
            height="10"
            value="10"
            striped
            v-else
          ></v-progress-linear>
        </v-stepper-content>

        <v-stepper-content step="3">
          <ComparativaComponent
            @irVentaCliente="irVentaCliente"
            v-if="mostrarStepS"
          />
        </v-stepper-content>
        <v-stepper-content step="4">
          <NotasComponent :editable="editableStep4" v-if="mostrarStepS" />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-container>
</template>

<script>
import Swal from "sweetalert2";
import DatosPrincipales from "../../components/folderPricing/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderPricing/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderPricing/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderPricing/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderPricing/ComparativaComponent.vue";
import NotasComponent from "../../components/folderPricing/NotasComponent.vue";
import { mapActions, mapState } from "vuex";

export default {
  components: {
    DatosPrincipales,
    DatosCargaComponent,
    ServicesComponent,
    DatosCostosComponent,
    ComparativaComponent,
    NotasComponent,
  },
  data() {
    return {
      step: 1,
      mostrarStepS: false,
      DatosCargaComponentFlag: false,
      ServicesComponentFlag: false,
      editableStep2: false,
      editableStep4: false,
      recargarSegmentos: false,
      indexCostos: 0,
      mostrar: false,
      abrirModalContenedorRecargar: false,
    };
  },
  async mounted() {
    this.$store.state.pricing.actualizarCostosFlag =
      !this.$store.state.pricing.actualizarCostosFlag;

    this.$store.commit("SET_RESET");
    this.$store.state.spiner = true;
    await Promise.all([
      this.getQuote({ id: this.$route.params.id }),
      this.getShipment(),
    ]);

    this.$store.state.mainTitle = `EDITAR  COTIZACIÓN - ${this.$store.state.pricing.nro_quote}`;

    let idTipoCarga = this.$store.state.pricing.listShipment.filter(
      (v) => v.id == this.$store.state.pricing.datosPrincipales.idtipocarga,
    )[0].id_transport;
    //
    let opciones = [...this.$store.state.pricing.opcionCostos];
    let IdProveedor = [];
    opciones.forEach((opcion) => {
      opcion.listCostos.forEach((costo) => {
        if (!IdProveedor.some((v) => v == costo.id_proveedor))
          IdProveedor.push(costo.id_proveedor);
      });
    });

    this.$store.state.spiner = false;
    this.mostrar = true;

    // obtenerProveedorPricing
    await Promise.all([
      this.obtenerProveedorPricing({
        id: IdProveedor.join(","),
        search: null,
      }),
      this.getMarketingList(),
      this.getQuoteStatus(),
      this.getCargarEjecutivo(),
      this.getModality(),
      this.getIncoterms(),

      this.cargarMasterDetallePercepcionAduana(),
      this.getMultiplicador(),
      this.getTipoCostos(),
      this._getContainers(),
      this.getBegEndList(),
      this.obtenerCostosPricing(),
      this.getServices(),
      this.obtenerImpuestoXEmpresa(),
      this.getPortBegin({
        id_transport: idTipoCarga,
        id: this.$store.state.pricing.datosPrincipales.idorigen,
      }),
      this.getPortEnd({
        id_transport: idTipoCarga,
        id: this.$store.state.pricing.datosPrincipales.iddestino,
      }),
    ]);

    this.mostrarStepS = true;
    this.$store.state.pricing.llenadoCostos = false;

    await Promise.all([this.getServices(), this.obtenerCostosPricing()]);

    this.$store.state.pricing.actualizarComparativa =
      !this.$store.state.pricing.actualizarComparativa;
  },
  methods: {
    ...mapActions([
      "obtenerImpuestoXEmpresa",
      "getMarketingList",
      "getQuoteStatus",
      "obtenerProveedorPricing",
      "getModality",
      "getShipment",
      "getIncoterms",
      "getCargarEjecutivo",
      "getQuote",
      "getServices",
      "getBegEndList",
      "getTipoCostos",
      "obtenerCostosPricing",
      "getMultiplicador",
      "getImpuestos",
      "getCargarMasterDetalleNotasCotizacion",
      "cargarProveedores",
      "getImpuestos",
      "obtenerImpuestoXEmpresa",
      "getPortBegin",
      "getPortEnd",
      "_getContainers",
      "cargarMasterDetallePercepcionAduana",
      "getServices",
      "obtenerCostosPricing",
    ]),
    async recargar() {
      await this.recargarServicios();
      await this.getTipoCostos();
      setTimeout(async () => {
        await this.recargarCostos();
      }, 1000);
    },
    continuarComparativa() {
      this.step = 3;
    },
    activarDatosCarga() {
      this.DatosCargaComponentFlag = true;
    },
    async activarServicios() {
      this.ServicesComponentFlag = true;
      let services = [...this.$store.state.pricing.preServices];
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga.id,
      );
      this.$store.state.pricing.listServices = serv;
      await this.getTipoCostos();
    },
    recargarServicios() {
      let services = [...this.$store.state.pricing.preServices];

      if (services.length == 0) {
        return;
      }
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            (typeof this.$store.state.pricing.datosPrincipales.idtipocarga ===
            "object"
              ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
              : this.$store.state.pricing.datosPrincipales.idtipocarga),
      );

      let IdServices = serv.map((v) => v.id);
      this.$store.state.pricing.listServices
        .filter((v) => !!v.id)
        .forEach((servicios) => {
          if (!IdServices.includes(servicios.id)) {
            let index = this.$store.state.pricing.listServices.findIndex(
              (v) => v.code_service == servicios.code_service,
            );
            this.$store.state.pricing.listServices.splice(index, 1);
          }
        });

      IdServices = this.$store.state.pricing.listServices.map(
        (v) => v.code_service,
      );

      serv.forEach((servicios) => {
        if (!IdServices.includes(servicios.code_service)) {
          this.$store.state.pricing.listServices.push(servicios);
        }
      });
    },
    async activarLlenadoCostos() {
      this.$store.state.spiner = true;
      await this.getMultiplicador();
      await this.getImpuestos();

      let codeServicesActivos = new Set(
        this.$store.state.pricing.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );

      let costos = [...this.$store.state.pricing.preCostos];

      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(Number(v.code_service)),
      );

      let idContainer = [];
      if (this.$store.state.pricing.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.pricing.datosPrincipales.containers.map(
          (v) => v.id,
        );
      }

      let cFiltrado = c.filter((v) => {
        if (v.escontenedorflag) {
          return idContainer.includes(v.id_container);
        }
        return true;
      });

      let codeCost = [69, 114, 105, 39];

      let cDuplicado = cFiltrado.flatMap((item) => {
        if (codeCost.includes(item.code_cost)) {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
          ];
        } else {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
            {
              ...item,
              esopcionflag: 0,
              esventaflag: 1,
              status: true,
              cif: 0,
              seguro: 0,
            },
          ];
        }
      });

      this.$store.state.pricing.opcionCostos[0].listCostos = cDuplicado;
      this.$store.state.pricing.opcionCostos[0].listImpuestos =
        this.$store.state.pricing.listImpuestos;
      this.$store.state.pricing.opcionCostos[0].listNotasQuote =
        this.$store.state.pricing.listNotasQuote;

      this.step = 2;
      this.editableStep2 = true;
      this.$store.state.spiner = false;
    },
    anadirNuevaOpcion(nro_propuesta) {
      // this.$store.state.spiner = true;
      let codeServicesActivos = new Set(
        this.$store.state.pricing.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );
      let costos = [...this.$store.state.pricing.preCostos];
      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.pricing.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(Number(v.code_service)),
      );
      let idContainer = [];
      if (this.$store.state.pricing.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.pricing.datosPrincipales.containers.map(
          (v) => v.id,
        );
      }
      let cFiltrado = c.filter((v) => {
        if (v.escontenedorflag) {
          return idContainer.includes(v.id_container);
        }
        return true;
      });

      let codeCost = [69, 114, 105, 39];

      let cDuplicado = cFiltrado.flatMap((item) => {
        if (codeCost.includes(item.code_cost)) {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
          ];
        } else {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
            {
              ...item,
              esopcionflag: 0,
              esventaflag: 1,
              status: true,
              cif: 0,
              seguro: 0,
            },
          ];
        }
      });
      let newPropuesta = {
        nro_propuesta: nro_propuesta,
        date_end: "",
        tiempo_transito: 0,
        listCostos: cDuplicado,
        listImpuestos: this.$store.state.pricing.listImpuestos,
        listNotasQuote: this.$store.state.pricing.listNotasQuote,
      };
      this.$store.state.pricing.opcionCostos.push(newPropuesta);
      // this.$store.state.spiner = false;
    },
    async recargarCostos(event = true) {
      this.$store.state.spiner = true;
      await this.getTipoCostos();
      await this.getMultiplicador();

      let codeServicesActivos = new Set(
        this.$store.state.pricing.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );

      let id_shipment = this.$store.state.pricing.datosPrincipales.idtipocarga;
      if (typeof id_shipment === "object") {
        id_shipment = id_shipment.id;
      }

      let c = this.$store.state.pricing.preCostos.filter(
        (v) =>
          v.id_incoterms ===
            this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.id_modality ===
            this.$store.state.pricing.datosPrincipales.idsentido &&
          v.id_shipment === id_shipment &&
          codeServicesActivos.has(Number(v.code_service)),
      );

      let idContainer = [];
      if (this.$store.state.pricing.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.pricing.datosPrincipales.containers.map(
          (v) => v.id_containers,
        );
      }

      let cFiltrado = c.filter((v) => {
        if (v.escontenedorflag) {
          return idContainer.includes(v.id_container);
        }
        return true;
      });

      let codeCost = [69, 114, 105, 39];

      let cDuplicado = cFiltrado.flatMap((item) => {
        if (codeCost.includes(item.code_cost)) {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: 1,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
          ];
        } else {
          return [
            {
              ...item,
              esopcionflag: 1,
              esventaflag: 0,
              status: 1,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
            {
              ...item,
              esopcionflag: 0,
              esventaflag: 1,
              status: 1,
              cif: 0,
              seguro: 0,
            },
          ];
        }
      });
      let newOpciones = [];

      this.$store.state.pricing.opcionCostos.forEach((opcion) => {
        let listCostosActual = opcion.listCostos || [];

        let costosValidos = listCostosActual.filter(
          (costo) =>
            !costo.code_cost ||
            cDuplicado.some((nuevo) => nuevo.code_cost === costo.code_cost),
        );

        let nuevosCostos = cDuplicado
          .filter(
            (nuevo) =>
              !costosValidos.some(
                (costo) =>
                  costo.code_cost === nuevo.code_cost &&
                  costo.id_multiplicador === nuevo.id_multiplicador,
              ),
          )
          .map((nuevo) => ({
            ...nuevo,
            id: 0,
          }));
        console.log("nuevosCostos", nuevosCostos);
        let Propuesta = {
          ...opcion,
          listCostos: [...costosValidos, ...nuevosCostos],
          listImpuestos: opcion.listImpuestos,
          listNotasQuote: opcion.listNotasQuote,
          selected: true,
        };

        newOpciones.push(Propuesta);
      });

      this.$set(this.$store.state.pricing, "opcionCostos", newOpciones);

      this.$store.state.pricing.llenadoCostos = false;
      this.$forceUpdate();
      this.indexCostos++;
      this.$store.state.spiner = false;
      let isFCL = this.$store.state.pricing.listShipment.some(
        (v) =>
          v.id ==
            (this.$store.state.pricing.datosPrincipales.idtipocarga.id
              ? this.$store.state.pricing.datosPrincipales.idtipocarga.id
              : this.$store.state.pricing.datosPrincipales.idtipocarga) &&
          v.code == "FCL",
      );
      Swal.fire({
        icon: "success",
        title: "Actualización Correcta.",
        text: "Se han activado todas las opciones, actualice los montos de los nuevos registros, y los multiplicadores respectivo.",
        allowEnterKey: false,
        allowOutsideClick: false,
      }).then((res) => {
        this.$store.state.pricing.actualizarComparativa =
          !this.$store.state.pricing.actualizarComparativa;
        if (res.isConfirmed) {
          if (isFCL && event) {
            this.abrirModalContenedorRecargar =
              !this.abrirModalContenedorRecargar;
          }
        }
      });
      // let isFCL = this.$store.state.pricing.listShipment.filter(v=>v.id==)
    },
    irVentaCliente() {
      this.step = 2;
    },
    irANotas() {
      this.step = 4;
      this.editableStep4 = true;
    },
  },
  computed: {
    ...mapState(["itemsShipment"]),
  },
  watch: {
    step() {
      this.$store.state.pricing.step = this.step;
    },
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
