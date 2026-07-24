<template>
  <v-container fluid class="pt-0 px-0">
    <v-stepper v-model="step" class="pt-0">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1" editable>
          Datos de la Carga
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step :complete="step > 2" step="2" :editable="editableStep2">
          costos de la Cotización
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3"> Comparativa </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="4"> Notas de Costos </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <v-row>
            <!-- <v-col cols="12" md="6" class="pt-0"> -->
            <v-col cols="12" md="6" class="pt-0">
              <v-row>
                <v-col cols="12" class="my-0 py-0">
                  <DatosPrincipales
                    @recargarServiciosCostos="recargarServiciosCostos"
                    @activarDatosCarga="activarDatosCarga"
                  />
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" md="6" class="my-0 py-0" id="DatosCargaComponent">
              <DatosCargaComponent
                v-if="DatosCargaComponentFlag"
                @activarServicios="activarServicios()"
                @recargarCostos="recargarCostos"
              />
            </v-col>
            <v-col cols="12" id="ServicesComponent">
              <ServicesComponent
                v-if="ServicesComponentFlag"
                @activarLlenadoCostos="activarLlenadoCostos()"
                @recargarCostos="recargarCostos()"
              />
            </v-col>
          </v-row>

          <!-- <v-btn color="primary" @click="step = 2"> Continue </v-btn>

          <v-btn text> Cancel </v-btn> -->
        </v-stepper-content>

        <v-stepper-content step="2">
          <DatosCostosComponent
            :key="indexCostos"
            @anadirNuevaOpcion="anadirNuevaOpcion"
            @continuarComparativa="continuarComparativa"
            @irANotas="irANotas"
            :mostrarImpuestosEditar="true"
          />
        </v-stepper-content>

        <v-stepper-content step="3">
          <ComparativaComponent @irVentaCliente="irVentaCliente" />
        </v-stepper-content>
        <v-stepper-content step="4">
          <NotasComponent :editable="editableStep4" />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-container>
</template>

