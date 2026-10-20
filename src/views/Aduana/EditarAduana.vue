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
          :editable="mostrarStepS"
        >
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

        <v-stepper-item :value="3" :editable="mostrarStepS">
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
        <v-stepper-item :value="4" :editable="mostrarStepS">
          <template #title>
            <span v-if="mostrarStepS"> Notas de Costos </span>
            <v-progress-circular
              v-else
              indeterminate
              color="primary"
            ></v-progress-circular>
          </template>
        </v-stepper-item>
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
        </v-stepper-window-item>

        <v-stepper-window-item :value="2" eager>
          <DatosCostosComponent
            :key="indexCostos"
            :mostrarBtn="false"
            @anadirNuevaOpcion="anadirNuevaOpcion"
            @continuarComparativa="continuarComparativa"
            @irANotas="irANotas"
            :mostrarImpuestosEditar="true"
            v-if="mostrarStepS"
          />
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
import DatosPrincipales from "../../components/folderAduana/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderAduana/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderAduana/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderAduana/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderAduana/ComparativaComponent.vue";
import NotasComponent from "../../components/folderAduana/NotasComponent.vue";
import { mapActions, mapState } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";

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
    this.$store.state.spiner = true;
    await Promise.all([
      await this.getAdunaVer({ id: this.$route.params.id }),
      await this.getShipmentAduana(),
    ]);

    this.$store.state.mainTitle = `EDITAR  COTIZACIÓN - ${this.aduanaStore.nro_quote}`;
    this.$store.state.spiner = false;
    this.mostrar = true;
    let idTipoCarga = this.aduanaStore.listShipment.filter(
      (v) => v.id == this.aduanaStore.datosPrincipales.idtipocarga
    )[0].id_transport;
    let opciones = [...this.aduanaStore.opcionCostos];
    let IdProveedor = [];
    opciones.forEach((opcion) => {
      opcion.listCostos.forEach((costo) => {
        if (!IdProveedor.some((v) => v == costo.id_proveedor))
          IdProveedor.push(costo.id_proveedor);
      });
    });

    Promise.all([
      this.getPortBeginAduana({
        id_transport: idTipoCarga,
        id: this.aduanaStore.datosPrincipales.idorigen,
      }),
      this.getPortEndAduana({
        id_transport: idTipoCarga,
        id: this.aduanaStore.datosPrincipales.idorigen,
      }),
      this.getMarketingList(),
      this.getQuoteStatus(),
      this.getCargarEjecutivo(),
      this.getModalityAduana(),
      this.getIncotermsAduana(),
      this.cargarMasterDetallePercepcionAduana(),
      this.getMultiplicadorAduana(),
      this.getTipoCostosAduana(),
    ]);
    this.mostrarStepS = true;
    this.aduanaStore.llenadoCostos = false;
    await Promise.all([
      this._getContainers(),
      this.getBegEndList(),
      this.obtenerCostosAduana(),
      this.getServicesAduana(),
      this.obtenerImpuestoXEmpresa(),
      this.getPortBeginAduana({
        id_transport: idTipoCarga,
        id: this.aduanaStore.datosPrincipales.idorigen,
      }),
      this.getPortEndAduana({
        id_transport: idTipoCarga,
        id: this.aduanaStore.datosPrincipales.idorigen,
      }),

      // this.cargarProveedores(),
    ]);
    this.aduanaStore.llenadoCostos = false;
    this.mostrarStepS = true;
  },
  methods: {
    ...mapActions([
      "cargarProveedores",
      "_getContainers",
    ]),
    ...mapPiniaActions(useAduanaStore, ["getModalityAduana", "getShipmentAduana", "getIncotermsAduana", "getPortBeginAduana", "getPortEndAduana", "getServicesAduana", "getTipoCostosAduana", "obtenerCostosAduana", "getMultiplicadorAduana", "getAdunaVer"]),
    ...mapPiniaActions(usePricingStore, ["resetQuoteNew", "getMarketingList", "getQuoteStatus", "getCargarEjecutivo", "getBegEndList", "getImpuestos", "getCargarMasterDetalleNotasCotizacion", "registrarQuote"]),
    ...mapPiniaActions(useEnterprisesStore, ["obtenerImpuestoXEmpresa"]),
    ...mapPiniaActions(useMasterusuariosStore, ["cargarMasterDetallePercepcionAduana"]),
    async recargar() {
      await this.recargarServicios();
      await this.getTipoCostosAduana();
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
      let services = [...this.aduanaStore.preServices];
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.aduanaStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.aduanaStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.aduanaStore.datosPrincipales.idtipocarga.id
      );
      this.aduanaStore.listServices = serv;
      await this.getTipoCostosAduana();
    },
    recargarServicios() {
      let services = [...this.aduanaStore.preServices];

      if (services.length == 0) {
        return;
      }
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.aduanaStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.aduanaStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            (typeof this.aduanaStore.datosPrincipales.idtipocarga ===
            "object"
              ? this.aduanaStore.datosPrincipales.idtipocarga.id
              : this.aduanaStore.datosPrincipales.idtipocarga)
      );

      let IdServices = serv.map((v) => v.id);
      this.aduanaStore.listServices
        .filter((v) => !!v.id)
        .forEach((servicios) => {
          if (!IdServices.includes(servicios.id)) {
            let index = this.aduanaStore.listServices.findIndex(
              (v) => v.code_service == servicios.code_service
            );
            this.aduanaStore.listServices.splice(index, 1);
          }
        });

      IdServices = this.aduanaStore.listServices.map(
        (v) => v.code_service
      );

      serv.forEach((servicios) => {
        if (!IdServices.includes(servicios.code_service)) {
          this.aduanaStore.listServices.push(servicios);
        }
      });
    },
    async activarLlenadoCostos() {
      this.$store.state.spiner = true;
      await this.getMultiplicadorAduana();
      await this.getImpuestos();

      let codeServicesActivos = new Set(
        this.aduanaStore.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service)
      );

      let costos = [...this.aduanaStore.preCostos];

      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.aduanaStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.aduanaStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.aduanaStore.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(Number(v.code_service))
      );

      let idContainer = [];
      if (this.aduanaStore.datosPrincipales.containers.length > 0) {
        idContainer = this.aduanaStore.datosPrincipales.containers.map(
          (v) => v.id
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

      this.aduanaStore.opcionCostos[0].listCostos = cDuplicado;
      this.aduanaStore.opcionCostos[0].listImpuestos =
        this.aduanaStore.listImpuestos;
      this.aduanaStore.opcionCostos[0].listNotasQuote =
        this.aduanaStore.listNotasQuote;

      this.step = 2;
      this.editableStep2 = true;
      this.$store.state.spiner = false;
    },
    anadirNuevaOpcion(nro_propuesta) {
      // this.$store.state.spiner = true;
      let codeServicesActivos = new Set(
        this.aduanaStore.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service)
      );
      let costos = [...this.aduanaStore.preCostos];
      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.aduanaStore.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.aduanaStore.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.aduanaStore.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(Number(v.code_service))
      );
      let idContainer = [];
      if (this.aduanaStore.datosPrincipales.containers.length > 0) {
        idContainer = this.aduanaStore.datosPrincipales.containers.map(
          (v) => v.id
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
        listImpuestos: this.aduanaStore.listImpuestos,
        listNotasQuote: this.aduanaStore.listNotasQuote,
      };
      this.aduanaStore.opcionCostos.push(newPropuesta);
      // this.$store.state.spiner = false;
    },
    async recargarCostos(event = true) {
      this.$store.state.spiner = true;
      await this.getTipoCostosAduana();
      await this.getMultiplicadorAduana();

      let codeServicesActivos = new Set(
        this.aduanaStore.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service)
      );

      let id_shipment = this.aduanaStore.datosPrincipales.idtipocarga;
      if (typeof id_shipment === "object") {
        id_shipment = id_shipment.id;
      }

      let c = this.aduanaStore.preCostos.filter(
        (v) =>
          v.id_incoterms ===
            this.aduanaStore.datosPrincipales.idincoterms &&
          v.id_modality ===
            this.aduanaStore.datosPrincipales.idsentido &&
          v.id_shipment === id_shipment &&
          codeServicesActivos.has(Number(v.code_service))
      );

      let idContainer = [];
      if (this.aduanaStore.datosPrincipales.containers.length > 0) {
        idContainer = this.aduanaStore.datosPrincipales.containers.map(
          (v) => v.id_containers
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

      this.aduanaStore.opcionCostos.forEach((opcion) => {
        let listCostosActual = opcion.listCostos || [];

        let costosValidos = listCostosActual.filter(
          (costo) =>
            !costo.code_cost ||
            cDuplicado.some((nuevo) => nuevo.code_cost === costo.code_cost)
        );

        let nuevosCostos = cDuplicado
          .filter(
            (nuevo) =>
              !costosValidos.some(
                (costo) =>
                  costo.code_cost === nuevo.code_cost &&
                  costo.id_multiplicador === nuevo.id_multiplicador
              )
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

      this.aduanaStore.opcionCostos = newOpciones;

      this.aduanaStore.llenadoCostos = false;
      this.$forceUpdate();
      this.indexCostos++;
      this.$store.state.spiner = false;
      let isFCL = this.aduanaStore.listShipment.some(
        (v) =>
          v.id ==
            (this.aduanaStore.datosPrincipales.idtipocarga.id
              ? this.aduanaStore.datosPrincipales.idtipocarga.id
              : this.aduanaStore.datosPrincipales.idtipocarga) &&
          v.code == "FCL"
      );
      Swal.fire({
        icon: "success",
        title: "Actualización Correcta.",
        text: "Se han activado todas las opciones, actualice los montos de los nuevos registros, y los multiplicadores respectivo.",
        allowEnterKey: false,
        allowOutsideClick: false,
      }).then((res) => {
        this.aduanaStore.actualizarComparativa =
          !this.aduanaStore.actualizarComparativa;
        if (res.isConfirmed) {
          if (isFCL && event) {
            this.abrirModalContenedorRecargar =
              !this.abrirModalContenedorRecargar;
          }
        }
      });
      // let isFCL = this.$store.state.aduana.listShipment.filter(v=>v.id==)
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
    ...mapStores(useAduanaStore),
    ...mapState(["itemsShipment"]),
  },
  watch: {
    step() {
      this.aduanaStore.step = this.step;
    },
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
