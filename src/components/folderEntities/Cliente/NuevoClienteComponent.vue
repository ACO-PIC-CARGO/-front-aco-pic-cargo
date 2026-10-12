<template>
  <div>
    <v-overlay :model-value="$store.state.spiner">
      <v-row class="fill-height align-content-center justify-center">
        <v-col class="text-subtitle-1 text-center" cols="12">
          Cargando Datos, espere un momento por favor...
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-overlay>
    <v-stepper v-model="$store.state.entities.stepper" non-linear>
      <v-stepper-header>
        <v-stepper-step
          :complete="$store.state.entities.stepper > 1"
          editable
          step="1"
          >Datos del Cliente</v-stepper-step
        >

        <v-divider></v-divider>

        <v-stepper-step
          :complete="$store.state.entities.stepper > 2"
          :editable="$store.state.entities.stepper > 2"
          step="2"
          >Teléfonos y Contactos</v-stepper-step
        >

        <v-divider></v-divider>

        <v-stepper-step
          :complete="$store.state.entities.stepper > 3"
          :editable="$store.state.entities.stepper > 3"
          step="3"
          >Convenios y Tarifas</v-stepper-step
        >

        <v-divider></v-divider>

        <v-stepper-step
          :complete="$store.state.entities.stepper > 4"
          :editable="$store.state.entities.stepper > 4"
          step="4"
          >Información Bancaria</v-stepper-step
        >

        <v-divider></v-divider>

        <v-stepper-step
          :complete="$store.state.entities.stepper > 5"
          :editable="$store.state.entities.stepper > 5"
          step="5"
          >Shipper</v-stepper-step
        >

        <v-divider></v-divider>

        <v-stepper-step step="6">Destinatario</v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <!--DATOS DEL CLIENTE-->
        <v-stepper-content step="1">
          <SeccionCliente :isPricing="isPricing" />
        </v-stepper-content>

        <!--TELÉFONOS-->
        <v-stepper-content step="2">
          <SeccionTelefonos />
        </v-stepper-content>

        <!--CONVENIOS Y TARIFAS-->
        <v-stepper-content step="3">
          <SeccionConvenios />
        </v-stepper-content>

        <!--INFORMACIÓN BANCARIA-->
        <v-stepper-content step="4">
          <SeccionInformacionBancaria />
        </v-stepper-content>

        <!--SHIPPER-->
        <v-stepper-content step="5">
          <SeccionShippers />
        </v-stepper-content>

        <!--INFORMACIÓN DE ENTREGA-->
        <v-stepper-content step="6">
          <SeccionInformacionEntrega />
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import moment from "moment";
import Swal from "sweetalert2";
import SeccionCliente from "./seccionCliente.vue";
import SeccionTelefonos from "./seccionTelefonos.vue";
import SeccionConvenios from "./seccionConvenios.vue";
import SeccionInformacionBancaria from "./seccionInformacionBancaria.vue";
import SeccionShippers from "./seccionShippers.vue";
import SeccionInformacionEntrega from "./seccionInformacionEntrega.vue";
export default {
  components: {
    SeccionCliente,
    SeccionTelefonos,
    SeccionConvenios,
    SeccionInformacionBancaria,
    SeccionShippers,
    SeccionInformacionEntrega,
  },
  data() {
    return {
      loading: false,
      titleVal: "",
      defaultTipoTransaccion: 56,
    };
  },
  props: {
    isPricing: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    ...mapActions([
      "getListProveedor",
      "_getDocumentsPais",
      "cargarMasterDetalleTipoProveedor",
      "cargarMasterDetalleTipoTransaccion",
      "_getRole",
      "getValidaRazonSocial",
      "cargarTipoTelefono",
      "getCoinsListCargar",
      "getBanksListCargar",
      "guardarCliente",
      "getValidaDocumentCliente",
      "_getSex",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "cargarTipoPersona",
      "_getProveedorRolShipper",
      "_getProveedor",
    ]),
    /* CÓDIGO NUEVO */
    getIDTipoTelefono(criterio = "") {
      var vm = this;
      var id = null;

      const tipoTelefonoData =
        vm.$store.state.masterusuarios.lstTipoTelefono.find(
          (v) => v.descripcion.toUpperCase() == criterio.toUpperCase()
        );
      if (tipoTelefonoData) {
        id = tipoTelefonoData.id;
      }

      return id;
    },
    getIDTipoPersona(criterio = "") {
      var vm = this;
      var id = null;

      const tipoPersonaData =
        vm.$store.state.masterusuarios.lstTipoPersona.find(
          (v) => v.descripcion.toUpperCase() == criterio.toUpperCase()
        );
      if (tipoPersonaData) {
        id = tipoPersonaData.id;
      }

      return id;
    },
    getIDTipoDocumento(criterio = "") {
      var vm = this;
      var id = null;

      const tipoDocumentoData = vm.$store.state.itemsDocumentsPais.find(
        (v) => v.name.toUpperCase() == criterio.toUpperCase()
      );
      if (tipoDocumentoData) {
        id = tipoDocumentoData.id;
      }

      return id;
    },
  },
  created() {
    this.$store.state.entities.lstProveedores_x_nombre = [];
    this.$store.state.entities.lstProveedores_x_documento = [];
  },
  async mounted() {
    this.$store.state.spiner = true;
    //this.$refs.formProveedor.reset();
    await Promise.all([
      this._getDocumentsPais(),
      this.cargarMasterDetalleTipoProveedor(),
      this._getPais(),
      this.cargarMasterDetalleTipoTransaccion(),
      this.cargarTipoTelefono(),
      this._getRole(),
      this.getCoinsListCargar(),
      this.getBanksListCargar(),
      this._getSex(),
      this.cargarTipoPersona(),
      this._getProveedorRolShipper(),
    ]);
    this.$store.state.entities.stepper = 1;
    this.$store.state.entities.isEdit = false;
    this.$store.state.entities.isReadonly = false;
    this.$store.state.entities.showBtnSaveFlag = false;

    this.$store.state.entities.cliente.nombrecompleto = "";
    this.$store.state.entities.cliente.id_tipotransaccion = "56";
    this.$store.state.entities.cliente.nro_documento = "";
    this.$store.state.entities.cliente.id_pais = 0;
    this.$store.state.entities.cliente.id_ciudad = 0;
    this.$store.state.entities.cliente.direccion = "";
    this.$store.state.entities.cliente.emailaddress = "";
    this.$store.state.entities.cliente.notas = "";
    this.$store.state.entities.cliente.convenioActual = {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
      id_path: "",
    };
    this.$store.state.entities.cliente.telefonoActual = {
      id_tipotelefono: "",
      telefono: "",
    };
    this.$store.state.entities.cliente.contactoActual = {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    };

    this.$store.state.entities.lstTelefonos = [];
    this.$store.state.entities.lstContactos = [];
    this.$store.state.entities.lstConvenios = [];
    this.$store.state.entities.lstTarifas = [];
    this.$store.state.entities.lstInformacionBancaria = [];
    this.$store.state.entities.lstShippers = [];
    this.$store.state.entities.informacionEntrega = { status: true };

    const tipoPersona = this.getIDTipoPersona("PERSONA NATURAL");
    this.$store.state.entities.cliente.id_tipopersona = tipoPersona;

    const tipoDocumento = this.getIDTipoDocumento("DNI");
    this.$store.state.entities.cliente.id_tipodocumento = tipoDocumento;

    const tipoTelefono = this.getIDTipoTelefono("WHATSAPP");
    this.$store.state.entities.cliente.telefonoActual.id_tipotelefono =
      tipoTelefono;
    this.$store.state.entities.cliente.contactoActual.id_tipotelefono =
      tipoTelefono;
    this.$store.state.spiner = false;
  },
  watch: {
    "$store.state.entities.stepper": {
      handler(newStep, oldStep) {
        if (newStep == 6) {
          this.$emit("btnGuardar", true);
        }
        if (this.$route.name == "nuevoClientes" && newStep === 6) {
          this.$store.state.entities.showBtnSaveFlag = true;
        } else {
          this.$store.state.entities.showBtnSaveFlag = false;
        }
      },
      immediate: true,
    },
  },
};
</script>

<style>
.v-stepper__content {
  padding: 24px;
}

.row + .row {
  margin-top: 0;
}

tr.v-data-table__selected {
  background: #ffccab !important;
}
</style>