<script>
import DatosPrincipales from "../../components/folderAduana/DatosPrincipales.vue";
import DatosCargaComponent from "../../components/folderAduana/DatosCargaComponent.vue";
import ServicesComponent from "../../components/folderAduana/ServicesComponent.vue";
import DatosCostosComponent from "../../components/folderAduana/DatosCostosComponent.vue";
import ComparativaComponent from "../../components/folderAduana/ComparativaComponent.vue";
import NotasComponent from "../../components/folderAduana/NotasComponent.vue";
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
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
      DatosCargaComponentFlag: false,
      ServicesComponentFlag: false,
      editableStep2: false,
      editableStep4: false,
      recargarSegmentos: false,
      indexCostos: 0,
    };
  },
  async mounted() {
    this.$store.state.mainTitle = "Nueva Cotización";
    await this.resetQuoteNew();
    await this.getMarketingList();
    await this.getQuoteStatus();
    await this.getModalityAduana();
    await this.getShipmentAduana();
    await this.getIncotermsAduana();
    await this.getCargarEjecutivo();
    await this.getBegEndList();
    await this.getServicesAduana();
    await this.obtenerCostosAduana();
    await this.cargarProveedores();
    await this.getImpuestos();
    await this.getCargarMasterDetalleNotasCotizacionAduana();
    await this.obtenerImpuestoXEmpresa();
    await this.cargarMasterDetallePercepcionAduana();
    await this._getContainers();
  },
  methods: {
    ...mapActions([
      "resetQuoteNew",
      "getMarketingList",
      "getQuoteStatus",
      "getModalityAduana",
      "getShipmentAduana",
      "getIncotermsAduana",
      "getCargarEjecutivo",
      "getPortBeginAduana",
      "getPortEndAduana",
      "getServicesAduana",
      "getBegEndList",
      "getTipoCostosAduana",
      "obtenerCostosAduana",
      "getMultiplicadorAduana",
      "getImpuestos",
      "getCargarMasterDetalleNotasCotizacionAduana",
      "cargarProveedores",
      "obtenerImpuestoXEmpresa",
      "registrarQuote",
      "cargarMasterDetallePercepcionAduana",
      "_getContainers",
    ]),
    recargar() {
      if (this.$store.state.aduana.listServices.length > 0) {
        this.recargarServicios();
        this.getTipoCostosAduana();
      }
      if (this.editableStep2) {
        this.recargarCostos();
        // this.$store.state.aduana.index = 0;
      }
    },
    continuarComparativa() {
      this.step = 3;
    },
    async activarDatosCarga() {
      this.$store.state.spiner = true;
      await this.getPortBeginAduana({
        id_transport: this.$store.state.aduana.datosPrincipales.idtipocarga
          .id_transport
          ? this.$store.state.aduana.datosPrincipales.idtipocarga.id_transport
          : this.$store.state.aduana.datosPrincipales.idtipocarga,
      });
      await this.getPortEndAduana({
        id_transport: this.$store.state.aduana.datosPrincipales.idtipocarga
          .id_transport
          ? this.$store.state.aduana.datosPrincipales.idtipocarga.id_transport
          : this.$store.state.aduana.datosPrincipales.idtipocarga,
      });
      this.DatosCargaComponentFlag = true;
      this.$nextTick(() => {
        // setTimeout(() => {
        const element = document.getElementById("DatosCargaComponent");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // }, 100);
      });
      this.$store.state.spiner = false;
    },
    async activarServicios() {
      this.ServicesComponentFlag = true;
      let services = [...this.$store.state.aduana.preServices];
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.aduana.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.aduana.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.aduana.datosPrincipales.idtipocarga.id
      );
      this.getTipoCostosAduana();
      this.$store.state.aduana.listServices = serv;
      this.$nextTick(() => {
        // setTimeout(() => {
        const element = document.getElementById("ServicesComponent");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        // }, 100);
      });
      this.$store.state.spiner = false;
    },
    recargarServiciosCostos() {
      let services = [...this.$store.state.aduana.preServices];
      if (services.length == 0) {
        return;
      }
      let serv = services.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.aduana.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.aduana.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.aduana.datosPrincipales.idtipocarga.id
      );
      // eliminando los servicios que ya no van
      let IdServices = serv.map((v) => v.id);
      this.$store.state.aduana.listServices
        .filter((v) => !!v.id)
        .forEach((servicios) => {
          if (!IdServices.includes(servicios.id)) {
            let index = this.$store.state.aduana.listServices.findIndex(
              (v) => v.code_service == servicios.code_service
            );
            this.$store.state.aduana.listServices.splice(index, 1);
          }
        });
      // agregando los servicios que faltan
      IdServices = this.$store.state.aduana.listServices.map(
        (v) => v.code_service
      );

      serv.forEach((servicios) => {
        if (!IdServices.includes(servicios.code_service)) {
          this.$store.state.aduana.listServices.push(servicios);
        }
      });
      this.recargarCostos();
    },
    async activarLlenadoCostos() {
      try {
        this.$store.state.spiner = true;
        await this.getMultiplicadorAduana();
        // await this.getImpuestos();

        let codeServicesActivos = new Set(
          this.$store.state.aduana.listServices
            .filter((v) => v.status === true || v.status === 1)
            .map((v) => v.code_service)
        );

        let costos = [...this.$store.state.aduana.preCostos];

        let c = costos.filter(
          (v) =>
            v.id_incoterms ==
              this.$store.state.aduana.datosPrincipales.idincoterms &&
            v.id_modality ==
              this.$store.state.aduana.datosPrincipales.idsentido &&
            v.id_shipment ==
              this.$store.state.aduana.datosPrincipales.idtipocarga.id &&
            codeServicesActivos.has(v.code_service)
        );

        let idContainer = [];
        if (this.$store.state.aduana.datosPrincipales.containers.length > 0) {
          idContainer =
            this.$store.state.aduana.datosPrincipales.containers.map(
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
                nro_propuesta: 1,
              },
            ];
          } else {
            return [
              {
                ...item,
                nro_propuesta: 1,
                esopcionflag: 1,
                esventaflag: 0,
                status: true,
                cif: parseFloat(0.35),
                seguro: parseFloat(0.45),
                nro_propuesta: 1,
              },
              {
                ...item,
                nro_propuesta: 1,
                esopcionflag: 0,
                esventaflag: 1,
                status: true,
                costounitario: 0,
                cif: parseFloat(0.35),
                seguro: parseFloat(0.45),
                nro_propuesta: 1,
              },
            ];
          }
        });

        this.$store.state.aduana.opcionCostos[0].listCostos = cDuplicado;
        this.$store.state.aduana.opcionCostos[0].listImpuestos =
          this.$store.state.aduana.listImpuestos;
        this.$store.state.aduana.opcionCostos[0].listNotasQuote =
          this.$store.state.aduana.listNotasQuote;
        this.$store.state.spiner = false;
        Swal.fire({
          icon: "question",
          title: "Cotizar",
          text: "¿Desea pasar a Cotizar?",
          confirmButtonText: "Pasar a Cotizar",
          denyButtonText: "Guardar Borrador",
          allowEnterKey: false,
          allowOutsideClick: false,
          confirmButtonColor: "green",
          showDenyButton: true,
          allowEscapeKey: false,
        }).then(async (result) => {
          if (result.isConfirmed) {
            this.step = 2;
            this.editableStep2 = true;
          }
          if (result.isDenied) {
            await this.guardar();
          }
        });
      } catch (error) {
        console.error(error);
      }
    },
    async guardar() {
      this.$store.state.spiner = true;
      this.$store.state.aduana.opcionCostos[0].selected = true;
      await this.registrarQuote({ fullflag: false }).catch((e) => {
        console.error("registrarQuote", e);
      });
      if (this.$store.state.aduana.nro_quote) {
        this.$store.state.spiner = false;
        let vm = this;

        Swal.fire({
          icon: "success",
          title: "Aviso",
          text: vm.$store.state.aduana.mensaje,
          confirmButtonText: "Ir al listado",
          showConfirmButton: true,
        }).then((result) => {
          if (result.isConfirmed) {
            vm.$router.push({
              name: "lstQuote",
            });
          }
          if (result.isDismissed) {
            vm.$router.push({
              name: "lstQuote",
            });
          }
        });
        let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
          .id_branch;
        let branchCreacion = [1, 2];
        if (branchCreacion.includes(id_branch)) {
          await this.crearCarpetaOneDrive({
            nro_quote: this.$store.state.aduana.nro_quote,
            nombre: this.$store.state.aduana.datosPrincipales.nombre,
          }).catch((e) => {
            console.error("crearCarpetaOneDrive", e);
          });

          await this.actualizarURLEnElQuote({
            id: this.$store.state.aduana.id,
            url: this.$store.state.aduana.urlFolder,
          }).catch((e) => {
            console.error("actualizarURLEnElQuote", e);
          });
        }
      }
    },
    anadirNuevaOpcion(nro_propuesta) {
      // this.$store.state.spiner = true;
      let codeServicesActivos = new Set(
        this.$store.state.aduana.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service)
      );
      let costos = [...this.$store.state.aduana.preCostos];
      let c = costos.filter(
        (v) =>
          v.id_incoterms ==
            this.$store.state.aduana.datosPrincipales.idincoterms &&
          v.id_modality ==
            this.$store.state.aduana.datosPrincipales.idsentido &&
          v.id_shipment ==
            this.$store.state.aduana.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(v.code_service)
      );
      let idContainer = [];
      if (this.$store.state.aduana.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.aduana.datosPrincipales.containers.map(
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
              nro_propuesta: nro_propuesta,
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
              nro_propuesta: nro_propuesta,
              esventaflag: 0,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
            },
            {
              ...item,
              esopcionflag: 0,
              nro_propuesta: nro_propuesta,
              esventaflag: 1,
              status: true,
              cif: parseFloat(0.35),
              seguro: parseFloat(0.45),
              costounitario: 0,
            },
          ];
        }
      });
      let newPropuesta = {
        nro_propuesta: nro_propuesta,
        date_end: "",
        tiempo_transito: 0,
        listCostos: cDuplicado,
        listImpuestos: this.$store.state.aduana.listImpuestos,
        listNotasQuote: this.$store.state.aduana.listNotasQuote,
      };
      this.$store.state.aduana.opcionCostos.push(newPropuesta);
      this.$store.state.spiner = false;
    },
    async recargarCostos() {
      await this.getTipoCostosAduana();
      await this.getMultiplicadorAduana();
      let codeServicesActivos = new Set(
        this.$store.state.aduana.listServices
          .filter((v) => v.status === true || v.status === 1)
          .map((v) => v.code_service)
      );

      let c = this.$store.state.aduana.preCostos.filter(
        (v) =>
          v.id_incoterms ===
            this.$store.state.aduana.datosPrincipales.idincoterms &&
          v.id_modality ===
            this.$store.state.aduana.datosPrincipales.idsentido &&
          v.id_shipment ===
            this.$store.state.aduana.datosPrincipales.idtipocarga.id &&
          codeServicesActivos.has(v.code_service)
      );
      let idContainer = [];
      if (this.$store.state.aduana.datosPrincipales.containers.length > 0) {
        idContainer = this.$store.state.aduana.datosPrincipales.containers.map(
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
              nro_propuesta: 1,
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
              nro_propuesta: 1,
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
              costounitario: 0,
            },
          ];
        }
      });

      this.$store.state.aduana.opcionCostos =
        this.$store.state.aduana.opcionCostos.slice(0, 1);
      this.$store.state.aduana.index = 0;
      this.$store.state.aduana.opcionCostos[0].listCostos = cDuplicado;
      this.$store.state.aduana.opcionCostos[0].listImpuestos =
        this.$store.state.aduana.listImpuestos;
      this.$store.state.aduana.opcionCostos[0].listNotasQuote =
        this.$store.state.aduana.listNotasQuote;

      this.$store.state.aduana.llenadoCostos = true;
      this.$forceUpdate();
      this.indexCostos++;
    },
    irVentaCliente() {
      this.step = 2;
    },
    irANotas() {
      this.step = 4;
      this.editableStep4 = true;
      this.$store.state.aduana.btnRegistrar = true;
    },
  },
  computed: {
    // ...mapState(["preServices", "preCostos"]),
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
