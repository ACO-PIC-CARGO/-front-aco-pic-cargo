<template>
  <v-container fluid class="pt-0 px-0" v-if="mostrar">
    <v-stepper v-model="step" class="pt-0">
      <v-stepper-header>
        <v-stepper-item
          :complete="step > 1"
          :value="1"
          title="Datos de la Carga"
          editable
        />

        <v-divider></v-divider>

        <v-stepper-item
          :complete="step > 2"
          :value="2"
          title="Costos de la Cotización"
          :editable="mostrarStepS"
        />

        <v-divider></v-divider>

        <v-stepper-item
          :value="3"
          title="Comparativa"
          :editable="mostrarStepS"
        />
        <v-divider></v-divider>
        <v-stepper-item
          :value="4"
          title="Notas de Costos"
          :editable="mostrarStepS"
        />
      </v-stepper-header>

      <v-stepper-window>
        <v-stepper-window-item :value="1" eager>
          <v-row class="my-1">
            <v-col cols="12" md="6" class="pt-0">
              <v-row>
                <v-col cols="12" class="my-0 py-0">
                  <DatosPrincipales
                    @recargarServiciosCostos="recargar"
                    @activarDatosCarga="activarDatosCarga"
                    :mostrarBtn="false"
                    :editable-flag="false"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" md="6" class="my-0 py-0">
              <DatosCargaComponent
                @activarServicios="activarServicios"
                @recargarCostos="recargarCostos"
                @recargarGrupalFlag="recargarGrupalFlag"
                :mostrarBtn="false"
                :abrirModalContenedorRecargar="abrirModalContenedorRecargar"
                :ServicesComponentFlag="true"
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
        </v-stepper-window-item>

        <v-stepper-window-item :value="2" eager v-if="mostrarCostos">
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
            model-value="10"
            striped
            v-else
          ></v-progress-linear>
        </v-stepper-window-item>

        <v-stepper-window-item :value="3" eager>
          <ComparativaComponent
            @irVentaCliente="irVentaCliente"
            v-if="mostrarStepS"
          />
        </v-stepper-window-item>
        <v-stepper-window-item :value="4" eager>
          <NotasComponent :editable="editableStep4" v-if="mostrarStepS" />
        </v-stepper-window-item>
      </v-stepper-window>
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useTownStore } from "@/stores/town";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useProveedorStore } from "@/stores/proveedor";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePricingStore } from "@/stores/pricing";

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
      mostrarCostos: true,
    };
  },
  async mounted() {
    this.pricingStore.actualizarCostosFlag =
      !this.pricingStore.actualizarCostosFlag;

    this.pricingStore.SET_RESET();
    this.$store.state.spiner = true;
    await Promise.all([
      this.getQuote({ id: this.$route.params.id }),
      this.getShipment(),
    ]);

    this.$store.state.mainTitle = `EDITAR  COTIZACIÓN - ${this.pricingStore.nro_quote}`;

    let idTransport = this.pricingStore.listShipment.filter(
      (v) => v.id == this.pricingStore.datosPrincipales.idtipocarga,
    )[0].id_transport;
    //
    let opciones = [...this.pricingStore.opcionCostos];
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
        id_transport: idTransport,
        id: this.pricingStore.datosPrincipales.idorigen,
      }),
      this.getPortEnd({
        id_transport: idTransport,
        id: this.pricingStore.datosPrincipales.iddestino,
      }),
      this.getCargarMasterDetalleNotasCotizacion(),
    ]);

    this.mostrarStepS = true;
    this.pricingStore.llenadoCostos = false;
    let idTipoCarga =
      typeof this.pricingStore.datosPrincipales.idtipocarga === "object"
        ? this.pricingStore.datosPrincipales.idtipocarga.id
        : this.pricingStore.datosPrincipales.idtipocarga;
    await Promise.all([
      this.getServices(),
      this.obtenerCostosPricing(),
      this.obtenerFleteCalculadora({
        shipment: this.pricingStore.listShipment.find(
          (v) => v.id == idTipoCarga,
        ).code,
        puerto_origen: this.pricingStore.listPortBegin.find(
          (v) =>
            v.id_port == this.pricingStore.datosPrincipales.idorigen,
        ).puerto,
        puerto_destino: this.pricingStore.listPortEnd.find(
          (v) =>
            v.id_port == this.pricingStore.datosPrincipales.iddestino,
        ).puerto,
        volumen: this.pricingStore.datosPrincipales.volumen,
        peso: this.pricingStore.datosPrincipales.peso,
      }),
      this.getTransporte({
        shimpent: this.pricingStore.listShipment.find(
          (v) => v.id == idTipoCarga,
        ).code,
        id_modality: this.pricingStore.datosPrincipales.idsentido,
        id_pais: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_pais,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      }),
    ]);
    const puertoDestino = this.pricingStore.listPortEnd.find(
      (puerto) =>
        String(puerto.id_port) ===
        String(this.pricingStore.datosPrincipales.iddestino),
    );
    if (puertoDestino) {
      await this.cargarTownParaPricing({ id_pais: puertoDestino.id_pais });
    }

    this.pricingStore.actualizarComparativa =
      !this.pricingStore.actualizarComparativa;
  },
  methods: {
    ...mapActions([
      "cargarProveedores",
      "_getContainers",
    ]),
    ...mapPiniaActions(usePricingStore, ["getMarketingList", "getQuoteStatus", "getModality", "getShipment", "getIncoterms", "getCargarEjecutivo", "getQuote", "getServices", "getBegEndList", "getTipoCostos", "obtenerCostosPricing", "getMultiplicador", "getImpuestos", "getCargarMasterDetalleNotasCotizacion", "getPortBegin", "getPortEnd"]),
    ...mapPiniaActions(useCalculadorasStore, ["obtenerFleteCalculadora", "getTransporte"]),
    ...mapPiniaActions(useProveedorStore, ["obtenerProveedorPricing"]),
    ...mapPiniaActions(useEnterprisesStore, ["obtenerImpuestoXEmpresa"]),
    ...mapPiniaActions(useMasterusuariosStore, ["cargarMasterDetallePercepcionAduana"]),
    ...mapPiniaActions(useTownStore, ["cargarTownParaPricing"]),
    async recargar() {
      await this.recargarServicios();
      await this.getTipoCostos();
      setTimeout(async () => {
        await this.recargarCostos();
      }, 1000);
    },
    recargarGrupalFlag() {
      this.mostrarCostos = false;
      setTimeout(async () => {
        this.mostrarCostos = true;
      }, 100);
    },
    continuarComparativa() {
      this.step = 3;
    },
    activarDatosCarga() {
      this.DatosCargaComponentFlag = true;
    },
    async activarServicios() {
      this.ServicesComponentFlag = true;
      let services = [...this.pricingStore.preServices];
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.pricingStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.pricingStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.pricingStore.datosPrincipales.idtipocarga.id,
      );
      this.pricingStore.listServices = serv;
      await this.getTipoCostos();
    },
    recargarServicios() {
      let services = [...this.pricingStore.preServices];

      if (services.length == 0) {
        return;
      }
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.pricingStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.pricingStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            (typeof this.pricingStore.datosPrincipales.idtipocarga ===
            "object"
              ? this.pricingStore.datosPrincipales.idtipocarga.id
              : this.pricingStore.datosPrincipales.idtipocarga),
      );

      let IdServices = serv.map((v) => v.id);
      this.pricingStore.listServices
        .filter((v) => !!v.id)
        .forEach((servicios) => {
          if (!IdServices.includes(servicios.id)) {
            let index = this.pricingStore.listServices.findIndex(
              (v) => v.code_service == servicios.code_service,
            );
            this.pricingStore.listServices.splice(index, 1);
          }
        });

      IdServices = this.pricingStore.listServices.map(
        (v) => v.code_service,
      );

      serv.forEach((servicios) => {
        if (!IdServices.includes(servicios.code_service)) {
          this.pricingStore.listServices.push(servicios);
        }
      });
    },
    async activarLlenadoCostos() {
      this.$store.state.spiner = true;
      await this.getMultiplicador();
      await this.getImpuestos();

      let codeServicesActivos = new Set(
        this.pricingStore.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );

      let costos = [...this.pricingStore.preCostos];

      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.pricingStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.pricingStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.pricingStore.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(Number(v.code_service)),
      );

      let idContainer = [];
      if (this.pricingStore.datosPrincipales.containers.length > 0) {
        idContainer = this.pricingStore.datosPrincipales.containers.map(
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
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
          ];
        }
      });

      this.pricingStore.opcionCostos[0].listCostos = cDuplicado;
      this.pricingStore.opcionCostos[0].listImpuestos =
        this.pricingStore.listImpuestos;
      this.pricingStore.opcionCostos[0].listNotasQuote =
        this.pricingStore.listNotasQuote;

      this.step = 2;
      this.editableStep2 = true;
      this.$store.state.spiner = false;
    },
    anadirNuevaOpcion(nro_propuesta) {
      // this.$store.state.spiner = true;
      let codeServicesActivos = new Set(
        this.pricingStore.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );
      let costos = [...this.pricingStore.preCostos];
      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.pricingStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.pricingStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.pricingStore.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(Number(v.code_service)),
      );
      let idContainer = [];
      if (this.pricingStore.datosPrincipales.containers.length > 0) {
        idContainer = this.pricingStore.datosPrincipales.containers.map(
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
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
          ];
        }
      });
      let newPropuesta = {
        nro_propuesta: nro_propuesta,
         date_end: moment().add(7, 'days').format("YYYY-MM-DD"),
        tiempo_transito: 35,
        listCostos: cDuplicado,
        listImpuestos: this.pricingStore.listImpuestos,
        listNotasQuote: this.pricingStore.listNotasQuote,
      };
      this.pricingStore.opcionCostos.push(newPropuesta);
      // this.$store.state.spiner = false;
    },
    async recargarCostos(event = true) {
      this.$store.state.spiner = true;
      await this.getTipoCostos();
      await this.getMultiplicador();

      let codeServicesActivos = new Set(
        this.pricingStore.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service),
      );

      let id_shipment = this.pricingStore.datosPrincipales.idtipocarga;
      if (typeof id_shipment === "object") {
        id_shipment = id_shipment.id;
      }

      let c = this.pricingStore.preCostos.filter(
        (v) =>
          v.id_incoterms ===
            this.pricingStore.datosPrincipales.idincoterms &&
          v.id_modality ===
            this.pricingStore.datosPrincipales.idsentido &&
          v.id_shipment === id_shipment &&
          codeServicesActivos.has(Number(v.code_service)),
      );

      let idContainer = [];
      if (this.pricingStore.datosPrincipales.containers.length > 0) {
        idContainer = this.pricingStore.datosPrincipales.containers.map(
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
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
          ];
        }
      });
      let newOpciones = [];

      this.pricingStore.opcionCostos.forEach((opcion) => {
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

        let Propuesta = {
          ...opcion,
          listCostos: [...costosValidos, ...nuevosCostos],
          listImpuestos: opcion.listImpuestos,
          listNotasQuote: opcion.listNotasQuote,
          selected: true,
        };

        newOpciones.push(Propuesta);
      });

      this.pricingStore.opcionCostos = newOpciones;

      this.pricingStore.llenadoCostos = false;
      this.$forceUpdate();
      this.indexCostos++;
      this.$store.state.spiner = false;
      let isFCL = this.pricingStore.listShipment.some(
        (v) =>
          v.id ==
            (this.pricingStore.datosPrincipales.idtipocarga.id
              ? this.pricingStore.datosPrincipales.idtipocarga.id
              : this.pricingStore.datosPrincipales.idtipocarga) &&
          v.code == "FCL",
      );
      Swal.fire({
        icon: "success",
        title: "Actualización Correcta.",
        text: "Se han activado todas las opciones, actualice los montos de los nuevos registros, y los multiplicadores respectivo.",
        allowEnterKey: false,
        allowOutsideClick: false,
      }).then((res) => {
        this.pricingStore.actualizarComparativa =
          !this.pricingStore.actualizarComparativa;
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
    ...mapStores(usePricingStore),
    ...mapState(["itemsShipment"]),
  },
  watch: {
    step() {
      this.pricingStore.step = this.step;
    },
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
